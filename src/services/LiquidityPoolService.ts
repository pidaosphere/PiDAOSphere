import { Program, web3, BN } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

export interface PoolInfo {
    poolAddress: PublicKey;
    tokenAReserve: PublicKey;
    tokenBReserve: PublicKey;
    lpTokenMint: PublicKey;
    totalLiquidity: BN;
    tokenAAmount: BN;
    tokenBAmount: BN;
    fee: number;
}

export class LiquidityPoolService {
    private program: Program;
    private connection: Connection;

    constructor(program: Program, connection: Connection) {
        this.program = program;
        this.connection = connection;
    }

    async createPool(
        tokenA: PublicKey,
        tokenB: PublicKey,
        authority: web3.Keypair
    ): Promise<PoolInfo> {
        try {
            // Create LP token mint
            const lpTokenMint = await Token.createMint(
                this.connection,
                authority,
                authority.publicKey,
                null,
                9,
                TOKEN_PROGRAM_ID
            );

            // Find pool address
            const [poolAddress] = await this.findPoolAddress(tokenA, tokenB);

            // Create token accounts for pool reserves
            const tokenAReserve = await Token.createAccount(
                this.connection,
                authority,
                tokenA,
                poolAddress,
                TOKEN_PROGRAM_ID
            );

            const tokenBReserve = await Token.createAccount(
                this.connection,
                authority,
                tokenB,
                poolAddress,
                TOKEN_PROGRAM_ID
            );

            // Initialize pool
            await this.program.methods
                .initializePool({
                    fee: new BN(30), // 0.3% fee
                })
                .accounts({
                    pool: poolAddress,
                    tokenA: tokenA,
                    tokenB: tokenB,
                    tokenAReserve: tokenAReserve,
                    tokenBReserve: tokenBReserve,
                    lpTokenMint: lpTokenMint.publicKey,
                    authority: authority.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: web3.SystemProgram.programId,
                })
                .signers([authority])
                .rpc();

            return {
                poolAddress,
                tokenAReserve,
                tokenBReserve,
                lpTokenMint: lpTokenMint.publicKey,
                totalLiquidity: new BN(0),
                tokenAAmount: new BN(0),
                tokenBAmount: new BN(0),
                fee: 0.003,
            };
        } catch (error) {
            console.error('Failed to create liquidity pool:', error);
            throw error;
        }
    }

    async addLiquidity(
        pool: PublicKey,
        userTokenAAccount: PublicKey,
        userTokenBAccount: PublicKey,
        userLpTokenAccount: PublicKey,
        amountA: BN,
        amountB: BN,
        authority: web3.Keypair
    ): Promise<string> {
        try {
            const tx = await this.program.methods
                .addLiquidity(amountA, amountB)
                .accounts({
                    pool,
                    userTokenAAccount,
                    userTokenBAccount,
                    userLpTokenAccount,
                    authority: authority.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .signers([authority])
                .rpc();

            return tx;
        } catch (error) {
            console.error('Failed to add liquidity:', error);
            throw error;
        }
    }

    async removeLiquidity(
        pool: PublicKey,
        userTokenAAccount: PublicKey,
        userTokenBAccount: PublicKey,
        userLpTokenAccount: PublicKey,
        lpAmount: BN,
        authority: web3.Keypair
    ): Promise<string> {
        try {
            const tx = await this.program.methods
                .removeLiquidity(lpAmount)
                .accounts({
                    pool,
                    userTokenAAccount,
                    userTokenBAccount,
                    userLpTokenAccount,
                    authority: authority.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .signers([authority])
                .rpc();

            return tx;
        } catch (error) {
            console.error('Failed to remove liquidity:', error);
            throw error;
        }
    }

    async swap(
        pool: PublicKey,
        userSourceAccount: PublicKey,
        userDestinationAccount: PublicKey,
        amount: BN,
        minAmountOut: BN,
        authority: web3.Keypair
    ): Promise<string> {
        try {
            const tx = await this.program.methods
                .swap(amount, minAmountOut)
                .accounts({
                    pool,
                    userSourceAccount,
                    userDestinationAccount,
                    authority: authority.publicKey,
                    tokenProgram: TOKEN_PROGRAM_ID,
                })
                .signers([authority])
                .rpc();

            return tx;
        } catch (error) {
            console.error('Failed to swap tokens:', error);
            throw error;
        }
    }

    async getPoolInfo(pool: PublicKey): Promise<PoolInfo> {
        try {
            const poolAccount = await this.program.account.pool.fetch(pool);
            return {
                poolAddress: pool,
                tokenAReserve: poolAccount.tokenAReserve,
                tokenBReserve: poolAccount.tokenBReserve,
                lpTokenMint: poolAccount.lpTokenMint,
                totalLiquidity: poolAccount.totalLiquidity,
                tokenAAmount: poolAccount.tokenAAmount,
                tokenBAmount: poolAccount.tokenBAmount,
                fee: poolAccount.fee.toNumber() / 10000,
            };
        } catch (error) {
            console.error('Failed to get pool info:', error);
            throw error;
        }
    }

    private async findPoolAddress(
        tokenA: PublicKey,
        tokenB: PublicKey
    ): Promise<[PublicKey, number]> {
        return await web3.PublicKey.findProgramAddress(
            [
                Buffer.from('pool'),
                tokenA.toBuffer(),
                tokenB.toBuffer(),
            ],
            this.program.programId
        );
    }
} 