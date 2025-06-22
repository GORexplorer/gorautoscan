// app.js
const charts = {
  tps: null,
  slot: null,
  blockHeight: null,
};
const dataPoints = {
  tps: [],
  slot: [],
  blockHeight: [],
  timestamps: [],
};

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // Update Header
    document.getElementById('lastUpdated').textContent = new Date(data.lastUpdated).toLocaleString();

    // Update Network
    document.getElementById('health').textContent = data.network.health;
    document.getElementById('slot').textContent = data.network.slot;
    document.getElementById('blockHeight').textContent = data.network.blockHeight;
    document.getElementById('tps').textContent = data.network.transactionsPerSecond.toFixed(2);
    document.getElementById('epoch').textContent = `${data.network.epoch} (${data.network.epochProgress})`;
    document.getElementById('slotLeader').textContent = data.network.slotLeader;
    document.getElementById('version').textContent = data.network.version;
    document.getElementById('epochProgressBar').style.width = data.network.epochProgress;

    // Update Economics
    document.getElementById('totalSupply').textContent = data.economics.totalSupply;
    document.getElementById('circulatingSupply').textContent = data.economics.circulatingSupply;
    document.getElementById('inflationRate').textContent = data.economics.inflationRate;
    document.getElementById('minRentExemption').textContent = data.economics.minRentExemption;

    // Update Validators
    document.getElementById('currentValidators').textContent = data.validators.currentValidators;
    document.getElementById('delinquentValidators').textContent = data.validators.delinquentValidators;
    document.getElementById('activeNodes').textContent = data.validators.activeNodes;
    document.getElementById('voteProgramAccounts').textContent = data.validators.voteProgramAccounts;
    document.getElementById('leaderSchedule').textContent = data.validators.leaderSchedule.join(', ') || 'N/A';

    // Update Transactions
    document.getElementById('transactionCount').textContent = data.transactions.transactionCount;
    document.getElementById('baseFee').textContent = data.transactions.baseFee;
    document.getElementById('prioritizationFees').textContent = data.transactions.prioritizationFees.toFixed(6);

    // Update Snapshots & Blocks
    document.getElementById('highestSnapshotSlot').textContent = data.snapshots.highestSnapshotSlot;
    document.getElementById('recentBlockSlot').textContent = data.blocks.recentBlockSlot;
    document.getElementById('blockTransactions').textContent = data.blocks.blockTransactions;
    document.getElementById('blockRewards').textContent = data.blocks.blockRewards;

    // Update Charts
    const now = new Date().toLocaleTimeString();
    dataPoints.tps.push(data.network.transactionsPerSecond);
    dataPoints.slot.push(data.network.slot);
    dataPoints.blockHeight.push(data.network.blockHeight);
    dataPoints.timestamps.push(now);

    // Keep last 30 data points (60 seconds)
    if (dataPoints.tps.length > 30) {
      dataPoints.tps.shift();
      dataPoints.slot.shift();
      dataPoints.blockHeight.shift();
      dataPoints.timestamps.shift();
    }

    // TPS Chart
    if (!charts.tps) {
      charts.tps = new Chart(document.getElementById('tpsChart').getContext('2d'), {
        type: 'line',
        data: {
          labels: dataPoints.timestamps,
          datasets: [{
            label: 'TPS',
            data: dataPoints.tps,
            borderColor: '#4a90e2',
            backgroundColor: 'rgba(74, 144, 226, 0.2)',
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: false, title: { display: true, text: 'TPS', color: '#ffffff' }, ticks: { color: '#b0b0b0' } },
            x: { title: { display: true, text: 'Time', color: '#ffffff' }, ticks: { color: '#b0b0b0' } },
          },
          plugins: {
            legend: { labels: { color: '#ffffff' } },
            tooltip: { backgroundColor: '#2a3439', titleColor: '#ffffff', bodyColor: '#ffffff' },
          },
          elements: { line: { borderWidth: 2 } },
        },
      });
    } else {
      charts.tps.data.labels = dataPoints.timestamps;
      charts.tps.data.datasets[0].data = dataPoints.tps;
      charts.tps.update();
    }

    // Slot Chart
    if (!charts.slot) {
      charts.slot = new Chart(document.getElementById('slotChart').getContext('2d'), {
        type: 'line',
        data: {
          labels: dataPoints.timestamps,
          datasets: [{
            label: 'Slot',
            data: dataPoints.slot,
            borderColor: '#4a90e2',
            backgroundColor: 'rgba(74, 144, 226, 0.2)',
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: false, title: { display: true, text: 'Slot', color: '#ffffff' }, ticks: { color: '#b0b0b0' } },
            x: { title: { display: true, text: 'Time', color: '#ffffff' }, ticks: { color: '#b0b0b0' } },
          },
          plugins: {
            legend: { labels: { color: '#ffffff' } },
            tooltip: { backgroundColor: '#2a3439', titleColor: '#ffffff', bodyColor: '#ffffff' },
          },
          elements: { line: { borderWidth: 2 } },
        },
      });
    } else {
      charts.slot.data.labels = dataPoints.timestamps;
      charts.slot.data.datasets[0].data = dataPoints.slot;
      charts.slot.update();
    }

    // Block Height Chart
    if (!charts.blockHeight) {
      charts.blockHeight = new Chart(document.getElementById('blockHeightChart').getContext('2d'), {
        type: 'line',
        data: {
          labels: dataPoints.timestamps,
          datasets: [{
            label: 'Block Height',
            data: dataPoints.blockHeight,
            borderColor: '#4a90e2',
            backgroundColor: 'rgba(74, 144, 226, 0.2)',
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: false, title: { display: true, text: 'Block Height', color: '#ffffff' }, ticks: { color: '#b0b0b0' } },
            x: { title: { display: true, text: 'Time', color: '#ffffff' }, ticks: { color: '#b0b0b0' } },
          },
          plugins: {
            legend: { labels: { color: '#ffffff' } },
            tooltip: { backgroundColor: '#2a3439', titleColor: '#ffffff', bodyColor: '#ffffff' },
          },
          elements: { line: { borderWidth: 2 } },
        },
      });
    } else {
      charts.blockHeight.data.labels = dataPoints.timestamps;
      charts.blockHeight.data.datasets[0].data = dataPoints.blockHeight;
      charts.blockHeight.update();
    }
  } catch (err) {
    console.error('Error fetching stats:', err.message);
  }
}

// Fetch data every 2 seconds
fetchStats();
setInterval(fetchStats, 2000);