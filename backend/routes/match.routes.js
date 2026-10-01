const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

// ── GET all matches (with optional filters) ────────────────
router.get('/', async (req, res) => {
  const { tournament_id, status, round } = req.query;
  try {
    let query = `
      SELECT m.*, 
             ht.name AS home_team_name, at.name AS away_team_name,
             v.name  AS venue_name,     u.full_name AS umpire_name,
             mr.home_score, mr.away_score, mr.winner_team_id,
             mr.margin, mr.is_draw, mr.man_of_match_id,
             wt.name AS winner_team_name
      FROM matches m
      LEFT JOIN teams   ht ON m.home_team_id = ht.team_id
      LEFT JOIN teams   at ON m.away_team_id = at.team_id
      LEFT JOIN venues  v  ON m.venue_id     = v.venue_id
      LEFT JOIN umpires u  ON m.umpire_id    = u.umpire_id
      LEFT JOIN match_results mr ON m.match_id = mr.match_id
      LEFT JOIN teams   wt ON mr.winner_team_id = wt.team_id
      WHERE 1=1`;
    const params = [];
    if (tournament_id) { query += ' AND m.tournament_id = ?'; params.push(tournament_id); }
    if (status)        { query += ' AND m.status = ?';        params.push(status); }
    if (round)         { query += ' AND m.round = ?';         params.push(round); }
    query += ' ORDER BY m.match_date, m.match_time, m.match_number';
    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET single match detail ────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT m.*, ht.name AS home_team_name, at.name AS away_team_name,
              v.name AS venue_name, u.full_name AS umpire_name,
              mr.home_score, mr.away_score, mr.winner_team_id, mr.margin, mr.is_draw,
              mr.man_of_match_id, mr.result_notes,
              wt.name AS winner_team_name, p.full_name AS man_of_match_name
       FROM matches m
       LEFT JOIN teams ht      ON m.home_team_id = ht.team_id
       LEFT JOIN teams at      ON m.away_team_id = at.team_id
       LEFT JOIN venues v      ON m.venue_id     = v.venue_id
       LEFT JOIN umpires u     ON m.umpire_id    = u.umpire_id
       LEFT JOIN match_results mr ON m.match_id  = mr.match_id
       LEFT JOIN teams   wt    ON mr.winner_team_id  = wt.team_id
       LEFT JOIN players p     ON mr.man_of_match_id = p.player_id
       WHERE m.match_id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Match not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /generate — Automatic fixture generation ──────────
router.post('/generate', authMiddleware, async (req, res) => {
  const { tournament_id } = req.body;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id is required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Fetch tournament info
    const [tournaments] = await conn.execute(
      'SELECT * FROM tournaments WHERE tournament_id = ?', [tournament_id]
    );
    if (!tournaments.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Tournament not found' });
    }
    const tournament = tournaments[0];

    // 2. Check for existing group-stage matches
    const [existingMatches] = await conn.execute(
      "SELECT COUNT(*) AS cnt FROM matches WHERE tournament_id = ? AND round = 'Group Stage'",
      [tournament_id]
    );
    if (existingMatches[0].cnt > 0) {
      await conn.rollback();
      return res.status(400).json({
        error: 'Fixtures already generated for this tournament. Delete existing matches first to regenerate.'
      });
    }

    // 3. Get all teams
    const [teams] = await conn.execute(
      'SELECT team_id, name FROM teams WHERE tournament_id = ? ORDER BY team_id',
      [tournament_id]
    );
    if (teams.length < 2) {
      await conn.rollback();
      return res.status(400).json({ error: 'At least 2 teams are required to generate fixtures' });
    }

    // 4. Get available venues
    const [venues] = await conn.execute(
      'SELECT venue_id, name FROM venues WHERE tournament_id = ? AND is_available = 1',
      [tournament_id]
    );

    // 5. Get available umpires
    const [umpires] = await conn.execute(
      'SELECT umpire_id, full_name FROM umpires WHERE tournament_id = ? AND is_available = 1',
      [tournament_id]
    );

    // 6. Generate round-robin pairs
    const fixtures = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({ home: teams[i].team_id, away: teams[j].team_id });
      }
    }

    // 7. Spread matches across the tournament date range
    const startDate = new Date(tournament.start_date);
    const endDate   = new Date(tournament.end_date);
    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

    // Calculate max matches per day (based on venues available, default 2)
    const maxPerDay = Math.max(1, venues.length || 2);
    const matchTimes = ['10:00:00', '14:00:00', '18:00:00', '20:00:00'];

    // Track venue/umpire usage per date to prevent conflicts
    const venueUsage  = {};  // { 'YYYY-MM-DD': Set(venue_id) }
    const umpireUsage = {};  // { 'YYYY-MM-DD': Set(umpire_id) }

    let dayOffset  = 0;
    let slotInDay  = 0;
    let matchNum   = 1;

    const generatedMatches = [];

    for (const fix of fixtures) {
      // Advance day if we've filled the day's slots
      if (slotInDay >= maxPerDay) {
        slotInDay = 0;
        dayOffset++;
      }

      // Wrap around if we exceed end date
      const actualDayOffset = dayOffset % (totalDays + 1);
      const matchDate = new Date(startDate);
      matchDate.setDate(matchDate.getDate() + actualDayOffset);
      const dateStr = matchDate.toISOString().slice(0, 10);

      // Initialize tracking sets
      if (!venueUsage[dateStr])  venueUsage[dateStr]  = new Set();
      if (!umpireUsage[dateStr]) umpireUsage[dateStr] = new Set();

      // Assign venue (round-robin through available venues, checking conflicts)
      let assignedVenue = null;
      if (venues.length > 0) {
        for (const v of venues) {
          if (!venueUsage[dateStr].has(v.venue_id)) {
            assignedVenue = v.venue_id;
            venueUsage[dateStr].add(v.venue_id);
            break;
          }
        }
        // If all venues taken for this date, just assign first one with different time
        if (!assignedVenue) {
          assignedVenue = venues[slotInDay % venues.length].venue_id;
        }
      }

      // Assign umpire (round-robin, checking conflicts)
      let assignedUmpire = null;
      if (umpires.length > 0) {
        for (const u of umpires) {
          if (!umpireUsage[dateStr].has(u.umpire_id)) {
            assignedUmpire = u.umpire_id;
            umpireUsage[dateStr].add(u.umpire_id);
            break;
          }
        }
        if (!assignedUmpire) {
          assignedUmpire = umpires[slotInDay % umpires.length].umpire_id;
        }
      }

      // Assign time slot
      const matchTime = matchTimes[slotInDay % matchTimes.length];

      generatedMatches.push({
        tournament_id, home_team_id: fix.home, away_team_id: fix.away,
        venue_id: assignedVenue, umpire_id: assignedUmpire,
        match_date: dateStr, match_time: matchTime,
        round: 'Group Stage', match_number: matchNum++
      });

      slotInDay++;
    }

    // 8. Insert all matches
    for (const m of generatedMatches) {
      await conn.execute(
        `INSERT INTO matches (tournament_id, home_team_id, away_team_id, venue_id, umpire_id,
         match_date, match_time, round, match_number, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
        [m.tournament_id, m.home_team_id, m.away_team_id, m.venue_id, m.umpire_id,
         m.match_date, m.match_time, m.round, m.match_number]
      );
    }

    // 9. Initialize standings for all teams (upsert to avoid duplicates)
    for (const team of teams) {
      await conn.execute(
        `INSERT INTO standings (tournament_id, team_id, matches_played, wins, losses, draws, points)
         VALUES (?, ?, 0, 0, 0, 0, 0)
         ON DUPLICATE KEY UPDATE standing_id = standing_id`,
        [tournament_id, team.team_id]
      );
    }

    // 10. Update tournament status to ongoing
    await conn.execute(
      "UPDATE tournaments SET status = 'ongoing' WHERE tournament_id = ? AND status = 'upcoming'",
      [tournament_id]
    );

    await conn.commit();

    res.status(201).json({
      message: `${generatedMatches.length} fixtures generated successfully`,
      matches_count: generatedMatches.length,
      teams_count: teams.length,
      venues_assigned: venues.length > 0,
      umpires_assigned: umpires.length > 0
    });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ── POST /  — Create a single match ───────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { tournament_id, home_team_id, away_team_id, venue_id, umpire_id, match_date, match_time, round, match_number } = req.body;
  if (!tournament_id || !home_team_id || !away_team_id || !match_date)
    return res.status(400).json({ error: 'tournament_id, home/away team ids and match_date required' });

  try {
    // Conflict check: same venue on same date at same time
    if (venue_id && match_time) {
      const [conflicts] = await db.execute(
        `SELECT match_id FROM matches
         WHERE venue_id = ? AND match_date = ? AND match_time = ? AND tournament_id = ?`,
        [venue_id, match_date, match_time, tournament_id]
      );
      if (conflicts.length > 0) {
        return res.status(400).json({ error: 'Venue conflict: this venue is already booked at that date/time' });
      }
    }

    // Conflict check: same umpire on same date at same time
    if (umpire_id && match_time) {
      const [conflicts] = await db.execute(
        `SELECT match_id FROM matches
         WHERE umpire_id = ? AND match_date = ? AND match_time = ? AND tournament_id = ?`,
        [umpire_id, match_date, match_time, tournament_id]
      );
      if (conflicts.length > 0) {
        return res.status(400).json({ error: 'Umpire conflict: this umpire is already assigned at that date/time' });
      }
    }

    const [result] = await db.execute(
      'INSERT INTO matches (tournament_id,home_team_id,away_team_id,venue_id,umpire_id,match_date,match_time,round,match_number) VALUES (?,?,?,?,?,?,?,?,?)',
      [tournament_id, home_team_id, away_team_id, venue_id || null, umpire_id || null, match_date, match_time || null, round || 'Group Stage', match_number || null]
    );
    res.status(201).json({ message: 'Match created', match_id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /:id — Update a match ──────────────────────────────
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

// ── DELETE /:id — Delete a single match ────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.execute('DELETE FROM matches WHERE match_id = ?', [req.params.id]);
    res.json({ message: 'Match deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELETE /clear/:tournament_id — Delete all group matches ─
router.delete('/clear/:tournament_id', authMiddleware, async (req, res) => {
  try {
    await db.execute(
      "DELETE FROM matches WHERE tournament_id = ? AND round = 'Group Stage'",
      [req.params.tournament_id]
    );
    // Reset standings
    await db.execute(
      'UPDATE standings SET matches_played=0, wins=0, losses=0, draws=0, points=0, goals_for=0, goals_against=0 WHERE tournament_id=?',
      [req.params.tournament_id]
    );
    res.json({ message: 'All group stage matches cleared' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
