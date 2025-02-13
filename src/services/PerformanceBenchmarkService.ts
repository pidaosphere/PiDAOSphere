import { Connection } from '@solana/web3.js';
import { CacheService } from './CacheService';
import { NotificationService } from './NotificationService';
import { logger } from '../utils/logger';

export interface BenchmarkResult {
    id: string;
    timestamp: Date;
    category: 'network' | 'application' | 'contract';
    metrics: {
        name: string;
        value: number;
        baseline: number;
        deviation: number;
    }[];
    status: 'success' | 'warning' | 'failure';
    summary: string;
}

export interface BenchmarkConfig {
    id: string;
    name: string;
    description: string;
    category: 'network' | 'application' | 'contract';
    metrics: {
        name: string;
        baseline: number;
        warningThreshold: number;
        failureThreshold: number;
    }[];
    schedule: {
        frequency: 'hourly' | 'daily' | 'weekly';
        lastRun?: Date;
    };
}

export class PerformanceBenchmarkService {
    private readonly connection: Connection;
    private readonly cacheService: CacheService;
    private readonly notificationService: NotificationService;
    private readonly BENCHMARK_CONFIG_KEY = 'benchmark:config';
    private readonly BENCHMARK_RESULTS_KEY = 'benchmark:results';

    constructor(
        connection: Connection,
        cacheService: CacheService,
        notificationService: NotificationService
    ) {
        this.connection = connection;
        this.cacheService = cacheService;
        this.notificationService = notificationService;
        this.initializeDefaultBenchmarks();
    }

    private async initializeDefaultBenchmarks(): Promise<void> {
        const defaultConfigs: BenchmarkConfig[] = [
            {
                id: 'network-performance',
                name: 'Network Performance Benchmark',
                description: 'Measures network performance metrics',
                category: 'network',
                metrics: [
                    {
                        name: 'tps',
                        baseline: 1000,
                        warningThreshold: 800,
                        failureThreshold: 500,
                    },
                    {
                        name: 'blockTime',
                        baseline: 400,
                        warningThreshold: 600,
                        failureThreshold: 1000,
                    },
                ],
                schedule: {
                    frequency: 'hourly',
                },
            },
            {
                id: 'application-performance',
                name: 'Application Performance Benchmark',
                description: 'Measures application performance metrics',
                category: 'application',
                metrics: [
                    {
                        name: 'requestLatency',
                        baseline: 100,
                        warningThreshold: 200,
                        failureThreshold: 500,
                    },
                    {
                        name: 'errorRate',
                        baseline: 0.01,
                        warningThreshold: 0.05,
                        failureThreshold: 0.1,
                    },
                ],
                schedule: {
                    frequency: 'hourly',
                },
            },
            {
                id: 'contract-performance',
                name: 'Smart Contract Performance Benchmark',
                description: 'Measures smart contract performance metrics',
                category: 'contract',
                metrics: [
                    {
                        name: 'gasUsage',
                        baseline: 1000000,
                        warningThreshold: 2000000,
                        failureThreshold: 5000000,
                    },
                    {
                        name: 'failureRate',
                        baseline: 0.01,
                        warningThreshold: 0.05,
                        failureThreshold: 0.1,
                    },
                ],
                schedule: {
                    frequency: 'daily',
                },
            },
        ];

        await this.cacheService.set(
            this.BENCHMARK_CONFIG_KEY,
            defaultConfigs,
            0 // No expiration
        );
    }

    async runBenchmark(configId: string): Promise<BenchmarkResult> {
        try {
            const config = await this.getBenchmarkConfig(configId);
            if (!config) {
                throw new Error(`Benchmark config not found: ${configId}`);
            }

            const metrics = await this.collectMetrics(config);
            const result = this.analyzeBenchmarkResults(config, metrics);

            await this.storeBenchmarkResult(result);
            await this.updateLastRunTime(configId);

            if (result.status !== 'success') {
                await this.notifyBenchmarkFailure(result);
            }

            return result;
        } catch (error) {
            logger.error('Failed to run benchmark:', error);
            throw error;
        }
    }

    private async collectMetrics(config: BenchmarkConfig): Promise<Array<{ name: string; value: number }>> {
        const metrics: Array<{ name: string; value: number }> = [];

        for (const metric of config.metrics) {
            try {
                const value = await this.measureMetric(config.category, metric.name);
                metrics.push({ name: metric.name, value });
            } catch (error) {
                logger.error(`Failed to collect metric ${metric.name}:`, error);
            }
        }

        return metrics;
    }

    private async measureMetric(category: string, metric: string): Promise<number> {
        switch (`${category}.${metric}`) {
            case 'network.tps':
                return this.measureNetworkTPS();
            case 'network.blockTime':
                return this.measureBlockTime();
            case 'application.requestLatency':
                return this.measureRequestLatency();
            case 'application.errorRate':
                return this.measureErrorRate();
            case 'contract.gasUsage':
                return this.measureGasUsage();
            case 'contract.failureRate':
                return this.measureContractFailureRate();
            default:
                throw new Error(`Unsupported metric: ${category}.${metric}`);
        }
    }

    private async measureNetworkTPS(): Promise<number> {
        const performance = await this.connection.getRecentPerformanceSamples(1);
        return performance[0]?.numTransactions || 0;
    }

    private async measureBlockTime(): Promise<number> {
        const slot = await this.connection.getSlot();
        const blockTime = await this.connection.getBlockTime(slot);
        return blockTime || 0;
    }

    private async measureRequestLatency(): Promise<number> {
        const start = Date.now();
        await this.connection.getRecentBlockhash();
        return Date.now() - start;
    }

    private async measureErrorRate(): Promise<number> {
        // Implementation depends on how you track errors
        return 0;
    }

    private async measureGasUsage(): Promise<number> {
        // Implementation depends on how you track gas usage
        return 0;
    }

    private async measureContractFailureRate(): Promise<number> {
        // Implementation depends on how you track contract failures
        return 0;
    }

    private analyzeBenchmarkResults(
        config: BenchmarkConfig,
        metrics: Array<{ name: string; value: number }>
    ): BenchmarkResult {
        const analyzedMetrics = metrics.map((metric) => {
            const configMetric = config.metrics.find((m) => m.name === metric.name);
            if (!configMetric) {
                throw new Error(`Metric config not found: ${metric.name}`);
            }

            const deviation = (metric.value - configMetric.baseline) / configMetric.baseline;
            return {
                name: metric.name,
                value: metric.value,
                baseline: configMetric.baseline,
                deviation,
            };
        });

        const status = this.calculateBenchmarkStatus(config, analyzedMetrics);
        const summary = this.generateBenchmarkSummary(config, analyzedMetrics, status);

        return {
            id: `${config.id}-${Date.now()}`,
            timestamp: new Date(),
            category: config.category,
            metrics: analyzedMetrics,
            status,
            summary,
        };
    }

    private calculateBenchmarkStatus(
        config: BenchmarkConfig,
        metrics: BenchmarkResult['metrics']
    ): BenchmarkResult['status'] {
        let hasWarning = false;
        let hasFailure = false;

        for (const metric of metrics) {
            const configMetric = config.metrics.find((m) => m.name === metric.name);
            if (!configMetric) continue;

            if (metric.value >= configMetric.failureThreshold) {
                hasFailure = true;
            } else if (metric.value >= configMetric.warningThreshold) {
                hasWarning = true;
            }
        }

        if (hasFailure) return 'failure';
        if (hasWarning) return 'warning';
        return 'success';
    }

    private generateBenchmarkSummary(
        config: BenchmarkConfig,
        metrics: BenchmarkResult['metrics'],
        status: BenchmarkResult['status']
    ): string {
        const statusText = status === 'success' ? 'passed' : 'failed';
        let summary = `${config.name} benchmark ${statusText}.\n\n`;

        summary += 'Metrics:\n';
        for (const metric of metrics) {
            const deviation = (metric.deviation * 100).toFixed(2);
            const direction = metric.deviation > 0 ? 'above' : 'below';
            summary += `- ${metric.name}: ${metric.value} (${deviation}% ${direction} baseline)\n`;
        }

        return summary;
    }

    private async storeBenchmarkResult(result: BenchmarkResult): Promise<void> {
        try {
            const results = await this.getBenchmarkResults();
            results.unshift(result);

            // Keep only the last 1000 results
            const trimmedResults = results.slice(0, 1000);

            await this.cacheService.set(
                this.BENCHMARK_RESULTS_KEY,
                trimmedResults,
                30 * 24 * 60 * 60 // Store for 30 days
            );
        } catch (error) {
            logger.error('Failed to store benchmark result:', error);
        }
    }

    private async updateLastRunTime(configId: string): Promise<void> {
        try {
            const configs = await this.getBenchmarkConfigs();
            const config = configs.find((c) => c.id === configId);
            if (config) {
                config.schedule.lastRun = new Date();
                await this.cacheService.set(this.BENCHMARK_CONFIG_KEY, configs, 0);
            }
        } catch (error) {
            logger.error('Failed to update last run time:', error);
        }
    }

    private async notifyBenchmarkFailure(result: BenchmarkResult): Promise<void> {
        await this.notificationService.sendNotification({
            title: `Benchmark ${result.status === 'warning' ? 'Warning' : 'Failure'}`,
            message: result.summary,
            severity: result.status === 'warning' ? 'warning' : 'error',
            metadata: result,
        });
    }

    async getBenchmarkConfigs(): Promise<BenchmarkConfig[]> {
        return (await this.cacheService.get<BenchmarkConfig[]>(this.BENCHMARK_CONFIG_KEY)) || [];
    }

    async getBenchmarkConfig(id: string): Promise<BenchmarkConfig | undefined> {
        const configs = await this.getBenchmarkConfigs();
        return configs.find((config) => config.id === id);
    }

    async getBenchmarkResults(
        category?: string,
        limit = 100
    ): Promise<BenchmarkResult[]> {
        const results = (await this.cacheService.get<BenchmarkResult[]>(
            this.BENCHMARK_RESULTS_KEY
        )) || [];

        return results
            .filter((result) => !category || result.category === category)
            .slice(0, limit);
    }

    async getLatestBenchmarkResult(category?: string): Promise<BenchmarkResult | undefined> {
        const results = await this.getBenchmarkResults(category, 1);
        return results[0];
    }

    async scheduleBenchmarks(): Promise<void> {
        const configs = await this.getBenchmarkConfigs();
        for (const config of configs) {
            if (this.shouldRunBenchmark(config)) {
                try {
                    await this.runBenchmark(config.id);
                } catch (error) {
                    logger.error(`Failed to run scheduled benchmark ${config.id}:`, error);
                }
            }
        }
    }

    private shouldRunBenchmark(config: BenchmarkConfig): boolean {
        if (!config.schedule.lastRun) return true;

        const now = new Date().getTime();
        const lastRun = config.schedule.lastRun.getTime();
        const interval = this.getScheduleInterval(config.schedule.frequency);

        return now - lastRun >= interval;
    }

    private getScheduleInterval(frequency: BenchmarkConfig['schedule']['frequency']): number {
        switch (frequency) {
            case 'hourly':
                return 60 * 60 * 1000;
            case 'daily':
                return 24 * 60 * 60 * 1000;
            case 'weekly':
                return 7 * 24 * 60 * 60 * 1000;
            default:
                return 24 * 60 * 60 * 1000;
        }
    }
} 