import { web3, BN } from '@project-serum/anchor';

export interface ProjectState {
    isInitialized: boolean;
    authority: web3.PublicKey;
    projectTokenMint: web3.PublicKey;
    totalSupply: BN;
    initialPiPrice: BN;
    currentPiPrice: BN;
    startTime: BN;
    fundraiseEndTime: BN;
    expirationTime: BN;
    minRaise: BN;
    maxRaise: BN;
    minInvestment: BN;
    maxInvestment: BN;
    totalInvestors: BN;
    totalInvestment: BN;
    liquidityAmount: BN;
    investmentAmount: BN;
    inviteOnly: boolean;
    inviteCode: string;
    refundsEnabled: boolean;
    status: ProjectStatus;
}

export enum ProjectStatus {
    Fundraising = 0,
    Active = 1,
    Expired = 2,
    Refunding = 3
}

export interface ProjectConfig {
    totalSupply: BN;
    minRaise: BN;
    maxRaise: BN;
    minInvestment: BN;
    maxInvestment: BN;
    duration: BN; // Project duration in seconds after fundraise
}

export interface InvestmentInfo {
    investor: web3.PublicKey;
    amount: BN;
    tokenAmount: BN;
    timestamp: BN;
}

export interface ProposalState {
    id: BN;
    creator: web3.PublicKey;
    startTime: BN;
    endTime: BN;
    forVotes: BN;
    againstVotes: BN;
    status: ProposalStatus;
    description: string;
    executionData: Buffer;
}

export enum ProposalStatus {
    Active = 0,
    Succeeded = 1,
    Defeated = 2,
    Executed = 3,
    Cancelled = 4
}

export interface VoteReceipt {
    proposal: BN;
    voter: web3.PublicKey;
    support: boolean;
    votes: BN;
    timestamp: BN;
} 