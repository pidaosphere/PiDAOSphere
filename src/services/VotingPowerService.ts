import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@project-serum/anchor';
import { PiNetworkService } from './PiNetworkService';

export class VotingPowerService {
    private program: Program;
    private connection: Connection;
    private piNetworkService: PiNetworkService;

    constructor(
        program: Program,
        connection: Connection,
        piNetworkService: PiNetworkService
    ) {
        this.program = program;
        this.connection = connection;
        this.piNetworkService = piNetworkService;
    }

    async getVotingPower(
        userAddress: PublicKey,
        projectTokenMint: PublicKey
    ): Promise<{
        tokenBalance: number;
        piHolderMultiplier: number;
        totalVotingPower: number;
    }> {
        try {
            // Get project token balance
            const tokenAccounts = await this.connection.getTokenAccountsByOwner(
                userAddress,
                { mint: projectTokenMint }
            );

            let tokenBalance = 0;
            if (tokenAccounts.value.length > 0) {
                const tokenAccount = tokenAccounts.value[0].account;
                const accountInfo = await this.connection.getTokenAccountBalance(
                    tokenAccount.pubkey
                );
                tokenBalance = accountInfo.value.uiAmount || 0;
            }

            // Get Pi holder status and multiplier
            const piHolderMultiplier = await this.getPiHolderMultiplier(userAddress);

            // Calculate total voting power
            const totalVotingPower = tokenBalance * piHolderMultiplier;

            return {
                tokenBalance,
                piHolderMultiplier,
                totalVotingPower,
            };
        } catch (error) {
            console.error('Failed to get voting power:', error);
            throw error;
        }
    }

    private async getPiHolderMultiplier(userAddress: PublicKey): Promise<number> {
        try {
            // Check if user is authenticated with Pi Network
            if (!this.piNetworkService.isAuthenticated()) {
                return 1; // Base multiplier for non-Pi holders
            }

            const user = this.piNetworkService.getUser();
            if (!user) {
                return 1;
            }

            // Get Pi balance
            const piBalance = await this.piNetworkService.getPiBalance(user.username);

            // Calculate multiplier based on Pi holdings
            // Example tiers:
            // 0-100 Pi: 1x
            // 100-1000 Pi: 1.5x
            // 1000+ Pi: 2x
            if (piBalance >= 1000) {
                return 2;
            } else if (piBalance >= 100) {
                return 1.5;
            } else {
                return 1;
            }
        } catch (error) {
            console.error('Failed to get Pi holder multiplier:', error);
            return 1; // Default to base multiplier on error
        }
    }

    async getProjectVotingStats(projectTokenMint: PublicKey): Promise<{
        totalVotingPower: number;
        totalVoters: number;
        averageVotingPower: number;
    }> {
        try {
            // Get all token holders
            const tokenAccounts = await this.connection.getProgramAccounts(
                new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token program ID
                {
                    filters: [
                        {
                            dataSize: 165, // Size of token account
                        },
                        {
                            memcmp: {
                                offset: 0,
                                bytes: projectTokenMint.toBase58(),
                            },
                        },
                    ],
                }
            );

            let totalVotingPower = 0;
            const uniqueVoters = new Set();

            for (const account of tokenAccounts) {
                const owner = new PublicKey(account.account.data.slice(32, 64));
                uniqueVoters.add(owner.toString());

                const votingPower = await this.getVotingPower(owner, projectTokenMint);
                totalVotingPower += votingPower.totalVotingPower;
            }

            return {
                totalVotingPower,
                totalVoters: uniqueVoters.size,
                averageVotingPower: totalVotingPower / uniqueVoters.size || 0,
            };
        } catch (error) {
            console.error('Failed to get project voting stats:', error);
            throw error;
        }
    }

    async getUserVotingHistory(
        userAddress: PublicKey,
        projectTokenMint: PublicKey
    ): Promise<{
        proposalsVoted: number;
        totalVotesCast: number;
        votingPowerHistory: Array<{
            timestamp: number;
            votingPower: number;
        }>;
    }> {
        try {
            // Get all vote receipts for the user
            const voteReceipts = await this.program.account.voteReceipt.all([
                {
                    memcmp: {
                        offset: 8, // Skip discriminator
                        bytes: userAddress.toBase58(),
                    },
                },
            ]);

            const votingPowerHistory: Array<{
                timestamp: number;
                votingPower: number;
            }> = [];

            let totalVotesCast = 0;

            for (const receipt of voteReceipts) {
                totalVotesCast += receipt.account.votes;
                votingPowerHistory.push({
                    timestamp: receipt.account.timestamp,
                    votingPower: receipt.account.votes,
                });
            }

            return {
                proposalsVoted: voteReceipts.length,
                totalVotesCast,
                votingPowerHistory: votingPowerHistory.sort(
                    (a, b) => b.timestamp - a.timestamp
                ),
            };
        } catch (error) {
            console.error('Failed to get user voting history:', error);
            throw error;
        }
    }
} 