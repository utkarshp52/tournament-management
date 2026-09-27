const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../database/db');
const router   = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, username, password } = req.body;
  const loginId = (email || username || '').trim();
  if (!loginId || !password)
    return res.status(400).json({ error: 'Email or username and password are required' });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1',
      [loginId, loginId]
    );
    if (!rows.length)
      return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: { user_id: user.user_id, username: user.username, email: user.email, role: user.role, full_name: user.full_name }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password, full_name, role } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Username, email, and password are required' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hash, full_name || null, role || 'organizer']
    );
    res.status(201).json({ message: 'User registered', user_id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// GET /api/auth/me
const { authMiddleware } = require('../middleware/auth.middleware');
router.get('/me', authMiddleware, async (req, res) => {
  const [rows] = await db.execute(
    'SELECT user_id, username, email, role, full_name, created_at FROM users WHERE user_id = ?',
    [req.user.user_id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

module.exports = router;
