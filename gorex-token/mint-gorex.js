const fs = require("fs");
const bs58 = require("bs58");
const {
  Connection,
  Keypair,
  clusterApiUrl,
  PublicKey,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");

const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} = require("@solana/spl-token");

const {
  DataV2,
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID: TOKEN_METADATA_PROGRAM_ID,
} = require("@metaplex-foundation/mpl-token-metadata");

(async () => {
  // 1. Load wallet
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync("id.json")));
  const payer = Keypair.fromSecretKey(secretKey);

  // 2. Connect to Gorbagana RPC
  const connection = new Connection("https://rpc.gorbagana.wtf/", "confirmed");

  // 3. Create Mint (decimals = 6 like RADBRO, or set 9 if you prefer)
  const decimals = 6;
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    payer.publicKey,
    decimals
  );

  console.log("✅ Mint created:", mint.toBase58());

  // 4. Create ATA for our wallet
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );

  // 5. Mint 1B tokens
  const totalSupply = 1_000_000_000 * 10 ** decimals;
  await mintTo(connection, payer, mint, ata.address, payer, totalSupply);
  console.log("✅ Minted 1B tokens to ATA:", ata.address.toBase58());

  // 6. Add Metadata (Metaplex)
  const metadataSeeds = [
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    mint.toBuffer(),
  ];
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    metadataSeeds,
    TOKEN_METADATA_PROGRAM_ID
  );

  const tokenMetadata = {
    name: "GOR Explorer",
    symbol: "GOREX",
    uri: "https://sapphire-working-koi-276.mypinata.cloud/ipfs/bafybeic2gjuh5aias7hiduqngldbfdicuw3yafaiktawnsnt6d42guubhq",
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const ix = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint: mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: tokenMetadata,
        isMutable: true,
        collectionDetails: null,
      },
    }
  );

  const tx = await sendAndConfirmTransaction(connection, {
    feePayer: payer.publicKey,
    instructions: [ix],
  }, [payer]);

  console.log("✅ Metadata added tx:", tx);
  console.log("🌐 Token Mint Address:", mint.toBase58());
})();
