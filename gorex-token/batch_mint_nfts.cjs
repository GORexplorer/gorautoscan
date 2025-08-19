const fs = require("fs");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const { Metaplex, keypairIdentity } = require("@metaplex-foundation/js");

// ---- CLI args ----
function args() {
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
const argv = args();

// ---- Config ----
const RPC_URL = process.env.RPC_URL || "https://rpc.gorbagana.wtf/";
const secret = JSON.parse(fs.readFileSync("id.json", "utf8"));
const keypair = Keypair.fromSecretKey(Uint8Array.from(secret));
const connection = new Connection(RPC_URL, "finalized");
const mx = Metaplex.make(connection).use(keypairIdentity(keypair));

const COUNT = parseInt(argv.count || "999", 10);
const START = parseInt(argv.start || "1", 10);
const NAME_TEMPLATE = argv["nameTemplate"] || "Gorex Capsules #{{i}}";
const SYMBOL = argv.symbol || "GOREX";
const SINGLE_URI = argv.uri || null;            // same JSON for all
const BASE = argv.uriBase || null;              // e.g. https://gateway/ipfs/CID/
const MANIFEST = argv.manifest || null;         // items.json with [{name,symbol,uri}, ...]
const COLLECTION = argv.collection || null;     // optional: collection mint to verify into
const DELAY_MS = parseInt(argv.delay || "400", 10); // throttle to be kind to RPC

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Build mint list
function buildItems() {
  if (MANIFEST) {
    const arr = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    if (!Array.isArray(arr)) throw new Error("manifest must be an array of {name,symbol,uri}");
    return arr.map((x, i) => ({
      name: (x.name || NAME_TEMPLATE.replace("{{i}}", String(i + START))).slice(0, 32),
      symbol: (x.symbol || SYMBOL).slice(0, 10),
      uri: x.uri,
    }));
  }
  if (BASE) {
    const items = [];
    for (let i = 0; i < COUNT; i++) {
      const n = START + i;
      items.push({
        name: NAME_TEMPLATE.replace("{{i}}", String(n)).slice(0, 32),
        symbol: SYMBOL.slice(0, 10),
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
        name: NAME_TEMPLATE.replace("{{i}}", String(n)).slice(0, 32),
        symbol: SYMBOL.slice(0, 10),
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
  console.log(`Minting ${items.length} NFTs...`);

  const doVerify = !!COLLECTION;
  const collectionMint = doVerify ? new PublicKey(COLLECTION) : null;

  const minted = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    try {
      // Create NFT (decimals 0, 1 of 1) — minted to your wallet
      const res = await mx.nfts().create({
        uri: it.uri,
        name: it.name,
        symbol: it.symbol,
        sellerFeeBasisPoints: 0,
        // maxSupply: 0 ensures a Master Edition with no prints (1/1)
        maxSupply: 0,
        // tokenOwner defaults to identity (your wallet); set explicitly if you like:
        tokenOwner: keypair.publicKey,
      });

      const nft = res.nft; // minted NFT data
      console.log(`✅ ${i + 1}/${items.length} ${it.name} -> ${nft.mint.address.toBase58()} | tx: ${res.response.signature}`);
      minted.push(nft.mint.address.toBase58());

      // (Optional) Verify into collection
      if (doVerify) {
        try {
          await mx.nfts().verifyCollection({
            mintAddress: nft.mint.address,
            collectionMintAddress: collectionMint,
          });
          console.log(`   ↳ collection verified: ${COLLECTION}`);
        } catch (e) {
          console.warn("   ⚠ verifyCollection failed (continuing):", String(e));
        }
      }

      if (DELAY_MS) await sleep(DELAY_MS);
    } catch (e) {
      console.error(`❌ ${i + 1}/${items.length} ${it.name} failed:`, String(e));
      // small delay and continue
      if (DELAY_MS) await sleep(DELAY_MS);
    }
  }

  console.log("Done. Minted:", minted.length, "NFTs");
  if (minted.length) console.log("Example mint:", minted[0]);
})();
