const express = require('express');
const db      = require('../database/db');
const router  = express.Router();

// ── GET player stats for a tournament ───────────────────────
router.get('/players', async (req, res) => {
  const { tournament_id, sort_by } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  try {
    // Build stats from match_results and player data
    // First get base player stats if they exist
    let orderClause = 'ps.runs_scored DESC';
    if (sort_by === 'goals')   orderClause = 'ps.goals_scored DESC';
    if (sort_by === 'assists') orderClause = 'ps.assists DESC';
    if (sort_by === 'wickets') orderClause = 'ps.wickets_taken DESC';
    if (sort_by === 'matches') orderClause = 'ps.matches_played DESC';

    const [rows] = await db.execute(
      `SELECT ps.*, p.full_name, p.jersey_number, p.position,
              t.name AS team_name, t.short_name AS team_short_name
       FROM player_statistics ps
       JOIN players p ON ps.player_id = p.player_id
       JOIN teams   t ON p.team_id    = t.team_id
       WHERE ps.tournament_id = ?
       ORDER BY ${orderClause}`, [tournament_id]
    );

    // Compute derived stats
    rows.forEach(r => {
      r.batting_average = r.matches_played > 0
        ? (r.runs_scored / r.matches_played).toFixed(1)
        : '0.0';
      r.strike_rate = r.balls_faced > 0
        ? ((r.runs_scored / r.balls_faced) * 100).toFixed(1)
        : '0.0';
      r.bowling_average = r.wickets_taken > 0
        ? (r.runs_conceded / r.wickets_taken).toFixed(1)
        : '—';
      r.economy_rate = r.overs_bowled > 0
        ? (r.runs_conceded / r.overs_bowled).toFixed(2)
        : '—';
    });

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET team stats (aggregated from standings + match data) ──
router.get('/teams', async (req, res) => {
  const { tournament_id } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  try {
    const [rows] = await db.execute(
      `SELECT s.*, t.name AS team_name, t.short_name, t.coach_name, t.home_city,
              (SELECT COUNT(*) FROM players WHERE team_id = t.team_id) AS player_count,
              (SELECT COUNT(*) FROM match_results mr
               JOIN matches m ON mr.match_id = m.match_id
               WHERE m.tournament_id = ? AND mr.winner_team_id = t.team_id) AS total_wins,
              (SELECT COUNT(*) FROM match_results mr
               JOIN matches m ON mr.match_id = m.match_id
               WHERE m.tournament_id = ?
                 AND (m.home_team_id = t.team_id OR m.away_team_id = t.team_id)
                 AND mr.is_draw = 1) AS total_draws
       FROM standings s
       JOIN teams t ON s.team_id = t.team_id
       WHERE s.tournament_id = ?
       ORDER BY s.points DESC, s.wins DESC`, [tournament_id, tournament_id, tournament_id]
    );

    rows.forEach((r, i) => {
      r.rank = i + 1;
      r.win_percentage = r.matches_played > 0
        ? ((r.wins / r.matches_played) * 100).toFixed(1)
        : '0.0';
      r.loss_percentage = r.matches_played > 0
        ? ((r.losses / r.matches_played) * 100).toFixed(1)
        : '0.0';
    });

    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET top performers (leaderboards) ───────────────────────
router.get('/leaderboard', async (req, res) => {
  const { tournament_id } = req.query;
  if (!tournament_id) return res.status(400).json({ error: 'tournament_id required' });
  try {
    // Top scorers (runs or goals depending on sport)
    const [topScorers] = await db.execute(
      `SELECT ps.player_id, p.full_name, t.name AS team_name,
              ps.runs_scored, ps.goals_scored, ps.matches_played
       FROM player_statistics ps
       JOIN players p ON ps.player_id = p.player_id
       JOIN teams   t ON p.team_id    = t.team_id
       WHERE ps.tournament_id = ?
       ORDER BY ps.runs_scored DESC, ps.goals_scored DESC
       LIMIT 5`, [tournament_id]
    );

    // Top wicket takers / assists
    const [topWickets] = await db.execute(
      `SELECT ps.player_id, p.full_name, t.name AS team_name,
              ps.wickets_taken, ps.assists, ps.matches_played
       FROM player_statistics ps
       JOIN players p ON ps.player_id = p.player_id
       JOIN teams   t ON p.team_id    = t.team_id
       WHERE ps.tournament_id = ?
       ORDER BY ps.wickets_taken DESC, ps.assists DESC
       LIMIT 5`, [tournament_id]
    );

    // Most man of the match awards
    const [topMOM] = await db.execute(
      `SELECT ps.player_id, p.full_name, t.name AS team_name,
              ps.man_of_match_count
       FROM player_statistics ps
       JOIN players p ON ps.player_id = p.player_id
       JOIN teams   t ON p.team_id    = t.team_id
       WHERE ps.tournament_id = ? AND ps.man_of_match_count > 0
       ORDER BY ps.man_of_match_count DESC
       LIMIT 5`, [tournament_id]
    );

    res.json({ topScorers, topWickets, topMOM });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
