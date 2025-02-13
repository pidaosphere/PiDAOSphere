import {
    Program,
    web3,
    BN,
    AnchorProvider,
} from '@project-serum/anchor';
import {
    TOKEN_PROGRAM_ID,
    createMint,
    getMint,
    getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import {
    ProjectState,
    ProjectConfig,
    ProposalState,
    ProposalStatus,
    InvestmentInfo,
} from './types';

export class PiDaosFun {
    private program: Program;
    private provider: AnchorProvider;

    constructor(program: Program, provider: AnchorProvider) {
        this.program = program;
        this.provider = provider;
    }

    async initializeProject(
        config: ProjectConfig,
        authority: web3.PublicKey,
        inviteCode?: string,
    ): Promise<web3.PublicKey> {
        const [projectAccount] = await this.findProjectAddress(authority);
        
        // Create project token mint
        const projectTokenMint = await createMint(
            this.provider.connection,
            this.provider.wallet.payer,
            authority,
            null, // Freeze authority
            9, // Decimals
            TOKEN_PROGRAM_ID
        );

        // Calculate initial token price in Pi
        const initialPiPrice = config.totalSupply.div(config.targetRaise);

        await this.program.methods.initializeProject({
            ...config,
            initialPiPrice,
            fundraiseEndTime: new BN(Date.now() / 1000 + 7 * 24 * 60 * 60), // 1 week
            inviteOnly: !!inviteCode,
            inviteCode: inviteCode || '',
        })
            .accounts({
                project: projectAccount,
                authority,
                projectTokenMint,
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .rpc();

        return projectAccount;
    }

    async verifyPiHolder(
        projectAccount: web3.PublicKey,
        piSignature: string,
    ): Promise<boolean> {
        try {
            // Verify Pi Network signature
            const isVerified = await this.verifyPiNetworkSignature(piSignature);
            
            if (isVerified) {
                await this.program.methods.setPiHolderStatus(true)
                    .accounts({
                        project: projectAccount,
                        authority: this.provider.wallet.publicKey,
                    })
                    .rpc();
            }
            
            return isVerified;
        } catch (error) {
            console.error('Pi holder verification failed:', error);
            return false;
        }
    }

    async invest(
        projectAccount: web3.PublicKey,
        amount: BN,
        inviteCode?: string,
    ): Promise<string> {
        try {
            const project = await this.program.account.project.fetch(
                projectAccount
            ) as ProjectState;
            
            // Validate investment period
            if (Date.now() / 1000 > project.fundraiseEndTime.toNumber()) {
                throw new Error('Fundraising period has ended');
            }

            // Validate invite code if required
            if (project.inviteOnly && inviteCode !== project.inviteCode) {
                throw new Error('Invalid invite code');
            }

            // Calculate token amount based on Pi price
            const tokenAmount = amount.mul(project.initialPiPrice);

            // Get or create user token account
            const userTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.provider.connection,
                this.provider.wallet.payer,
                project.projectTokenMint,
                this.provider.wallet.publicKey
            );

            // Execute investment transaction
            const tx = await this.program.methods.invest(amount)
                .accounts({
                    project: projectAccount,
                    investor: this.provider.wallet.publicKey,
                    userTokenAccount: userTokenAccount.address,
                    projectTokenMint: project.projectTokenMint,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Investment failed:', error);
            throw error;
        }
    }

    async finalizeFundraise(
        projectAccount: web3.PublicKey,
    ): Promise<string> {
        try {
            const project = await this.program.account.project.fetch(
                projectAccount
            ) as ProjectState;

            // Ensure fundraise period has ended
            if (Date.now() / 1000 <= project.fundraiseEndTime.toNumber()) {
                throw new Error('Fundraising period is still active');
            }

            // Check if minimum raise was met
            if (project.totalInvestment.lt(project.minRaise)) {
                // Allow refunds
                return await this.enableRefunds(projectAccount);
            }

            // Split funds: 90% for investment, 10% for liquidity
            const liquidityAmount = project.totalInvestment.mul(new BN(10)).div(new BN(100));
            const investmentAmount = project.totalInvestment.sub(liquidityAmount);

            const tx = await this.program.methods.finalizeFundraise(
                liquidityAmount,
                investmentAmount
            )
                .accounts({
                    project: projectAccount,
                    authority: this.provider.wallet.publicKey,
                    projectTokenMint: project.projectTokenMint,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Fundraise finalization failed:', error);
            throw error;
        }
    }

    async claimRefund(
        projectAccount: web3.PublicKey,
    ): Promise<string> {
        try {
            const project = await this.program.account.project.fetch(
                projectAccount
            ) as ProjectState;

            // Ensure project is in refund state
            if (!project.refundsEnabled) {
                throw new Error('Refunds are not enabled for this project');
            }

            const tx = await this.program.methods.claimRefund()
                .accounts({
                    project: projectAccount,
                    investor: this.provider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Refund claim failed:', error);
            throw error;
        }
    }

    async redeemTokens(
        projectAccount: web3.PublicKey,
        amount: BN,
    ): Promise<string> {
        try {
            const project = await this.program.account.project.fetch(
                projectAccount
            ) as ProjectState;

            // Ensure project has expired
            if (Date.now() / 1000 <= project.expirationTime.toNumber()) {
                throw new Error('Project has not expired yet');
            }

            const tx = await this.program.methods.redeemTokens(amount)
                .accounts({
                    project: projectAccount,
                    investor: this.provider.wallet.publicKey,
                    projectTokenMint: project.projectTokenMint,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Token redemption failed:', error);
            throw error;
        }
    }

    async createProposal(
        projectAccount: web3.PublicKey,
        description: string,
        executionData: Buffer,
        votingPeriod: BN,
    ): Promise<web3.PublicKey> {
        try {
            const [proposalAccount] = await this.findProposalAddress(
                projectAccount,
                this.provider.wallet.publicKey
            );

            await this.program.methods.createProposal(
                description,
                executionData,
                votingPeriod
            )
                .accounts({
                    proposal: proposalAccount,
                    project: projectAccount,
                    creator: this.provider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            return proposalAccount;
        } catch (error) {
            console.error('Proposal creation failed:', error);
            throw error;
        }
    }

    async castVote(
        proposalAccount: web3.PublicKey,
        support: boolean,
    ): Promise<string> {
        try {
            const tx = await this.program.methods.castVote(support)
                .accounts({
                    proposal: proposalAccount,
                    voter: this.provider.wallet.publicKey,
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Vote casting failed:', error);
            throw error;
        }
    }

    async executeProposal(
        proposalAccount: web3.PublicKey,
    ): Promise<string> {
        try {
            const proposal = await this.program.account.proposal.fetch(
                proposalAccount
            ) as ProposalState;

            if (proposal.status !== ProposalStatus.Succeeded) {
                throw new Error('Proposal not in executable state');
            }

            const tx = await this.program.methods.executeProposal()
                .accounts({
                    proposal: proposalAccount,
                    executor: this.provider.wallet.publicKey,
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Proposal execution failed:', error);
            throw error;
        }
    }

    private async enableRefunds(
        projectAccount: web3.PublicKey,
    ): Promise<string> {
        try {
            const tx = await this.program.methods.enableRefunds()
                .accounts({
                    project: projectAccount,
                    authority: this.provider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Enable refunds failed:', error);
            throw error;
        }
    }

    private async findProjectAddress(
        authority: web3.PublicKey,
    ): Promise<[web3.PublicKey, number]> {
        return await web3.PublicKey.findProgramAddress(
            [
                Buffer.from('project'),
                authority.toBuffer(),
            ],
            this.program.programId
        );
    }

    private async findProposalAddress(
        project: web3.PublicKey,
        creator: web3.PublicKey,
    ): Promise<[web3.PublicKey, number]> {
        return await web3.PublicKey.findProgramAddress(
            [
                Buffer.from('proposal'),
                project.toBuffer(),
                creator.toBuffer(),
            ],
            this.program.programId
        );
    }

    private async verifyPiNetworkSignature(
        signature: string,
    ): Promise<boolean> {
        // TODO: Implement Pi Network signature verification
        // This should integrate with Pi Network's SDK
        return true;
    }
} 