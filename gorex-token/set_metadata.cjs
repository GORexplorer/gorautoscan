const { Connection, Keypair } = require("@solana/web3.js");
const { Metaplex, keypairIdentity } = require("@metaplex-foundation/js");
const fs = require("fs");

// Load wallet
const secret = JSON.parse(fs.readFileSync("id.json"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));

// Connection
const connection = new Connection("https://rpc.gorbagana.wtf");
const metaplex = Metaplex.make(connection).use(keypairIdentity(keypair));

const mintAddress = "BswDEEvvHPE7zzintHEmFsqXwNueiinDRkaGzuijNSkz";
const uri = "https://red-defensive-guanaco-572.mypinata.cloud/ipfs/bafybeiei2zvcepq5e3dxh5hc3bywo6gjbrszjlrq73mi5u57v2pmzn4zcq";

async function main() {
  const { nft } = await metaplex.nfts().create({
    uri,
    name: "Gorex Capsules",
    symbol: "GOREX",
    sellerFeeBasisPoints: 0,
    mintAddress,
  });

  console.log("Metadata set for token:", nft.address.toBase58());
}

main();
