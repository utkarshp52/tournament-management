import { useState, useEffect } from 'react';
import { tournamentApi, teamApi, playerApi, matchApi } from '../api/api';
import { Spinner, StatusBadge } from '../components/UI';
import TopBar from '../components/TopBar';

export default function Dashboard({ onNavigate }) {
  const [stats, setStats]       = useState(null);
  const [recent, setRecent]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      tournamentApi.getAll(),
      teamApi.getAll(),
      playerApi.getAll(),
      matchApi.getAll(),
    ]).then(([tournaments, teams, players, matches]) => {
      setStats({
        tournaments: tournaments.length,
        teams:       teams.length,
        players:     players.length,
        matches:     matches.length,
        upcoming:    matches.filter(m => m.status === 'scheduled').length,
        completed:   matches.filter(m => m.status === 'completed').length,
      });
      setRecent(tournaments.slice(0, 6));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <><TopBar title="📊 Dashboard" /><Spinner /></>;

  const statCards = [
    { label: 'Tournaments', value: stats?.tournaments ?? 0, icon: '🏆', cls: 'primary' },
    { label: 'Teams',       value: stats?.teams       ?? 0, icon: '🧑‍🤝‍🧑', cls: 'info'    },
    { label: 'Players',     value: stats?.players     ?? 0, icon: '👤', cls: 'success'  },
    { label: 'Matches',     value: stats?.matches     ?? 0, icon: '📅', cls: 'warning'  },
    { label: 'Upcoming',    value: stats?.upcoming    ?? 0, icon: '🕐', cls: 'primary'  },
    { label: 'Completed',   value: stats?.completed   ?? 0, icon: '✅', cls: 'success'  },
  ];

  return (
    <>
      <TopBar
        title="📊 Dashboard"
        actions={
          <button id="btn-new-tournament" className="btn btn-primary btn-sm" onClick={() => onNavigate('tournaments')}>
            + New Tournament
          </button>
        }
      />
      <div className="page-wrapper">
        {/* Hero */}
        <div className="hero">
          <h1 className="hero-title">Tournament Management System</h1>
          <p className="hero-subtitle">
            Centralize your tournament operations — from team registration and scheduling
            to live standings and champion declaration.
          </p>
          <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
            <button id="dash-goto-tournaments" className="btn btn-primary" onClick={() => onNavigate('tournaments')}>
              🏆 Tournaments
            </button>
            <button id="dash-goto-schedule" className="btn btn-secondary" onClick={() => onNavigate('matches')}>
              📅 Schedule
            </button>
            <button id="dash-goto-standings" className="btn btn-secondary" onClick={() => onNavigate('standings')}>
              📋 Standings
            </button>
          </div>
        </div>

        {/* Stat Grid */}
        <div className="grid grid-3" style={{ marginBottom: '32px' }}>
          {statCards.map(s => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div className="stat-info">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Tournaments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Tournaments</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('tournaments')}>
              View All →
            </button>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
              No tournaments yet. <button className="btn btn-primary btn-sm" style={{ marginLeft: '8px' }} onClick={() => onNavigate('tournaments')}>Create one</button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Sport</th>
                    <th>Dates</th>
                    <th>Teams</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(t => (
                    <tr key={t.tournament_id}>
                      <td><strong style={{ color: 'var(--clr-text-primary)' }}>{t.name}</strong></td>
                      <td><span className="badge badge-info">{t.sport_type}</span></td>
                      <td style={{ fontSize: '12px' }}>
                        {new Date(t.start_date).toLocaleDateString()} → {new Date(t.end_date).toLocaleDateString()}
                      </td>
                      <td>{t.team_count ?? 0} / {t.max_teams}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('teams')}>
                          Manage →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-4 mt-lg">
          {[
            { id: 'teams',     icon: '🧑‍🤝‍🧑', label: 'Manage Teams',    desc: 'Register and edit teams' },
            { id: 'players',   icon: '👤', label: 'Manage Players',  desc: 'Add player rosters' },
            { id: 'venues',    icon: '🏟️',  label: 'Manage Venues',   desc: 'Configure match venues' },
            { id: 'umpires',   icon: '🧑‍⚖️', label: 'Manage Umpires',  desc: 'Assign umpires' },
          ].map(q => (
            <div
              key={q.id}
              id={`quick-${q.id}`}
              className="card"
              style={{ cursor: 'pointer', textAlign: 'center' }}
              onClick={() => onNavigate(q.id)}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{q.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{q.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--clr-text-muted)' }}>{q.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
