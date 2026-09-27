const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

// POST /api/results — record or update a match result
router.post('/', authMiddleware, async (req, res) => {
  const { match_id, winner_team_id, home_score, away_score, margin, is_draw, man_of_match_id, result_notes } = req.body;
  if (!match_id) return res.status(400).json({ error: 'match_id is required' });
  try {
    await db.execute(
      `INSERT INTO match_results (match_id, winner_team_id, home_score, away_score, margin, is_draw, man_of_match_id, result_notes)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         winner_team_id=VALUES(winner_team_id), home_score=VALUES(home_score),
         away_score=VALUES(away_score), margin=VALUES(margin), is_draw=VALUES(is_draw),
         man_of_match_id=VALUES(man_of_match_id), result_notes=VALUES(result_notes)`,
      [match_id, winner_team_id || null, home_score, away_score, margin, is_draw ? 1 : 0, man_of_match_id || null, result_notes]
    );
    // Mark match as completed
    await db.execute("UPDATE matches SET status='completed' WHERE match_id=?", [match_id]);
    res.status(201).json({ message: 'Result recorded' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/results/:match_id
router.get('/:match_id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT mr.*, wt.name AS winner_team_name, p.full_name AS man_of_match_name
       FROM match_results mr
       LEFT JOIN teams   wt ON mr.winner_team_id   = wt.team_id
       LEFT JOIN players p  ON mr.man_of_match_id  = p.player_id
       WHERE mr.match_id = ?`, [req.params.match_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Result not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
