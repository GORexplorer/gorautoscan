// gorex_automintr.js (ESM)
// One-stop script to:
//  - create a Collection NFT (1/1)
//  - mint a batch of 1/1 NFTs and (try to) verify them into the collection
//
// Usage examples (PowerShell one line):
//  Create collection:
//    node gorex_automintr.js create-collection "GOR Explorer · GOREX Collection" "GOREX" https://<gateway>/ipfs/<collection.json>
//
//  Mint from manifest file (array of {name,symbol,uri}):
//    node gorex_automintr.js mint-batch <COLLECTION_MINT> --manifest .\items.json
//
//  Mint from base URI + count (auto names):
//    node gorex_automintr.js mint-batch <COLLECTION_MINT> --ipfs-base https://<gateway>/ipfs/<CID>/ --count 10 --start 1 --name-template "GOR Explorer #{{i}}" --symbol GOREX
//
// Optional (if Gorbagana uses a custom Token Metadata program id):
//   $env:METADATA_PROGRAM_ID="PUT_PROGRAM_ID_HERE"
//
// Requirements:
//  - package.json has "type": "module"
//  - id.json = your funded keypair (mint + update authority)
//  - @solana/web3.js, @solana/spl-token, @metaplex-foundation/mpl-token-metadata installed

import fs from "fs";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import * as mpl from "@metaplex-foundation/mpl-token-metadata";

// ---------- config ----------
const RPC_URL = process.env.RPC_URL ?? "https://rpc.gorbagana.wtf/";
const payer = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("id.json", "utf8")))
);
const connection = new Connection(RPC_URL, "finalized");

const DEFAULT_TM = new PublicKey(
  // Standard Metaplex Token Metadata program id (many forks keep this)
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
const TM_PROGRAM_ID = new PublicKey(
  process.env.METADATA_PROGRAM_ID ??
    (mpl.PROGRAM_ID ? mpl.PROGRAM_ID.toBase58() : DEFAULT_TM.toBase58())
);

// ---------- helpers ----------
function pdaMetadata(mint) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TM_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TM_PROGRAM_ID
  )[0];
}

function pdaMasterEdition(mint) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TM_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
      Buffer.from("edition"),
    ],
    TM_PROGRAM_ID
  )[0];
}

function createMetadataIx({ mint, data, updateAuthority, payerPubkey }) {
  if (typeof mpl.createCreateMetadataAccountV3Instruction === "function") {
    return mpl.createCreateMetadataAccountV3Instruction(
      {
        metadata: pdaMetadata(mint),
        mint,
        mintAuthority: payerPubkey,
        payer: payerPubkey,
        updateAuthority,
      },
      {
        createMetadataAccountArgsV3: {
          data,
          isMutable: true,
          collectionDetails: null,
        },
      }
    );
  }
  if (typeof mpl.createCreateMetadataAccountV2Instruction === "function") {
    return mpl.createCreateMetadataAccountV2Instruction(
      {
        metadata: pdaMetadata(mint),
        mint,
        mintAuthority: payerPubkey,
        payer: payerPubkey,
        updateAuthority,
      },
      {
        createMetadataAccountArgsV2: {
          data,
          isMutable: true,
        },
      }
    );
  }
  throw new Error(
    "mpl-token-metadata package does not export V3 or V2 create metadata instruction"
  );
}

function createMasterEditionIx({ mint, updateAuthority, payerPubkey }) {
  return mpl.createCreateMasterEditionV3Instruction(
    {
      edition: pdaMasterEdition(mint),
      mint,
      updateAuthority,
      mintAuthority: payerPubkey,
      payer: payerPubkey,
      metadata: pdaMetadata(mint),
    },
    { createMasterEditionArgs: { maxSupply: 0 } }
  );
}

function setOrVerifyCollectionIx({ childMint, collectionMint, payerPubkey }) {
  const childMd = pdaMetadata(childMint);
  const collMd = pdaMetadata(collectionMint);
  const collMe = pdaMasterEdition(collectionMint);

  if (typeof mpl.createSetAndVerifyCollectionInstruction === "function") {
    return mpl.createSetAndVerifyCollectionInstruction({
      metadata: childMd,
      collectionAuthority: payerPubkey,
      payer: payerPubkey,
      updateAuthority: payerPubkey,
      collectionMint,
      collection: collMd,
      collectionMasterEdition: collMe,
    });
  }
  if (typeof mpl.createVerifyCollectionInstruction === "function") {
    return mpl.createVerifyCollectionInstruction({
      metadata: childMd,
      collectionAuthority: payerPubkey,
      payer: payerPubkey,
      collectionMint,
      collection: collMd,
      collectionMasterEdition: collMe,
    });
  }
  return null; // older package: skip verify; NFTs still minted
}

async function sendTx(ixs) {
  const tx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 800_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }),
    ...ixs
  );
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  const sig = await connection.sendTransaction(tx, [payer], { skipPreflight: false });
  await connection.confirmTransaction(sig, "finalized");
  return sig;
}

// ---------- core ops ----------
async function createCollection(name, symbol, uri) {
  const nm = name.slice(0, 32);
  const sy = symbol.slice(0, 10);

  // 1) Mint account (decimals=0) and mint 1 token to our ATA
  const mint = await createMint(connection, payer, payer.publicKey, payer.publicKey, 0);
  const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  await mintTo(connection, payer, mint, ata.address, payer, 1n);

  // 2) Metadata
  const data = {
    name: nm,
    symbol: sy,
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };
  const mdIx = createMetadataIx({ mint, data, updateAuthority: payer.publicKey, payerPubkey: payer.publicKey });

  // 3) Master Edition (marks as NFT)
  const meIx = createMasterEditionIx({ mint, updateAuthority: payer.publicKey, payerPubkey: payer.publicKey });

  const sig = await sendTx([mdIx, meIx]);
  return { mint, sig, metadataPDA: pdaMetadata(mint), masterEditionPDA: pdaMasterEdition(mint) };
}

async function mintOneNFT({ name, symbol, uri }, collectionMint) {
  const nm = (name ?? "NFT").slice(0, 32);
  const sy = (symbol ?? "").slice(0, 10);

  // 1) Create mint, ATA, and mint 1
  const mint = await createMint(connection, payer, payer.publicKey, payer.publicKey, 0);
  const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  await mintTo(connection, payer, mint, ata.address, payer, 1n);

  // 2) Metadata with unverified collection reference
  const data = {
    name: nm,
    symbol: sy,
    uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: { verified: false, key: collectionMint },
    uses: null,
  };
  const mdIx = createMetadataIx({ mint, data, updateAuthority: payer.publicKey, payerPubkey: payer.publicKey });

  // 3) Master Edition
  const meIx = createMasterEditionIx({ mint, updateAuthority: payer.publicKey, payerPubkey: payer.publicKey });

  // 4) Try to set+verify (best effort)
  const verifyIx = setOrVerifyCollectionIx({ childMint: mint, collectionMint, payerPubkey: payer.publicKey });
  const ixs = verifyIx ? [mdIx, meIx, verifyIx] : [mdIx, meIx];

  const sig = await sendTx(ixs);
  return { mint, sig };
}

// ---------- CLI ----------
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      out[key] = val;
    } else {
      out._.push(a);
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];

(async () => {
  try {
    if (cmd === "create-collection") {
      const name = args._[1];
      const symbol = args._[2];
      const uri = args._[3];
      if (!name || !symbol || !uri) throw new Error('Usage: create-collection "<NAME>" "<SYMBOL>" <URI>');
      console.log("Creating collection…");
      const { mint, sig, metadataPDA, masterEditionPDA } = await createCollection(name, symbol, uri);
      console.log("✅ Collection created");
      console.log("Mint:", mint.toBase58());
      console.log("Metadata PDA:", metadataPDA.toBase58());
      console.log("Master Edition PDA:", masterEditionPDA.toBase58());
      console.log("Tx:", sig);
      return;
    }

    if (cmd === "mint-batch") {
      const collectionMintStr = args._[1];
      if (!collectionMintStr) throw new Error("Usage: mint-batch <COLLECTION_MINT> [--manifest items.json | --ipfs-base <url> --count N --start 1 --name-template 'NAME #{{i}}' --symbol GOREX]");
      const collectionMint = new PublicKey(collectionMintStr);

      let items = [];
      if (args.manifest) {
        const raw = JSON.parse(fs.readFileSync(String(args.manifest), "utf8"));
        if (Array.isArray(raw)) {
          items = raw;
        } else if (raw && typeof raw === "object") {
          // If a single object is provided:
          // - If it already has a `uri`, treat it as a single manifest item.
          // - If it looks like a full NFT metadata JSON (has `image` but no `uri`),
          //   require the caller to pass --manifest-uri <URL to this JSON on IPFS>.
          if (raw.uri) {
            items = [raw];
          } else if (raw.image && args["manifest-uri"]) {
            items = [{ name: raw.name || "NFT", symbol: raw.symbol || "", uri: String(args["manifest-uri"]) }];
          } else {
            throw new Error("Manifest object must include `uri`, or pass --manifest-uri <URL to the metadata JSON on IPFS> when providing a local NFT JSON file.");
          }
        } else {
          throw new Error("Manifest must be an array of items or a single object.");
        }
      } else if (args["ipfs-base"] && args.count) {
        const base = String(args["ipfs-base"]);
        const count = parseInt(String(args.count), 10);
        const start = args.start ? parseInt(String(args.start), 10) : 1;
        const nameTpl = String(args["name-template"] || "NFT #{{i}}");
        const symbol = String(args.symbol || "");
        for (let i = 0; i < count; i++) {
          const n = start + i;
          items.push({
            name: nameTpl.replace("{{i}}", String(n)),
            symbol,
            uri: base + n + ".json",
          });
        }
      } else {
        throw new Error("Provide either --manifest (array or single) or --ipfs-base with --count");
      }

      console.log(`Minting ${Array.isArray(items) ? items.length : 0} NFTs into collection ${collectionMint.toBase58()} …`);
      const minted = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        try {
          const { mint, sig } = await mintOneNFT(it, collectionMint);
          minted.push(mint.toBase58());
          console.log(`✅ ${i + 1}/${items.length} ${it.name} -> ${mint.toBase58()} (tx ${sig})`);
        } catch (e) {
          console.error(`❌ ${i + 1}/${items.length} ${it.name} failed:`, String(e));
        }
      }
      console.log("Done. Minted:", minted.length, "mints:", minted);
      return;
    }

    console.log(`Unknown command: ${cmd}");
    console.log("Commands:\n  create-collection \"<NAME>\" \"<SYMBOL>\" <URI>\n  mint-batch <COLLECTION_MINT> --manifest items.json\n  mint-batch <COLLECTION_MINT> --ipfs-base <url> --count N [--start 1] [--name-template \"NAME #{{i}}\"] [--symbol GOREX]`);
  } catch (e) {
    console.error("Error:", e.message || String(e));
    process.exit(1);
  }
})();
