const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

// GET bracket for a tournament
router.get('/', async (req, res) => {
  const { tournament_id } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  try {
    const [rows] = await db.execute(
      `SELECT kb.*, 
              t1.name AS team1_name, t2.name AS team2_name, w.name AS winner_name
       FROM knockout_bracket kb
       LEFT JOIN teams t1 ON kb.team1_id  = t1.team_id
       LEFT JOIN teams t2 ON kb.team2_id  = t2.team_id
       LEFT JOIN teams w  ON kb.winner_id = w.team_id
       WHERE kb.tournament_id = ?
       ORDER BY FIELD(kb.stage,'semi_final','final'), kb.bracket_order`, [tournament_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST — create/update bracket slot
router.post('/', authMiddleware, async (req, res) => {
  const { tournament_id, stage, match_id, team1_id, team2_id, winner_id, bracket_order } = req.body;
  if (!tournament_id || !stage) return res.status(400).json({ error: 'tournament_id and stage required' });
  try {
    const [result] = await db.execute(
      'INSERT INTO knockout_bracket (tournament_id,stage,match_id,team1_id,team2_id,winner_id,bracket_order) VALUES (?,?,?,?,?,?,?)',
      [tournament_id, stage, match_id || null, team1_id || null, team2_id || null, winner_id || null, bracket_order || 1]
    );
    res.status(201).json({ message: 'Bracket slot created', bracket_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT — update bracket slot (set winner etc.)
router.put('/:id', authMiddleware, async (req, res) => {
  const { team1_id, team2_id, winner_id, match_id } = req.body;
  try {
    await db.execute(
      'UPDATE knockout_bracket SET team1_id=?,team2_id=?,winner_id=?,match_id=? WHERE bracket_id=?',
      [team1_id || null, team2_id || null, winner_id || null, match_id || null, req.params.id]
    );
    res.json({ message: 'Bracket updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
