import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Stack,
  Button,
  SimpleGrid,
  Text,
  Badge,
  Flex,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus } from 'react-icons/fi';
import { useApp } from '../contexts/AppContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'succeeded' | 'defeated' | 'executed' | 'cancelled';
  creator: string;
  startTime: Date;
  endTime: Date;
  forVotes: number;
  againstVotes: number;
}

export const Proposals: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, projectService } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    votingPeriod: 3, // days
  });

  // Mock data - replace with actual API call
  const proposals: Proposal[] = [
    {
      id: '1',
      title: 'Increase Pi Holder Multiplier',
      description: 'Proposal to increase the Pi holder multiplier from 2x to 3x',
      status: 'active',
      creator: 'user123',
      startTime: new Date('2024-02-01'),
      endTime: new Date('2024-02-08'),
      forVotes: 1000000,
      againstVotes: 500000,
    },
    // Add more mock proposals...
  ];

  const handleCreateProposal = async () => {
    try {
      setLoading(true);
      // Implement proposal creation logic
      toast({
        title: 'Proposal Created',
        description: 'Your proposal has been successfully created',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter((proposal) => {
    const matchesFilter = filter === 'all' || proposal.status === filter;
    const matchesSearch = proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Flex justify="space-between" align="center">
          <Heading>Governance Proposals</Heading>
          {isAuthenticated && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="purple"
              onClick={onOpen}
            >
              Create Proposal
            </Button>
          )}
        </Flex>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <InputGroup maxW={{ base: 'full', md: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            maxW={{ base: 'full', md: '200px' }}
          >
            <option value="all">All Proposals</option>
            <option value="active">Active</option>
            <option value="succeeded">Succeeded</option>
            <option value="defeated">Defeated</option>
            <option value="executed">Executed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredProposals.map((proposal) => (
            <Box
              key={proposal.id}
              p={6}
              bg="white"
              shadow="md"
              borderRadius="lg"
              cursor="pointer"
              onClick={() => navigate(`/proposals/${proposal.id}`)}
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              transition="all 0.2s"
            >
              <Stack spacing={4}>
                <Flex justify="space-between" align="center">
                  <Badge
                    colorScheme={
                      proposal.status === 'active' ? 'green' :
                      proposal.status === 'succeeded' ? 'blue' :
                      proposal.status === 'defeated' ? 'red' :
                      proposal.status === 'executed' ? 'purple' :
                      'gray'
                    }
                  >
                    {proposal.status}
                  </Badge>
                  <Text fontSize="sm" color="gray.500">
                    {new Date(proposal.endTime).toLocaleDateString()}
                  </Text>
                </Flex>

                <Heading size="md" noOfLines={2}>
                  {proposal.title}
                </Heading>

                <Text noOfLines={3} color="gray.600">
                  {proposal.description}
                </Text>

                <Stack spacing={2}>
                  <Text fontSize="sm" color="gray.500">
                    Created by {proposal.creator}
                  </Text>
                  <Flex justify="space-between" fontSize="sm">
                    <Text>For: {proposal.forVotes.toLocaleString()}</Text>
                    <Text>Against: {proposal.againstVotes.toLocaleString()}</Text>
                  </Flex>
                </Stack>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Proposal</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                  placeholder="Enter proposal title"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                  placeholder="Describe your proposal..."
                  minH="200px"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Voting Period (days)</FormLabel>
                <Select
                  value={newProposal.votingPeriod}
                  onChange={(e) => setNewProposal({ ...newProposal, votingPeriod: parseInt(e.target.value) })}
                >
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                </Select>
              </FormControl>

              <Button
                colorScheme="purple"
                onClick={handleCreateProposal}
                isLoading={loading}
              >
                Create Proposal
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}; 