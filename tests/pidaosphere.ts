import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { Pidaosphere } from '../target/types/pidaosphere';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMint } from '@solana/spl-token';
import { expect } from 'chai';

describe('pidaosphere', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Pidaosphere as Program<Pidaosphere>;
  
  // Test accounts
  const authority = Keypair.generate();
  const investor = Keypair.generate();
  let projectTokenMint: PublicKey;
  let projectAccount: PublicKey;
  let proposalAccount: PublicKey;

  // Test configuration
  const projectConfig = {
    totalSupply: new anchor.BN(1000000),
    startPrice: new anchor.BN(1000000), // 1 SOL
    duration: new anchor.BN(7 * 24 * 60 * 60), // 1 week
    minInvestment: new anchor.BN(100000), // 0.1 SOL
    maxInvestment: new anchor.BN(10000000), // 10 SOL
    piHolderMultiplier: new anchor.BN(2),
  };

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(authority.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(investor.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);

    // Create project token mint
    projectTokenMint = await createMint(
      provider.connection,
      authority,
      authority.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );

    // Find project account PDA
    [projectAccount] = await PublicKey.findProgramAddress(
      [Buffer.from('project'), authority.publicKey.toBuffer()],
      program.programId
    );
  });

  it('Initialize Project', async () => {
    try {
      await program.methods
        .initializeProject(projectConfig)
        .accounts({
          project: projectAccount,
          authority: authority.publicKey,
          projectTokenMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([authority])
        .rpc();

      const project = await program.account.projectState.fetch(projectAccount);
      expect(project.authority.toString()).to.equal(authority.publicKey.toString());
      expect(project.totalSupply.toString()).to.equal(projectConfig.totalSupply.toString());
      expect(project.currentPrice.toString()).to.equal(projectConfig.startPrice.toString());
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  it('Invest in Project', async () => {
    try {
      const investAmount = new anchor.BN(500000); // 0.5 SOL

      await program.methods
        .invest(investAmount)
        .accounts({
          project: projectAccount,
          investor: investor.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([investor])
        .rpc();

      const project = await program.account.projectState.fetch(projectAccount);
      expect(project.totalInvestors.toString()).to.equal('1');
      expect(project.totalInvestment.toString()).to.equal(investAmount.toString());
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  it('Create Proposal', async () => {
    try {
      const description = 'Test Proposal';
      const executionData = Buffer.from('test');
      const votingPeriod = new anchor.BN(3 * 24 * 60 * 60); // 3 days

      [proposalAccount] = await PublicKey.findProgramAddress(
        [Buffer.from('proposal'), projectAccount.toBuffer(), authority.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .createProposal(description, executionData, votingPeriod)
        .accounts({
          proposal: proposalAccount,
          project: projectAccount,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const proposal = await program.account.proposalState.fetch(proposalAccount);
      expect(proposal.description).to.equal(description);
      expect(proposal.status).to.equal({ active: {} });
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  it('Cast Vote', async () => {
    try {
      await program.methods
        .castVote(true)
        .accounts({
          proposal: proposalAccount,
          voter: investor.publicKey,
        })
        .signers([investor])
        .rpc();

      const proposal = await program.account.proposalState.fetch(proposalAccount);
      expect(proposal.forVotes.toString()).not.to.equal('0');
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  // Error cases
  it('Should fail with invalid investment amount', async () => {
    try {
      const invalidAmount = new anchor.BN(50000); // 0.05 SOL (below min)
      
      await program.methods
        .invest(invalidAmount)
        .accounts({
          project: projectAccount,
          investor: investor.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([investor])
        .rpc();
      
      expect.fail('Expected transaction to fail');
    } catch (error) {
      expect(error.message).to.include('Investment amount out of bounds');
    }
  });
}); 