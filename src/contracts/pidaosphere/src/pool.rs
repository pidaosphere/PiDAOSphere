use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(init, payer = authority, space = 8 + PoolState::SIZE)]
    pub pool: Account<'info, PoolState>,
    pub token_a: Account<'info, Mint>,
    pub token_b: Account<'info, Mint>,
    #[account(mut)]
    pub token_a_reserve: Account<'info, TokenAccount>,
    #[account(mut)]
    pub token_b_reserve: Account<'info, TokenAccount>,
    pub lp_token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolState>,
    #[account(mut)]
    pub user_token_a_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_b_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_lp_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolState>,
    #[account(mut)]
    pub user_token_a_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_b_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_lp_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub pool: Account<'info, PoolState>,
    #[account(mut)]
    pub user_source_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_destination_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct PoolState {
    pub token_a: Pubkey,
    pub token_b: Pubkey,
    pub token_a_reserve: Pubkey,
    pub token_b_reserve: Pubkey,
    pub lp_token_mint: Pubkey,
    pub total_liquidity: u64,
    pub token_a_amount: u64,
    pub token_b_amount: u64,
    pub fee: u64, // Fee in basis points (1/10000)
}

impl PoolState {
    pub const SIZE: usize = 32 * 5 + 8 * 4;
}

pub fn initialize_pool(ctx: Context<InitializePool>, fee: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    
    pool.token_a = ctx.accounts.token_a.key();
    pool.token_b = ctx.accounts.token_b.key();
    pool.token_a_reserve = ctx.accounts.token_a_reserve.key();
    pool.token_b_reserve = ctx.accounts.token_b_reserve.key();
    pool.lp_token_mint = ctx.accounts.lp_token_mint.key();
    pool.total_liquidity = 0;
    pool.token_a_amount = 0;
    pool.token_b_amount = 0;
    pool.fee = fee;

    Ok(())
}

pub fn add_liquidity(ctx: Context<AddLiquidity>, amount_a: u64, amount_b: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    
    // Transfer tokens to pool reserves
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_a_account.to_account_info(),
                to: ctx.accounts.token_a_reserve.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount_a,
    )?;

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_b_account.to_account_info(),
                to: ctx.accounts.token_b_reserve.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount_b,
    )?;

    // Calculate and mint LP tokens
    let lp_amount = if pool.total_liquidity == 0 {
        (amount_a as u128 * amount_b as u128).sqrt() as u64
    } else {
        std::cmp::min(
            amount_a * pool.total_liquidity / pool.token_a_amount,
            amount_b * pool.total_liquidity / pool.token_b_amount,
        )
    };

    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.lp_token_mint.to_account_info(),
                to: ctx.accounts.user_lp_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        lp_amount,
    )?;

    // Update pool state
    pool.token_a_amount += amount_a;
    pool.token_b_amount += amount_b;
    pool.total_liquidity += lp_amount;

    Ok(())
}

pub fn remove_liquidity(ctx: Context<RemoveLiquidity>, lp_amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    
    // Calculate token amounts to return
    let amount_a = lp_amount * pool.token_a_amount / pool.total_liquidity;
    let amount_b = lp_amount * pool.token_b_amount / pool.total_liquidity;

    // Burn LP tokens
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.lp_token_mint.to_account_info(),
                from: ctx.accounts.user_lp_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        lp_amount,
    )?;

    // Transfer tokens back to user
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.token_a_reserve.to_account_info(),
                to: ctx.accounts.user_token_a_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount_a,
    )?;

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.token_b_reserve.to_account_info(),
                to: ctx.accounts.user_token_b_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount_b,
    )?;

    // Update pool state
    pool.token_a_amount -= amount_a;
    pool.token_b_amount -= amount_b;
    pool.total_liquidity -= lp_amount;

    Ok(())
}

pub fn swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    
    // Calculate amount out using constant product formula
    let fee_amount = amount_in * pool.fee / 10000;
    let amount_in_with_fee = amount_in - fee_amount;
    
    let amount_out = amount_in_with_fee * pool.token_b_amount / (pool.token_a_amount + amount_in_with_fee);
    require!(amount_out >= min_amount_out, ErrorCode::SlippageExceeded);

    // Transfer tokens
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_source_account.to_account_info(),
                to: ctx.accounts.token_a_reserve.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount_in,
    )?;

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.token_b_reserve.to_account_info(),
                to: ctx.accounts.user_destination_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount_out,
    )?;

    // Update pool state
    pool.token_a_amount += amount_in;
    pool.token_b_amount -= amount_out;

    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Amount out less than minimum")]
    SlippageExceeded,
} 