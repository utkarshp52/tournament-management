import { useState, useEffect } from 'react';
import { standingApi, tournamentApi } from '../api/api';
import { Spinner, EmptyState, Alert } from '../components/UI';
import TopBar from '../components/TopBar';

export default function StandingsPage() {
  const [tournaments, setTournaments]     = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [standings, setStandings]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');

  useEffect(() => {
    tournamentApi.getAll()
      .then(data => {
        setTournaments(data);
        if (data.length > 0) setSelectedTournament(data[0].tournament_id);
      })
      .catch(() => setError('Failed to load tournaments'));
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;
    setLoading(true);
    standingApi.get(selectedTournament)
      .then(setStandings)
      .catch(() => setError('Failed to load standings'))
      .finally(() => setLoading(false));
  }, [selectedTournament]);

  const currentTournament = tournaments.find(t => t.tournament_id == selectedTournament);

  // Determine top 4 for qualification highlight
  const qualifiedIds = new Set(standings.slice(0, 4).map(s => s.team_id));

  return (
    <>
      <TopBar title="📋 Points Table" />

      <div className="page-wrapper">
        {error && <Alert type="danger">❌ {error}</Alert>}

        {/* Tournament selector */}
        <div className="standings-header">
          <div className="form-group" style={{ minWidth: '220px' }}>
            <label className="form-label">Tournament</label>
            <select
              id="standings-tournament-select"
              className="form-control"
              value={selectedTournament}
              onChange={e => setSelectedTournament(e.target.value)}
            >
              <option value="">Select tournament...</option>
              {tournaments.map(t => (
                <option key={t.tournament_id} value={t.tournament_id}>{t.name}</option>
              ))}
            </select>
          </div>

          {standings.length > 0 && (
            <div className="standings-legend">
              <span className="standings-legend-item qualified">
                <span className="standings-legend-dot"></span>
                Top 4 — Qualifies for Knockout
              </span>
            </div>
          )}
        </div>

        {!selectedTournament ? (
          <EmptyState icon="🏆" title="Select a Tournament" desc="Choose a tournament to view the points table." />
        ) : loading ? (
          <Spinner text="Loading standings..." />
        ) : standings.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No Standings Yet"
            desc="Generate fixtures and record match results to populate the points table."
          />
        ) : (
          <>
            {/* Tournament Header Card */}
            {currentTournament && (
              <div className="standings-tournament-card">
                <div className="standings-tournament-name">
                  🏆 {currentTournament.name}
                </div>
                <div className="standings-tournament-meta">
                  <span>🏅 {currentTournament.sport_type}</span>
                  <span>👥 {standings.length} Teams</span>
                  <span>📅 {currentTournament.start_date?.slice(0,10)} → {currentTournament.end_date?.slice(0,10)}</span>
                </div>
              </div>
            )}

            {/* Points Table */}
            <div className="standings-table-wrapper">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th className="standings-rank-col">#</th>
                    <th className="standings-team-col">Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>L</th>
                    <th>D</th>
                    <th className="standings-pts-col">PTS</th>
                    <th>Win %</th>
                    <th className="standings-bar-col">Form</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((s, idx) => (
                    <tr
                      key={s.standing_id}
                      className={`standings-row ${qualifiedIds.has(s.team_id) ? 'qualified' : ''} ${idx === 0 ? 'leader' : ''}`}
                    >
                      <td className="standings-rank">
                        <span className={`rank-badge ${idx < 4 ? 'top' : ''}`}>{s.rank}</span>
                      </td>
                      <td className="standings-team">
                        <span className="standings-team-name">{s.team_name}</span>
                        {s.short_name && (
                          <span className="standings-team-short">{s.short_name}</span>
                        )}
                      </td>
                      <td className="standings-cell">{s.matches_played}</td>
                      <td className="standings-cell wins">{s.wins}</td>
                      <td className="standings-cell losses">{s.losses}</td>
                      <td className="standings-cell draws">{s.draws}</td>
                      <td className="standings-cell points">{s.points}</td>
                      <td className="standings-cell">
                        <span className="standings-winpct">{s.win_percentage}%</span>
                      </td>
                      <td className="standings-cell">
                        <div className="standings-bar-container">
                          <div
                            className="standings-bar win-bar"
                            style={{ width: `${s.win_percentage}%` }}
                            title={`${s.wins} wins`}
                          />
                          <div
                            className="standings-bar draw-bar"
                            style={{ width: `${s.matches_played > 0 ? ((s.draws / s.matches_played) * 100).toFixed(1) : 0}%` }}
                            title={`${s.draws} draws`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Team Cards (mobile-friendly alternative) */}
            <div className="standings-cards-mobile">
              {standings.map((s, idx) => (
                <div key={s.standing_id} className={`standings-mobile-card ${idx < 4 ? 'qualified' : ''}`}>
                  <div className="standings-mobile-rank">
                    <span className={`rank-badge ${idx < 4 ? 'top' : ''}`}>{s.rank}</span>
                  </div>
                  <div className="standings-mobile-info">
                    <div className="standings-mobile-name">{s.team_name}</div>
                    <div className="standings-mobile-stats">
                      <span>P: {s.matches_played}</span>
                      <span className="win-text">W: {s.wins}</span>
                      <span className="loss-text">L: {s.losses}</span>
                      <span>D: {s.draws}</span>
                    </div>
                  </div>
                  <div className="standings-mobile-points">
                    <span className="standings-mobile-pts">{s.points}</span>
                    <span className="standings-mobile-pts-label">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
