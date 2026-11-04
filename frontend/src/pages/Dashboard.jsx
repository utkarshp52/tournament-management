import { useState, useEffect } from 'react';
import { tournamentApi, teamApi, playerApi, matchApi } from '../api/api';
import { Spinner, StatusBadge } from '../components/UI';
import TopBar from '../components/TopBar';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats]     = useState(null);
  const [recent, setRecent]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      tournamentApi.getAll(),
      teamApi.getAll(),
      playerApi.getAll(),
      matchApi.getAll(),
    ])
      .then(([tournaments, teams, players, matches]) => {
        setStats({
          tournaments: tournaments.length,
          teams:       teams.length,
          players:     players.length,
          matches:     matches.length,
          upcoming:    matches.filter((m) => m.status === 'scheduled').length,
          completed:   matches.filter((m) => m.status === 'completed').length,
        });
        setRecent(tournaments.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <TopBar title="Operations Dashboard" />
        <div className="dashboard-loading-center">
          <Spinner text="Loading tournament intelligence..." />
        </div>
      </>
    );
  }

  const statCards = [
    {
      label: 'Active Tournaments',
      value: stats?.tournaments ?? 0,
      icon: '🏆',
      cls: 'primary',
      sub: 'Sanctioned Leagues',
    },
    {
      label: 'Registered Teams',
      value: stats?.teams ?? 0,
      icon: '🛡️',
      cls: 'info',
      sub: 'Competing Franchises',
    },
    {
      label: 'Total Players',
      value: stats?.players ?? 0,
      icon: '👥',
      cls: 'success',
      sub: 'Registered Athletes',
    },
    {
      label: 'Fixtures Generated',
      value: stats?.matches ?? 0,
      icon: '📅',
      cls: 'warning',
      sub: 'Season Calendar',
    },
    {
      label: 'Upcoming Matches',
      value: stats?.upcoming ?? 0,
      icon: '⏳',
      cls: 'accent',
      sub: 'Pending Results',
    },
    {
      label: 'Completed Matches',
      value: stats?.completed ?? 0,
      icon: '✅',
      cls: 'emerald',
      sub: 'Finalized Outcomes',
    },
  ];

  return (
    <>
      <TopBar
        title="Operations Dashboard"
        actions={
          <button
            id="btn-new-tournament"
            className="btn-primary-gradient"
            onClick={() => onNavigate('tournaments')}
          >
            <span className="btn-icon">+</span>
            <span>New Tournament</span>
          </button>
        }
      />

      <div className="page-wrapper">
        {/* Hero Banner */}
        <div className="dashboard-hero-card">
          <div className="hero-pattern-overlay" />
          <div className="hero-content-stack">
            <div className="hero-pill-badge">
              <span className="live-spark">●</span>
              <span>LIVE OPERATIONS DESK</span>
            </div>
            <h1 className="hero-headline">Tournament Management Suite</h1>
            <p className="hero-description">
              Orchestrate end-to-end sports leagues — automate round-robin fixtures, manage verified rosters,
              record real-time scorecards, and compute dynamic standings.
            </p>
            <div className="hero-action-buttons">
              <button
                id="dash-goto-tournaments"
                className="hero-btn-primary"
                onClick={() => onNavigate('tournaments')}
              >
                <span>🏆 Tournaments Hub</span>
              </button>
              <button
                id="dash-goto-schedule"
                className="hero-btn-glass"
                onClick={() => onNavigate('matches')}
              >
                <span>📅 Match Schedule</span>
              </button>
              <button
                id="dash-goto-standings"
                className="hero-btn-glass"
                onClick={() => onNavigate('standings')}
              >
                <span>🥇 Points Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Executive Stats Grid */}
        <div className="stats-metric-grid">
          {statCards.map((s) => (
            <div key={s.label} className={`stat-card-modern ${s.cls}`}>
              <div className="stat-card-top">
                <span className="stat-card-label">{s.label}</span>
                <div className={`stat-card-icon-pill ${s.cls}`}>{s.icon}</div>
              </div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-subtext">{s.sub}</div>
              <div className="stat-bottom-bar" />
            </div>
          ))}
        </div>

        {/* Recent Tournaments Overview */}
        <div className="modern-panel-card">
          <div className="panel-card-header">
            <div className="panel-header-left">
              <h3 className="panel-title">Active & Recent Tournaments</h3>
              <span className="panel-subtitle">Latest tournaments registered in your league system</span>
            </div>
            <button
              className="btn-view-all-link"
              onClick={() => onNavigate('tournaments')}
            >
              <span>View All Tournaments</span>
              <span className="arrow">→</span>
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="empty-panel-placeholder">
              <div className="empty-icon-box">🏆</div>
              <h4>No Tournaments Initialized Yet</h4>
              <p>Create your first tournament to start scheduling matches and managing teams.</p>
              <button
                className="btn-primary-gradient mt-md"
                onClick={() => onNavigate('tournaments')}
              >
                + Create Tournament
              </button>
            </div>
          ) : (
            <div className="modern-table-container">
              <table className="modern-data-table">
                <thead>
                  <tr>
                    <th>TOURNAMENT NAME</th>
                    <th>SPORT DISCIPLINE</th>
                    <th>COMPETITION DATES</th>
                    <th>ROSTER CAPACITY</th>
                    <th>STATUS</th>
                    <th className="text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.tournament_id} className="table-row-hover">
                      <td>
                        <div className="tournament-name-cell">
                          <span className="tournament-lead-icon">🏆</span>
                          <span className="tournament-main-name">{t.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="sport-pill-tag">{t.sport_type}</span>
                      </td>
                      <td>
                        <div className="date-range-text">
                          {new Date(t.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' → '}
                          {new Date(t.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <div className="capacity-bar-wrapper">
                          <span className="capacity-fraction">
                            <strong>{t.team_count ?? 0}</strong> / {t.max_teams} Teams
                          </span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="text-right">
                        <button
                          className="btn-manage-row"
                          onClick={() => onNavigate('teams')}
                        >
                          Manage Teams →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Operations Modules */}
        <div className="quick-actions-grid">
          {[
            {
              id: 'teams',
              icon: '🛡️',
              title: 'Team Franchises',
              desc: 'Register clubs, upload logos, configure coaches & home venues',
            },
            {
              id: 'players',
              icon: '👥',
              title: 'Player Rosters',
              desc: 'Manage squad contracts, captaincies, jersey numbers & roles',
            },
            {
              id: 'venues',
              icon: '🏟️',
              title: 'Stadiums & Grounds',
              desc: 'Assign match venues, ground availability & capacities',
            },
            {
              id: 'umpires',
              icon: '⚖️',
              title: 'Match Officials',
              desc: 'Coordinate certified umpires & referee allocation rosters',
            },
          ].map((q) => (
            <div
              key={q.id}
              id={`quick-${q.id}`}
              className="quick-action-tile"
              onClick={() => onNavigate(q.id)}
            >
              <div className="tile-icon-bubble">{q.icon}</div>
              <div className="tile-info">
                <div className="tile-title">{q.title}</div>
                <div className="tile-desc">{q.desc}</div>
              </div>
              <div className="tile-arrow">→</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
