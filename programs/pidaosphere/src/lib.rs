use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

declare_id!("your_program_id");

#[program]
pub mod pidaosphere {
    use super::*;

    // Initialize a new project
    pub fn initialize_project(
        ctx: Context<InitializeProject>,
        config: ProjectConfig,
        initial_pi_price: u64,
        invite_code: Option<String>,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let current_time = Clock::get()?.unix_timestamp;

        // Validate configuration
        require!(
            config.min_raise <= config.max_raise,
            PiDaoError::InvalidConfig
        );
        require!(
            config.min_investment <= config.max_investment,
            PiDaoError::InvalidConfig
        );

        project.is_initialized = true;
        project.authority = ctx.accounts.authority.key();
        project.project_token_mint = ctx.accounts.project_token_mint.key();
        project.total_supply = config.total_supply;
        project.initial_pi_price = initial_pi_price;
        project.current_pi_price = initial_pi_price;
        project.start_time = current_time;
        project.fundraise_end_time = current_time + 7 * 24 * 60 * 60; // 1 week
        project.expiration_time = project.fundraise_end_time + config.duration;
        project.min_raise = config.min_raise;
        project.max_raise = config.max_raise;
        project.min_investment = config.min_investment;
        project.max_investment = config.max_investment;
        project.total_investors = 0;
        project.total_investment = 0;
        project.liquidity_amount = 0;
        project.investment_amount = 0;
        project.invite_only = invite_code.is_some();
        project.invite_code = invite_code.unwrap_or_default();
        project.refunds_enabled = false;
        project.status = ProjectStatus::Fundraising;

        Ok(())
    }

    // Emergency pause
    pub fn pause_contract(ctx: Context<EmergencyAction>) -> Result<()> {
        require!(
            ctx.accounts.admin.key() == ctx.accounts.project.authority,
            PiDaoError::UnauthorizedAccess
        );
        
        let project = &mut ctx.accounts.project;
        project.is_paused = true;
        
        emit!(ContractPaused {
            project: ctx.accounts.project.key(),
            admin: ctx.accounts.admin.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // Emergency unpause
    pub fn unpause_contract(ctx: Context<EmergencyAction>) -> Result<()> {
        require!(
            ctx.accounts.admin.key() == ctx.accounts.project.authority,
            PiDaoError::UnauthorizedAccess
        );
        
        let project = &mut ctx.accounts.project;
        project.is_paused = false;
        
        emit!(ContractUnpaused {
            project: ctx.accounts.project.key(),
            admin: ctx.accounts.admin.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }

    // Invest in a project with additional validations
    pub fn invest(
        ctx: Context<Invest>,
        amount: u64,
        invite_code: Option<String>,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let current_time = Clock::get()?.unix_timestamp;

        // Validate project state
        require!(
            project.status == ProjectStatus::Fundraising,
            PiDaoError::InvalidProjectState
        );
        require!(
            current_time <= project.fundraise_end_time,
            PiDaoError::FundraisingEnded
        );

        // Validate invite code if required
        if project.invite_only {
            require!(
                Some(project.invite_code.clone()) == invite_code,
                PiDaoError::InvalidInviteCode
            );
        }

        // Validate investment amount
        require!(
            amount >= project.min_investment && amount <= project.max_investment,
            PiDaoError::InvalidInvestmentAmount
        );
        require!(
            project.total_investment.checked_add(amount).unwrap() <= project.max_raise,
            PiDaoError::MaxRaiseExceeded
        );

        // Calculate token amount
        let token_amount = amount
            .checked_mul(project.initial_pi_price)
            .ok_or(PiDaoError::Overflow)?;

        // Transfer Pi tokens from investor
        // TODO: Implement Pi Network payment integration

        // Mint project tokens to investor
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::MintTo {
                    mint: ctx.accounts.project_token_mint.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            token_amount,
        )?;

        // Update project state
        project.total_investment = project.total_investment.checked_add(amount).unwrap();
        project.total_investors = project.total_investors.checked_add(1).unwrap();

        // Emit investment event
        emit!(InvestmentMade {
            project: ctx.accounts.project.key(),
            investor: ctx.accounts.investor.key(),
            amount,
            token_amount,
            timestamp: current_time,
        });

        Ok(())
    }

    // Create a proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        description: String,
        execution_data: Vec<u64>,
        voting_period: i64,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let project = &ctx.accounts.project;

        proposal.creator = ctx.accounts.creator.key();
        proposal.start_time = Clock::get()?.unix_timestamp;
        proposal.end_time = proposal.start_time + voting_period;
        proposal.description = description;
        proposal.execution_data = execution_data;
        proposal.for_votes = 0;
        proposal.against_votes = 0;
        proposal.status = ProposalStatus::Active;

        Ok(())
    }

    // Cast a vote
    pub fn cast_vote(
        ctx: Context<CastVote>,
        support: bool,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let voter = &ctx.accounts.voter;

        require!(
            Clock::get()?.unix_timestamp <= proposal.end_time,
            PiDaoError::VotingEnded
        );

        // Calculate voting power based on token balance
        let voting_power = token::accessor::amount(
            &ctx.accounts.voter_token_account.to_account_info()
        )?;

        if support {
            proposal.for_votes = proposal.for_votes.checked_add(voting_power).unwrap();
        } else {
            proposal.against_votes = proposal.against_votes.checked_add(voting_power).unwrap();
        }

        Ok(())
    }

    // Initialize multisig
    pub fn initialize_multisig(
        ctx: Context<InitializeMultisig>,
        owners: Vec<Pubkey>,
        threshold: u64,
    ) -> Result<()> {
        require!(threshold > 0 && threshold <= owners.len() as u64, PiDaoError::InvalidThreshold);
        require!(owners.len() <= 10, PiDaoError::TooManyOwners);

        let multisig = &mut ctx.accounts.multisig;
        multisig.owners = owners;
        multisig.threshold = threshold;
        multisig.nonce = 0;
        multisig.owner_set_seqno = 0;

        Ok(())
    }

    // Propose upgrade
    pub fn propose_upgrade(
        ctx: Context<ProposeUpgrade>,
        new_program_id: Pubkey,
        description: String,
    ) -> Result<()> {
        let upgrade = &mut ctx.accounts.upgrade_proposal;
        let multisig = &ctx.accounts.multisig;

        require!(
            multisig.owners.contains(&ctx.accounts.proposer.key()),
            PiDaoError::UnauthorizedAccess
        );

        upgrade.proposer = ctx.accounts.proposer.key();
        upgrade.new_program_id = new_program_id;
        upgrade.description = description;
        upgrade.approved_by = vec![ctx.accounts.proposer.key()];
        upgrade.executed = false;
        upgrade.created_at = Clock::get()?.unix_timestamp;

        emit!(UpgradeProposed {
            upgrade_id: upgrade.key(),
            proposer: upgrade.proposer,
            new_program_id,
            timestamp: upgrade.created_at,
        });

        Ok(())
    }

    // Approve upgrade
    pub fn approve_upgrade(ctx: Context<ApproveUpgrade>) -> Result<()> {
        let upgrade = &mut ctx.accounts.upgrade_proposal;
        let multisig = &ctx.accounts.multisig;
        let approver = &ctx.accounts.approver;

        require!(!upgrade.executed, PiDaoError::AlreadyExecuted);
        require!(
            multisig.owners.contains(&approver.key()),
            PiDaoError::UnauthorizedAccess
        );
        require!(
            !upgrade.approved_by.contains(&approver.key()),
            PiDaoError::AlreadyApproved
        );

        upgrade.approved_by.push(approver.key());

        emit!(UpgradeApproved {
            upgrade_id: upgrade.key(),
            approver: approver.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    // Execute upgrade
    pub fn execute_upgrade(ctx: Context<ExecuteUpgrade>) -> Result<()> {
        let upgrade = &mut ctx.accounts.upgrade_proposal;
        let multisig = &ctx.accounts.multisig;

        require!(!upgrade.executed, PiDaoError::AlreadyExecuted);
        require!(
            upgrade.approved_by.len() as u64 >= multisig.threshold,
            PiDaoError::InsufficientApprovals
        );

        // Implement program upgrade logic here
        upgrade.executed = true;

        emit!(UpgradeExecuted {
            upgrade_id: upgrade.key(),
            new_program_id: upgrade.new_program_id,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn finalize_fundraise(ctx: Context<FinalizeFundraise>) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let current_time = Clock::get()?.unix_timestamp;

        // Validate timing and state
        require!(
            current_time > project.fundraise_end_time,
            PiDaoError::FundraisingActive
        );
        require!(
            project.status == ProjectStatus::Fundraising,
            PiDaoError::InvalidProjectState
        );

        // Check if minimum raise was met
        if project.total_investment < project.min_raise {
            project.status = ProjectStatus::Refunding;
            project.refunds_enabled = true;
            emit!(FundraiseFinalized {
                project: ctx.accounts.project.key(),
                success: false,
                timestamp: current_time,
            });
            return Ok(());
        }

        // Calculate fund split (90/10)
        let liquidity_amount = project.total_investment
            .checked_mul(10)
            .unwrap()
            .checked_div(100)
            .unwrap();
        let investment_amount = project.total_investment.checked_sub(liquidity_amount).unwrap();

        project.liquidity_amount = liquidity_amount;
        project.investment_amount = investment_amount;
        project.status = ProjectStatus::Active;

        emit!(FundraiseFinalized {
            project: ctx.accounts.project.key(),
            success: true,
            timestamp: current_time,
        });

        Ok(())
    }

    pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
        let project = &mut ctx.accounts.project;
        
        require!(
            project.status == ProjectStatus::Refunding,
            PiDaoError::RefundsNotEnabled
        );

        // TODO: Implement refund logic with Pi Network integration

        emit!(RefundClaimed {
            project: ctx.accounts.project.key(),
            investor: ctx.accounts.investor.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn redeem_tokens(
        ctx: Context<RedeemTokens>,
        amount: u64,
    ) -> Result<()> {
        let project = &mut ctx.accounts.project;
        let current_time = Clock::get()?.unix_timestamp;

        require!(
            current_time > project.expiration_time,
            PiDaoError::ProjectNotExpired
        );
        require!(
            project.status == ProjectStatus::Active,
            PiDaoError::InvalidProjectState
        );

        // Calculate redemption amount
        let redemption_amount = amount
            .checked_mul(project.current_pi_price)
            .ok_or(PiDaoError::Overflow)?;

        // Burn project tokens
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Burn {
                    mint: ctx.accounts.project_token_mint.to_account_info(),
                    from: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.investor.to_account_info(),
                },
            ),
            amount,
        )?;

        // TODO: Implement Pi token transfer for redemption

        emit!(TokensRedeemed {
            project: ctx.accounts.project.key(),
            investor: ctx.accounts.investor.key(),
            amount,
            redemption_amount,
            timestamp: current_time,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeProject<'info> {
    #[account(init, payer = authority, space = 8 + ProjectState::SIZE)]
    pub project: Account<'info, ProjectState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub project_token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Invest<'info> {
    #[account(mut)]
    pub project: Account<'info, ProjectState>,
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub project_token_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(init, payer = creator, space = 8 + ProposalState::SIZE)]
    pub proposal: Account<'info, ProposalState>,
    pub project: Account<'info, ProjectState>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, ProposalState>,
    pub voter: Signer<'info>,
    pub voter_token_account: Account<'info, TokenAccount>,
}

#[derive(Accounts)]
pub struct EmergencyAction<'info> {
    #[account(mut)]
    pub project: Account<'info, ProjectState>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeMultisig<'info> {
    #[account(init, payer = payer, space = 8 + MultisigState::SIZE)]
    pub multisig: Account<'info, MultisigState>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProposeUpgrade<'info> {
    #[account(init, payer = proposer, space = 8 + UpgradeProposal::SIZE)]
    pub upgrade_proposal: Account<'info, UpgradeProposal>,
    pub multisig: Account<'info, MultisigState>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveUpgrade<'info> {
    #[account(mut)]
    pub upgrade_proposal: Account<'info, UpgradeProposal>,
    pub multisig: Account<'info, MultisigState>,
    pub approver: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteUpgrade<'info> {
    #[account(mut)]
    pub upgrade_proposal: Account<'info, UpgradeProposal>,
    pub multisig: Account<'info, MultisigState>,
    #[account(mut)]
    pub executor: Signer<'info>,
}

#[derive(Accounts)]
pub struct FinalizeFundraise<'info> {
    #[account(mut)]
    pub project: Account<'info, ProjectState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRefund<'info> {
    #[account(mut)]
    pub project: Account<'info, ProjectState>,
    #[account(mut)]
    pub investor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RedeemTokens<'info> {
    #[account(mut)]
    pub project: Account<'info, ProjectState>,
    #[account(mut)]
    pub investor: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub project_token_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct ProjectState {
    pub is_initialized: bool,
    pub authority: Pubkey,
    pub project_token_mint: Pubkey,
    pub total_supply: u64,
    pub initial_pi_price: u64,
    pub current_pi_price: u64,
    pub start_time: i64,
    pub fundraise_end_time: i64,
    pub expiration_time: i64,
    pub min_raise: u64,
    pub max_raise: u64,
    pub min_investment: u64,
    pub max_investment: u64,
    pub total_investors: u64,
    pub total_investment: u64,
    pub liquidity_amount: u64,
    pub investment_amount: u64,
    pub invite_only: bool,
    pub invite_code: String,
    pub refunds_enabled: bool,
    pub status: ProjectStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ProjectStatus {
    Fundraising,
    Active,
    Expired,
    Refunding,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProjectConfig {
    pub total_supply: u64,
    pub min_raise: u64,
    pub max_raise: u64,
    pub min_investment: u64,
    pub max_investment: u64,
    pub duration: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ProposalStatus {
    Active,
    Succeeded,
    Defeated,
    Executed,
    Cancelled,
}

#[event]
pub struct ContractPaused {
    pub project: Pubkey,
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ContractUnpaused {
    pub project: Pubkey,
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct InvestmentMade {
    pub project: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub token_amount: u64,
    pub timestamp: i64,
}

#[account]
pub struct MultisigState {
    pub owners: Vec<Pubkey>,
    pub threshold: u64,
    pub nonce: u64,
    pub owner_set_seqno: u64,
}

#[account]
pub struct UpgradeProposal {
    pub proposer: Pubkey,
    pub new_program_id: Pubkey,
    pub description: String,
    pub approved_by: Vec<Pubkey>,
    pub executed: bool,
    pub created_at: i64,
}

impl MultisigState {
    pub const SIZE: usize = 32 * 10 + // owners (max 10)
                           8 + // threshold
                           8 + // nonce
                           8; // owner_set_seqno
}

impl UpgradeProposal {
    pub const SIZE: usize = 32 + // proposer
                           32 + // new_program_id
                           200 + // description
                           32 * 10 + // approved_by (max 10)
                           1 + // executed
                           8; // created_at
}

#[event]
pub struct UpgradeProposed {
    pub upgrade_id: Pubkey,
    pub proposer: Pubkey,
    pub new_program_id: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UpgradeApproved {
    pub upgrade_id: Pubkey,
    pub approver: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct UpgradeExecuted {
    pub upgrade_id: Pubkey,
    pub new_program_id: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct FundraiseFinalized {
    pub project: Pubkey,
    pub success: bool,
    pub timestamp: i64,
}

#[event]
pub struct RefundClaimed {
    pub project: Pubkey,
    pub investor: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TokensRedeemed {
    pub project: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub redemption_amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum PiDaoError {
    #[msg("Contract is paused")]
    ContractPaused,
    #[msg("Invalid configuration parameters")]
    InvalidConfig,
    #[msg("Investment amount out of bounds")]
    InvalidInvestmentAmount,
    #[msg("Investment cap reached")]
    InvestmentCapReached,
    #[msg("Invalid time window for operation")]
    InvalidTimeWindow,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Voting period has ended")]
    VotingEnded,
    #[msg("Invalid threshold")]
    InvalidThreshold,
    #[msg("Too many owners")]
    TooManyOwners,
    #[msg("Already executed")]
    AlreadyExecuted,
    #[msg("Already approved")]
    AlreadyApproved,
    #[msg("Insufficient approvals")]
    InsufficientApprovals,
    #[msg("Invalid project state")]
    InvalidProjectState,
    #[msg("Fundraising period has ended")]
    FundraisingEnded,
    #[msg("Fundraising is still active")]
    FundraisingActive,
    #[msg("Invalid invite code")]
    InvalidInviteCode,
    #[msg("Maximum raise amount exceeded")]
    MaxRaiseExceeded,
    #[msg("Refunds are not enabled")]
    RefundsNotEnabled,
    #[msg("Project has not expired")]
    ProjectNotExpired,
} 