import React, { useState } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Select,
    InputGroup,
    InputLeftElement,
    Flex,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Textarea,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
} from '@chakra-ui/react';
import { FiSearch, FiPlus } from 'react-icons/fi';
import { VotingModule } from './VotingModule';

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
    quorum: number;
    canExecute: boolean;
}

export const ProposalList: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [newProposal, setNewProposal] = useState({
        title: '',
        description: '',
        quorum: 1000,
        votingPeriod: 7, // days
    });

    const handleCreateProposal = async () => {
        try {
            // TODO: Implement proposal creation logic
            onClose();
        } catch (error) {
            console.error('Failed to create proposal:', error);
        }
    };

    const handleVote = async (proposalId: string, support: boolean) => {
        try {
            // TODO: Implement voting logic
        } catch (error) {
            console.error('Failed to vote:', error);
        }
    };

    const handleExecute = async (proposalId: string) => {
        try {
            // TODO: Implement proposal execution logic
        } catch (error) {
            console.error('Failed to execute proposal:', error);
        }
    };

    const filteredProposals = proposals
        .filter((proposal) => {
            const matchesSearch = proposal.title
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesStatus =
                statusFilter === 'all' || proposal.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') {
                return b.startTime.getTime() - a.startTime.getTime();
            } else if (sortBy === 'oldest') {
                return a.startTime.getTime() - b.startTime.getTime();
            } else if (sortBy === 'mostVotes') {
                return b.forVotes + b.againstVotes - (a.forVotes + a.againstVotes);
            }
            return 0;
        });

    return (
        <Box>
            <Flex justify="space-between" align="center" mb={6}>
                <Text fontSize="2xl" fontWeight="bold">
                    Governance Proposals
                </Text>
                <Button
                    leftIcon={<FiPlus />}
                    colorScheme="blue"
                    onClick={onOpen}
                >
                    Create Proposal
                </Button>
            </Flex>

            <HStack spacing={4} mb={6}>
                <InputGroup>
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
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    w="200px"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="succeeded">Succeeded</option>
                    <option value="defeated">Defeated</option>
                    <option value="executed">Executed</option>
                    <option value="cancelled">Cancelled</option>
                </Select>

                <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    w="200px"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="mostVotes">Most Votes</option>
                </Select>
            </HStack>

            <VStack spacing={6} align="stretch">
                {filteredProposals.map((proposal) => (
                    <VotingModule
                        key={proposal.id}
                        {...proposal}
                        onVote={(support) => handleVote(proposal.id, support)}
                        onExecute={
                            proposal.canExecute
                                ? () => handleExecute(proposal.id)
                                : undefined
                        }
                    />
                ))}
                {filteredProposals.length === 0 && (
                    <Text textAlign="center" color="gray.500">
                        No proposals found
                    </Text>
                )}
            </VStack>

            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Create New Proposal</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Title</FormLabel>
                                <Input
                                    value={newProposal.title}
                                    onChange={(e) =>
                                        setNewProposal({
                                            ...newProposal,
                                            title: e.target.value,
                                        })
                                    }
                                    placeholder="Enter proposal title"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                    value={newProposal.description}
                                    onChange={(e) =>
                                        setNewProposal({
                                            ...newProposal,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Enter proposal description"
                                    minH="200px"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Quorum (Pi tokens)</FormLabel>
                                <NumberInput
                                    value={newProposal.quorum}
                                    onChange={(_, value) =>
                                        setNewProposal({
                                            ...newProposal,
                                            quorum: value,
                                        })
                                    }
                                    min={1}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Voting Period (days)</FormLabel>
                                <NumberInput
                                    value={newProposal.votingPeriod}
                                    onChange={(_, value) =>
                                        setNewProposal({
                                            ...newProposal,
                                            votingPeriod: value,
                                        })
                                    }
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
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            onClick={handleCreateProposal}
                        >
                            Create Proposal
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}; 