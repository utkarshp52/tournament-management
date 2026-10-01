import { useState, useEffect } from 'react';
import { statsApi, tournamentApi } from '../api/api';
import { Spinner, EmptyState, Alert } from '../components/UI';
import TopBar from '../components/TopBar';

const PLAYER_SORT_OPTIONS = [
  { value: '',         label: '🏏 Top Scorers (Runs)' },
  { value: 'wickets',  label: '🎯 Top Wicket Takers' },
  { value: 'goals',    label: '⚽ Top Goal Scorers' },
  { value: 'assists',  label: '🤝 Most Assists' },
  { value: 'matches',  label: '📅 Most Matches' },
];

export default function StatisticsPage() {
  const [tournaments, setTournaments]     = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [activeTab, setActiveTab]         = useState('teams'); // 'teams' | 'players'
  const [teamStats, setTeamStats]         = useState([]);
  const [playerStats, setPlayerStats]     = useState([]);
  const [playerSort, setPlayerSort]       = useState('');
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
    loadStats();
  }, [selectedTournament]);

  useEffect(() => {
    if (!selectedTournament || activeTab !== 'players') return;
    loadPlayerStats();
  }, [playerSort]);

  const loadStats = () => {
    setLoading(true);
    Promise.all([
      statsApi.teams(selectedTournament),
      statsApi.players(selectedTournament, playerSort),
    ])
      .then(([teams, players]) => {
        setTeamStats(teams);
        setPlayerStats(players);
      })
      .catch(() => setError('Failed to load statistics'))
      .finally(() => setLoading(false));
  };

  const loadPlayerStats = () => {
    statsApi.players(selectedTournament, playerSort)
      .then(setPlayerStats)
      .catch(() => {});
  };

  const currentTournament = tournaments.find(t => t.tournament_id == selectedTournament);

  return (
    <>
      <TopBar title="📈 Statistics" />

      <div className="page-wrapper">
        {error && <Alert type="danger">❌ {error}</Alert>}

        {/* Header */}
        <div className="stats-header">
          <div className="form-group" style={{ minWidth: '220px' }}>
            <label className="form-label">Tournament</label>
            <select
              id="stats-tournament-select"
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
        </div>

        {/* Tabs */}
        <div className="result-tabs" style={{ marginBottom: '24px' }}>
          <button
            className={`result-tab ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            🧑‍🤝‍🧑 Team Stats
          </button>
          <button
            className={`result-tab ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            👤 Player Stats
          </button>
        </div>

        {!selectedTournament ? (
          <EmptyState icon="🏆" title="Select a Tournament" desc="Choose a tournament to view statistics." />
        ) : loading ? (
          <Spinner text="Loading statistics..." />
        ) : activeTab === 'teams' ? (
          /* ── Team Statistics ─────────────────────── */
          teamStats.length === 0 ? (
            <EmptyState icon="🧑‍🤝‍🧑" title="No Team Statistics" desc="Record match results to see team statistics." />
          ) : (
            <div className="stats-team-grid">
              {teamStats.map((team, idx) => (
                <div key={team.team_id} className={`stats-team-card ${idx === 0 ? 'leader' : ''}`}>
                  <div className="stats-team-card-header">
                    <div className="stats-team-rank">
                      <span className={`rank-badge ${idx < 4 ? 'top' : ''}`}>{team.rank}</span>
                    </div>
                    <div className="stats-team-identity">
                      <h3 className="stats-team-name">{team.team_name}</h3>
                      <div className="stats-team-meta">
                        {team.coach_name && <span>🧑‍🏫 {team.coach_name}</span>}
                        {team.home_city && <span>📍 {team.home_city}</span>}
                        <span>👥 {team.player_count} players</span>
                      </div>
                    </div>
                    <div className="stats-team-points">
                      <span className="stats-team-pts-num">{team.points}</span>
                      <span className="stats-team-pts-label">pts</span>
                    </div>
                  </div>

                  <div className="stats-team-card-body">
                    <div className="stats-mini-grid">
                      <div className="stats-mini-item">
                        <span className="stats-mini-value">{team.matches_played}</span>
                        <span className="stats-mini-label">Played</span>
                      </div>
                      <div className="stats-mini-item win">
                        <span className="stats-mini-value">{team.wins}</span>
                        <span className="stats-mini-label">Wins</span>
                      </div>
                      <div className="stats-mini-item loss">
                        <span className="stats-mini-value">{team.losses}</span>
                        <span className="stats-mini-label">Losses</span>
                      </div>
                      <div className="stats-mini-item">
                        <span className="stats-mini-value">{team.draws}</span>
                        <span className="stats-mini-label">Draws</span>
                      </div>
                      <div className="stats-mini-item">
                        <span className="stats-mini-value">{team.win_percentage}%</span>
                        <span className="stats-mini-label">Win Rate</span>
                      </div>
                      <div className="stats-mini-item">
                        <span className="stats-mini-value">{team.loss_percentage}%</span>
                        <span className="stats-mini-label">Loss Rate</span>
                      </div>
                    </div>

                    {/* Win/Loss bar */}
                    <div className="stats-team-progress">
                      <div className="stats-progress-bar">
                        <div className="stats-progress-fill win" style={{ width: `${team.win_percentage}%` }}></div>
                        <div className="stats-progress-fill draw" style={{ width: `${team.matches_played > 0 ? ((team.draws / team.matches_played) * 100) : 0}%` }}></div>
                      </div>
                      <div className="stats-progress-labels">
                        <span className="win-text">{team.win_percentage}% W</span>
                        <span className="loss-text">{team.loss_percentage}% L</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* ── Player Statistics ───────────────────── */
          <>
            {/* Sort selector */}
            <div className="stats-sort-bar">
              <label className="form-label">Sort By</label>
              <select
                className="form-control"
                value={playerSort}
                onChange={e => setPlayerSort(e.target.value)}
                style={{ maxWidth: '260px' }}
              >
                {PLAYER_SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {playerStats.length === 0 ? (
              <EmptyState icon="👤" title="No Player Statistics" desc="Player statistics will appear once they are recorded in the system." />
            ) : (
              <div className="table-wrapper">
                <table className="data-table stats-player-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Mat</th>
                      <th>Runs</th>
                      <th>Avg</th>
                      <th>SR</th>
                      <th>50s</th>
                      <th>100s</th>
                      <th>Wkts</th>
                      <th>Econ</th>
                      <th>Catches</th>
                      <th>⭐</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerStats.map((p, idx) => (
                      <tr key={p.stat_id} className={idx === 0 ? 'stats-leader-row' : ''}>
                        <td className="text-muted">{idx + 1}</td>
                        <td>
                          <div className="stats-player-cell">
                            <span className="stats-player-name">{p.full_name}</span>
                            {p.jersey_number && (
                              <span className="stats-player-jersey">#{p.jersey_number}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary">{p.team_short_name || p.team_name}</span>
                        </td>
                        <td>{p.matches_played}</td>
                        <td className="font-bold">{p.runs_scored}</td>
                        <td>{p.batting_average}</td>
                        <td>{p.strike_rate}</td>
                        <td>{p.fifties}</td>
                        <td>{p.hundreds}</td>
                        <td className="font-bold">{p.wickets_taken}</td>
                        <td>{p.economy_rate}</td>
                        <td>{p.catches}</td>
                        <td>{p.man_of_match_count > 0 ? `⭐${p.man_of_match_count}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
