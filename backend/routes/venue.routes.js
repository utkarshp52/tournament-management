const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

router.get('/', async (req, res) => {
  const { tournament_id } = req.query;
  try {
    const [rows] = tournament_id
      ? await db.execute('SELECT * FROM venues WHERE tournament_id = ? ORDER BY name', [tournament_id])
      : await db.execute('SELECT * FROM venues ORDER BY name');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM venues WHERE venue_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Venue not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, async (req, res) => {
  const { tournament_id, name, city, country, capacity, address } = req.body;
  if (!tournament_id || !name) return res.status(400).json({ error: 'tournament_id and name required' });
  try {
    const [result] = await db.execute(
      'INSERT INTO venues (tournament_id, name, city, country, capacity, address) VALUES (?,?,?,?,?,?)',
      [tournament_id, name, city, country || 'India', capacity || null, address]
    );
    res.status(201).json({ message: 'Venue created', venue_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { name, city, country, capacity, address, is_available } = req.body;
  try {
    await db.execute(
      'UPDATE venues SET name=?,city=?,country=?,capacity=?,address=?,is_available=? WHERE venue_id=?',
      [name, city, country, capacity, address, is_available !== undefined ? is_available : true, req.params.id]
    );
    res.json({ message: 'Venue updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('DELETE FROM venues WHERE venue_id = ?', [req.params.id]);
    res.json({ message: 'Venue deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
