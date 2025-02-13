pub fn invest(
    ctx: Context<Invest>,
    amount: u64,
    invite_code: Option<String>,
    pi_payment_txid: String,
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

    // Verify Pi Network payment
    // Note: In a production environment, you would want to verify the payment
    // through an oracle or other secure mechanism
    require!(!pi_payment_txid.is_empty(), PiDaoError::InvalidPayment);

    // Calculate token amount
    let token_amount = amount
        .checked_mul(project.initial_pi_price)
        .ok_or(PiDaoError::Overflow)?;

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

    // Emit investment event with Pi payment information
    emit!(InvestmentMade {
        project: ctx.accounts.project.key(),
        investor: ctx.accounts.investor.key(),
        amount,
        token_amount,
        pi_payment_txid,
        timestamp: current_time,
    });

    Ok(())
}

#[event]
pub struct InvestmentMade {
    pub project: Pubkey,
    pub investor: Pubkey,
    pub amount: u64,
    pub token_amount: u64,
    pub pi_payment_txid: String,
    pub timestamp: i64,
}

#[error_code]
pub enum PiDaoError {
    // ... existing errors ...
    #[msg("Invalid Pi Network payment")]
    InvalidPayment,
} 