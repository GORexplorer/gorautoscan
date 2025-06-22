// gorex-fetch.mjs
import fetch from 'node-fetch';
import { Connection } from '@solana/web3.js';

const RPC = 'https://gorchain.wstf.io';
const connection = new Connection(RPC, 'confirmed');

// Helper to send raw JSON-RPC requests with retries
async function sendRpc(method, params = [], retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });
      const json = await res.json();
      if (json.error) throw new Error(`${method}: ${json.error.message}`);
      return json.result;
    } catch (err) {
      if (i === retries - 1) throw new Error(`RPC ${method}: ${err.message}`);
      console.warn(`Retrying ${method} (${i + 1}/${retries}): ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// Fetch all possible network stats
async function fetchGorexStats() {
  try {
    const currentSlot = await sendRpc('getSlot');
    const [
      health,
      slot,
      blockHeight,
      epochInfo,
      version,
      txCount,
      blockhash,
      genesisHash,
      identity,
      supply,
      inflationRate,
      leaderSchedule,
      performance,
      voteAccounts,
      blockTime,
      blockProduction,
      clusterNodes,
      minRentExemption,
      programAccounts,
      feeForMessage,
      recentPrioritizationFees,
      highestSnapshotSlot,
      slotLeader,
      recentBlock,
    ] = await Promise.all([
      sendRpc('getHealth').catch(err => { console.warn(err.message); return 'N/A'; }),
      sendRpc('getSlot').catch(err => { console.warn(err.message); return 0; }),
      sendRpc('getBlockHeight').catch(err => { console.warn(err.message); return 0; }),
      sendRpc('getEpochInfo').catch(err => { console.warn(err.message); return {}; }),
      sendRpc('getVersion').catch(err => { console.warn(err.message); return {}; }),
      sendRpc('getTransactionCount').catch(err => { console.warn(err.message); return 0; }),
      sendRpc('getLatestBlockhash').catch(err => { console.warn(err.message); return {}; }),
      sendRpc('getGenesisHash').catch(err => { console.warn(err.message); return 'N/A'; }),
      sendRpc('getIdentity').catch(err => { console.warn(err.message); return {}; }),
      sendRpc('getSupply').catch(err => { console.warn(err.message); return { value: { total: 0, circulating: 0 } }; }),
      sendRpc('getInflationRate').catch(err => { console.warn(err.message); return { total: 0 }; }),
      sendRpc('getLeaderSchedule').catch(err => { console.warn(err.message); return {}; }),
      sendRpc('getRecentPerformanceSamples', [1]).catch(err => { console.warn(err.message); return [{}]; }),
      sendRpc('getVoteAccounts').catch(err => { console.warn(err.message); return { current: [], delinquent: [] }; }),
      sendRpc('getBlockTime', [currentSlot - 100]).catch(err => { console.warn(err.message); return null; }),
      sendRpc('getBlockProduction').catch(err => { console.warn(err.message); return { value: {} }; }),
      sendRpc('getClusterNodes').catch(err => { console.warn(err.message); return []; }),
      sendRpc('getMinimumBalanceForRentExemption', [128]).catch(err => { console.warn(err.message); return 0; }),
      sendRpc('getProgramAccounts', ['Vote111111111111111111111111111111111111111']).catch(err => { console.warn(err.message); return []; }),
      sendRpc('getFeeForMessage', ['AQAB']).catch(err => { console.warn(err.message); return null; }),
      sendRpc('getRecentPrioritizationFees').catch(err => { console.warn(err.message); return []; }),
      sendRpc('getHighestSnapshotSlot').catch(err => { console.warn(err.message); return {}; }),
      sendRpc('getSlotLeader').catch(err => { console.warn(err.message); return 'N/A'; }),
      sendRpc('getBlock', [currentSlot - 100, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]).catch(err => { console.warn(err.message); return {}; }),
    ]);

    return {
      lastUpdated: new Date().toISOString(),
      network: {
        health: health || 'N/A',
        slot: slot || 0,
        blockHeight: blockHeight || 0,
        epoch: epochInfo.epoch || 0,
        epochProgress: epochInfo.slotsInEpoch ? `${((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(2)}%` : 'N/A',
        epochSlotIndex: epochInfo.slotIndex || 0,
        slotsInEpoch: epochInfo.slotsInEpoch || 0,
        version: version['solana-core'] || 'N/A',
        genesisHash: genesisHash || 'N/A',
        nodeIdentity: identity.identity || 'N/A',
        blockTime: blockTime ? new Date(blockTime * 1000).toISOString() : 'N/A',
        transactionsPerSecond: performance[0]?.numTransactions / performance[0]?.samplePeriodSecs || 0,
        slotLeader: slotLeader || 'N/A',
      },
      economics: {
        totalSupply: (supply.value.total / 1e9).toFixed(2) + ' GOR',
        circulatingSupply: (supply.value.circulating / 1e9).toFixed(2) + ' GOR',
        inflationRate: (inflationRate.total * 100).toFixed(2) + '%',
        minRentExemption: (minRentExemption / 1e9).toFixed(6) + ' GOR',
      },
      validators: {
        currentValidators: voteAccounts.current.length || 0,
        delinquentValidators: voteAccounts.delinquent.length || 0,
        leaderSchedule: Object.keys(leaderSchedule).slice(0, 5) || [],
        activeNodes: clusterNodes.length || 0,
        blockProduction: blockProduction.value?.byIdentity || {},
        voteProgramAccounts: programAccounts.length || 0,
      },
      transactions: {
        transactionCount: txCount || 0,
        latestBlockhash: blockhash.blockhash || 'N/A',
        baseFee: feeForMessage ? (feeForMessage.value / 1e9).toFixed(6) + ' GOR' : 'N/A',
        prioritizationFees: recentPrioritizationFees[0]?.prioritizationFee / 1e6 || 0,
      },
      snapshots: {
        highestSnapshotSlot: highestSnapshotSlot.full || 0,
      },
      blocks: {
        recentBlockSlot: recentBlock.slot || 'N/A',
        blockTransactions: recentBlock.transactions?.length || 0,
        blockRewards: recentBlock.rewards?.length || 0,
      },
    };
  } catch (err) {
    console.error('❌ Stats Error:', err.message);
    return null;
  }
}

// Export for use in web server
export { fetchGorexStats };

// Run standalone for testing
if (import.meta.url === new URL(import.meta.url).href) {
  fetchGorexStats().then(data => console.log('Stats:', JSON.stringify(data, null, 2)));
}