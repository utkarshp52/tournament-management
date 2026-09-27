const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

// GET teams by tournament
router.get('/', async (req, res) => {
  const { tournament_id } = req.query;
  try {
    const query = tournament_id
      ? 'SELECT t.*, p.full_name AS captain_name FROM teams t LEFT JOIN players p ON t.captain_id = p.player_id WHERE t.tournament_id = ? ORDER BY t.name'
      : 'SELECT t.*, p.full_name AS captain_name FROM teams t LEFT JOIN players p ON t.captain_id = p.player_id ORDER BY t.name';
    const params = tournament_id ? [tournament_id] : [];
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single team with players
router.get('/:id', async (req, res) => {
  try {
    const [teams] = await db.execute('SELECT * FROM teams WHERE team_id = ?', [req.params.id]);
    if (!teams.length) return res.status(404).json({ error: 'Team not found' });
    const [players] = await db.execute('SELECT * FROM players WHERE team_id = ? ORDER BY jersey_number', [req.params.id]);
    res.json({ ...teams[0], players });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create team
router.post('/', authMiddleware, async (req, res) => {
  const { tournament_id, name, short_name, home_city, coach_name } = req.body;
  if (!tournament_id || !name) return res.status(400).json({ error: 'tournament_id and name required' });
  try {
    const [result] = await db.execute(
      'INSERT INTO teams (tournament_id, name, short_name, home_city, coach_name) VALUES (?,?,?,?,?)',
      [tournament_id, name, short_name, home_city, coach_name]
    );
    res.status(201).json({ message: 'Team created', team_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Team name already exists in this tournament' });
    res.status(500).json({ error: err.message });
  }
});

// PUT update team
router.put('/:id', authMiddleware, async (req, res) => {
  const { name, short_name, home_city, coach_name, captain_id } = req.body;
  try {
    await db.execute('UPDATE teams SET name=?,short_name=?,home_city=?,coach_name=?,captain_id=? WHERE team_id=?',
      [name, short_name, home_city, coach_name, captain_id || null, req.params.id]);
    res.json({ message: 'Team updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE team
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('DELETE FROM teams WHERE team_id = ?', [req.params.id]);
    res.json({ message: 'Team deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
