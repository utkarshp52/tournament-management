const express = require('express');
const db      = require('../database/db');
const router  = express.Router();

// ── GET /api/reports/summary?tournament_id=X ─────────────────────────────────
// Returns a full tournament summary: info, champion, standings, top performers,
// match results, and key tournament metrics.
router.get('/summary', async (req, res) => {
  const { tournament_id } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });

  try {
    // 1. Tournament info
    const [tournaments] = await db.execute(
      `SELECT t.*, u.full_name AS organizer_name
       FROM tournaments t
       LEFT JOIN users u ON t.organizer_id = u.user_id
       WHERE t.tournament_id = ?`, [tournament_id]
    );
    if (!tournaments.length) return res.status(404).json({ error: 'Tournament not found' });
    const tournament = tournaments[0];

    // 2. Champion (from knockout bracket final)
    const [champRows] = await db.execute(
      `SELECT kb.winner_id, t.name AS champion_name, t.short_name AS champion_short,
              t.coach_name, t.home_city
       FROM knockout_bracket kb
       JOIN teams t ON kb.winner_id = t.team_id
       WHERE kb.tournament_id = ? AND kb.stage = 'final' AND kb.winner_id IS NOT NULL
       LIMIT 1`, [tournament_id]
    );
    const champion = champRows[0] || null;

    // 3. Runner-up (finalist that lost)
    let runnerUp = null;
    if (champRows.length > 0) {
      const [ruRows] = await db.execute(
        `SELECT kb.team1_id, kb.team2_id, kb.winner_id,
                t1.name AS team1_name, t2.name AS team2_name
         FROM knockout_bracket kb
         LEFT JOIN teams t1 ON kb.team1_id = t1.team_id
         LEFT JOIN teams t2 ON kb.team2_id = t2.team_id
         WHERE kb.tournament_id = ? AND kb.stage = 'final'
         LIMIT 1`, [tournament_id]
      );
      if (ruRows.length > 0) {
        const final = ruRows[0];
        const runnerUpId = final.winner_id === final.team1_id ? final.team2_id : final.team1_id;
        const runnerUpName = final.winner_id === final.team1_id ? final.team2_name : final.team1_name;
        runnerUp = { team_id: runnerUpId, team_name: runnerUpName };
      }
    }

    // 4. Final standings (top 8)
    const [standings] = await db.execute(
      `SELECT s.*, t.name AS team_name, t.short_name
       FROM standings s
       JOIN teams t ON s.team_id = t.team_id
       WHERE s.tournament_id = ?
       ORDER BY s.points DESC, s.wins DESC, s.net_run_rate DESC
       LIMIT 8`, [tournament_id]
    );
    standings.forEach((r, i) => {
      r.rank = i + 1;
      r.win_percentage = r.matches_played > 0
        ? ((r.wins / r.matches_played) * 100).toFixed(1) : '0.0';
    });

    // 5. Match summary stats
    const [matchStats] = await db.execute(
      `SELECT
         COUNT(*) AS total_matches,
         SUM(status = 'completed') AS completed_matches,
         SUM(status = 'scheduled') AS scheduled_matches,
         SUM(status = 'cancelled') AS cancelled_matches
       FROM matches WHERE tournament_id = ?`, [tournament_id]
    );

    // 6. Top scorer (runs)
    const [topScorers] = await db.execute(
      `SELECT ps.player_id, p.full_name, t.name AS team_name, t.short_name AS team_short,
              ps.runs_scored, ps.goals_scored, ps.matches_played, ps.man_of_match_count
       FROM player_statistics ps
       JOIN players p ON ps.player_id = p.player_id
       JOIN teams   t ON p.team_id    = t.team_id
       WHERE ps.tournament_id = ?
       ORDER BY ps.runs_scored DESC, ps.goals_scored DESC
       LIMIT 5`, [tournament_id]
    );

    // 7. Top wicket takers
    const [topWickets] = await db.execute(
      `SELECT ps.player_id, p.full_name, t.name AS team_name, t.short_name AS team_short,
              ps.wickets_taken, ps.assists, ps.matches_played
       FROM player_statistics ps
       JOIN players p ON ps.player_id = p.player_id
       JOIN teams   t ON p.team_id    = t.team_id
       WHERE ps.tournament_id = ?
       ORDER BY ps.wickets_taken DESC, ps.assists DESC
       LIMIT 5`, [tournament_id]
    );

    // 8. Man of the Match leaders
    const [topMOM] = await db.execute(
      `SELECT ps.player_id, p.full_name, t.name AS team_name, t.short_name AS team_short,
              ps.man_of_match_count
       FROM player_statistics ps
       JOIN players p ON ps.player_id = p.player_id
       JOIN teams   t ON p.team_id    = t.team_id
       WHERE ps.tournament_id = ? AND ps.man_of_match_count > 0
       ORDER BY ps.man_of_match_count DESC
       LIMIT 5`, [tournament_id]
    );

    // 9. All completed match results
    const [matchResults] = await db.execute(
      `SELECT m.match_id, m.round, m.match_date, m.match_number,
              ht.name AS home_team, at.name AS away_team,
              ht.short_name AS home_short, at.short_name AS away_short,
              v.name AS venue_name,
              mr.home_score, mr.away_score, mr.margin, mr.is_draw,
              wt.name AS winner_name, wt.short_name AS winner_short,
              p.full_name AS man_of_match
       FROM matches m
       JOIN teams ht ON m.home_team_id = ht.team_id
       JOIN teams at ON m.away_team_id = at.team_id
       LEFT JOIN venues v           ON m.venue_id    = v.venue_id
       LEFT JOIN match_results mr   ON m.match_id    = mr.match_id
       LEFT JOIN teams wt           ON mr.winner_team_id = wt.team_id
       LEFT JOIN players p          ON mr.man_of_match_id = p.player_id
       WHERE m.tournament_id = ? AND m.status = 'completed'
       ORDER BY m.match_date ASC, m.match_number ASC`, [tournament_id]
    );

    // 10. Knockout bracket summary
    const [knockoutBracket] = await db.execute(
      `SELECT kb.stage, kb.bracket_order,
              t1.name AS team1_name, t2.name AS team2_name, w.name AS winner_name,
              m.match_date
       FROM knockout_bracket kb
       LEFT JOIN teams t1 ON kb.team1_id  = t1.team_id
       LEFT JOIN teams t2 ON kb.team2_id  = t2.team_id
       LEFT JOIN teams w  ON kb.winner_id = w.team_id
       LEFT JOIN matches m ON kb.match_id = m.match_id
       WHERE kb.tournament_id = ?
       ORDER BY FIELD(kb.stage,'semi_final','final'), kb.bracket_order`, [tournament_id]
    );

    // 11. Team/player counts
    const [teamCount] = await db.execute(
      'SELECT COUNT(*) AS count FROM teams WHERE tournament_id = ?', [tournament_id]
    );
    const [playerCount] = await db.execute(
      'SELECT COUNT(*) AS count FROM players WHERE tournament_id = ?', [tournament_id]
    );
    const [venueCount] = await db.execute(
      'SELECT COUNT(*) AS count FROM venues WHERE tournament_id = ?', [tournament_id]
    );

    res.json({
      tournament,
      champion,
      runnerUp,
      standings,
      matchSummary: {
        ...matchStats[0],
        team_count:   teamCount[0].count,
        player_count: playerCount[0].count,
        venue_count:  venueCount[0].count,
      },
      topScorers,
      topWickets,
      topMOM,
      matchResults,
      knockoutBracket,
    });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/reports/tournaments — list all tournaments for selector ──────────
router.get('/tournaments', async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT tournament_id, name, sport_type, start_date, end_date, status,
              (SELECT COUNT(*) FROM teams WHERE tournament_id = t.tournament_id) AS team_count
       FROM tournaments t
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
