const fs = require("fs");
const {
  Connection, Keypair, PublicKey, LAMPORTS_PER_SOL,
} = require("@solana/web3.js");
const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMint,
} = require("@solana/spl-token");

(async () => {
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync("id.json", "utf8")))
  );

  const RPC_URL = process.env.RPC_URL || "https://rpc.gorbagana.wtf/";
  const connection = new Connection(RPC_URL, "finalized");

  // Decimals: 6 (matches examples like RADBRO)
  const decimals = 6;

  // 1) Create the mint (mint authority & freeze authority = your wallet)
  const mintPubkey = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    decimals
  );
  console.log("Mint:", mintPubkey.toBase58());

  // 2) Ensure your wallet has an ATA for this mint
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mintPubkey,
    payer.publicKey
  );
  console.log("Your ATA:", ata.address.toBase58());

  // 3) Mint 1B tokens -> use BigInt to avoid precision issues
  const supply = BigInt(1_000_000_000) * BigInt(10 ** decimals); // 1B * 10^6
  await mintTo(connection, payer, mintPubkey, ata.address, payer, supply);

  const mintInfo = await getMint(connection, mintPubkey);
  console.log("✅ Done. Decimals:", mintInfo.decimals, "Supply (raw):", mintInfo.supply.toString());
  console.log("👉 Explorer: open your wallet or the mint on Trashscan/explorer");
})();
