import { logger } from '../utils/logger';
import { CacheService } from './CacheService';

export enum AuditLogType {
    USER_AUTH = 'USER_AUTH',
    INVESTMENT = 'INVESTMENT',
    PROPOSAL = 'PROPOSAL',
    VOTE = 'VOTE',
    CONTRACT_UPGRADE = 'CONTRACT_UPGRADE',
    EMERGENCY_ACTION = 'EMERGENCY_ACTION',
    SECURITY = 'SECURITY',
}

export interface AuditLogEntry {
    type: AuditLogType;
    action: string;
    userId: string;
    timestamp: Date;
    details: any;
    ipAddress?: string;
    status: 'SUCCESS' | 'FAILURE';
    errorMessage?: string;
}

export class AuditLogService {
    private readonly cacheService: CacheService;
    private readonly AUDIT_LOG_PREFIX = 'audit:';
    private readonly RETENTION_DAYS = 90;

    constructor(cacheService: CacheService) {
        this.cacheService = cacheService;
    }

    async logEvent(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
        try {
            const fullEntry: AuditLogEntry = {
                ...entry,
                timestamp: new Date(),
            };

            // Store in Redis for quick access
            const key = `${this.AUDIT_LOG_PREFIX}${fullEntry.type}:${fullEntry.timestamp.getTime()}`;
            await this.cacheService.set(key, fullEntry, this.RETENTION_DAYS * 24 * 60 * 60);

            // Log to application logs
            logger.info('Audit Log Entry:', {
                ...fullEntry,
                details: JSON.stringify(fullEntry.details),
            });

            // If it's a security or emergency event, trigger alerts
            if (
                fullEntry.type === AuditLogType.SECURITY ||
                fullEntry.type === AuditLogType.EMERGENCY_ACTION ||
                fullEntry.status === 'FAILURE'
            ) {
                await this.triggerAlert(fullEntry);
            }
        } catch (error) {
            logger.error('Failed to create audit log:', error);
            throw error;
        }
    }

    async getAuditLogs(
        type?: AuditLogType,
        startTime?: Date,
        endTime?: Date,
        userId?: string
    ): Promise<AuditLogEntry[]> {
        try {
            const pattern = type
                ? `${this.AUDIT_LOG_PREFIX}${type}:*`
                : `${this.AUDIT_LOG_PREFIX}*`;

            const keys = await this.cacheService.redis.keys(pattern);
            const logs: AuditLogEntry[] = [];

            for (const key of keys) {
                const log = await this.cacheService.get<AuditLogEntry>(key);
                if (log) {
                    const logTime = new Date(log.timestamp);
                    if (
                        (!startTime || logTime >= startTime) &&
                        (!endTime || logTime <= endTime) &&
                        (!userId || log.userId === userId)
                    ) {
                        logs.push(log);
                    }
                }
            }

            return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        } catch (error) {
            logger.error('Failed to retrieve audit logs:', error);
            throw error;
        }
    }

    async getSecurityEvents(hours: number = 24): Promise<AuditLogEntry[]> {
        const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.getAuditLogs(AuditLogType.SECURITY, startTime);
    }

    async getUserActivity(userId: string, days: number = 30): Promise<AuditLogEntry[]> {
        const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return this.getAuditLogs(undefined, startTime, undefined, userId);
    }

    private async triggerAlert(entry: AuditLogEntry): Promise<void> {
        // Implement alert notification logic (email, Slack, etc.)
        logger.warn('Alert triggered:', {
            type: entry.type,
            action: entry.action,
            status: entry.status,
            error: entry.errorMessage,
        });

        // TODO: Implement actual notification system
        // await notificationService.send({
        //     channel: 'security-alerts',
        //     message: `Security Alert: ${entry.action} - ${entry.errorMessage || 'No error'}`,
        //     severity: entry.status === 'FAILURE' ? 'high' : 'medium',
        // });
    }
} 