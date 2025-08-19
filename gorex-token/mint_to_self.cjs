const fs = require("fs");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMint,
} = require("@solana/spl-token");

(async () => {
  const payer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync("id.json","utf8")))
  );

  const RPC_URL = "https://rpc.gorbagana.wtf/";
  const connection = new Connection(RPC_URL, "finalized");

  const mintPk = new PublicKey(process.argv[2]);           // mint address
  const uiAmount = BigInt(process.argv[3] || "1000000000"); // default 1,000,000,000 (1B UI tokens)

  const mintInfo = await getMint(connection, mintPk);
  const decimals = mintInfo.decimals;

  // raw = uiAmount * 10^decimals  (use BigInt-safe pow)
  const raw = uiAmount * (BigInt(10) ** BigInt(decimals));

  const ata = await getOrCreateAssociatedTokenAccount(
    connection, payer, mintPk, payer.publicKey
  );

  await mintTo(connection, payer, mintPk, ata.address, payer, raw);

  console.log("✅ Minted", uiAmount.toString(), "UI tokens to:", ata.address.toBase58());
})();
