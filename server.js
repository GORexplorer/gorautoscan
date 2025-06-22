// server.js
import express from 'express';
import { fetchGorexStats } from './gorex-fetch.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to fetch stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await fetchGorexStats();
    if (!stats) {
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});