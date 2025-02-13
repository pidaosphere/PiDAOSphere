import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Stack,
  Badge,
  Progress,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorModeValue,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiTrendingUp,
  FiClock,
  FiUsers,
  FiInfo,
} from 'react-icons/fi';
import { useApp } from '../contexts/AppContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  totalSupply: number;
  currentPrice: number;
  startTime: Date;
  endTime: Date;
  minInvestment: number;
  maxInvestment: number;
  piHolderMultiplier: number;
  totalInvestors: number;
  totalInvestment: number;
  targetRaise: number;
  creator: string;
  category: string;
  tags: string[];
}

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuthenticated, projectService } = useApp();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    totalSupply: 1000000,
    startPrice: 0.1,
    duration: 7,
    minInvestment: 0.1,
    maxInvestment: 100,
    piHolderMultiplier: 2,
    category: 'defi',
    tags: '',
  });

  // Mock data - replace with actual API call
  const projects: Project[] = [
    {
      id: '1',
      name: 'DeFi Lending Protocol',
      description: 'Decentralized lending platform with unique features for Pi holders',
      status: 'active',
      totalSupply: 1000000,
      currentPrice: 0.5,
      startTime: new Date('2024-02-01'),
      endTime: new Date('2024-02-08'),
      minInvestment: 0.1,
      maxInvestment: 100,
      piHolderMultiplier: 2,
      totalInvestors: 150,
      totalInvestment: 50000,
      targetRaise: 100000,
      creator: 'team@defilending.com',
      category: 'defi',
      tags: ['lending', 'yield', 'staking'],
    },
    // Add more projects...
  ];

  const handleCreateProject = async () => {
    try {
      setLoading(true);
      // Implement project creation logic
      await projectService?.createProject(newProject);
      
      toast({
        title: 'Project Created',
        description: 'Your project has been successfully created',
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

  const filteredProjects = projects.filter((project) => {
    const matchesFilter = filter === 'all' || project.status === filter;
    const matchesCategory = category === 'all' || project.category === category;
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesCategory && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.startTime.getTime() - a.startTime.getTime();
      case 'oldest':
        return a.startTime.getTime() - b.startTime.getTime();
      case 'investment':
        return b.totalInvestment - a.totalInvestment;
      case 'investors':
        return b.totalInvestors - a.totalInvestors;
      default:
        return 0;
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Stack>
            <Heading>Projects</Heading>
            <Text color="gray.600">
              Discover and invest in promising projects
            </Text>
          </Stack>
          {isAuthenticated && (
            <Button
              leftIcon={<FiPlus />}
              colorScheme="purple"
              onClick={onOpen}
            >
              Create Project
            </Button>
          )}
        </Flex>

        <Tabs variant="soft-rounded" colorScheme="purple" onChange={setSelectedTab}>
          <TabList>
            <Tab>All Projects</Tab>
            <Tab>My Investments</Tab>
            <Tab>Created Projects</Tab>
          </TabList>
        </Tabs>

        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <InputGroup maxW={{ base: 'full', md: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>

          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            maxW={{ base: 'full', md: '200px' }}
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxW={{ base: 'full', md: '200px' }}
          >
            <option value="all">All Categories</option>
            <option value="defi">DeFi</option>
            <option value="nft">NFT</option>
            <option value="gaming">Gaming</option>
            <option value="infrastructure">Infrastructure</option>
          </Select>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            maxW={{ base: 'full', md: '200px' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="investment">Highest Investment</option>
            <option value="investors">Most Investors</option>
          </Select>
        </Stack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredProjects.map((project) => (
            <Box
              key={project.id}
              bg={useColorModeValue('white', 'gray.700')}
              p={6}
              borderRadius="lg"
              shadow="base"
              cursor="pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
              transition="all 0.2s"
            >
              <Stack spacing={4}>
                <Flex justify="space-between" align="center">
                  <Badge
                    colorScheme={
                      project.status === 'upcoming' ? 'yellow' :
                      project.status === 'active' ? 'green' :
                      project.status === 'completed' ? 'blue' :
                      'red'
                    }
                  >
                    {project.status}
                  </Badge>
                  <Badge colorScheme="purple">
                    {project.category}
                  </Badge>
                </Flex>

                <Stack spacing={2}>
                  <Heading size="md" noOfLines={2}>
                    {project.name}
                  </Heading>
                  <Text color="gray.600" noOfLines={3}>
                    {project.description}
                  </Text>
                </Stack>

                <Stack spacing={2}>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.500">Progress</Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {((project.totalInvestment / project.targetRaise) * 100).toFixed(1)}%
                    </Text>
                  </Flex>
                  <Progress
                    value={(project.totalInvestment / project.targetRaise) * 100}
                    colorScheme="purple"
                    borderRadius="full"
                  />
                </Stack>

                <SimpleGrid columns={2} spacing={4}>
                  <Stack spacing={1}>
                    <Flex align="center" gap={1}>
                      <Icon as={FiTrendingUp} color="gray.500" />
                      <Text fontSize="sm" color="gray.500">
                        Current Price
                      </Text>
                    </Flex>
                    <Text fontWeight="medium">
                      {project.currentPrice} SOL
                    </Text>
                  </Stack>

                  <Stack spacing={1}>
                    <Flex align="center" gap={1}>
                      <Icon as={FiUsers} color="gray.500" />
                      <Text fontSize="sm" color="gray.500">
                        Investors
                      </Text>
                    </Flex>
                    <Text fontWeight="medium">
                      {project.totalInvestors}
                    </Text>
                  </Stack>
                </SimpleGrid>

                <Flex wrap="wrap" gap={2}>
                  {project.tags.map((tag) => (
                    <Badge
                      key={tag}
                      colorScheme="gray"
                      variant="subtle"
                      fontSize="xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </Flex>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Project Name</FormLabel>
                <Input
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe your project..."
                  minH="150px"
                />
              </FormControl>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Total Supply</FormLabel>
                  <NumberInput
                    value={newProject.totalSupply}
                    onChange={(value) => setNewProject({ ...newProject, totalSupply: parseInt(value) })}
                    min={1000}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Start Price (SOL)</FormLabel>
                  <NumberInput
                    value={newProject.startPrice}
                    onChange={(value) => setNewProject({ ...newProject, startPrice: parseFloat(value) })}
                    min={0.001}
                    step={0.001}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Duration (days)</FormLabel>
                  <NumberInput
                    value={newProject.duration}
                    onChange={(value) => setNewProject({ ...newProject, duration: parseInt(value) })}
                    min={1}
                    max={30}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>
                    <Flex align="center" gap={1}>
                      Pi Holder Multiplier
                      <Tooltip label="Bonus multiplier for verified Pi Network holders">
                        <Icon as={FiInfo} color="gray.500" />
                      </Tooltip>
                    </Flex>
                  </FormLabel>
                  <NumberInput
                    value={newProject.piHolderMultiplier}
                    onChange={(value) => setNewProject({ ...newProject, piHolderMultiplier: parseInt(value) })}
                    min={1}
                    max={5}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Minimum Investment (SOL)</FormLabel>
                  <NumberInput
                    value={newProject.minInvestment}
                    onChange={(value) => setNewProject({ ...newProject, minInvestment: parseFloat(value) })}
                    min={0.1}
                    step={0.1}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Maximum Investment (SOL)</FormLabel>
                  <NumberInput
                    value={newProject.maxInvestment}
                    onChange={(value) => setNewProject({ ...newProject, maxInvestment: parseFloat(value) })}
                    min={1}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Category</FormLabel>
                <Select
                  value={newProject.category}
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                >
                  <option value="defi">DeFi</option>
                  <option value="nft">NFT</option>
                  <option value="gaming">Gaming</option>
                  <option value="infrastructure">Infrastructure</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Tags (comma separated)</FormLabel>
                <Input
                  value={newProject.tags}
                  onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                  placeholder="e.g. defi, lending, yield"
                />
              </FormControl>

              <Button
                colorScheme="purple"
                onClick={handleCreateProject}
                isLoading={loading}
                size="lg"
                width="full"
              >
                Create Project
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}; 