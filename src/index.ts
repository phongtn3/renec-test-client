import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
import * as dotenv from "dotenv";


async function createNewMint(
  connection: web3.Connection,
  payer: web3.Keypair,
  mintAuthority: web3.PublicKey,
  freezeAuthority: web3.PublicKey,
  decimals: number
): Promise<web3.PublicKey> {
  const tokenMint = await token.createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    decimals
  );

  console.log(`The token mint account address is ${tokenMint}`);
  console.log(
    `Token Mint: https://explorer.renec.foundation/address/${tokenMint}`
  );

  return tokenMint;
}

async function createTokenAccount(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  owner: web3.PublicKey
) {
  const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner
  );

  console.log(
    `Token Account: https:/explorer.renec.foundation/address/${tokenAccount.address}`
  );

  return tokenAccount;
}

async function mintTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  destination: web3.PublicKey,
  authority: web3.Keypair,
  amount: number
) {
  const mintInfo = await token.getMint(connection, mint);

  const transactionSignature = await token.mintTo(
    connection,
    payer,
    mint,
    destination,
    authority,
    amount * 10 ** mintInfo.decimals
  );

  console.log(
    `Mint Token Transaction: https://explorer.renec.foundation/tx/${transactionSignature}`
  );
}

async function main() {
  dotenv.config();
  const opts: web3.ConfirmOptions = {
    preflightCommitment: "processed",
    commitment: "processed",
  };
  const connection = new web3.Connection(
    "https://api-mainnet-beta.renec.foundation:8899/",
    opts
  );
  const secretKey = new Uint8Array(JSON.parse(process.env.PRIV_KEY as string));
  let user = web3.Keypair.fromSecretKey(secretKey);

  console.log("PublicKey:", user.publicKey.toBase58());

  const mint = await createNewMint(
    connection,
    user, // We'll pay the fees
    user.publicKey, // We're the mint authority
    user.publicKey, // And the freeze authority >:)
    9 // Only two decimals!
  );

  const tokenAccount = await createTokenAccount(
    connection,
    user,
    mint,
    user.publicKey // Associating our address with the token account
  );

  // Mint 100 tokens to our address
  await mintTokens(connection, user, mint, tokenAccount.address, user, 100);
}

main()
  .then(() => {
    console.log("Finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
