import { Connection } from '@solana/web3.js';
import { CacheService } from './CacheService';
import { AuditLogService } from './AuditLogService';
import { NotificationService } from './NotificationService';
import { logger } from '../utils/logger';

export interface HealthCheck {
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    timestamp: Date;
    details?: any;
}

export interface Alert {
    severity: 'low' | 'medium' | 'high' | 'critical';
    service: string;
    message: string;
    timestamp: Date;
    metadata?: any;
}

export class MonitoringService {
    private readonly connection: Connection;
    private readonly cacheService: CacheService;
    private readonly auditLogService: AuditLogService;
    private readonly notificationService: NotificationService;
    private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
    private readonly ALERT_THRESHOLD = {
        latency: {
            degraded: 1000, // 1 second
            down: 5000, // 5 seconds
        },
        errorRate: {
            degraded: 0.05, // 5%
            down: 0.15, // 15%
        },
    };

    constructor(
        connection: Connection,
        cacheService: CacheService,
        auditLogService: AuditLogService,
        notificationService: NotificationService
    ) {
        this.connection = connection;
        this.cacheService = cacheService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
        this.startMonitoring();
    }

    private async startMonitoring(): Promise<void> {
        try {
            setInterval(async () => {
                await this.performHealthChecks();
            }, this.HEALTH_CHECK_INTERVAL);

            logger.info('System monitoring started');
        } catch (error) {
            logger.error('Failed to start monitoring:', error);
        }
    }

    private async performHealthChecks(): Promise<void> {
        try {
            const checks: HealthCheck[] = await Promise.all([
                this.checkSolanaConnection(),
                this.checkRedisConnection(),
                this.checkAPIEndpoints(),
            ]);

            await this.storeHealthChecks(checks);
            await this.analyzeHealthChecks(checks);
        } catch (error) {
            logger.error('Health check failed:', error);
        }
    }

    private async checkSolanaConnection(): Promise<HealthCheck> {
        const startTime = Date.now();
        try {
            await this.connection.getSlot();
            const latency = Date.now() - startTime;

            const status = this.getStatusFromLatency(latency);
            return {
                service: 'solana',
                status,
                latency,
                timestamp: new Date(),
            };
        } catch (error) {
            return {
                service: 'solana',
                status: 'down',
                latency: Date.now() - startTime,
                timestamp: new Date(),
                details: { error: error.message },
            };
        }
    }

    private async checkRedisConnection(): Promise<HealthCheck> {
        const startTime = Date.now();
        try {
            await this.cacheService.redis.ping();
            const latency = Date.now() - startTime;

            const status = this.getStatusFromLatency(latency);
            return {
                service: 'redis',
                status,
                latency,
                timestamp: new Date(),
            };
        } catch (error) {
            return {
                service: 'redis',
                status: 'down',
                latency: Date.now() - startTime,
                timestamp: new Date(),
                details: { error: error.message },
            };
        }
    }

    private async checkAPIEndpoints(): Promise<HealthCheck> {
        const startTime = Date.now();
        try {
            // Check critical API endpoints
            const endpoints = ['/health', '/api/projects', '/api/proposals'];
            const results = await Promise.all(
                endpoints.map(async (endpoint) => {
                    try {
                        const response = await fetch(`${process.env.API_BASE_URL}${endpoint}`);
                        return response.ok;
                    } catch {
                        return false;
                    }
                })
            );

            const successRate = results.filter(Boolean).length / results.length;
            const latency = Date.now() - startTime;

            let status: HealthCheck['status'];
            if (successRate === 1) {
                status = this.getStatusFromLatency(latency);
            } else if (successRate >= 0.5) {
                status = 'degraded';
            } else {
                status = 'down';
            }

            return {
                service: 'api',
                status,
                latency,
                timestamp: new Date(),
                details: { successRate },
            };
        } catch (error) {
            return {
                service: 'api',
                status: 'down',
                latency: Date.now() - startTime,
                timestamp: new Date(),
                details: { error: error.message },
            };
        }
    }

    private getStatusFromLatency(latency: number): HealthCheck['status'] {
        if (latency < this.ALERT_THRESHOLD.latency.degraded) {
            return 'healthy';
        } else if (latency < this.ALERT_THRESHOLD.latency.down) {
            return 'degraded';
        } else {
            return 'down';
        }
    }

    private async storeHealthChecks(checks: HealthCheck[]): Promise<void> {
        try {
            const timestamp = new Date().getTime();
            await Promise.all(
                checks.map((check) =>
                    this.cacheService.set(
                        `health:${check.service}:${timestamp}`,
                        check,
                        3600 * 24 // Store for 24 hours
                    )
                )
            );
        } catch (error) {
            logger.error('Failed to store health checks:', error);
        }
    }

    private async analyzeHealthChecks(checks: HealthCheck[]): Promise<void> {
        try {
            for (const check of checks) {
                if (check.status !== 'healthy') {
                    const alert: Alert = {
                        severity: this.calculateAlertSeverity(check),
                        service: check.service,
                        message: `Service ${check.service} is ${check.status}`,
                        timestamp: new Date(),
                        metadata: {
                            latency: check.latency,
                            details: check.details,
                        },
                    };

                    await this.triggerAlert(alert);
                }
            }
        } catch (error) {
            logger.error('Failed to analyze health checks:', error);
        }
    }

    private calculateAlertSeverity(check: HealthCheck): Alert['severity'] {
        if (check.status === 'down') {
            return 'critical';
        } else if (check.status === 'degraded') {
            return check.latency > this.ALERT_THRESHOLD.latency.degraded * 2
                ? 'high'
                : 'medium';
        }
        return 'low';
    }

    private async triggerAlert(alert: Alert): Promise<void> {
        try {
            // Log alert
            logger.warn('System alert:', alert);

            // Store in audit log
            await this.auditLogService.logEvent({
                type: 'SECURITY',
                action: 'SYSTEM_ALERT',
                userId: 'system',
                details: alert,
                status: 'FAILURE',
            });

            // Send notification
            await this.notificationService.sendNotification({
                title: `System Alert: ${alert.service}`,
                message: alert.message,
                severity: alert.severity === 'critical' ? 'critical' : 'error',
                metadata: alert.metadata,
            });
        } catch (error) {
            logger.error('Failed to trigger alert:', error);
        }
    }

    async getServiceHealth(service: string): Promise<HealthCheck[]> {
        try {
            const keys = await this.cacheService.redis.keys(`health:${service}:*`);
            const checks = await Promise.all(
                keys.map((key) => this.cacheService.get<HealthCheck>(key))
            );
            return checks.filter((check): check is HealthCheck => check !== null)
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        } catch (error) {
            logger.error('Failed to get service health:', error);
            throw error;
        }
    }

    async getSystemStatus(): Promise<{
        overall: 'healthy' | 'degraded' | 'down';
        services: Record<string, HealthCheck>;
    }> {
        try {
            const checks = await Promise.all([
                this.checkSolanaConnection(),
                this.checkRedisConnection(),
                this.checkAPIEndpoints(),
            ]);

            const services = checks.reduce(
                (acc, check) => ({ ...acc, [check.service]: check }),
                {} as Record<string, HealthCheck>
            );

            const overall = checks.every((check) => check.status === 'healthy')
                ? 'healthy'
                : checks.some((check) => check.status === 'down')
                ? 'down'
                : 'degraded';

            return { overall, services };
        } catch (error) {
            logger.error('Failed to get system status:', error);
            throw error;
        }
    }
} 