import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { assert } from "chai";
import { Counter } from "../target/types/counter";
const { SystemProgram } = anchor.web3;


describe("counter", async () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider);

  const program = anchor.workspace.Counter as Program<Counter>;

  const [profilePda, _] = await findProgramAddressSync([utf8.encode('USER_PROFILE'), provider.wallet.publicKey.toBuffer()], program.programId);

  it("Is initialized!", async () => {
    await program.methods.initializeUser().accounts({
      authority: provider.wallet.publicKey,
      userAccount: profilePda,
      systemProgram: SystemProgram.programId
    }).rpc();
  });

  it("create counter", async () => {
    const user = await program.account.userAccount.fetch(profilePda)

    const [counterPda, _] = await findProgramAddressSync([utf8.encode('COUNTER'), provider.wallet.publicKey.toBuffer(),  Uint8Array.from([0])], program.programId);

    const tx = await program.methods.initializeCounter().accounts({
      authority: provider.wallet.publicKey,
      userAccount: profilePda,
      counterAccount: counterPda,
      systemProgram: SystemProgram.programId
    }).rpc();
    console.log("Your transaction signature", tx);
  })

  it("Is incremented!", async () => {

    const [counterPda, _] = await findProgramAddressSync([utf8.encode('COUNTER'), provider.wallet.publicKey.toBuffer(),  Uint8Array.from([0])], program.programId);

    const tx = await program.methods.increment(0, 2).accounts({
      counterAccount: counterPda,
      authority: provider.wallet.publicKey,
    }).rpc();
    const counter = await program.account.counterAccount.fetch(counterPda);
    assert.equal(counter.count, 2)
  });

  it("Is decremented!", async () => {

    const [counterPda, _] = await findProgramAddressSync([utf8.encode('COUNTER'), provider.wallet.publicKey.toBuffer(),  Uint8Array.from([0])], program.programId);

    const tx = await program.methods.decrement(0, 2).accounts({
      counterAccount: counterPda,
      authority: provider.wallet.publicKey,
    }).rpc();
    const counter = await program.account.counterAccount.fetch(counterPda);
    
    assert.equal(counter.count, 0)

    await program.methods.decrement(0, 2).accounts({
      counterAccount: counterPda,
      authority: provider.wallet.publicKey,
    }).rpc();
    const counter2 = await program.account.counterAccount.fetch(counterPda);

    assert.equal(counter2.count, 0)
  });
});
