import { Connection } from '@solana/web3.js';
import { CacheService } from './CacheService';
import { NotificationService } from './NotificationService';
import { logger } from '../utils/logger';
import * as os from 'os';

export interface PerformanceMetrics {
    timestamp: Date;
    solana: {
        tps: number;
        blockTime: number;
        slotHeight: number;
        confirmationTime: number;
        failureRate: number;
    };
    application: {
        requestLatency: number;
        errorRate: number;
        activeUsers: number;
        memoryUsage: number;
        cpuUsage: number;
    };
    contract: {
        gasUsage: number;
        callCount: number;
        failureRate: number;
        averageConfirmationTime: number;
    };
}

export class PerformanceMonitor {
    private readonly connection: Connection;
    private readonly cacheService: CacheService;
    private readonly notificationService: NotificationService;
    private readonly METRICS_PREFIX = 'metrics:';
    private readonly ALERT_THRESHOLDS = {
        tps: {
            min: 1000,
            critical: 500,
        },
        errorRate: {
            max: 0.05,
            critical: 0.10,
        },
        memoryUsage: {
            max: 0.85,
            critical: 0.95,
        },
        cpuUsage: {
            max: 0.80,
            critical: 0.90,
        },
    };

    constructor(
        connection: Connection,
        cacheService: CacheService,
        notificationService: NotificationService
    ) {
        this.connection = connection;
        this.cacheService = cacheService;
        this.notificationService = notificationService;
        this.startMonitoring();
    }

    private startMonitoring() {
        setInterval(async () => {
            try {
                const metrics = await this.collectMetrics();
                await this.storeMetrics(metrics);
                await this.analyzeMetrics(metrics);
            } catch (error) {
                logger.error('Performance monitoring failed:', error);
            }
        }, 60000); // Collect metrics every minute
    }

    private async collectMetrics(): Promise<PerformanceMetrics> {
        const [
            tps,
            blockTime,
            slotHeight,
            confirmationTime,
            failureRate,
            requestLatency,
            errorRate,
            activeUsers,
            gasUsage,
            contractCallCount,
            contractFailureRate,
            averageConfirmationTime,
        ] = await Promise.all([
            this.getSolanaTPS(),
            this.getBlockTime(),
            this.connection.getSlot(),
            this.getConfirmationTime(),
            this.getTransactionFailureRate(),
            this.getAverageRequestLatency(),
            this.getApplicationErrorRate(),
            this.getActiveUsers(),
            this.getAverageGasUsage(),
            this.getContractCallCount(),
            this.getContractFailureRate(),
            this.getAverageConfirmationTime(),
        ]);

        return {
            timestamp: new Date(),
            solana: {
                tps,
                blockTime,
                slotHeight,
                confirmationTime,
                failureRate,
            },
            application: {
                requestLatency,
                errorRate,
                activeUsers,
                memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
                cpuUsage: os.loadavg()[0] / os.cpus().length,
            },
            contract: {
                gasUsage,
                callCount: contractCallCount,
                failureRate: contractFailureRate,
                averageConfirmationTime,
            },
        };
    }

    private async getSolanaTPS(): Promise<number> {
        try {
            const performance = await this.connection.getRecentPerformanceSamples(1);
            return performance[0]?.numTransactions || 0;
        } catch (error) {
            logger.error('Failed to get Solana TPS:', error);
            return 0;
        }
    }

    private async getBlockTime(): Promise<number> {
        try {
            const slot = await this.connection.getSlot();
            const blockTime = await this.connection.getBlockTime(slot);
            return blockTime || 0;
        } catch (error) {
            logger.error('Failed to get block time:', error);
            return 0;
        }
    }

    private async getConfirmationTime(): Promise<number> {
        try {
            // Implementation depends on how you track confirmation times
            return 0;
        } catch (error) {
            logger.error('Failed to get confirmation time:', error);
            return 0;
        }
    }

    private async getTransactionFailureRate(): Promise<number> {
        try {
            // Implementation depends on how you track transaction success/failure
            return 0;
        } catch (error) {
            logger.error('Failed to get transaction failure rate:', error);
            return 0;
        }
    }

    private async getAverageRequestLatency(): Promise<number> {
        try {
            const latencyKey = `${this.METRICS_PREFIX}request_latency`;
            const latencies = await this.cacheService.get<number[]>(latencyKey) || [];
            return latencies.length > 0
                ? latencies.reduce((a, b) => a + b, 0) / latencies.length
                : 0;
        } catch (error) {
            logger.error('Failed to get average request latency:', error);
            return 0;
        }
    }

    private async getApplicationErrorRate(): Promise<number> {
        try {
            const errorKey = `${this.METRICS_PREFIX}error_rate`;
            return (await this.cacheService.get<number>(errorKey)) || 0;
        } catch (error) {
            logger.error('Failed to get application error rate:', error);
            return 0;
        }
    }

    private async getActiveUsers(): Promise<number> {
        try {
            const activeUsersKey = `${this.METRICS_PREFIX}active_users`;
            return (await this.cacheService.get<number>(activeUsersKey)) || 0;
        } catch (error) {
            logger.error('Failed to get active users:', error);
            return 0;
        }
    }

    private async getAverageGasUsage(): Promise<number> {
        try {
            const gasKey = `${this.METRICS_PREFIX}gas_usage`;
            const gasUsages = await this.cacheService.get<number[]>(gasKey) || [];
            return gasUsages.length > 0
                ? gasUsages.reduce((a, b) => a + b, 0) / gasUsages.length
                : 0;
        } catch (error) {
            logger.error('Failed to get average gas usage:', error);
            return 0;
        }
    }

    private async getContractCallCount(): Promise<number> {
        try {
            const callCountKey = `${this.METRICS_PREFIX}contract_calls`;
            return (await this.cacheService.get<number>(callCountKey)) || 0;
        } catch (error) {
            logger.error('Failed to get contract call count:', error);
            return 0;
        }
    }

    private async getContractFailureRate(): Promise<number> {
        try {
            const failureRateKey = `${this.METRICS_PREFIX}contract_failures`;
            return (await this.cacheService.get<number>(failureRateKey)) || 0;
        } catch (error) {
            logger.error('Failed to get contract failure rate:', error);
            return 0;
        }
    }

    private async getAverageConfirmationTime(): Promise<number> {
        try {
            const confirmationTimeKey = `${this.METRICS_PREFIX}confirmation_times`;
            const times = await this.cacheService.get<number[]>(confirmationTimeKey) || [];
            return times.length > 0
                ? times.reduce((a, b) => a + b, 0) / times.length
                : 0;
        } catch (error) {
            logger.error('Failed to get average confirmation time:', error);
            return 0;
        }
    }

    private async storeMetrics(metrics: PerformanceMetrics): Promise<void> {
        try {
            const key = `${this.METRICS_PREFIX}${metrics.timestamp.getTime()}`;
            await this.cacheService.set(key, metrics, 24 * 60 * 60); // Store for 24 hours
        } catch (error) {
            logger.error('Failed to store metrics:', error);
        }
    }

    private async analyzeMetrics(metrics: PerformanceMetrics): Promise<void> {
        try {
            // Check Solana performance
            if (metrics.solana.tps < this.ALERT_THRESHOLDS.tps.critical) {
                await this.notificationService.sendNotification({
                    title: 'Critical Performance Alert',
                    message: `Solana TPS is critically low: ${metrics.solana.tps}`,
                    severity: 'critical',
                    metadata: metrics.solana,
                });
            } else if (metrics.solana.tps < this.ALERT_THRESHOLDS.tps.min) {
                await this.notificationService.sendNotification({
                    title: 'Performance Warning',
                    message: `Solana TPS is below threshold: ${metrics.solana.tps}`,
                    severity: 'warning',
                    metadata: metrics.solana,
                });
            }

            // Check application performance
            if (metrics.application.errorRate > this.ALERT_THRESHOLDS.errorRate.critical) {
                await this.notificationService.sendNotification({
                    title: 'Critical Error Rate Alert',
                    message: `Application error rate is critically high: ${metrics.application.errorRate}`,
                    severity: 'critical',
                    metadata: metrics.application,
                });
            }

            // Check resource usage
            if (metrics.application.memoryUsage > this.ALERT_THRESHOLDS.memoryUsage.critical) {
                await this.notificationService.sendNotification({
                    title: 'Critical Memory Usage Alert',
                    message: `Memory usage is critically high: ${metrics.application.memoryUsage * 100}%`,
                    severity: 'critical',
                    metadata: metrics.application,
                });
            }

            if (metrics.application.cpuUsage > this.ALERT_THRESHOLDS.cpuUsage.critical) {
                await this.notificationService.sendNotification({
                    title: 'Critical CPU Usage Alert',
                    message: `CPU usage is critically high: ${metrics.application.cpuUsage * 100}%`,
                    severity: 'critical',
                    metadata: metrics.application,
                });
            }
        } catch (error) {
            logger.error('Failed to analyze metrics:', error);
        }
    }

    async getMetricsHistory(
        startTime: Date,
        endTime: Date = new Date()
    ): Promise<PerformanceMetrics[]> {
        try {
            const keys = await this.cacheService.redis.keys(
                `${this.METRICS_PREFIX}*`
            );
            const metrics = await Promise.all(
                keys
                    .filter((key) => {
                        const timestamp = parseInt(key.split(':')[1]);
                        return timestamp >= startTime.getTime() && timestamp <= endTime.getTime();
                    })
                    .map((key) => this.cacheService.get<PerformanceMetrics>(key))
            );

            return metrics
                .filter((metric): metric is PerformanceMetrics => metric !== null)
                .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        } catch (error) {
            logger.error('Failed to get metrics history:', error);
            throw error;
        }
    }

    async getAggregatedMetrics(
        period: '1h' | '24h' | '7d'
    ): Promise<{
        averageTPS: number;
        averageBlockTime: number;
        averageConfirmationTime: number;
        totalTransactions: number;
        failureRate: number;
    }> {
        try {
            const endTime = new Date();
            const startTime = new Date(
                endTime.getTime() - this.getPeriodMilliseconds(period)
            );

            const metrics = await this.getMetricsHistory(startTime, endTime);
            return this.calculateAggregatedMetrics(metrics);
        } catch (error) {
            logger.error('Failed to get aggregated metrics:', error);
            throw error;
        }
    }

    private getPeriodMilliseconds(period: '1h' | '24h' | '7d'): number {
        switch (period) {
            case '1h':
                return 60 * 60 * 1000;
            case '24h':
                return 24 * 60 * 60 * 1000;
            case '7d':
                return 7 * 24 * 60 * 60 * 1000;
        }
    }

    private calculateAggregatedMetrics(metrics: PerformanceMetrics[]): any {
        if (metrics.length === 0) {
            return {
                averageTPS: 0,
                averageBlockTime: 0,
                averageConfirmationTime: 0,
                totalTransactions: 0,
                failureRate: 0,
            };
        }

        const totalTransactions = metrics.reduce(
            (sum, metric) => sum + metric.solana.tps * 60,
            0
        );

        return {
            averageTPS: this.average(metrics.map((m) => m.solana.tps)),
            averageBlockTime: this.average(metrics.map((m) => m.solana.blockTime)),
            averageConfirmationTime: this.average(
                metrics.map((m) => m.solana.confirmationTime)
            ),
            totalTransactions,
            failureRate:
                this.average(metrics.map((m) => m.solana.failureRate)),
        };
    }

    private average(values: number[]): number {
        return values.length > 0
            ? values.reduce((a, b) => a + b, 0) / values.length
            : 0;
    }
} 