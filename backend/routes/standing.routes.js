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
       ORDER BY s.points DESC, s.net_run_rate DESC`, [tournament_id]
    );
    // Assign rank
    rows.forEach((r, i) => r.rank = i + 1);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
