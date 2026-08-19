const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Allowed origins: support multiple (local dev + production frontend)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/decks', require('./routes/decks'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/progress', require('./routes/progress'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const { setupDatabase } = require('./db/setup');

// Startup: init DB schema first, then listen
async function start() {
  try {
    await setupDatabase();
    if (process.env.VERCEL !== '1') {
      app.listen(PORT, () => {
        console.log(`🚀 Flashcard API running at http://localhost:${PORT}`);
      });
    }
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    if (process.env.VERCEL !== '1') process.exit(1);
  }
}

start();

// Export the Express API for Vercel
module.exports = app;

