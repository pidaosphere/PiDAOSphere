import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Stack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorModeValue,
  Button,
  Flex,
  Icon,
  Progress,
} from '@chakra-ui/react';
import { FiDollarSign, FiUsers, FiActivity, FiPieChart } from 'react-icons/fi';
import { useApp } from '../contexts/AppContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

interface Investment {
  projectId: string;
  projectName: string;
  amount: number;
  tokens: number;
  timestamp: Date;
  status: 'active' | 'completed' | 'pending';
}

interface Vote {
  proposalId: string;
  proposalTitle: string;
  support: boolean;
  votes: number;
  timestamp: Date;
  status: 'active' | 'executed' | 'defeated';
}

export const Dashboard: React.FC = () => {
  const { isAuthenticated, user } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with actual API calls
  const stats = {
    totalInvestment: 1500,
    totalTokens: 75000,
    activeProjects: 3,
    votingPower: 50000,
    piHolderStatus: true,
    recentGrowth: 12.5,
  };

  const investments: Investment[] = [
    {
      projectId: '1',
      projectName: 'Project Alpha',
      amount: 500,
      tokens: 25000,
      timestamp: new Date('2024-02-01'),
      status: 'active',
    },
    // Add more investments...
  ];

  const votes: Vote[] = [
    {
      proposalId: '1',
      proposalTitle: 'Increase Pi Holder Multiplier',
      support: true,
      votes: 25000,
      timestamp: new Date('2024-02-02'),
      status: 'active',
    },
    // Add more votes...
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;
  if (!isAuthenticated) return <ErrorAlert message="Please connect your wallet to view the dashboard" />;

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Stack>
            <Heading size="lg">Dashboard</Heading>
            <Text color="gray.600">Welcome back, {user?.username}</Text>
          </Stack>
          {stats.piHolderStatus && (
            <Badge colorScheme="purple" p={2} fontSize="md">
              Verified Pi Holder
            </Badge>
          )}
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            label="Total Investment"
            value={`${stats.totalInvestment} SOL`}
            icon={FiDollarSign}
            change={stats.recentGrowth}
          />
          <StatCard
            label="Total Tokens"
            value={stats.totalTokens.toLocaleString()}
            icon={FiPieChart}
          />
          <StatCard
            label="Active Projects"
            value={stats.activeProjects.toString()}
            icon={FiUsers}
          />
          <StatCard
            label="Voting Power"
            value={stats.votingPower.toLocaleString()}
            icon={FiActivity}
          />
        </SimpleGrid>

        <Tabs variant="enclosed">
          <TabList>
            <Tab>Investments</Tab>
            <Tab>Voting History</Tab>
            <Tab>Performance</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Project</Th>
                    <Th isNumeric>Amount (SOL)</Th>
                    <Th isNumeric>Tokens</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {investments.map((investment) => (
                    <Tr key={`${investment.projectId}-${investment.timestamp.getTime()}`}>
                      <Td fontWeight="medium">{investment.projectName}</Td>
                      <Td isNumeric>{investment.amount}</Td>
                      <Td isNumeric>{investment.tokens.toLocaleString()}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            investment.status === 'active' ? 'green' :
                            investment.status === 'completed' ? 'blue' :
                            'yellow'
                          }
                        >
                          {investment.status}
                        </Badge>
                      </Td>
                      <Td>{investment.timestamp.toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            <TabPanel>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Proposal</Th>
                    <Th>Vote</Th>
                    <Th isNumeric>Voting Power</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {votes.map((vote) => (
                    <Tr key={`${vote.proposalId}-${vote.timestamp.getTime()}`}>
                      <Td fontWeight="medium">{vote.proposalTitle}</Td>
                      <Td>
                        <Badge colorScheme={vote.support ? 'green' : 'red'}>
                          {vote.support ? 'For' : 'Against'}
                        </Badge>
                      </Td>
                      <Td isNumeric>{vote.votes.toLocaleString()}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            vote.status === 'active' ? 'green' :
                            vote.status === 'executed' ? 'blue' :
                            'red'
                          }
                        >
                          {vote.status}
                        </Badge>
                      </Td>
                      <Td>{vote.timestamp.toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            <TabPanel>
              <Stack spacing={6}>
                <Box>
                  <Text mb={2}>Investment Growth</Text>
                  <Progress
                    value={75}
                    size="lg"
                    colorScheme="purple"
                    hasStripe
                    isAnimated
                  />
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <Box
                    p={6}
                    bg={useColorModeValue('white', 'gray.700')}
                    borderRadius="lg"
                    shadow="base"
                  >
                    <Stack spacing={4}>
                      <Text fontWeight="bold">Token Distribution</Text>
                      {/* Add token distribution chart */}
                    </Stack>
                  </Box>

                  <Box
                    p={6}
                    bg={useColorModeValue('white', 'gray.700')}
                    borderRadius="lg"
                    shadow="base"
                  >
                    <Stack spacing={4}>
                      <Text fontWeight="bold">Voting Activity</Text>
                      {/* Add voting activity chart */}
                    </Stack>
                  </Box>
                </SimpleGrid>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Container>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType;
  change?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, change }) => {
  const bg = useColorModeValue('white', 'gray.700');
  
  return (
    <Box p={6} bg={bg} borderRadius="lg" shadow="base">
      <Stack spacing={2}>
        <Flex justify="space-between" align="center">
          <Text color="gray.500" fontSize="sm">
            {label}
          </Text>
          <Icon as={icon} color="purple.500" boxSize={6} />
        </Flex>
        <Stat>
          <StatNumber fontSize="2xl">{value}</StatNumber>
          {change && (
            <StatHelpText>
              <StatArrow type={change > 0 ? 'increase' : 'decrease'} />
              {Math.abs(change)}%
            </StatHelpText>
          )}
        </Stat>
      </Stack>
    </Box>
  );
}; 