const fs = require("fs");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const { getMint } = require("@solana/spl-token");

(async () => {
  const RPC_URL = "https://rpc.gorbagana.wtf/";
  const connection = new Connection(RPC_URL, "finalized");
  const mint = new PublicKey(process.argv[2]);
  const info = await getMint(connection, mint);
  console.log({
    mint: mint.toBase58(),
    decimals: info.decimals,
    supplyRaw: info.supply.toString()
  });
})();
