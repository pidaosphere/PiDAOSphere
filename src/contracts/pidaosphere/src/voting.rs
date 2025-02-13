use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

#[account]
pub struct Proposal {
    pub title: String,
    pub description: String,
    pub creator: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub for_votes: u64,
    pub against_votes: u64,
    pub quorum: u64,
    pub executed: bool,
    pub cancelled: bool,
    pub execution_data: Vec<u8>,
}

#[account]
pub struct VoteReceipt {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub support: bool,
    pub votes: u64,
    pub timestamp: i64,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 256 + 256 + 32 + 8 + 8 + 8 + 8 + 8 + 1 + 1 + 1024
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(
        mut,
        constraint = voter_token_account.owner == voter.key(),
        constraint = voter_token_account.mint == project_token_mint.key()
    )]
    pub voter_token_account: Account<'info, TokenAccount>,
    pub project_token_mint: Account<'info, token::Mint>,
    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + 32 + 32 + 1 + 8 + 8,
        seeds = [b"vote_receipt", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub executor: Signer<'info>,
}

impl Proposal {
    pub fn create(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        quorum: u64,
        voting_period: i64,
        execution_data: Vec<u8>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        require!(voting_period > 0, ErrorCode::InvalidVotingPeriod);
        require!(quorum > 0, ErrorCode::InvalidQuorum);

        proposal.title = title;
        proposal.description = description;
        proposal.creator = ctx.accounts.creator.key();
        proposal.start_time = clock.unix_timestamp;
        proposal.end_time = clock.unix_timestamp + voting_period;
        proposal.quorum = quorum;
        proposal.for_votes = 0;
        proposal.against_votes = 0;
        proposal.executed = false;
        proposal.cancelled = false;
        proposal.execution_data = execution_data;

        Ok(())
    }

    pub fn cast_vote(ctx: Context<CastVote>, support: bool) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let vote_receipt = &mut ctx.accounts.vote_receipt;
        let clock = Clock::get()?;

        // Check if voting is still active
        require!(
            clock.unix_timestamp <= proposal.end_time,
            ErrorCode::VotingEnded
        );

        // Calculate vote weight based on token balance
        let vote_weight = ctx.accounts.voter_token_account.amount;
        require!(vote_weight > 0, ErrorCode::NoVotingPower);

        // Check if user has already voted
        if vote_receipt.timestamp > 0 {
            // Remove previous vote
            if vote_receipt.support {
                proposal.for_votes = proposal.for_votes.checked_sub(vote_receipt.votes)
                    .ok_or(ErrorCode::Overflow)?;
            } else {
                proposal.against_votes = proposal.against_votes.checked_sub(vote_receipt.votes)
                    .ok_or(ErrorCode::Overflow)?;
            }
        }

        // Record new vote
        if support {
            proposal.for_votes = proposal.for_votes.checked_add(vote_weight)
                .ok_or(ErrorCode::Overflow)?;
        } else {
            proposal.against_votes = proposal.against_votes.checked_add(vote_weight)
                .ok_or(ErrorCode::Overflow)?;
        }

        // Update vote receipt
        vote_receipt.proposal = proposal.key();
        vote_receipt.voter = ctx.accounts.voter.key();
        vote_receipt.support = support;
        vote_receipt.votes = vote_weight;
        vote_receipt.timestamp = clock.unix_timestamp;

        emit!(VoteCast {
            proposal: proposal.key(),
            voter: ctx.accounts.voter.key(),
            support,
            votes: vote_weight,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn execute(ctx: Context<ExecuteProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let clock = Clock::get()?;

        // Check if proposal can be executed
        require!(
            clock.unix_timestamp > proposal.end_time,
            ErrorCode::VotingNotEnded
        );
        require!(!proposal.executed, ErrorCode::AlreadyExecuted);
        require!(!proposal.cancelled, ErrorCode::ProposalCancelled);

        let total_votes = proposal.for_votes + proposal.against_votes;
        require!(total_votes >= proposal.quorum, ErrorCode::QuorumNotReached);
        require!(
            proposal.for_votes > proposal.against_votes,
            ErrorCode::ProposalNotPassed
        );

        proposal.executed = true;

        emit!(ProposalExecuted {
            proposal: proposal.key(),
            executor: ctx.accounts.executor.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

#[event]
pub struct VoteCast {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub support: bool,
    pub votes: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProposalExecuted {
    pub proposal: Pubkey,
    pub executor: Pubkey,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid voting period")]
    InvalidVotingPeriod,
    #[msg("Invalid quorum")]
    InvalidQuorum,
    #[msg("Voting period has ended")]
    VotingEnded,
    #[msg("Voting period has not ended")]
    VotingNotEnded,
    #[msg("No voting power")]
    NoVotingPower,
    #[msg("Proposal already executed")]
    AlreadyExecuted,
    #[msg("Proposal cancelled")]
    ProposalCancelled,
    #[msg("Quorum not reached")]
    QuorumNotReached,
    #[msg("Proposal not passed")]
    ProposalNotPassed,
    #[msg("Arithmetic overflow")]
    Overflow,
} 