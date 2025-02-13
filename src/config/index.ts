import { config } from 'dotenv';
import { web3 } from '@project-serum/anchor';

// Load environment variables
config();

export const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
export const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.devnet.solana.com';
export const PROGRAM_ID = new web3.PublicKey(process.env.PROGRAM_ID || '');

// Pi Network Configuration
export const PI_NETWORK_API = process.env.PI_NETWORK_API || 'https://api.minepi.com';
export const PI_APP_ID = process.env.PI_APP_ID || '';
export const PI_API_KEY = process.env.PI_API_KEY || '';

// Project Configuration
export const DEFAULT_TOKEN_DECIMALS = 9;
export const MIN_PROPOSAL_DELAY = 60 * 60; // 1 hour in seconds
export const MAX_PROPOSAL_DELAY = 60 * 60 * 24 * 14; // 14 days in seconds
export const MIN_VOTING_PERIOD = 60 * 60 * 24 * 3; // 3 days in seconds
export const MAX_VOTING_PERIOD = 60 * 60 * 24 * 14; // 14 days in seconds
export const QUORUM_VOTES = 4; // 4% of total supply
export const PROPOSAL_THRESHOLD = 1; // 1% of total supply

// Security Configuration
export const MAX_TRANSACTIONS_PER_HOUR = 100;
export const MIN_INVESTMENT_AMOUNT = new web3.LAMPORTS_PER_SOL * 0.1; // 0.1 SOL
export const MAX_INVESTMENT_AMOUNT = new web3.LAMPORTS_PER_SOL * 100; // 100 SOL
export const DEFAULT_PI_HOLDER_MULTIPLIER = 2; // 2x for Pi holders 