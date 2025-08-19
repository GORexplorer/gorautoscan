import { Connection, PublicKey } from "@solana/web3.js";
import * as mpl from "@metaplex-foundation/mpl-token-metadata";

// Usage: node check_metadata.js <MINT_ADDRESS>
// Example: node check_metadata.js F4a1SWxD4pzQasHpN7ek4cuy61tgxvCw9AZr2fUdTgyQ

const [mintStr] = process.argv.slice(2);
if (!mintStr) {
  console.error("Usage: node check_metadata.js <MINT_ADDRESS>");
  process.exit(1);
}

const RPC_URL = process.env.RPC_URL ?? "https://rpc.gorbagana.wtf/";
const connection = new Connection(RPC_URL, "finalized");
const mint = new PublicKey(mintStr);

// Resolve Token Metadata program id (fallback to the standard one)
const DEFAULT_TM = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const TM_PROGRAM_ID = new PublicKey(
  process.env.METADATA_PROGRAM_ID ??
  (mpl.PROGRAM_ID ? mpl.PROGRAM_ID.toBase58() : DEFAULT_TM)
);

// Derive Metadata PDA
const [metadataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("metadata"), TM_PROGRAM_ID.toBuffer(), mint.toBuffer()],
  TM_PROGRAM_ID
);

console.log("Metadata PDA:", metadataPDA.toBase58());

const acc = await connection.getAccountInfo(metadataPDA);
if (!acc) {
  console.log("❌ No metadata account found yet.");
  console.log("→ Run your set_metadata script first with the JSON URI.");
  process.exit(0);
}

// Try to decode with mpl helper (different versions expose different APIs).
let name = null, symbol = null, uri = null;
try {
  // Many versions expose this deserializer via generated code:
  const decoded = mpl.Metadata.deserialize(acc.data)[0]; // [metadata, offset]
  name = decoded.data.name.replace(/\0/g, "");
  symbol = decoded.data.symbol.replace(/\0/g, "");
  uri = decoded.data.uri.replace(/\0/g, "");
} catch (e) {
  try {
    // Newer codegen sometimes attaches a struct with "fromAccountInfo"
    const md = mpl.Metadata.fromAccountInfo({ data: acc.data })?.data;
    name = md.data.name.replace(/\0/g, "");
    symbol = md.data.symbol.replace(/\0/g, "");
    uri = md.data.uri.replace(/\0/g, "");
  } catch {
    console.warn("⚠️ Could not decode metadata with current mpl version; printing raw size:", acc.data.length);
  }
}

console.log({ name, symbol, uri });

// Also fetch the JSON to confirm it matches on-chain URI
if (uri && uri.startsWith("http")) {
  try {
    const res = await fetch(uri);
    const json = await res.json();
    console.log("Fetched JSON:", {
      name: json.name,
      symbol: json.symbol,
      image: json.image,
      description: json.description,
      extensions: json.extensions ?? null,
    });
  } catch (e) {
    console.warn("⚠️ Could not fetch JSON from uri:", uri, String(e));
  }
} else if (uri) {
  console.log("URI is non-HTTP (e.g., ipfs://). If needed, open via a gateway to view the JSON.");
}
