const express = require('express');
const db      = require('../database/db');
const router  = express.Router();

// GET standings for a tournament
router.get('/', async (req, res) => {
  const { tournament_id } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  try {
    const [rows] = await db.execute(
      `SELECT s.*, t.name AS team_name, t.short_name
       FROM standings s
       JOIN teams t ON s.team_id = t.team_id
       WHERE s.tournament_id = ?
       ORDER BY s.points DESC, s.wins DESC, s.net_run_rate DESC`, [tournament_id]
    );
    // Assign rank
    rows.forEach((r, i) => r.rank = i + 1);

    // Calculate win percentage for each team
    rows.forEach(r => {
      r.win_percentage = r.matches_played > 0
        ? ((r.wins / r.matches_played) * 100).toFixed(1)
        : '0.0';
    });

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET summary stats for a tournament (total matches, completed, etc.)
router.get('/summary', async (req, res) => {
  const { tournament_id } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  try {
    const [matchStats] = await db.execute(
      `SELECT 
         COUNT(*) AS total_matches,
         SUM(status = 'completed') AS completed_matches,
         SUM(status = 'scheduled') AS scheduled_matches
       FROM matches WHERE tournament_id = ?`, [tournament_id]
    );
    const [teamCount] = await db.execute(
      'SELECT COUNT(*) AS count FROM teams WHERE tournament_id = ?', [tournament_id]
    );
    res.json({
      ...matchStats[0],
      team_count: teamCount[0].count,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
