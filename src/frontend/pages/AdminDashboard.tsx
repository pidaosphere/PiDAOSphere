import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Heading,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    VStack,
    HStack,
    Badge,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    StatArrow,
    useColorModeValue,
    Select,
} from '@chakra-ui/react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { PerformanceMetrics } from '../../services/PerformanceMonitor';
import { HealthCheck } from '../../services/MonitoringService';

interface DashboardMetrics {
    performance: PerformanceMetrics[];
    health: Record<string, HealthCheck>;
    aggregated: {
        averageTPS: number;
        averageBlockTime: number;
        averageConfirmationTime: number;
        totalTransactions: number;
        failureRate: number;
    };
}

export const AdminDashboard: React.FC = () => {
    const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [timeRange]);

    const fetchMetrics = async () => {
        try {
            const [performance, health, aggregated] = await Promise.all([
                fetch(`/api/metrics/history?period=${timeRange}`).then(res => res.json()),
                fetch('/api/health/status').then(res => res.json()),
                fetch(`/api/metrics/aggregated?period=${timeRange}`).then(res => res.json()),
            ]);

            setMetrics({ performance, health, aggregated });
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'green';
            case 'degraded':
                return 'yellow';
            case 'down':
                return 'red';
            default:
                return 'gray';
        }
    };

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                <HStack justify="space-between">
                    <Heading size="lg">System Dashboard</Heading>
                    <Select
                        w="200px"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as '1h' | '24h' | '7d')}
                    >
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                    </Select>
                </HStack>

                {/* System Health Status */}
                <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                    {metrics?.health && Object.entries(metrics.health).map(([service, check]) => (
                        <Box
                            key={service}
                            p={6}
                            bg={bgColor}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={borderColor}
                        >
                            <VStack align="start" spacing={3}>
                                <HStack justify="space-between" w="100%">
                                    <Heading size="md" textTransform="capitalize">
                                        {service}
                                    </Heading>
                                    <Badge
                                        colorScheme={getStatusColor(check.status)}
                                        fontSize="sm"
                                    >
                                        {check.status}
                                    </Badge>
                                </HStack>
                                <Text>Latency: {check.latency}ms</Text>
                                {check.details && (
                                    <Text color="gray.500">
                                        {JSON.stringify(check.details)}
                                    </Text>
                                )}
                            </VStack>
                        </Box>
                    ))}
                </Grid>

                {/* Performance Metrics */}
                <Tabs variant="enclosed">
                    <TabList>
                        <Tab>Solana Metrics</Tab>
                        <Tab>Application Metrics</Tab>
                        <Tab>Contract Metrics</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                                <Box
                                    p={6}
                                    bg={bgColor}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                    h="400px"
                                >
                                    <Heading size="md" mb={4}>TPS Over Time</Heading>
                                    <ResponsiveContainer>
                                        <LineChart
                                            data={metrics?.performance}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="timestamp"
                                                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(label) => new Date(label).toLocaleString()}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="solana.tps"
                                                stroke="#8884d8"
                                                name="TPS"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>

                                <Box
                                    p={6}
                                    bg={bgColor}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                >
                                    <VStack align="start" spacing={4}>
                                        <Stat>
                                            <StatLabel>Average TPS</StatLabel>
                                            <StatNumber>
                                                {metrics?.aggregated.averageTPS.toFixed(2)}
                                            </StatNumber>
                                            <StatHelpText>
                                                <StatArrow
                                                    type={
                                                        metrics?.aggregated.averageTPS > 1000
                                                            ? 'increase'
                                                            : 'decrease'
                                                    }
                                                />
                                                vs. baseline
                                            </StatHelpText>
                                        </Stat>

                                        <Stat>
                                            <StatLabel>Block Time</StatLabel>
                                            <StatNumber>
                                                {metrics?.aggregated.averageBlockTime.toFixed(2)}ms
                                            </StatNumber>
                                        </Stat>

                                        <Stat>
                                            <StatLabel>Failure Rate</StatLabel>
                                            <StatNumber>
                                                {(metrics?.aggregated.failureRate * 100).toFixed(2)}%
                                            </StatNumber>
                                        </Stat>
                                    </VStack>
                                </Box>
                            </Grid>
                        </TabPanel>

                        <TabPanel>
                            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                                <Box
                                    p={6}
                                    bg={bgColor}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                    h="400px"
                                >
                                    <Heading size="md" mb={4}>Resource Usage</Heading>
                                    <ResponsiveContainer>
                                        <LineChart
                                            data={metrics?.performance}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="timestamp"
                                                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(label) => new Date(label).toLocaleString()}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="application.cpuUsage"
                                                stroke="#82ca9d"
                                                name="CPU Usage"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="application.memoryUsage"
                                                stroke="#ffc658"
                                                name="Memory Usage"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>

                                <Box
                                    p={6}
                                    bg={bgColor}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                    h="400px"
                                >
                                    <Heading size="md" mb={4}>Error Rate</Heading>
                                    <ResponsiveContainer>
                                        <LineChart
                                            data={metrics?.performance}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="timestamp"
                                                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(label) => new Date(label).toLocaleString()}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="application.errorRate"
                                                stroke="#ff7300"
                                                name="Error Rate"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                        </TabPanel>

                        <TabPanel>
                            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                                <Box
                                    p={6}
                                    bg={bgColor}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                    h="400px"
                                >
                                    <Heading size="md" mb={4}>Contract Performance</Heading>
                                    <ResponsiveContainer>
                                        <LineChart
                                            data={metrics?.performance}
                                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="timestamp"
                                                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(label) => new Date(label).toLocaleString()}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="contract.gasUsage"
                                                stroke="#8884d8"
                                                name="Gas Usage"
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="contract.callCount"
                                                stroke="#82ca9d"
                                                name="Call Count"
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>

                                <Box
                                    p={6}
                                    bg={bgColor}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={borderColor}
                                >
                                    <VStack align="start" spacing={4}>
                                        <Stat>
                                            <StatLabel>Average Gas Usage</StatLabel>
                                            <StatNumber>
                                                {metrics?.performance[0]?.contract.gasUsage.toFixed(2)}
                                            </StatNumber>
                                        </Stat>

                                        <Stat>
                                            <StatLabel>Contract Calls</StatLabel>
                                            <StatNumber>
                                                {metrics?.performance[0]?.contract.callCount}
                                            </StatNumber>
                                        </Stat>

                                        <Stat>
                                            <StatLabel>Contract Failure Rate</StatLabel>
                                            <StatNumber>
                                                {(metrics?.performance[0]?.contract.failureRate * 100).toFixed(2)}%
                                            </StatNumber>
                                        </Stat>
                                    </VStack>
                                </Box>
                            </Grid>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
        </Box>
    );
}; 