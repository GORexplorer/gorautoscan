import { Keypair } from '@solana/web3.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Desktop path for Windows
const desktopPath = join(homedir(), 'Desktop');
const outputFile = join(desktopPath, 'solana-keypair.json');

// Generate a new keypair
const keypair = Keypair.generate();
const publicKey = keypair.publicKey.toString();

console.log(`Generated Solana wallet`);
console.log(`Public Key: ${publicKey}`);

// Save the keypair to the desktop
writeFileSync(outputFile, JSON.stringify(Array.from(keypair.secretKey)));
console.log(`Keypair saved to ${outputFile}`);