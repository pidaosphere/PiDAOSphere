import React, { useState } from 'react';
import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    Progress,
    Badge,
    Divider,
    useToast,
    Stat,
    StatLabel,
    StatNumber,
    StatGroup,
    Flex,
    IconButton,
    Tooltip,
} from '@chakra-ui/react';
import { FiThumbsUp, FiThumbsDown, FiCheck } from 'react-icons/fi';
import { useWallet } from '@solana/wallet-adapter-react';
import { useApp } from '../contexts/AppContext';
import { BN } from '@project-serum/anchor';

interface VotingModuleProps {
    proposalId: string;
    title: string;
    description: string;
    status: 'active' | 'succeeded' | 'defeated' | 'executed' | 'cancelled';
    creator: string;
    startTime: Date;
    endTime: Date;
    forVotes: number;
    againstVotes: number;
    quorum: number;
    canExecute?: boolean;
    onVote: (support: boolean) => Promise<void>;
    onExecute?: () => Promise<void>;
}

export const VotingModule: React.FC<VotingModuleProps> = ({
    proposalId,
    title,
    description,
    status,
    creator,
    startTime,
    endTime,
    forVotes,
    againstVotes,
    quorum,
    canExecute,
    onVote,
    onExecute,
}) => {
    const [isVoting, setIsVoting] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const { publicKey } = useWallet();
    const { isPiHolder } = useApp();
    const toast = useToast();

    const totalVotes = forVotes + againstVotes;
    const forPercentage = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
    const againstPercentage = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;
    const quorumPercentage = (totalVotes / quorum) * 100;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'blue';
            case 'succeeded':
                return 'green';
            case 'defeated':
                return 'red';
            case 'executed':
                return 'purple';
            case 'cancelled':
                return 'gray';
            default:
                return 'gray';
        }
    };

    const handleVote = async (support: boolean) => {
        if (!publicKey) {
            toast({
                title: 'Error',
                description: 'Please connect your wallet first',
                status: 'error',
                duration: 5000,
            });
            return;
        }

        if (!isPiHolder) {
            toast({
                title: 'Error',
                description: 'Only Pi holders can vote',
                status: 'error',
                duration: 5000,
            });
            return;
        }

        try {
            setIsVoting(true);
            await onVote(support);
            toast({
                title: 'Success',
                description: `Successfully voted ${support ? 'for' : 'against'} the proposal`,
                status: 'success',
                duration: 5000,
            });
        } catch (error) {
            console.error('Voting failed:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to cast vote',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setIsVoting(false);
        }
    };

    const handleExecute = async () => {
        if (!publicKey) {
            toast({
                title: 'Error',
                description: 'Please connect your wallet first',
                status: 'error',
                duration: 5000,
            });
            return;
        }

        try {
            setIsExecuting(true);
            await onExecute?.();
            toast({
                title: 'Success',
                description: 'Proposal executed successfully',
                status: 'success',
                duration: 5000,
            });
        } catch (error) {
            console.error('Execution failed:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to execute proposal',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <Box p={6} borderWidth="1px" borderRadius="lg" bg="rgba(255, 255, 255, 0.05)">
            <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                    <Box>
                        <Text fontSize="2xl" fontWeight="bold">
                            {title}
                        </Text>
                        <Text color="gray.500" fontSize="sm">
                            Created by {creator}
                        </Text>
                    </Box>
                    <Badge
                        colorScheme={getStatusColor(status)}
                        fontSize="md"
                        px={3}
                        py={1}
                        borderRadius="full"
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                </Flex>

                <Text>{description}</Text>

                <Divider />

                <StatGroup>
                    <Stat>
                        <StatLabel>For</StatLabel>
                        <StatNumber>{forVotes}</StatNumber>
                    </Stat>
                    <Stat>
                        <StatLabel>Against</StatLabel>
                        <StatNumber>{againstVotes}</StatNumber>
                    </Stat>
                    <Stat>
                        <StatLabel>Total Votes</StatLabel>
                        <StatNumber>{totalVotes}</StatNumber>
                    </Stat>
                </StatGroup>

                <Box>
                    <Text mb={2}>Voting Progress</Text>
                    <Progress
                        value={forPercentage}
                        colorScheme="green"
                        bg="red.500"
                        borderRadius="full"
                        size="lg"
                    />
                    <Flex justify="space-between" mt={1}>
                        <Text fontSize="sm">{forPercentage.toFixed(1)}% For</Text>
                        <Text fontSize="sm">{againstPercentage.toFixed(1)}% Against</Text>
                    </Flex>
                </Box>

                <Box>
                    <Text mb={2}>Quorum Progress</Text>
                    <Progress
                        value={quorumPercentage}
                        colorScheme="blue"
                        borderRadius="full"
                        size="lg"
                    />
                    <Text fontSize="sm" mt={1}>
                        {quorumPercentage.toFixed(1)}% of required quorum reached
                    </Text>
                </Box>

                <Divider />

                <VStack spacing={4}>
                    {status === 'active' && (
                        <HStack spacing={4} width="full">
                            <Tooltip label="Vote For">
                                <IconButton
                                    aria-label="Vote For"
                                    icon={<FiThumbsUp />}
                                    colorScheme="green"
                                    size="lg"
                                    isLoading={isVoting}
                                    onClick={() => handleVote(true)}
                                    flex={1}
                                />
                            </Tooltip>
                            <Tooltip label="Vote Against">
                                <IconButton
                                    aria-label="Vote Against"
                                    icon={<FiThumbsDown />}
                                    colorScheme="red"
                                    size="lg"
                                    isLoading={isVoting}
                                    onClick={() => handleVote(false)}
                                    flex={1}
                                />
                            </Tooltip>
                        </HStack>
                    )}

                    {status === 'succeeded' && canExecute && onExecute && (
                        <Button
                            leftIcon={<FiCheck />}
                            colorScheme="purple"
                            size="lg"
                            width="full"
                            isLoading={isExecuting}
                            onClick={handleExecute}
                        >
                            Execute Proposal
                        </Button>
                    )}
                </VStack>

                <Box>
                    <Text fontSize="sm" color="gray.500">
                        Voting Period: {startTime.toLocaleDateString()} -{' '}
                        {endTime.toLocaleDateString()}
                    </Text>
                </Box>
            </VStack>
        </Box>
    );
}; 