// Updated server.js
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { fetchGorexStats } from './gordata/fetch.mjs'; // Import dashboard fetch

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serve static files for main website
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files for gordata dashboard
app.use('/gordata', express.static(path.join(__dirname, 'gordata/public')));

// API endpoint for gordata stats
app.get('/gordata/api/stats', async (req, res) => {
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

// Route for gordata dashboard
app.get('/gorDATA', (req, res) => {
  res.sendFile(path.join(__dirname, 'gordata/public', 'gordata.html'));
});

// Existing routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Other existing routes...

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});