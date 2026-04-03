require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const connectDB = require('./config/db');

const Game = require('./models/Game');
const { fetchAllRatedGames, fetchNewReleases } = require('./services/igdb');

// Connect to MongoDB and auto-seed if empty
(async () => {
  await connectDB();
  try {
    const count = await Game.countDocuments();
    if (count === 0) {
      console.log('No games found in database. Auto-seeding all IGDB games (this may take a few minutes)...');
      const ratedGames = await fetchAllRatedGames(1);
      console.log(`  Fetched ${ratedGames.length} rated games`);
      const newRels = await fetchNewReleases(500);
      console.log(`  Fetched ${newRels.length} new releases`);
      const seen = new Set();
      const unique = [...ratedGames, ...newRels].filter(g => {
        if (seen.has(g.igdbId)) return false;
        seen.add(g.igdbId);
        return true;
      });
      let upserted = 0;
      for (const game of unique) {
        await Game.findOneAndUpdate({ igdbId: game.igdbId }, game, { upsert: true, new: true });
        upserted++;
        if (upserted % 100 === 0) console.log(`  Upserted ${upserted}/${unique.length}...`);
      }
      console.log(`Auto-seeded ${upserted} games successfully.`);
    }
  } catch (err) {
    console.error('Auto-seed failed (non-fatal):', err.message);
  }
})();

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Compress responses
app.use(compression());

// HTTP request logging
app.use(morgan('dev'));

// CORS — allow requests from the React frontend
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173', 'https://pixelcritic-gamma.vercel.app', 'https://pixelcritic.net', 'https://www.pixelcritic.net'].filter(Boolean),
  credentials: true,
}));

// Global rate limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Auth route limiter: 100 attempts per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' },
});

app.use('/api', globalLimiter);

// Parse JSON request bodies (10mb limit for base64 avatar images)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (avatars etc.)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health-check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const userRoutes = require('./routes/userRoutes');
const followRoutes = require('./routes/followRoutes');
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler for unknown API routes
app.use('/api/*splat', (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handler (must be last middleware)
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
