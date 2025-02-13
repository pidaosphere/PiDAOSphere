import { PerformanceMetrics } from './PerformanceMonitor';
import { NotificationService, Notification } from './NotificationService';
import { AuditLogService, AuditLogType } from './AuditLogService';

export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: keyof PerformanceMetrics['solana' | 'application' | 'contract'] | string;
    condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    severity: 'info' | 'warning' | 'error' | 'critical';
    enabled: boolean;
    cooldown: number; // Cooldown period in minutes
    lastTriggered?: Date;
    notificationChannels: string[];
}

export interface AlertEvent {
    ruleId: string;
    timestamp: Date;
    value: number;
    threshold: number;
    severity: AlertRule['severity'];
}

export class AlertRuleService {
    private rules: Map<string, AlertRule> = new Map();
    private readonly notificationService: NotificationService;
    private readonly auditLogService: AuditLogService;

    constructor(
        notificationService: NotificationService,
        auditLogService: AuditLogService
    ) {
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    addRule(rule: AlertRule): void {
        this.rules.set(rule.id, rule);
    }

    updateRule(ruleId: string, updates: Partial<AlertRule>): void {
        const rule = this.rules.get(ruleId);
        if (rule) {
            this.rules.set(ruleId, { ...rule, ...updates });
        }
    }

    deleteRule(ruleId: string): void {
        this.rules.delete(ruleId);
    }

    getRules(): AlertRule[] {
        return Array.from(this.rules.values());
    }

    async evaluateMetrics(metrics: PerformanceMetrics): Promise<void> {
        for (const rule of this.rules.values()) {
            if (!rule.enabled) continue;

            const value = this.getMetricValue(metrics, rule.metric);
            if (value === undefined) continue;

            const triggered = this.evaluateCondition(value, rule.condition, rule.threshold);
            if (triggered && this.shouldTriggerAlert(rule)) {
                await this.triggerAlert(rule, value);
            }
        }
    }

    private getMetricValue(
        metrics: PerformanceMetrics,
        metric: string
    ): number | undefined {
        const [category, name] = metric.split('.');
        if (category && name) {
            return metrics[category as keyof PerformanceMetrics]?.[name];
        }
        return undefined;
    }

    private evaluateCondition(
        value: number,
        condition: AlertRule['condition'],
        threshold: number
    ): boolean {
        switch (condition) {
            case 'gt':
                return value > threshold;
            case 'lt':
                return value < threshold;
            case 'eq':
                return value === threshold;
            case 'gte':
                return value >= threshold;
            case 'lte':
                return value <= threshold;
            default:
                return false;
        }
    }

    private shouldTriggerAlert(rule: AlertRule): boolean {
        if (!rule.lastTriggered) return true;

        const cooldownMs = rule.cooldown * 60 * 1000;
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
        return timeSinceLastTrigger >= cooldownMs;
    }

    private async triggerAlert(rule: AlertRule, value: number): Promise<void> {
        const event: AlertEvent = {
            ruleId: rule.id,
            timestamp: new Date(),
            value,
            threshold: rule.threshold,
            severity: rule.severity,
        };

        // Update last triggered time
        this.updateRule(rule.id, { lastTriggered: event.timestamp });

        // Log alert event
        await this.auditLogService.logEvent({
            type: AuditLogType.SECURITY,
            action: 'ALERT_TRIGGERED',
            userId: 'system',
            details: event,
            status: 'SUCCESS',
        });

        // Send notifications
        const notification: Notification = {
            title: `Alert: ${rule.name}`,
            message: this.formatAlertMessage(rule, value),
            severity: rule.severity,
            metadata: {
                ruleId: rule.id,
                metric: rule.metric,
                value,
                threshold: rule.threshold,
            },
        };

        await this.notificationService.sendNotification(notification);
    }

    private formatAlertMessage(rule: AlertRule, value: number): string {
        const condition = this.formatCondition(rule.condition);
        return `${rule.description}\n\nMetric: ${rule.metric}\nCurrent Value: ${value}\nThreshold: ${condition} ${rule.threshold}`;
    }

    private formatCondition(condition: AlertRule['condition']): string {
        switch (condition) {
            case 'gt':
                return '>';
            case 'lt':
                return '<';
            case 'eq':
                return '=';
            case 'gte':
                return '>=';
            case 'lte':
                return '<=';
            default:
                return condition;
        }
    }

    // Predefined alert rules
    initializeDefaultRules(): void {
        // Network Performance Rules
        this.addRule({
            id: 'network-tps',
            name: 'Low Transaction Throughput',
            description: 'Alert when network TPS falls below threshold',
            metric: 'tps',
            condition: 'lt',
            threshold: 1000,
            severity: 'warning',
            enabled: true,
            cooldown: 5,
            notificationChannels: ['slack', 'email']
        });

        this.addRule({
            id: 'network-latency',
            name: 'High Block Time',
            description: 'Alert when block time exceeds threshold',
            metric: 'blockTime',
            condition: 'gt',
            threshold: 1.5,
            severity: 'error',
            enabled: true,
            cooldown: 5,
            notificationChannels: ['slack', 'email']
        });

        // Application Performance Rules
        this.addRule({
            id: 'app-error-rate',
            name: 'High Error Rate',
            description: 'Alert when application error rate exceeds threshold',
            metric: 'errorRate',
            condition: 'gt',
            threshold: 0.05, // 5% error rate
            severity: 'critical',
            enabled: true,
            cooldown: 2,
            notificationChannels: ['slack', 'email', 'pager']
        });

        this.addRule({
            id: 'app-latency',
            name: 'High Request Latency',
            description: 'Alert when request latency exceeds threshold',
            metric: 'requestLatency',
            condition: 'gt',
            threshold: 1000, // 1 second
            severity: 'warning',
            enabled: true,
            cooldown: 5,
            notificationChannels: ['slack']
        });

        // Resource Utilization Rules
        this.addRule({
            id: 'memory-usage',
            name: 'High Memory Usage',
            description: 'Alert when memory usage exceeds threshold',
            metric: 'memoryUsage',
            condition: 'gt',
            threshold: 85, // 85% usage
            severity: 'warning',
            enabled: true,
            cooldown: 10,
            notificationChannels: ['slack']
        });

        this.addRule({
            id: 'cpu-usage',
            name: 'High CPU Usage',
            description: 'Alert when CPU usage exceeds threshold',
            metric: 'cpuUsage',
            condition: 'gt',
            threshold: 90, // 90% usage
            severity: 'warning',
            enabled: true,
            cooldown: 10,
            notificationChannels: ['slack']
        });

        // Smart Contract Performance Rules
        this.addRule({
            id: 'contract-failure',
            name: 'High Contract Failure Rate',
            description: 'Alert when contract failure rate exceeds threshold',
            metric: 'failureRate',
            condition: 'gt',
            threshold: 0.02, // 2% failure rate
            severity: 'critical',
            enabled: true,
            cooldown: 5,
            notificationChannels: ['slack', 'email', 'pager']
        });

        this.addRule({
            id: 'gas-usage',
            name: 'High Gas Usage',
            description: 'Alert when average gas usage exceeds threshold',
            metric: 'gasUsage',
            condition: 'gt',
            threshold: 1000000,
            severity: 'warning',
            enabled: true,
            cooldown: 15,
            notificationChannels: ['slack']
        });

        // User Activity Rules
        this.addRule({
            id: 'active-users',
            name: 'Low Active Users',
            description: 'Alert when active user count falls below threshold',
            metric: 'activeUsers',
            condition: 'lt',
            threshold: 100,
            severity: 'info',
            enabled: true,
            cooldown: 30,
            notificationChannels: ['slack']
        });

        // Security Rules
        this.addRule({
            id: 'failed-auth',
            name: 'High Failed Authentication Rate',
            description: 'Alert when failed authentication rate exceeds threshold',
            metric: 'failedAuthRate',
            condition: 'gt',
            threshold: 0.1, // 10% failure rate
            severity: 'critical',
            enabled: true,
            cooldown: 1,
            notificationChannels: ['slack', 'email', 'pager']
        });
    }
} 