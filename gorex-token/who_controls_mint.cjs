// who_controls_mint.js
const { Connection, PublicKey } = require("@solana/web3.js");
const { getMint } = require("@solana/spl-token");

(async () => {
  const connection = new Connection("https://rpc.gorbagana.wtf/", "finalized");
  const mint = new PublicKey(process.argv[2]);
  const info = await getMint(connection, mint);
  console.log({
    mint: mint.toBase58(),
    decimals: info.decimals,
    supplyRaw: info.supply.toString(),
    mintAuthority: info.mintAuthority ? info.mintAuthority.toBase58() : null,
    freezeAuthority: info.freezeAuthority ? info.freezeAuthority.toBase58() : null,
  });
})();
