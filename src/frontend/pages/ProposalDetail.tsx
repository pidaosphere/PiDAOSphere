import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  Button,
  Badge,
  Progress,
  Flex,
  Divider,
  Grid,
  GridItem,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorModeValue,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import { useApp } from '../contexts/AppContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

export const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, projectService } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [executionLoading, setExecutionLoading] = useState(false);

  // Mock data - replace with actual API call
  const proposal = {
    id: '1',
    title: 'Increase Pi Holder Multiplier',
    description: 'Proposal to increase the Pi holder multiplier from 2x to 3x to provide more incentives for Pi Network holders.',
    status: 'active',
    creator: 'user123',
    startTime: new Date('2024-02-01'),
    endTime: new Date('2024-02-08'),
    forVotes: 1000000,
    againstVotes: 500000,
    executionData: '0x...',
    discussions: [
      {
        author: 'user456',
        content: 'I support this proposal because...',
        timestamp: new Date('2024-02-02'),
      },
      // Add more discussions...
    ],
    votingHistory: [
      {
        voter: 'user789',
        support: true,
        votes: 50000,
        timestamp: new Date('2024-02-03'),
      },
      // Add more voting history...
    ],
  };

  const totalVotes = proposal.forVotes + proposal.againstVotes;
  const forPercentage = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;
  const quorumReached = totalVotes >= 1000000; // Example quorum threshold

  const handleVote = async (support: boolean) => {
    try {
      setVoting(true);
      // Implement voting logic
      await projectService?.castVote(proposal.id, support);
      
      toast({
        title: 'Vote Cast Successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setUserHasVoted(true);
    } catch (error) {
      toast({
        title: 'Error Casting Vote',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setVoting(false);
    }
  };

  const handleExecute = async () => {
    try {
      setExecutionLoading(true);
      // Implement proposal execution logic
      await projectService?.executeProposal(proposal.id);
      
      toast({
        title: 'Proposal Executed Successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error Executing Proposal',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExecutionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Button
          leftIcon={<FiArrowLeft />}
          variant="ghost"
          onClick={() => navigate('/proposals')}
          alignSelf="flex-start"
        >
          Back to Proposals
        </Button>

        <Stack spacing={4}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Heading size="lg">{proposal.title}</Heading>
            <Badge
              colorScheme={
                proposal.status === 'active' ? 'green' :
                proposal.status === 'succeeded' ? 'blue' :
                proposal.status === 'defeated' ? 'red' :
                proposal.status === 'executed' ? 'purple' :
                'gray'
              }
              fontSize="md"
              px={3}
              py={1}
            >
              {proposal.status}
            </Badge>
          </Flex>

          <Text color="gray.600">
            Created by {proposal.creator} on{' '}
            {new Date(proposal.startTime).toLocaleDateString()}
          </Text>
        </Stack>

        <Box
          bg={useColorModeValue('white', 'gray.700')}
          p={6}
          borderRadius="lg"
          shadow="base"
        >
          <Stack spacing={6}>
            <Text>{proposal.description}</Text>

            <Divider />

            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
              <Stat>
                <StatLabel>For Votes</StatLabel>
                <StatNumber>{proposal.forVotes.toLocaleString()}</StatNumber>
                <StatHelpText>{forPercentage.toFixed(2)}%</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Against Votes</StatLabel>
                <StatNumber>{proposal.againstVotes.toLocaleString()}</StatNumber>
                <StatHelpText>{againstPercentage.toFixed(2)}%</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Total Votes</StatLabel>
                <StatNumber>{totalVotes.toLocaleString()}</StatNumber>
                <StatHelpText>
                  {quorumReached ? 'Quorum Reached' : 'Quorum Not Reached'}
                </StatHelpText>
              </Stat>
            </Grid>

            <Box>
              <Text mb={2}>Voting Progress</Text>
              <Progress
                value={forPercentage}
                colorScheme="green"
                hasStripe
                isAnimated
                borderRadius="full"
              />
            </Box>

            {proposal.status === 'active' && (
              <>
                <Alert status="info">
                  <AlertIcon />
                  <AlertDescription>
                    Voting ends on {new Date(proposal.endTime).toLocaleString()}
                  </AlertDescription>
                </Alert>

                {isAuthenticated && !userHasVoted && (
                  <Flex gap={4} justify="center">
                    <Button
                      leftIcon={<FiCheck />}
                      colorScheme="green"
                      onClick={() => handleVote(true)}
                      isLoading={voting}
                      loadingText="Voting..."
                      size="lg"
                    >
                      Vote For
                    </Button>
                    <Button
                      leftIcon={<FiX />}
                      colorScheme="red"
                      onClick={() => handleVote(false)}
                      isLoading={voting}
                      loadingText="Voting..."
                      size="lg"
                    >
                      Vote Against
                    </Button>
                  </Flex>
                )}
              </>
            )}

            {proposal.status === 'succeeded' && (
              <Button
                colorScheme="purple"
                onClick={handleExecute}
                isLoading={executionLoading}
                loadingText="Executing..."
                size="lg"
                width="full"
              >
                Execute Proposal
              </Button>
            )}
          </Stack>
        </Box>

        <Tabs variant="enclosed">
          <TabList>
            <Tab>Discussion</Tab>
            <Tab>Voting History</Tab>
            <Tab>Execution Details</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Stack spacing={4}>
                {proposal.discussions.map((discussion, index) => (
                  <Box
                    key={index}
                    p={4}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="md"
                  >
                    <Stack spacing={2}>
                      <Flex justify="space-between" align="center">
                        <Text fontWeight="bold">{discussion.author}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(discussion.timestamp).toLocaleString()}
                        </Text>
                      </Flex>
                      <Text>{discussion.content}</Text>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </TabPanel>

            <TabPanel>
              <Stack spacing={4}>
                {proposal.votingHistory.map((vote, index) => (
                  <Box
                    key={index}
                    p={4}
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="md"
                  >
                    <Flex justify="space-between" align="center">
                      <Stack spacing={1}>
                        <Text fontWeight="bold">{vote.voter}</Text>
                        <Badge colorScheme={vote.support ? 'green' : 'red'}>
                          {vote.support ? 'For' : 'Against'}
                        </Badge>
                      </Stack>
                      <Stack spacing={1} align="flex-end">
                        <Text>{vote.votes.toLocaleString()} votes</Text>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(vote.timestamp).toLocaleString()}
                        </Text>
                      </Stack>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            </TabPanel>

            <TabPanel>
              <Stack spacing={4}>
                <Text fontWeight="bold">Execution Data:</Text>
                <Box
                  p={4}
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="md"
                  fontFamily="mono"
                  fontSize="sm"
                >
                  {proposal.executionData}
                </Box>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Container>
  );
}; 