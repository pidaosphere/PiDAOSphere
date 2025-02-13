import { PerformanceMetrics } from './PerformanceMonitor';
import { NotificationService } from './NotificationService';
import { CacheService } from './CacheService';
import { logger } from '../utils/logger';

export interface OptimizationSuggestion {
    id: string;
    timestamp: Date;
    category: 'network' | 'application' | 'contract' | 'resource';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact: string;
    recommendation: string;
    metrics: {
        name: string;
        value: number;
        threshold: number;
    }[];
}

export class PerformanceOptimizationService {
    private readonly cacheService: CacheService;
    private readonly notificationService: NotificationService;
    private readonly OPTIMIZATION_CACHE_KEY = 'optimization:suggestions';
    private readonly PERFORMANCE_BASELINES = {
        'solana.tps': 1000,
        'solana.blockTime': 400,
        'solana.confirmationTime': 1000,
        'application.requestLatency': 100,
        'application.errorRate': 0.01,
        'application.memoryUsage': 0.7,
        'application.cpuUsage': 0.6,
        'contract.gasUsage': 1000000,
        'contract.failureRate': 0.01,
    };

    constructor(
        cacheService: CacheService,
        notificationService: NotificationService
    ) {
        this.cacheService = cacheService;
        this.notificationService = notificationService;
    }

    async analyzePerfomance(metrics: PerformanceMetrics): Promise<OptimizationSuggestion[]> {
        const suggestions: OptimizationSuggestion[] = [];

        // Analyze network performance
        if (metrics.solana.tps < this.PERFORMANCE_BASELINES['solana.tps']) {
            suggestions.push(this.createNetworkOptimizationSuggestion(metrics));
        }

        // Analyze application performance
        if (
            metrics.application.requestLatency > this.PERFORMANCE_BASELINES['application.requestLatency'] ||
            metrics.application.errorRate > this.PERFORMANCE_BASELINES['application.errorRate']
        ) {
            suggestions.push(this.createApplicationOptimizationSuggestion(metrics));
        }

        // Analyze resource usage
        if (
            metrics.application.memoryUsage > this.PERFORMANCE_BASELINES['application.memoryUsage'] ||
            metrics.application.cpuUsage > this.PERFORMANCE_BASELINES['application.cpuUsage']
        ) {
            suggestions.push(this.createResourceOptimizationSuggestion(metrics));
        }

        // Analyze contract performance
        if (
            metrics.contract.gasUsage > this.PERFORMANCE_BASELINES['contract.gasUsage'] ||
            metrics.contract.failureRate > this.PERFORMANCE_BASELINES['contract.failureRate']
        ) {
            suggestions.push(this.createContractOptimizationSuggestion(metrics));
        }

        await this.storeSuggestions(suggestions);
        return suggestions;
    }

    private createNetworkOptimizationSuggestion(
        metrics: PerformanceMetrics
    ): OptimizationSuggestion {
        return {
            id: `network-${Date.now()}`,
            timestamp: new Date(),
            category: 'network',
            priority: this.calculatePriority(metrics.solana.tps, this.PERFORMANCE_BASELINES['solana.tps']),
            title: 'Network Performance Optimization',
            description: 'Network performance is below optimal levels',
            impact: 'Reduced transaction throughput and increased latency',
            recommendation: `
                Consider the following optimizations:
                1. Optimize transaction batching
                2. Implement request rate limiting
                3. Review network configuration
                4. Consider using a dedicated RPC node
            `,
            metrics: [
                {
                    name: 'TPS',
                    value: metrics.solana.tps,
                    threshold: this.PERFORMANCE_BASELINES['solana.tps'],
                },
                {
                    name: 'Block Time',
                    value: metrics.solana.blockTime,
                    threshold: this.PERFORMANCE_BASELINES['solana.blockTime'],
                },
            ],
        };
    }

    private createApplicationOptimizationSuggestion(
        metrics: PerformanceMetrics
    ): OptimizationSuggestion {
        return {
            id: `app-${Date.now()}`,
            timestamp: new Date(),
            category: 'application',
            priority: this.calculatePriority(
                metrics.application.errorRate,
                this.PERFORMANCE_BASELINES['application.errorRate']
            ),
            title: 'Application Performance Optimization',
            description: 'Application performance metrics indicate potential issues',
            impact: 'Degraded user experience and increased error rates',
            recommendation: `
                Consider the following optimizations:
                1. Implement request caching
                2. Optimize database queries
                3. Add request retries with exponential backoff
                4. Review error handling strategies
            `,
            metrics: [
                {
                    name: 'Request Latency',
                    value: metrics.application.requestLatency,
                    threshold: this.PERFORMANCE_BASELINES['application.requestLatency'],
                },
                {
                    name: 'Error Rate',
                    value: metrics.application.errorRate,
                    threshold: this.PERFORMANCE_BASELINES['application.errorRate'],
                },
            ],
        };
    }

    private createResourceOptimizationSuggestion(
        metrics: PerformanceMetrics
    ): OptimizationSuggestion {
        return {
            id: `resource-${Date.now()}`,
            timestamp: new Date(),
            category: 'resource',
            priority: this.calculatePriority(
                metrics.application.memoryUsage,
                this.PERFORMANCE_BASELINES['application.memoryUsage']
            ),
            title: 'Resource Usage Optimization',
            description: 'System resource usage is approaching critical levels',
            impact: 'Potential system instability and performance degradation',
            recommendation: `
                Consider the following optimizations:
                1. Implement memory leak detection
                2. Review resource-intensive operations
                3. Optimize background tasks
                4. Consider scaling infrastructure
            `,
            metrics: [
                {
                    name: 'Memory Usage',
                    value: metrics.application.memoryUsage,
                    threshold: this.PERFORMANCE_BASELINES['application.memoryUsage'],
                },
                {
                    name: 'CPU Usage',
                    value: metrics.application.cpuUsage,
                    threshold: this.PERFORMANCE_BASELINES['application.cpuUsage'],
                },
            ],
        };
    }

    private createContractOptimizationSuggestion(
        metrics: PerformanceMetrics
    ): OptimizationSuggestion {
        return {
            id: `contract-${Date.now()}`,
            timestamp: new Date(),
            category: 'contract',
            priority: this.calculatePriority(
                metrics.contract.failureRate,
                this.PERFORMANCE_BASELINES['contract.failureRate']
            ),
            title: 'Smart Contract Optimization',
            description: 'Smart contract performance can be improved',
            impact: 'High gas costs and increased failure rates',
            recommendation: `
                Consider the following optimizations:
                1. Optimize contract code for gas efficiency
                2. Implement proper error handling
                3. Review contract state management
                4. Consider batching transactions
            `,
            metrics: [
                {
                    name: 'Gas Usage',
                    value: metrics.contract.gasUsage,
                    threshold: this.PERFORMANCE_BASELINES['contract.gasUsage'],
                },
                {
                    name: 'Failure Rate',
                    value: metrics.contract.failureRate,
                    threshold: this.PERFORMANCE_BASELINES['contract.failureRate'],
                },
            ],
        };
    }

    private calculatePriority(
        value: number,
        baseline: number
    ): OptimizationSuggestion['priority'] {
        const deviation = value / baseline;
        if (deviation > 2) return 'high';
        if (deviation > 1.5) return 'medium';
        return 'low';
    }

    private async storeSuggestions(
        suggestions: OptimizationSuggestion[]
    ): Promise<void> {
        try {
            const existingSuggestions =
                (await this.cacheService.get<OptimizationSuggestion[]>(
                    this.OPTIMIZATION_CACHE_KEY
                )) || [];

            // Keep only the last 100 suggestions
            const updatedSuggestions = [...suggestions, ...existingSuggestions]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 100);

            await this.cacheService.set(
                this.OPTIMIZATION_CACHE_KEY,
                updatedSuggestions,
                24 * 60 * 60 // Store for 24 hours
            );

            // Notify about high priority suggestions
            const highPrioritySuggestions = suggestions.filter(
                (s) => s.priority === 'high'
            );
            if (highPrioritySuggestions.length > 0) {
                await this.notifyHighPrioritySuggestions(highPrioritySuggestions);
            }
        } catch (error) {
            logger.error('Failed to store optimization suggestions:', error);
        }
    }

    private async notifyHighPrioritySuggestions(
        suggestions: OptimizationSuggestion[]
    ): Promise<void> {
        for (const suggestion of suggestions) {
            await this.notificationService.sendNotification({
                title: `High Priority Optimization Required: ${suggestion.title}`,
                message: `
                    ${suggestion.description}
                    
                    Impact: ${suggestion.impact}
                    
                    Recommended Actions:
                    ${suggestion.recommendation}
                    
                    Current Metrics:
                    ${suggestion.metrics
                        .map((m) => `${m.name}: ${m.value} (Threshold: ${m.threshold})`)
                        .join('\n')}
                `,
                severity: 'warning',
                metadata: suggestion,
            });
        }
    }

    async getSuggestionHistory(): Promise<OptimizationSuggestion[]> {
        try {
            return (
                (await this.cacheService.get<OptimizationSuggestion[]>(
                    this.OPTIMIZATION_CACHE_KEY
                )) || []
            );
        } catch (error) {
            logger.error('Failed to get optimization suggestions:', error);
            return [];
        }
    }

    async getLatestSuggestions(): Promise<OptimizationSuggestion[]> {
        const suggestions = await this.getSuggestionHistory();
        return suggestions.slice(0, 10); // Return the 10 most recent suggestions
    }
} 