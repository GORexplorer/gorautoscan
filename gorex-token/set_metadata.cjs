const { Connection, Keypair } = require("@solana/web3.js");
const { Metaplex, keypairIdentity } = require("@metaplex-foundation/js");
const fs = require("fs");

// Load wallet
const secret = JSON.parse(fs.readFileSync("id.json"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));

// Connection
const connection = new Connection("https://rpc.gorbagana.wtf");
const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair));

const mintAddress = "FPfuQonocUaC8efjsbmtSBkKVMGsD6WmdB7qKDHu2Gye";
const uri = "https://red-defensive-guanaco-572.mypinata.cloud/ipfs/bafkreihejpl733pjn4dhcgoz37vqjddlkc4xuxv37qjtidgno2e24uiow4";

async function main() {
  const { nft } = await metaplex.nfts().create({
    uri,
    name: "JunkNET Oracle",
    symbol: "JunkNET",
    sellerFeeBasisPoints: 0,
    mintAddress,
  });

  console.log("Metadata set for token:", nft.address.toBase58());
}

main();
