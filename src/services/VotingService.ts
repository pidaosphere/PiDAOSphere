import { Program, web3, BN } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

export interface ProposalInfo {
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

export class VotingService {
    private program: Program;
    private connection: Connection;

    constructor(program: Program, connection: Connection) {
        this.program = program;
        this.connection = connection;
    }

    async createProposal(
        title: string,
        description: string,
        quorum: number,
        votingPeriod: number,
        authority: web3.Keypair
    ): Promise<string> {
        try {
            const [proposalAddress] = await this.findProposalAddress(title);

            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + votingPeriod * 24 * 60 * 60 * 1000);

            const tx = await this.program.methods
                .createProposal({
                    title,
                    description,
                    quorum: new BN(quorum),
                    startTime: new BN(startTime.getTime() / 1000),
                    endTime: new BN(endTime.getTime() / 1000),
                })
                .accounts({
                    proposal: proposalAddress,
                    creator: authority.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .signers([authority])
                .rpc();

            return tx;
        } catch (error) {
            console.error('Failed to create proposal:', error);
            throw error;
        }
    }

    async castVote(
        proposalId: string,
        support: boolean,
        authority: web3.Keypair
    ): Promise<string> {
        try {
            const tx = await this.program.methods
                .castVote(support)
                .accounts({
                    proposal: new PublicKey(proposalId),
                    voter: authority.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .signers([authority])
                .rpc();

            return tx;
        } catch (error) {
            console.error('Failed to cast vote:', error);
            throw error;
        }
    }

    async executeProposal(
        proposalId: string,
        authority: web3.Keypair
    ): Promise<string> {
        try {
            const tx = await this.program.methods
                .executeProposal()
                .accounts({
                    proposal: new PublicKey(proposalId),
                    executor: authority.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .signers([authority])
                .rpc();

            return tx;
        } catch (error) {
            console.error('Failed to execute proposal:', error);
            throw error;
        }
    }

    async getProposalInfo(proposalId: string): Promise<ProposalInfo> {
        try {
            const proposalAccount = await this.program.account.proposal.fetch(
                new PublicKey(proposalId)
            );

            return {
                id: proposalId,
                title: proposalAccount.title,
                description: proposalAccount.description,
                status: this.getProposalStatus(proposalAccount),
                creator: proposalAccount.creator.toString(),
                startTime: new Date(proposalAccount.startTime.toNumber() * 1000),
                endTime: new Date(proposalAccount.endTime.toNumber() * 1000),
                forVotes: proposalAccount.forVotes.toNumber(),
                againstVotes: proposalAccount.againstVotes.toNumber(),
                quorum: proposalAccount.quorum.toNumber(),
                canExecute: this.canExecuteProposal(proposalAccount),
            };
        } catch (error) {
            console.error('Failed to get proposal info:', error);
            throw error;
        }
    }

    async getAllProposals(): Promise<ProposalInfo[]> {
        try {
            const proposals = await this.program.account.proposal.all();
            return Promise.all(
                proposals.map(async (p) => {
                    const info = await this.getProposalInfo(p.publicKey.toString());
                    return info;
                })
            );
        } catch (error) {
            console.error('Failed to get all proposals:', error);
            throw error;
        }
    }

    private async findProposalAddress(
        title: string
    ): Promise<[PublicKey, number]> {
        return await web3.PublicKey.findProgramAddress(
            [
                Buffer.from('proposal'),
                Buffer.from(title),
            ],
            this.program.programId
        );
    }

    private getProposalStatus(proposalAccount: any): ProposalInfo['status'] {
        const now = new Date().getTime() / 1000;
        const endTime = proposalAccount.endTime.toNumber();
        const totalVotes = proposalAccount.forVotes.toNumber() + proposalAccount.againstVotes.toNumber();

        if (proposalAccount.executed) {
            return 'executed';
        }

        if (proposalAccount.cancelled) {
            return 'cancelled';
        }

        if (now < endTime) {
            return 'active';
        }

        if (totalVotes >= proposalAccount.quorum.toNumber()) {
            return proposalAccount.forVotes.toNumber() > proposalAccount.againstVotes.toNumber()
                ? 'succeeded'
                : 'defeated';
        }

        return 'defeated';
    }

    private canExecuteProposal(proposalAccount: any): boolean {
        const status = this.getProposalStatus(proposalAccount);
        return (
            status === 'succeeded' &&
            !proposalAccount.executed &&
            !proposalAccount.cancelled
        );
    }
} 