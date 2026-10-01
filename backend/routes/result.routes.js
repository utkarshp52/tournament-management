const express = require('express');
const db      = require('../database/db');
const { authMiddleware } = require('../middleware/auth.middleware');
const router  = express.Router();

// ── POST /api/results — Record or update a match result ────
// Automatically updates standings table
router.post('/', authMiddleware, async (req, res) => {
  const { match_id, winner_team_id, home_score, away_score, margin, is_draw, man_of_match_id, result_notes } = req.body;
  if (!match_id) return res.status(400).json({ error: 'match_id is required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get match info
    const [matches] = await conn.execute(
      'SELECT * FROM matches WHERE match_id = ?', [match_id]
    );
    if (!matches.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Match not found' });
    }
    const match = matches[0];

    // 2. Check if result already exists (for re-entry / correction)
    const [existingResult] = await conn.execute(
      'SELECT * FROM match_results WHERE match_id = ?', [match_id]
    );
    const hadPreviousResult = existingResult.length > 0;

    // 3. If previous result exists, reverse the standings impact first
    if (hadPreviousResult) {
      const prev = existingResult[0];
      const homeTeam = match.home_team_id;
      const awayTeam = match.away_team_id;

      if (prev.is_draw) {
        // Reverse draw: -1 draw, -1 point each, -1 match played
        await conn.execute(
          'UPDATE standings SET matches_played = matches_played - 1, draws = draws - 1, points = points - 1 WHERE tournament_id = ? AND team_id = ?',
          [match.tournament_id, homeTeam]
        );
        await conn.execute(
          'UPDATE standings SET matches_played = matches_played - 1, draws = draws - 1, points = points - 1 WHERE tournament_id = ? AND team_id = ?',
          [match.tournament_id, awayTeam]
        );
      } else if (prev.winner_team_id) {
        const loserId = prev.winner_team_id === homeTeam ? awayTeam : homeTeam;
        // Reverse win: -1 win, -2 points for winner; -1 loss for loser; -1 match played each
        await conn.execute(
          'UPDATE standings SET matches_played = matches_played - 1, wins = wins - 1, points = points - 2 WHERE tournament_id = ? AND team_id = ?',
          [match.tournament_id, prev.winner_team_id]
        );
        await conn.execute(
          'UPDATE standings SET matches_played = matches_played - 1, losses = losses - 1 WHERE tournament_id = ? AND team_id = ?',
          [match.tournament_id, loserId]
        );
      }
    }

    // 4. Upsert the result
    await conn.execute(
      `INSERT INTO match_results (match_id, winner_team_id, home_score, away_score, margin, is_draw, man_of_match_id, result_notes)
       VALUES (?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         winner_team_id=VALUES(winner_team_id), home_score=VALUES(home_score),
         away_score=VALUES(away_score), margin=VALUES(margin), is_draw=VALUES(is_draw),
         man_of_match_id=VALUES(man_of_match_id), result_notes=VALUES(result_notes)`,
      [match_id, winner_team_id || null, home_score, away_score, margin, is_draw ? 1 : 0, man_of_match_id || null, result_notes]
    );

    // 5. Mark match as completed
    await conn.execute(
      "UPDATE matches SET status='completed' WHERE match_id=?",
      [match_id]
    );

    // 6. Update standings for both teams
    const homeTeamId = match.home_team_id;
    const awayTeamId = match.away_team_id;

    // Ensure standings rows exist
    for (const tid of [homeTeamId, awayTeamId]) {
      await conn.execute(
        `INSERT INTO standings (tournament_id, team_id, matches_played, wins, losses, draws, points)
         VALUES (?, ?, 0, 0, 0, 0, 0)
         ON DUPLICATE KEY UPDATE standing_id = standing_id`,
        [match.tournament_id, tid]
      );
    }

    if (is_draw) {
      // Draw: +1 match, +1 draw, +1 point each
      await conn.execute(
        'UPDATE standings SET matches_played = matches_played + 1, draws = draws + 1, points = points + 1 WHERE tournament_id = ? AND team_id = ?',
        [match.tournament_id, homeTeamId]
      );
      await conn.execute(
        'UPDATE standings SET matches_played = matches_played + 1, draws = draws + 1, points = points + 1 WHERE tournament_id = ? AND team_id = ?',
        [match.tournament_id, awayTeamId]
      );
    } else if (winner_team_id) {
      const loserId = winner_team_id === homeTeamId ? awayTeamId : homeTeamId;

      // Winner: +1 match, +1 win, +2 points
      await conn.execute(
        'UPDATE standings SET matches_played = matches_played + 1, wins = wins + 1, points = points + 2 WHERE tournament_id = ? AND team_id = ?',
        [match.tournament_id, winner_team_id]
      );
      // Loser: +1 match, +1 loss
      await conn.execute(
        'UPDATE standings SET matches_played = matches_played + 1, losses = losses + 1 WHERE tournament_id = ? AND team_id = ?',
        [match.tournament_id, loserId]
      );
    }

    // 7. Update ranks in standings
    const [allStandings] = await conn.execute(
      'SELECT standing_id, points, wins FROM standings WHERE tournament_id = ? ORDER BY points DESC, wins DESC',
      [match.tournament_id]
    );
    for (let i = 0; i < allStandings.length; i++) {
      await conn.execute(
        'UPDATE standings SET rank = ? WHERE standing_id = ?',
        [i + 1, allStandings[i].standing_id]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Result recorded and standings updated' });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// ── GET /api/results/:match_id ─────────────────────────────
router.get('/:match_id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT mr.*, wt.name AS winner_team_name, p.full_name AS man_of_match_name
       FROM match_results mr
       LEFT JOIN teams   wt ON mr.winner_team_id   = wt.team_id
       LEFT JOIN players p  ON mr.man_of_match_id  = p.player_id
       WHERE mr.match_id = ?`, [req.params.match_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Result not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
