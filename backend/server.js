const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');

dotenv.config();

// Tournament Management System Backend

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Database connection (initialise pool) ──────────────────
require('./database/db');

// ── Route imports ──────────────────────────────────────────
const authRoutes        = require('./routes/auth.routes');
const tournamentRoutes  = require('./routes/tournament.routes');
const teamRoutes        = require('./routes/team.routes');
const playerRoutes      = require('./routes/player.routes');
const venueRoutes       = require('./routes/venue.routes');
const umpireRoutes      = require('./routes/umpire.routes');
const matchRoutes       = require('./routes/match.routes');
const resultRoutes      = require('./routes/result.routes');
const standingRoutes    = require('./routes/standing.routes');
const statsRoutes       = require('./routes/stats.routes');
const knockoutRoutes    = require('./routes/knockout.routes');

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams',       teamRoutes);
app.use('/api/players',     playerRoutes);
app.use('/api/venues',      venueRoutes);
app.use('/api/umpires',     umpireRoutes);
app.use('/api/matches',     matchRoutes);
app.use('/api/results',     resultRoutes);
app.use('/api/standings',   standingRoutes);
app.use('/api/stats',       statsRoutes);
app.use('/api/knockout',    knockoutRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:  'OK',
    server:  'Tournament Management API',
    version: '1.0.0',
    time:    new Date().toISOString(),
  });
});

// ── 404 handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Tournament API running on http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
