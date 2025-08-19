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

  const connection = new Connection("https://rpc.gorbagana.wtf/", "finalized");

  const mintPk = new PublicKey(process.argv[2]);            // mint address
  const uiAmount = BigInt(process.argv[3] || "1000000000"); // default: 1,000,000,000 UI

  const mintInfo = await getMint(connection, mintPk);
  const decimals = mintInfo.decimals;

  // raw = uiAmount * 10^decimals (BigInt-safe)
  const raw = uiAmount * (10n ** BigInt(decimals));

  const ata = await getOrCreateAssociatedTokenAccount(
    connection, payer, mintPk, payer.publicKey
  );

  await mintTo(connection, payer, mintPk, ata.address, payer, raw);

  console.log("✅ Minted", uiAmount.toString(), "UI tokens to ATA:", ata.address.toBase58());
})();
