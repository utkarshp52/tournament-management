const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const path       = require('path');
const fs         = require('fs');

dotenv.config();

// Tournament Management System Backend

const app  = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      process.env.FRONTEND_URL === '*' ||
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes(origin.replace(/\/$/, '')) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.railway.app')
    ) {
      callback(null, true);
    } else {
      callback(new Error(`Blocked by CORS: ${origin}`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Database connection (initialise pool & auto migrations) ──
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
const reportRoutes      = require('./routes/report.routes');

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
app.use('/api/reports',     reportRoutes);

// ── Root & Health check ────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    message: '🏆 Tournament Management API is online!',
    health:  '/api/health',
    status:  'OK',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status:  'OK',
    server:  'Tournament Management API',
    version: '1.0.0',
    time:    new Date().toISOString(),
  });
});

// ── One-click Database Setup endpoint ──────────────────────
app.get('/api/setup-db', async (_req, res) => {
  try {
    const applySchema = require('./run-schema');
    const seedAdmin = require('./seed-admin');
    await applySchema();
    await seedAdmin();
    res.json({
      success: true,
      message: '✅ Database tables created and Admin user (admin@tournament.com / Admin@123) is ready!',
    });
  } catch (err) {
    console.error('Setup DB error:', err);
    res.status(500).json({ error: 'Setup failed', message: err.message });
  }
});

// ── Optional Static Frontend (if backend serves built frontend) ──
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── 404 handler for API routes ─────────────────────────────
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
  console.log(`🚀 Tournament API running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
