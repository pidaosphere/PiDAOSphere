import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Stack,
  Flex,
  Image,
  Progress,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Grid,
  GridItem,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [investmentAmount, setInvestmentAmount] = useState('');

  // Mock project data - replace with API call
  const project = {
    id: '1',
    name: 'Project Alpha',
    description: 'Decentralized finance protocol built on Solana',
    logo: 'https://via.placeholder.com/100',
    status: 'active',
    totalRaise: 100000,
    currentRaise: 75000,
    piHolderMultiplier: 2,
    startTime: new Date('2024-02-01'),
    endTime: new Date('2024-02-28'),
    website: 'https://example.com',
    whitepaper: 'https://example.com/whitepaper',
    team: [
      {
        name: 'John Doe',
        role: 'CEO',
        avatar: 'https://via.placeholder.com/50',
      },
      // Add more team members...
    ],
  };

  const handleInvest = async () => {
    try {
      // Implement investment logic here
      toast({
        title: 'Investment Successful',
        description: `You have invested ${investmentAmount} SOL`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Investment Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={10}>
      <Stack spacing={8}>
        {/* Project Header */}
        <Flex align="center" gap={6}>
          <Image src={project.logo} boxSize="100px" borderRadius="xl" />
          <Stack>
            <Heading>{project.name}</Heading>
            <Text fontSize="lg">{project.description}</Text>
          </Stack>
        </Flex>

        {/* Progress Section */}
        <Box bg="rgba(255, 255, 255, 0.05)" p={6} borderRadius="xl">
          <Stack spacing={4}>
            <Flex justify="space-between">
              <Text>Progress</Text>
              <Text>{((project.currentRaise / project.totalRaise) * 100).toFixed(1)}%</Text>
            </Flex>
            <Progress value={(project.currentRaise / project.totalRaise) * 100} colorScheme="purple" borderRadius="full" />
            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
              <GridItem>
                <Text fontSize="sm">Total Raise</Text>
                <Text fontWeight="bold">{project.totalRaise} SOL</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="sm">Current Raise</Text>
                <Text fontWeight="bold">{project.currentRaise} SOL</Text>
              </GridItem>
              <GridItem>
                <Text fontSize="sm">Pi Holder Multiplier</Text>
                <Text fontWeight="bold">{project.piHolderMultiplier}x</Text>
              </GridItem>
            </Grid>
            <Button colorScheme="purple" size="lg" onClick={onOpen}>
              Invest Now
            </Button>
          </Stack>
        </Box>

        {/* Project Details Tabs */}
        <Tabs variant="soft-rounded">
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Team</Tab>
            <Tab>Documents</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Stack spacing={4}>
                <Text>{project.description}</Text>
                {/* Add more project details */}
              </Stack>
            </TabPanel>

            <TabPanel>
              <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
                {project.team.map((member, index) => (
                  <Box key={index} p={4} bg="rgba(255, 255, 255, 0.05)" borderRadius="xl">
                    <Stack align="center" spacing={3}>
                      <Image src={member.avatar} boxSize="80px" borderRadius="full" />
                      <Text fontWeight="bold">{member.name}</Text>
                      <Text fontSize="sm">{member.role}</Text>
                    </Stack>
                  </Box>
                ))}
              </Grid>
            </TabPanel>

            <TabPanel>
              <Stack spacing={4}>
                <Button as="a" href={project.whitepaper} target="_blank" variant="outline">
                  Download Whitepaper
                </Button>
                {/* Add more documents */}
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>

      {/* Investment Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="brand.background">
          <ModalHeader>Invest in {project.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>Investment Amount (SOL)</FormLabel>
                <Input
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </FormControl>
              <Text fontSize="sm">
                Pi Holder Multiplier: {project.piHolderMultiplier}x
              </Text>
              <Button colorScheme="purple" onClick={handleInvest}>
                Confirm Investment
              </Button>
            </Stack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}; 