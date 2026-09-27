const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

router.get('/', async (req, res) => {
  const { tournament_id, status } = req.query;
  try {
    let query = `
      SELECT m.*, 
             ht.name AS home_team_name, at.name AS away_team_name,
             v.name  AS venue_name,     u.full_name AS umpire_name
      FROM matches m
      LEFT JOIN teams   ht ON m.home_team_id = ht.team_id
      LEFT JOIN teams   at ON m.away_team_id = at.team_id
      LEFT JOIN venues  v  ON m.venue_id     = v.venue_id
      LEFT JOIN umpires u  ON m.umpire_id    = u.umpire_id
      WHERE 1=1`;
    const params = [];
    if (tournament_id) { query += ' AND m.tournament_id = ?'; params.push(tournament_id); }
    if (status)        { query += ' AND m.status = ?';        params.push(status); }
    query += ' ORDER BY m.match_date, m.match_time';
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT m.*, ht.name AS home_team_name, at.name AS away_team_name,
              v.name AS venue_name, u.full_name AS umpire_name,
              mr.home_score, mr.away_score, mr.winner_team_id, mr.margin, mr.is_draw
       FROM matches m
       LEFT JOIN teams ht      ON m.home_team_id = ht.team_id
       LEFT JOIN teams at      ON m.away_team_id = at.team_id
       LEFT JOIN venues v      ON m.venue_id     = v.venue_id
       LEFT JOIN umpires u     ON m.umpire_id    = u.umpire_id
       LEFT JOIN match_results mr ON m.match_id  = mr.match_id
       WHERE m.match_id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Match not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, async (req, res) => {
  const { tournament_id, home_team_id, away_team_id, venue_id, umpire_id, match_date, match_time, round, match_number } = req.body;
  if (!tournament_id || !home_team_id || !away_team_id || !match_date)
    return res.status(400).json({ error: 'tournament_id, home/away team ids and match_date required' });
  try {
    const [result] = await db.execute(
      'INSERT INTO matches (tournament_id,home_team_id,away_team_id,venue_id,umpire_id,match_date,match_time,round,match_number) VALUES (?,?,?,?,?,?,?,?,?)',
      [tournament_id, home_team_id, away_team_id, venue_id || null, umpire_id || null, match_date, match_time || null, round || 'Group Stage', match_number || null]
    );
    res.status(201).json({ message: 'Match created', match_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { venue_id, umpire_id, match_date, match_time, round, status, notes } = req.body;
  try {
    await db.execute(
      'UPDATE matches SET venue_id=?,umpire_id=?,match_date=?,match_time=?,round=?,status=?,notes=? WHERE match_id=?',
      [venue_id || null, umpire_id || null, match_date, match_time || null, round, status, notes, req.params.id]
    );
    res.json({ message: 'Match updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('DELETE FROM matches WHERE match_id = ?', [req.params.id]);
    res.json({ message: 'Match deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
