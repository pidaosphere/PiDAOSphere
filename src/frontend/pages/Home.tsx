import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Stack,
  Flex,
} from '@chakra-ui/react';
import { FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const bgGradient = useColorModeValue(
    'linear(to-r, brand.primary, brand.secondary)',
    'linear(to-r, brand.primary, brand.secondary)'
  );

  return (
    <Box>
      {/* Hero Section */}
      <Container maxW="container.xl" py={20}>
        <Stack spacing={8} alignItems="center" textAlign="center">
          <Heading
            fontSize={{ base: '4xl', md: '6xl' }}
            bgGradient={bgGradient}
            bgClip="text"
          >
            Launch Your Token with Pi Network
          </Heading>
          <Text fontSize="xl" maxW="2xl">
            The first fair token launch platform combining Pi Network's user base with
            Solana's blockchain infrastructure.
          </Text>
          <Button
            size="lg"
            rightIcon={<Icon as={FiArrowRight} />}
            onClick={() => navigate('/projects')}
          >
            Explore Projects
          </Button>
        </Stack>
      </Container>

      {/* Features Section */}
      <Box bg="rgba(255, 255, 255, 0.02)" py={20}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <FeatureCard
              title="Fair Launch"
              description="Equal opportunity for all participants with transparent pricing and distribution."
            />
            <FeatureCard
              title="Pi Holder Benefits"
              description="Special multipliers and privileges for verified Pi Network holders."
            />
            <FeatureCard
              title="DAO Governance"
              description="Community-driven decision making through proposal and voting system."
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxW="container.xl" py={20}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
          <StatCard title="Total Projects" value="100+" />
          <StatCard title="Total Users" value="50K+" />
          <StatCard title="Total Value Locked" value="$10M+" />
        </SimpleGrid>
      </Container>
    </Box>
  );
};

const FeatureCard: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => (
  <Box
    p={6}
    bg="rgba(255, 255, 255, 0.05)"
    borderRadius="xl"
    backdropFilter="blur(10px)"
    transition="transform 0.3s"
    _hover={{ transform: 'translateY(-5px)' }}
  >
    <Heading size="md" mb={4}>
      {title}
    </Heading>
    <Text>{description}</Text>
  </Box>
);

const StatCard: React.FC<{ title: string; value: string }> = ({
  title,
  value,
}) => (
  <Flex
    direction="column"
    align="center"
    p={6}
    bg="rgba(255, 255, 255, 0.05)"
    borderRadius="xl"
    backdropFilter="blur(10px)"
  >
    <Text fontSize="lg" mb={2}>
      {title}
    </Text>
    <Heading size="2xl" bgGradient={useColorModeValue(
      'linear(to-r, brand.primary, brand.secondary)',
      'linear(to-r, brand.primary, brand.secondary)'
    )} bgClip="text">
      {value}
    </Heading>
  </Flex>
); 