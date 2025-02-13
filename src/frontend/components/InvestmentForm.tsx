import React, { useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Text,
    useToast,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PiNetworkService } from '../services/PiNetworkService';
import { useProgram } from '../hooks/useProgram';

interface InvestmentFormProps {
    projectId: string;
    minInvestment: number;
    maxInvestment: number;
    inviteOnly: boolean;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({
    projectId,
    minInvestment,
    maxInvestment,
    inviteOnly,
}) => {
    const [amount, setAmount] = useState<number>(minInvestment);
    const [inviteCode, setInviteCode] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const { publicKey } = useWallet();
    const toast = useToast();
    const { program } = useProgram();
    const piNetwork = new PiNetworkService();

    const handleInvest = async () => {
        if (!publicKey || !program) {
            toast({
                title: 'Error',
                description: 'Please connect your wallet first',
                status: 'error',
                duration: 5000,
            });
            return;
        }

        try {
            setIsLoading(true);

            // Initiate Pi Network payment
            const paymentResult = await piNetwork.initiatePayment(
                amount,
                `Investment in project ${projectId}`,
                {
                    projectId,
                    investorAddress: publicKey.toString(),
                }
            );

            if (paymentResult.status !== 'completed') {
                throw new Error('Payment failed or was cancelled');
            }

            // Call the smart contract to invest
            await program.methods
                .invest(
                    new BN(amount),
                    inviteOnly ? inviteCode : null,
                    paymentResult.txid
                )
                .accounts({
                    project: projectId,
                    investor: publicKey,
                    // Add other required accounts
                })
                .rpc();

            toast({
                title: 'Success',
                description: 'Investment successful!',
                status: 'success',
                duration: 5000,
            });
        } catch (error) {
            console.error('Investment failed:', error);
            toast({
                title: 'Error',
                description: error.message || 'Investment failed',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg">
            <VStack spacing={4}>
                <Text fontSize="xl" fontWeight="bold">
                    Invest in Project
                </Text>

                <FormControl>
                    <FormLabel>Investment Amount (Pi)</FormLabel>
                    <NumberInput
                        value={amount}
                        min={minInvestment}
                        max={maxInvestment}
                        onChange={(_, value) => setAmount(value)}
                    >
                        <NumberInputField />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                    <Text fontSize="sm" color="gray.500">
                        Min: {minInvestment} Pi | Max: {maxInvestment} Pi
                    </Text>
                </FormControl>

                {inviteOnly && (
                    <FormControl>
                        <FormLabel>Invite Code</FormLabel>
                        <Input
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            placeholder="Enter invite code"
                        />
                    </FormControl>
                )}

                <Button
                    colorScheme="blue"
                    width="full"
                    onClick={handleInvest}
                    isLoading={isLoading}
                    loadingText="Processing..."
                    disabled={!publicKey || amount < minInvestment || amount > maxInvestment}
                >
                    Invest Now
                </Button>
            </VStack>
        </Box>
    );
}; 