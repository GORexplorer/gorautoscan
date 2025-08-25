const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Target prefix for the public key
const prefix = 'bag';

// Desktop path (works for macOS, Windows, Linux)
const desktopPath = path.join(os.homedir(), 'Desktop');
const outputFile = path.join(desktopPath, 'solana-keypair-bag.json');

// Generate keypairs until one matches the prefix
let attempts = 0;
let keypair;

console.log(`Generating Solana wallet with public key starting with "${prefix}"...`);

while (true) {
    keypair = Keypair.generate();
    attempts++;
    const publicKey = keypair.publicKey.toString();

    if (publicKey.startsWith(prefix)) {
        console.log(`Found matching wallet after ${attempts} attempts!`);
        console.log(`Public Key: ${publicKey}`);

        // Save the keypair to the desktop
        fs.writeFileSync(outputFile, JSON.stringify(Array.from(keypair.secretKey)));
        console.log(`Keypair saved to ${outputFile}`);
        break;
    }

    if (attempts % 1000 === 0) {
        console.log(`Attempt ${attempts}: Still searching...`);
    }
}