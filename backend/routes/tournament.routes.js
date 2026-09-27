const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

// GET all tournaments
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT t.*, u.full_name AS organizer_name,
              (SELECT COUNT(*) FROM teams WHERE tournament_id = t.tournament_id) AS team_count
       FROM tournaments t
       LEFT JOIN users u ON t.organizer_id = u.user_id
       ORDER BY t.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single tournament
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT t.*, u.full_name AS organizer_name FROM tournaments t
       LEFT JOIN users u ON t.organizer_id = u.user_id
       WHERE t.tournament_id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Tournament not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create tournament
router.post('/', authMiddleware, async (req, res) => {
  const { name, sport_type, start_date, end_date, location, description, format, max_teams } = req.body;
  if (!name || !start_date || !end_date)
    return res.status(400).json({ error: 'name, start_date and end_date are required' });
  try {
    const [result] = await db.execute(
      `INSERT INTO tournaments (name, sport_type, start_date, end_date, location, description, format, max_teams, organizer_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sport_type || 'Generic', start_date, end_date, location, description, format || 'league_knockout', max_teams || 8, req.user.user_id]
    );
    res.status(201).json({ message: 'Tournament created', tournament_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update tournament
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, sport_type, start_date, end_date, location, description, format, status, max_teams } = req.body;
  try {
    await db.execute(
      `UPDATE tournaments SET name=?, sport_type=?, start_date=?, end_date=?, location=?, description=?, format=?, status=?, max_teams=?
       WHERE tournament_id=?`,
      [name, sport_type, start_date, end_date, location, description, format, status, max_teams, req.params.id]
    );
    res.json({ message: 'Tournament updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE tournament
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('DELETE FROM tournaments WHERE tournament_id = ?', [req.params.id]);
    res.json({ message: 'Tournament deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
