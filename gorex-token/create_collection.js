import fs from "fs";
import {
  Connection, Keypair, PublicKey, Transaction, ComputeBudgetProgram
} from "@solana/web3.js";
import {
  createMint, getOrCreateAssociatedTokenAccount, mintTo
} from "@solana/spl-token";
import * as mpl from "@metaplex-foundation/mpl-token-metadata";

// USAGE:
// node create_collection.js "<NAME>" "<SYMBOL>" "<COLLECTION_JSON_URI>"

const [NAME, SYMBOL, URI] = process.argv.slice(2);
if (!NAME || !SYMBOL || !URI) {
  console.error('Usage: node create_collection.js "<NAME>" "<SYMBOL>" "<URI-to-collection.json>"');
  process.exit(1);
}

const RPC_URL = process.env.RPC_URL ?? "https://rpc.gorbagana.wtf/";
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync("id.json","utf8"))));
const connection = new Connection(RPC_URL, "finalized");

const DEFAULT_TM = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const TM_PROGRAM_ID = new PublicKey(process.env.METADATA_PROGRAM_ID ?? (mpl.PROGRAM_ID ? mpl.PROGRAM_ID.toBase58() : DEFAULT_TM));

const name = NAME.slice(0,32);
const symbol = SYMBOL.slice(0,10);

(async () => {
  // 1) Mint account (decimals=0)
  const mint = await createMint(connection, payer, payer.publicKey, payer.publicKey, 0);
  const ata = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  await mintTo(connection, payer, mint, ata.address, payer, 1n); // 1 of 1

  // 2) Metadata (collection NFT)
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TM_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    TM_PROGRAM_ID
  );

  const data = {
    name, symbol, uri: URI,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null
  };

  const createMetaIx = (typeof mpl.createCreateMetadataAccountV3Instruction === "function")
    ? mpl.createCreateMetadataAccountV3Instruction(
        { metadata: metadataPDA, mint, mintAuthority: payer.publicKey, payer: payer.publicKey, updateAuthority: payer.publicKey },
        { createMetadataAccountArgsV3: { data, isMutable: true, collectionDetails: null } }
      )
    : mpl.createCreateMetadataAccountV2Instruction(
        { metadata: metadataPDA, mint, mintAuthority: payer.publicKey, payer: payer.publicKey, updateAuthority: payer.publicKey },
        { createMetadataAccountArgsV2: { data, isMutable: true } }
      );

  // 3) Master Edition (marks it as an NFT)
  const [masterEditionPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), TM_PROGRAM_ID.toBuffer(), mint.toBuffer(), Buffer.from("edition")],
    TM_PROGRAM_ID
  );

  const createMEIx = mpl.createCreateMasterEditionV3Instruction(
    {
      edition: masterEditionPDA,
      mint,
      updateAuthority: payer.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      metadata: metadataPDA
    },
    { createMasterEditionArgs: { maxSupply: 0 } } // 1/1, no prints
  );

  // (Optional) Mark as a *sized* collection so items can be verified into it.
  // Not all versions export this; try if available.
  let sizeIx = null;
  if (typeof mpl.createSetCollectionSizeInstruction === "function") {
    sizeIx = mpl.createSetCollectionSizeInstruction(
      {
        collectionMetadata: metadataPDA,
        collectionAuthority: payer.publicKey,
        collectionMint: mint,
      },
      { setCollectionSizeArgs: { size: 0 } } // can grow as items are verified
    );
  }

  const tx = new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 800_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }),
    createMetaIx,
    createMEIx,
    ...(sizeIx ? [sizeIx] : [])
  );

  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  const sig = await connection.sendTransaction(tx, [payer], { skipPreflight: false });
  await connection.confirmTransaction(sig, "finalized");

  console.log("✅ Collection NFT created");
  console.log("Mint:", mint.toBase58());
  console.log("Metadata PDA:", metadataPDA.toBase58());
  console.log("Master Edition PDA:", masterEditionPDA.toBase58());
  console.log("Tx:", sig);
})();
