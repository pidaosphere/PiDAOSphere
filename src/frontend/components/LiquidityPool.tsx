import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    useToast,
    Divider,
    Progress,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN } from '@project-serum/anchor';
import { LiquidityPoolService, PoolInfo } from '../../services/LiquidityPoolService';
import { useProgram } from '../hooks/useProgram';

interface LiquidityPoolProps {
    poolAddress: string;
}

export const LiquidityPool: React.FC<LiquidityPoolProps> = ({ poolAddress }) => {
    const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [amountA, setAmountA] = useState<number>(0);
    const [amountB, setAmountB] = useState<number>(0);
    const [lpAmount, setLpAmount] = useState<number>(0);
    const [swapAmount, setSwapAmount] = useState<number>(0);
    const [slippage, setSlippage] = useState<number>(0.5); // 0.5%

    const { publicKey } = useWallet();
    const { program, connection } = useProgram();
    const toast = useToast();
    const poolService = new LiquidityPoolService(program, connection);

    useEffect(() => {
        loadPoolInfo();
    }, [poolAddress]);

    const loadPoolInfo = async () => {
        try {
            const info = await poolService.getPoolInfo(new PublicKey(poolAddress));
            setPoolInfo(info);
        } catch (error) {
            console.error('Failed to load pool info:', error);
            toast({
                title: 'Error',
                description: 'Failed to load pool information',
                status: 'error',
                duration: 5000,
            });
        }
    };

    const handleAddLiquidity = async () => {
        if (!publicKey || !poolInfo) return;

        try {
            setLoading(true);
            await poolService.addLiquidity(
                new PublicKey(poolAddress),
                // Add user token accounts
                new BN(amountA),
                new BN(amountB),
                // Add authority
            );

            toast({
                title: 'Success',
                description: 'Liquidity added successfully',
                status: 'success',
                duration: 5000,
            });

            await loadPoolInfo();
        } catch (error) {
            console.error('Failed to add liquidity:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to add liquidity',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveLiquidity = async () => {
        if (!publicKey || !poolInfo) return;

        try {
            setLoading(true);
            await poolService.removeLiquidity(
                new PublicKey(poolAddress),
                // Add user token accounts
                new BN(lpAmount),
                // Add authority
            );

            toast({
                title: 'Success',
                description: 'Liquidity removed successfully',
                status: 'success',
                duration: 5000,
            });

            await loadPoolInfo();
        } catch (error) {
            console.error('Failed to remove liquidity:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to remove liquidity',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSwap = async () => {
        if (!publicKey || !poolInfo) return;

        try {
            setLoading(true);
            const minAmountOut = calculateMinAmountOut(swapAmount);
            await poolService.swap(
                new PublicKey(poolAddress),
                // Add user token accounts
                new BN(swapAmount),
                new BN(minAmountOut),
                // Add authority
            );

            toast({
                title: 'Success',
                description: 'Swap executed successfully',
                status: 'success',
                duration: 5000,
            });

            await loadPoolInfo();
        } catch (error) {
            console.error('Failed to swap:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to execute swap',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateMinAmountOut = (amountIn: number): number => {
        if (!poolInfo) return 0;
        const expectedOut = (amountIn * poolInfo.tokenBAmount) / (poolInfo.tokenAAmount + amountIn);
        return expectedOut * (1 - slippage / 100);
    };

    if (!poolInfo) {
        return <Text>Loading pool information...</Text>;
    }

    return (
        <Box p={6} borderWidth="1px" borderRadius="lg">
            <VStack spacing={6}>
                <Text fontSize="2xl" fontWeight="bold">
                    Liquidity Pool
                </Text>

                <Box w="full">
                    <Text mb={2}>Pool Statistics</Text>
                    <VStack spacing={2} align="stretch">
                        <HStack justify="space-between">
                            <Text>Total Liquidity:</Text>
                            <Text>{poolInfo.totalLiquidity.toString()} LP</Text>
                        </HStack>
                        <HStack justify="space-between">
                            <Text>Token A Reserve:</Text>
                            <Text>{poolInfo.tokenAAmount.toString()}</Text>
                        </HStack>
                        <HStack justify="space-between">
                            <Text>Token B Reserve:</Text>
                            <Text>{poolInfo.tokenBAmount.toString()}</Text>
                        </HStack>
                        <HStack justify="space-between">
                            <Text>Fee:</Text>
                            <Text>{poolInfo.fee * 100}%</Text>
                        </HStack>
                    </VStack>
                </Box>

                <Divider />

                <Tabs isFitted variant="enclosed" w="full">
                    <TabList mb="1em">
                        <Tab>Add Liquidity</Tab>
                        <Tab>Remove Liquidity</Tab>
                        <Tab>Swap</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <VStack spacing={4}>
                                <NumberInput
                                    value={amountA}
                                    onChange={(_, value) => setAmountA(value)}
                                    min={0}
                                >
                                    <NumberInputField placeholder="Amount of Token A" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>

                                <NumberInput
                                    value={amountB}
                                    onChange={(_, value) => setAmountB(value)}
                                    min={0}
                                >
                                    <NumberInputField placeholder="Amount of Token B" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>

                                <Button
                                    colorScheme="blue"
                                    onClick={handleAddLiquidity}
                                    isLoading={loading}
                                    w="full"
                                >
                                    Add Liquidity
                                </Button>
                            </VStack>
                        </TabPanel>

                        <TabPanel>
                            <VStack spacing={4}>
                                <NumberInput
                                    value={lpAmount}
                                    onChange={(_, value) => setLpAmount(value)}
                                    min={0}
                                >
                                    <NumberInputField placeholder="Amount of LP tokens" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>

                                <Button
                                    colorScheme="red"
                                    onClick={handleRemoveLiquidity}
                                    isLoading={loading}
                                    w="full"
                                >
                                    Remove Liquidity
                                </Button>
                            </VStack>
                        </TabPanel>

                        <TabPanel>
                            <VStack spacing={4}>
                                <NumberInput
                                    value={swapAmount}
                                    onChange={(_, value) => setSwapAmount(value)}
                                    min={0}
                                >
                                    <NumberInputField placeholder="Amount to swap" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>

                                <NumberInput
                                    value={slippage}
                                    onChange={(_, value) => setSlippage(value)}
                                    min={0.1}
                                    max={100}
                                    precision={1}
                                >
                                    <NumberInputField placeholder="Slippage tolerance (%)" />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>

                                <Box w="full">
                                    <Text fontSize="sm" mb={2}>
                                        Minimum amount out: {calculateMinAmountOut(swapAmount)}
                                    </Text>
                                    <Progress value={slippage} max={100} size="sm" />
                                </Box>

                                <Button
                                    colorScheme="green"
                                    onClick={handleSwap}
                                    isLoading={loading}
                                    w="full"
                                >
                                    Swap
                                </Button>
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
        </Box>
    );
}; 