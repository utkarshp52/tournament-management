const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

router.get('/', async (req, res) => {
  const { tournament_id } = req.query;
  try {
    const [rows] = tournament_id
      ? await db.execute('SELECT * FROM umpires WHERE tournament_id = ? ORDER BY full_name', [tournament_id])
      : await db.execute('SELECT * FROM umpires ORDER BY full_name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM umpires WHERE umpire_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Umpire not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, async (req, res) => {
  const { tournament_id, full_name, nationality, experience_years, email, phone } = req.body;
  if (!tournament_id || !full_name) return res.status(400).json({ error: 'tournament_id and full_name required' });
  try {
    const [result] = await db.execute(
      'INSERT INTO umpires (tournament_id, full_name, nationality, experience_years, email, phone) VALUES (?,?,?,?,?,?)',
      [tournament_id, full_name, nationality, experience_years || 0, email, phone]
    );
    res.status(201).json({ message: 'Umpire created', umpire_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { full_name, nationality, experience_years, email, phone, is_available } = req.body;
  try {
    await db.execute(
      'UPDATE umpires SET full_name=?,nationality=?,experience_years=?,email=?,phone=?,is_available=? WHERE umpire_id=?',
      [full_name, nationality, experience_years, email, phone, is_available !== undefined ? is_available : true, req.params.id]
    );
    res.json({ message: 'Umpire updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('DELETE FROM umpires WHERE umpire_id = ?', [req.params.id]);
    res.json({ message: 'Umpire deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
