const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

router.get('/', async (req, res) => {
  const { team_id, tournament_id } = req.query;
  try {
    let query = 'SELECT p.*, t.name AS team_name FROM players p LEFT JOIN teams t ON p.team_id = t.team_id WHERE 1=1';
    const params = [];
    if (team_id)        { query += ' AND p.team_id = ?';       params.push(team_id); }
    if (tournament_id)  { query += ' AND p.tournament_id = ?'; params.push(tournament_id); }
    query += ' ORDER BY t.name, p.jersey_number';
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT p.*, t.name AS team_name FROM players p LEFT JOIN teams t ON p.team_id = t.team_id WHERE p.player_id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Player not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, async (req, res) => {
  const { team_id, tournament_id, full_name, jersey_number, position, date_of_birth, nationality } = req.body;
  if (!team_id || !tournament_id || !full_name)
    return res.status(400).json({ error: 'team_id, tournament_id and full_name required' });
  try {
    const [result] = await db.execute(
      'INSERT INTO players (team_id, tournament_id, full_name, jersey_number, position, date_of_birth, nationality) VALUES (?,?,?,?,?,?,?)',
      [team_id, tournament_id, full_name, jersey_number || null, position, date_of_birth || null, nationality]
    );
    res.status(201).json({ message: 'Player created', player_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Jersey number already taken in this team' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { full_name, jersey_number, position, date_of_birth, nationality, team_id, is_active } = req.body;
  try {
    await db.execute(
      'UPDATE players SET full_name=?,jersey_number=?,position=?,date_of_birth=?,nationality=?,team_id=?,is_active=? WHERE player_id=?',
      [full_name, jersey_number || null, position, date_of_birth || null, nationality, team_id, is_active !== undefined ? is_active : true, req.params.id]
    );
    res.json({ message: 'Player updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('DELETE FROM players WHERE player_id = ?', [req.params.id]);
    res.json({ message: 'Player deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
