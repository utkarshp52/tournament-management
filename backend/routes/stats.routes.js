const express = require('express');
const db      = require('../database/db');
const router  = express.Router();

// GET player stats for a tournament
router.get('/players', async (req, res) => {
  const { tournament_id } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  try {
    const [rows] = await db.execute(
      `SELECT ps.*, p.full_name, t.name AS team_name
       FROM player_statistics ps
       JOIN players p ON ps.player_id = p.player_id
       JOIN teams   t ON p.team_id    = t.team_id
       WHERE ps.tournament_id = ?
       ORDER BY ps.runs_scored DESC`, [tournament_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET team stats
router.get('/teams', async (req, res) => {
  const { tournament_id } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  try {
    const [rows] = await db.execute(
      `SELECT s.*, t.name AS team_name FROM standings s
       JOIN teams t ON s.team_id = t.team_id
       WHERE s.tournament_id = ?
       ORDER BY s.wins DESC`, [tournament_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
