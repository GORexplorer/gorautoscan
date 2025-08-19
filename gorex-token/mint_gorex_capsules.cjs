// mint_gorex_capsules.cjs (CommonJS)
// Batch mint N NFTs to your wallet using @metaplex-foundation/js.
// - Uses your id.json keypair (owner + update authority)
// - Each NFT is a 1/1 (Master Edition, maxSupply: 0)
// - You can pass a single URI (same metadata for all) or a base URI + count
//
// USAGE (PowerShell one-liners):
//   A) Same URI for all (e.g., one JSON OR your GIF URL)
//      node mint_gorex_capsules.cjs --uri <URI> --count 999 --nameBase "Gorex Capsules" --symbol GOREX --delay 400
//
//   B) Unique JSONs in a folder (e.g., .../1.json..999.json)
//      node mint_gorex_capsules.cjs --uriBase https://<gateway>/ipfs/<CID>/ --count 999 --start 1 --nameBase "Gorex Capsules" --symbol GOREX --delay 400
//
//   C) Manifest file with per-item URIs
//      node mint_gorex_capsules.cjs --manifest .\\items.json --delay 400
//
// NOTES:
// - Many wallets/explorers expect URI to be a JSON metadata file. Using a raw image (GIF) URL may not render previews everywhere.
//   If you only have a GIF link, you can still mint; on-chain name/symbol will show, image may vary by viewer.
// - If Gorbagana uses a custom Token-Metadata program id, Metaplex JS should still handle it. If not, we can switch to low-level MPL ixs.

const fs = require("fs");
const { Connection, Keypair } = require("@solana/web3.js");
const { Metaplex, keypairIdentity } = require("@metaplex-foundation/js");

function parseArgs() {
  const out = { _: [] };
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    if (k.startsWith("--")) {
      const key = k.slice(2);
      const val = a[i + 1] && !a[i + 1].startsWith("--") ? a[++i] : true;
      out[key] = val;
    } else out._.push(k);
  }
  return out;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const argv = parseArgs();
const RPC_URL = process.env.RPC_URL || "https://rpc.gorbagana.wtf/";
const secret = JSON.parse(fs.readFileSync("id.json", "utf8"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
const connection = new Connection(RPC_URL, "finalized");
const mx = Metaplex.make(connection).use(keypairIdentity(keypair));

const COUNT = parseInt(argv.count || "999", 10);
const START = parseInt(argv.start || "1", 10);
const NAME_BASE = argv.nameBase || "Gorex Capsules";
const SYMBOL = (argv.symbol || "GOREX").slice(0, 10);
const DELAY_MS = parseInt(argv.delay || "400", 10);
const SINGLE_URI = argv.uri || null;       // same for all
const BASE = argv.uriBase || null;         // prefix + i.json
const MANIFEST = argv.manifest || null;    // items.json array [{name,symbol,uri}]

function buildItems() {
  if (MANIFEST) {
    const arr = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    if (!Array.isArray(arr)) throw new Error("manifest must be an array of {name,symbol,uri}");
    return arr.map((x, i) => ({
      name: (x.name || `${NAME_BASE} #${i + START}`).slice(0, 32),
      symbol: (x.symbol || SYMBOL).slice(0, 10),
      uri: x.uri,
    }));
  }
  if (BASE) {
    const items = [];
    for (let i = 0; i < COUNT; i++) {
      const n = START + i;
      items.push({
        name: `${NAME_BASE} #${n}`.slice(0, 32),
        symbol: SYMBOL,
        uri: `${BASE}${n}.json`,
      });
    }
    return items;
  }
  if (SINGLE_URI) {
    const items = [];
    for (let i = 0; i < COUNT; i++) {
      const n = START + i;
      items.push({
        name: `${NAME_BASE} #${n}`.slice(0, 32),
        symbol: SYMBOL,
        uri: SINGLE_URI,
      });
    }
    return items;
  }
  throw new Error("Provide one of: --manifest items.json | --uriBase <url> --count N | --uri <singleUri> --count N");
}

(async () => {
  console.log("Wallet:", keypair.publicKey.toBase58());
  const items = buildItems();
  console.log(`Minting ${items.length} NFTs…`);

  const minted = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    try {
      const res = await mx.nfts().create({
        uri: it.uri,
        name: it.name,
        symbol: it.symbol,
        sellerFeeBasisPoints: 0,
        maxSupply: 0, // Master Edition 1/1
        tokenOwner: keypair.publicKey,
      });
      const { nft } = res;
      console.log(`✅ ${i + 1}/${items.length} ${it.name} -> ${nft.mint.address.toBase58()} | tx: ${res.response.signature}`);
      minted.push(nft.mint.address.toBase58());
    } catch (e) {
      console.error(`❌ ${i + 1}/${items.length} ${it.name} failed:`, String(e));
    }
    if (DELAY_MS) await sleep(DELAY_MS);
  }

  console.log("Done. Minted:", minted.length);
  if (minted.length) {
    fs.writeFileSync("minted_capsules.txt", minted.join("\n"));
    console.log("Saved mints to minted_capsules.txt");
  }
})();
