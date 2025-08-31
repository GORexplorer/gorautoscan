import { Keypair } from '@solana/web3.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Desktop path for Windows/Mac/Linux
const desktopPath = join(homedir(), 'Desktop');
const outputFile = join(desktopPath, 'solana-keypair.json');

// Function to generate a keypair with a public key starting with the specified prefix
function generateVanityAddress(prefix) {
  let attempts = 0;
  while (true) {
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    attempts++;
    if (publicKey.toLowerCase().startsWith(prefix.toLowerCase())) {
      console.log(`Generated Solana wallet after ${attempts} attempts`);
      console.log(`Public Key: ${publicKey}`);
      return keypair;
    }
    if (attempts % 1000 === 0) {
      console.log(`Attempt ${attempts}: Still searching for address starting with '${prefix}'...`);
    }
  }
}

// Generate a keypair with public key starting with "dao"
const keypair = generateVanityAddress('dao');

// Save the keypair to the desktop
writeFileSync(outputFile, JSON.stringify({
  publicKey: keypair.publicKey.toString(),
  secretKey: Array.from(keypair.secretKey)
}));
console.log(`Keypair saved to ${outputFile}`);