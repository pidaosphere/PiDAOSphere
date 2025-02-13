import { Program, web3, BN } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PiNetworkService } from './PiNetworkService';

export class ProjectService {
    private program: Program;
    private connection: Connection;
    private piNetworkService: PiNetworkService;

    constructor(program: Program, connection: Connection, piNetworkService: PiNetworkService) {
        this.program = program;
        this.connection = connection;
        this.piNetworkService = piNetworkService;
    }

    async createProject(
        authority: web3.PublicKey,
        config: {
            totalSupply: number;
            startPrice: number;
            duration: number;
            minInvestment: number;
            maxInvestment: number;
            piHolderMultiplier: number;
        }
    ): Promise<string> {
        try {
            const [projectAccount] = await this.findProjectAddress(authority);

            const tx = await this.program.methods
                .initializeProject({
                    totalSupply: new BN(config.totalSupply),
                    startPrice: new BN(config.startPrice),
                    duration: new BN(config.duration),
                    minInvestment: new BN(config.minInvestment),
                    maxInvestment: new BN(config.maxInvestment),
                    piHolderMultiplier: new BN(config.piHolderMultiplier),
                })
                .accounts({
                    project: projectAccount,
                    authority,
                    systemProgram: web3.SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Project creation failed:', error);
            throw error;
        }
    }

    async invest(
        projectAccount: web3.PublicKey,
        amount: number,
        isPiHolder: boolean
    ): Promise<string> {
        try {
            // First verify Pi holder status if applicable
            if (isPiHolder) {
                const auth = await this.piNetworkService.authenticate();
                // Implement Pi holder verification logic
            }

            const tx = await this.program.methods
                .invest(new BN(amount))
                .accounts({
                    project: projectAccount,
                    investor: this.program.provider.publicKey,
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

    async createProposal(
        projectAccount: web3.PublicKey,
        description: string,
        executionData: Buffer,
        votingPeriod: number
    ): Promise<string> {
        try {
            const [proposalAccount] = await this.findProposalAddress(
                projectAccount,
                this.program.provider.publicKey!
            );

            const tx = await this.program.methods
                .createProposal(description, executionData, new BN(votingPeriod))
                .accounts({
                    proposal: proposalAccount,
                    project: projectAccount,
                    creator: this.program.provider.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Proposal creation failed:', error);
            throw error;
        }
    }

    async castVote(
        proposalAccount: web3.PublicKey,
        support: boolean
    ): Promise<string> {
        try {
            const tx = await this.program.methods
                .castVote(support)
                .accounts({
                    proposal: proposalAccount,
                    voter: this.program.provider.publicKey,
                })
                .rpc();

            return tx;
        } catch (error) {
            console.error('Vote casting failed:', error);
            throw error;
        }
    }

    async getProject(projectAccount: web3.PublicKey): Promise<any> {
        try {
            const project = await this.program.account.project.fetch(projectAccount);
            return project;
        } catch (error) {
            console.error('Failed to fetch project:', error);
            throw error;
        }
    }

    async getProposal(proposalAccount: web3.PublicKey): Promise<any> {
        try {
            const proposal = await this.program.account.proposal.fetch(proposalAccount);
            return proposal;
        } catch (error) {
            console.error('Failed to fetch proposal:', error);
            throw error;
        }
    }

    private async findProjectAddress(
        authority: web3.PublicKey
    ): Promise<[web3.PublicKey, number]> {
        return await web3.PublicKey.findProgramAddress(
            [Buffer.from('project'), authority.toBuffer()],
            this.program.programId
        );
    }

    private async findProposalAddress(
        project: web3.PublicKey,
        creator: web3.PublicKey
    ): Promise<[web3.PublicKey, number]> {
        return await web3.PublicKey.findProgramAddress(
            [Buffer.from('proposal'), project.toBuffer(), creator.toBuffer()],
            this.program.programId
        );
    }
} 