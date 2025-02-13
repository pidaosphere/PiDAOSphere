import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Heading,
    VStack,
    HStack,
    Text,
    Badge,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    useColorModeValue,
    Spinner,
    Alert,
    AlertIcon,
    Select,
} from '@chakra-ui/react';
import { BenchmarkResult, BenchmarkConfig } from '../../services/PerformanceBenchmarkService';
import { OptimizationSuggestion } from '../../services/PerformanceOptimizationService';

interface BenchmarkPanelProps {
    onRunBenchmark: (configId: string) => Promise<void>;
}

export const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({ onRunBenchmark }) => {
    const [benchmarkConfigs, setBenchmarkConfigs] = useState<BenchmarkConfig[]>([]);
    const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
    const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    useEffect(() => {
        fetchData();
    }, [selectedCategory]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [configs, results, optimizations] = await Promise.all([
                fetch('/api/benchmark/configs').then(res => res.json()),
                fetch(`/api/benchmark/results?category=${selectedCategory}`).then(res => res.json()),
                fetch('/api/optimization/suggestions').then(res => res.json()),
            ]);

            setBenchmarkConfigs(configs);
            setBenchmarkResults(results);
            setSuggestions(optimizations);
        } catch (err) {
            setError('Failed to fetch benchmark data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRunBenchmark = async (configId: string) => {
        try {
            setLoading(true);
            await onRunBenchmark(configId);
            await fetchData();
        } catch (err) {
            setError('Failed to run benchmark');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'green';
            case 'warning':
                return 'yellow';
            case 'failure':
                return 'red';
            default:
                return 'gray';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'red';
            case 'medium':
                return 'yellow';
            case 'low':
                return 'green';
            default:
                return 'gray';
        }
    };

    if (loading) {
        return (
            <Box p={6} textAlign="center">
                <Spinner size="xl" />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert status="error">
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    return (
        <VStack spacing={6} align="stretch" p={6}>
            <HStack justify="space-between">
                <Heading size="lg">Performance Benchmarks</Heading>
                <Select
                    w="200px"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="all">All Categories</option>
                    <option value="network">Network</option>
                    <option value="application">Application</option>
                    <option value="contract">Smart Contract</option>
                </Select>
            </HStack>

            {/* Benchmark Configurations */}
            <Box>
                <Heading size="md" mb={4}>Available Benchmarks</Heading>
                <Accordion allowMultiple>
                    {benchmarkConfigs.map((config) => (
                        <AccordionItem
                            key={config.id}
                            border="1px"
                            borderColor={borderColor}
                            borderRadius="md"
                            mb={2}
                        >
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                    <HStack justify="space-between">
                                        <Text fontWeight="bold">{config.name}</Text>
                                        <Badge>{config.category}</Badge>
                                    </HStack>
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4}>
                                <VStack align="stretch" spacing={4}>
                                    <Text>{config.description}</Text>
                                    <Table size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th>Metric</Th>
                                                <Th isNumeric>Baseline</Th>
                                                <Th isNumeric>Warning</Th>
                                                <Th isNumeric>Failure</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {config.metrics.map((metric) => (
                                                <Tr key={metric.name}>
                                                    <Td>{metric.name}</Td>
                                                    <Td isNumeric>{metric.baseline}</Td>
                                                    <Td isNumeric>{metric.warningThreshold}</Td>
                                                    <Td isNumeric>{metric.failureThreshold}</Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                    <Button
                                        colorScheme="blue"
                                        onClick={() => handleRunBenchmark(config.id)}
                                    >
                                        Run Benchmark
                                    </Button>
                                </VStack>
                            </AccordionPanel>
                        </AccordionItem>
                    ))}
                </Accordion>
            </Box>

            {/* Benchmark Results */}
            <Box>
                <Heading size="md" mb={4}>Recent Results</Heading>
                <Table>
                    <Thead>
                        <Tr>
                            <Th>Timestamp</Th>
                            <Th>Category</Th>
                            <Th>Status</Th>
                            <Th>Details</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {benchmarkResults.map((result) => (
                            <Tr key={result.id}>
                                <Td>{new Date(result.timestamp).toLocaleString()}</Td>
                                <Td>{result.category}</Td>
                                <Td>
                                    <Badge colorScheme={getStatusColor(result.status)}>
                                        {result.status}
                                    </Badge>
                                </Td>
                                <Td>
                                    <Accordion allowToggle>
                                        <AccordionItem border="0">
                                            <AccordionButton>
                                                <Box flex="1" textAlign="left">
                                                    View Details
                                                </Box>
                                                <AccordionIcon />
                                            </AccordionButton>
                                            <AccordionPanel pb={4}>
                                                <VStack align="stretch" spacing={2}>
                                                    {result.metrics.map((metric) => (
                                                        <HStack key={metric.name} justify="space-between">
                                                            <Text>{metric.name}</Text>
                                                            <Text>
                                                                {metric.value.toFixed(2)}
                                                                {' '}
                                                                <Badge
                                                                    colorScheme={
                                                                        metric.deviation > 0 ? 'red' : 'green'
                                                                    }
                                                                >
                                                                    {(metric.deviation * 100).toFixed(2)}%
                                                                </Badge>
                                                            </Text>
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                            </AccordionPanel>
                                        </AccordionItem>
                                    </Accordion>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>

            {/* Optimization Suggestions */}
            <Box>
                <Heading size="md" mb={4}>Optimization Suggestions</Heading>
                <VStack spacing={4} align="stretch">
                    {suggestions.map((suggestion) => (
                        <Box
                            key={suggestion.id}
                            p={4}
                            bg={bgColor}
                            borderRadius="md"
                            borderWidth="1px"
                            borderColor={borderColor}
                        >
                            <HStack justify="space-between" mb={2}>
                                <Heading size="sm">{suggestion.title}</Heading>
                                <Badge colorScheme={getPriorityColor(suggestion.priority)}>
                                    {suggestion.priority} priority
                                </Badge>
                            </HStack>
                            <Text color="gray.600" mb={2}>{suggestion.description}</Text>
                            <Text fontWeight="bold" mb={2}>Impact:</Text>
                            <Text mb={2}>{suggestion.impact}</Text>
                            <Text fontWeight="bold" mb={2}>Recommendations:</Text>
                            <Text whiteSpace="pre-line">{suggestion.recommendation}</Text>
                            <Box mt={4}>
                                <Text fontWeight="bold" mb={2}>Current Metrics:</Text>
                                <Table size="sm">
                                    <Thead>
                                        <Tr>
                                            <Th>Metric</Th>
                                            <Th isNumeric>Value</Th>
                                            <Th isNumeric>Threshold</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {suggestion.metrics.map((metric) => (
                                            <Tr key={metric.name}>
                                                <Td>{metric.name}</Td>
                                                <Td isNumeric>{metric.value.toFixed(2)}</Td>
                                                <Td isNumeric>{metric.threshold.toFixed(2)}</Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>
                        </Box>
                    ))}
                </VStack>
            </Box>
        </VStack>
    );
}; 