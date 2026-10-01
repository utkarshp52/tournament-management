const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

// ── GET bracket for a tournament ────────────────────────────
router.get('/', async (req, res) => {
  const { tournament_id } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  try {
    const [rows] = await db.execute(
      `SELECT kb.*, 
              t1.name AS team1_name, t2.name AS team2_name, w.name AS winner_name,
              m.match_date, m.match_time, m.status AS match_status,
              v.name AS venue_name
       FROM knockout_bracket kb
       LEFT JOIN teams   t1 ON kb.team1_id  = t1.team_id
       LEFT JOIN teams   t2 ON kb.team2_id  = t2.team_id
       LEFT JOIN teams   w  ON kb.winner_id = w.team_id
       LEFT JOIN matches m  ON kb.match_id  = m.match_id
       LEFT JOIN venues  v  ON m.venue_id   = v.venue_id
       WHERE kb.tournament_id = ?
       ORDER BY FIELD(kb.stage,'semi_final','final'), kb.bracket_order`, [tournament_id]
    );

    // Determine tournament champion
    const finalBracket = rows.find(r => r.stage === 'final');
    const champion = finalBracket && finalBracket.winner_id ? {
      team_id: finalBracket.winner_id,
      team_name: finalBracket.winner_name
    } : null;

    res.json({ brackets: rows, champion });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /generate — Auto-generate knockout bracket from standings ──
router.post('/generate', authMiddleware, async (req, res) => {
  const { tournament_id } = req.body;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check if knockout already exists
    const [existing] = await conn.execute(
      'SELECT COUNT(*) AS cnt FROM knockout_bracket WHERE tournament_id = ?',
      [tournament_id]
    );
    if (existing[0].cnt > 0) {
      await conn.rollback();
      return res.status(400).json({
        error: 'Knockout bracket already exists. Clear it first to regenerate.'
      });
    }

    // Check if all group stage matches are completed
    const [pendingMatches] = await conn.execute(
      `SELECT COUNT(*) AS cnt FROM matches 
       WHERE tournament_id = ? AND round = 'Group Stage' AND status != 'completed'`,
      [tournament_id]
    );
    if (pendingMatches[0].cnt > 0) {
      await conn.rollback();
      return res.status(400).json({
        error: `${pendingMatches[0].cnt} group stage match(es) still pending. Complete all group stage matches before generating the knockout bracket.`
      });
    }

    // Get top 4 teams from standings
    const [standings] = await conn.execute(
      `SELECT s.team_id, t.name AS team_name, s.points, s.wins
       FROM standings s
       JOIN teams t ON s.team_id = t.team_id
       WHERE s.tournament_id = ?
       ORDER BY s.points DESC, s.wins DESC
       LIMIT 4`, [tournament_id]
    );

    if (standings.length < 4) {
      await conn.rollback();
      return res.status(400).json({
        error: `Need at least 4 teams in standings. Currently have ${standings.length}.`
      });
    }

    // Get tournament date range for scheduling knockout matches
    const [tournament] = await conn.execute(
      'SELECT * FROM tournaments WHERE tournament_id = ?', [tournament_id]
    );
    const endDate = new Date(tournament[0].end_date);

    // Get available venues and umpires
    const [venues] = await conn.execute(
      'SELECT venue_id FROM venues WHERE tournament_id = ? AND is_available = 1 LIMIT 2',
      [tournament_id]
    );
    const [umpires] = await conn.execute(
      'SELECT umpire_id FROM umpires WHERE tournament_id = ? AND is_available = 1 LIMIT 3',
      [tournament_id]
    );

    // Semi-Final 1: #1 vs #4
    const sf1Date = new Date(endDate);
    sf1Date.setDate(sf1Date.getDate() - 2);
    const sf1DateStr = sf1Date.toISOString().slice(0, 10);

    const [sf1Match] = await conn.execute(
      `INSERT INTO matches (tournament_id, home_team_id, away_team_id, venue_id, umpire_id,
       match_date, match_time, round, status)
       VALUES (?, ?, ?, ?, ?, ?, '14:00:00', 'Semi-Final 1', 'scheduled')`,
      [tournament_id, standings[0].team_id, standings[3].team_id,
       venues[0]?.venue_id || null, umpires[0]?.umpire_id || null, sf1DateStr]
    );

    await conn.execute(
      `INSERT INTO knockout_bracket (tournament_id, stage, match_id, team1_id, team2_id, bracket_order)
       VALUES (?, 'semi_final', ?, ?, ?, 1)`,
      [tournament_id, sf1Match.insertId, standings[0].team_id, standings[3].team_id]
    );

    // Semi-Final 2: #2 vs #3
    const [sf2Match] = await conn.execute(
      `INSERT INTO matches (tournament_id, home_team_id, away_team_id, venue_id, umpire_id,
       match_date, match_time, round, status)
       VALUES (?, ?, ?, ?, ?, ?, '18:00:00', 'Semi-Final 2', 'scheduled')`,
      [tournament_id, standings[1].team_id, standings[2].team_id,
       venues[1]?.venue_id || venues[0]?.venue_id || null,
       umpires[1]?.umpire_id || null, sf1DateStr]
    );

    await conn.execute(
      `INSERT INTO knockout_bracket (tournament_id, stage, match_id, team1_id, team2_id, bracket_order)
       VALUES (?, 'semi_final', ?, ?, ?, 2)`,
      [tournament_id, sf2Match.insertId, standings[1].team_id, standings[2].team_id]
    );

    // Final (placeholder — teams TBD until semi-finals are played)
    const finalDateStr = endDate.toISOString().slice(0, 10);

    const [finalMatch] = await conn.execute(
      `INSERT INTO matches (tournament_id, home_team_id, away_team_id, venue_id, umpire_id,
       match_date, match_time, round, status)
       VALUES (?, ?, ?, ?, ?, ?, '18:00:00', 'Final', 'scheduled')`,
      [tournament_id, standings[0].team_id, standings[1].team_id,
       venues[0]?.venue_id || null, umpires[2]?.umpire_id || umpires[0]?.umpire_id || null,
       finalDateStr]
    );

    await conn.execute(
      `INSERT INTO knockout_bracket (tournament_id, stage, match_id, bracket_order)
       VALUES (?, 'final', ?, 1)`,
      [tournament_id, finalMatch.insertId]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Knockout bracket generated',
      semi_finals: [
        { label: 'SF1', team1: standings[0].team_name, team2: standings[3].team_name },
        { label: 'SF2', team1: standings[1].team_name, team2: standings[2].team_name },
      ],
      qualified_teams: standings.map((s, i) => ({ rank: i + 1, ...s })),
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ── POST /record-winner — Record a knockout match winner and progress ──
router.post('/record-winner', authMiddleware, async (req, res) => {
  const { bracket_id, winner_id } = req.body;
  if (!bracket_id || !winner_id) {
    return res.status(400).json({ error: 'bracket_id and winner_id required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get the bracket
    const [brackets] = await conn.execute(
      'SELECT * FROM knockout_bracket WHERE bracket_id = ?', [bracket_id]
    );
    if (!brackets.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Bracket not found' });
    }
    const bracket = brackets[0];

    // Validate winner is one of the teams
    if (winner_id !== bracket.team1_id && winner_id !== bracket.team2_id) {
      await conn.rollback();
      return res.status(400).json({ error: 'Winner must be one of the bracket teams' });
    }

    // Update bracket winner
    await conn.execute(
      'UPDATE knockout_bracket SET winner_id = ? WHERE bracket_id = ?',
      [winner_id, bracket_id]
    );

    // If this is a semi-final, progress winner to the final
    if (bracket.stage === 'semi_final') {
      const [finalBrackets] = await conn.execute(
        "SELECT * FROM knockout_bracket WHERE tournament_id = ? AND stage = 'final'",
        [bracket.tournament_id]
      );

      if (finalBrackets.length > 0) {
        const finalBracket = finalBrackets[0];

        if (bracket.bracket_order === 1) {
          // SF1 winner → final team1
          await conn.execute(
            'UPDATE knockout_bracket SET team1_id = ? WHERE bracket_id = ?',
            [winner_id, finalBracket.bracket_id]
          );
          // Also update the final match
          if (finalBracket.match_id) {
            await conn.execute(
              'UPDATE matches SET home_team_id = ? WHERE match_id = ?',
              [winner_id, finalBracket.match_id]
            );
          }
        } else {
          // SF2 winner → final team2
          await conn.execute(
            'UPDATE knockout_bracket SET team2_id = ? WHERE bracket_id = ?',
            [winner_id, finalBracket.bracket_id]
          );
          if (finalBracket.match_id) {
            await conn.execute(
              'UPDATE matches SET away_team_id = ? WHERE match_id = ?',
              [winner_id, finalBracket.match_id]
            );
          }
        }
      }
    }

    // If this is the final, mark tournament as completed
    if (bracket.stage === 'final') {
      await conn.execute(
        "UPDATE tournaments SET status = 'completed' WHERE tournament_id = ?",
        [bracket.tournament_id]
      );
    }

    await conn.commit();

    res.json({
      message: bracket.stage === 'final'
        ? 'Champion declared! Tournament completed.'
        : 'Semi-final winner recorded and progressed to final.',
      winner_id,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ── POST — create/update bracket slot (manual) ──────────────
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

// ── PUT /:id — update bracket slot ──────────────────────────
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

// ── DELETE /clear/:tournament_id — Reset knockout bracket ───
router.delete('/clear/:tournament_id', authMiddleware, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get knockout match IDs to delete
    const [brackets] = await conn.execute(
      'SELECT match_id FROM knockout_bracket WHERE tournament_id = ? AND match_id IS NOT NULL',
      [req.params.tournament_id]
    );

    // Delete the bracket entries
    await conn.execute(
      'DELETE FROM knockout_bracket WHERE tournament_id = ?',
      [req.params.tournament_id]
    );

    // Delete associated matches
    for (const b of brackets) {
      if (b.match_id) {
        await conn.execute('DELETE FROM matches WHERE match_id = ?', [b.match_id]);
      }
    }

    // Reset tournament status back to ongoing
    await conn.execute(
      "UPDATE tournaments SET status = 'ongoing' WHERE tournament_id = ?",
      [req.params.tournament_id]
    );

    await conn.commit();
    res.json({ message: 'Knockout bracket cleared' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
