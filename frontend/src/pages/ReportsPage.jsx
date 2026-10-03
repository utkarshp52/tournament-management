import { useState, useEffect } from 'react';
import { reportApi } from '../api/api';
import { Spinner, EmptyState, Alert } from '../components/UI';
import TopBar from '../components/TopBar';

// ── Utility helpers ──────────────────────────────────────────────────────────
const fmt = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const medal = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
};

// ── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(filename, headers, rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csvContent = [
    headers.join(','),
    ...rows.map((r) => headers.map((h, i) => escape(r[i])).join(',')),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ChampionBanner({ champion, runnerUp, tournament }) {
  if (!champion) return null;
  return (
    <div className="champion-banner">
      <div className="champion-confetti" aria-hidden="true">
        {['🎉','✨','🏆','⭐','🎊','🥇','🎉','✨'].map((e, i) => (
          <span key={i} className="confetti-piece" style={{ '--delay': `${i * 0.3}s`, '--x': `${10 + i * 11}%` }}>{e}</span>
        ))}
      </div>
      <div className="champion-content">
        <div className="champion-trophy">🏆</div>
        <div className="champion-label">Tournament Champion</div>
        <div className="champion-name">{champion.champion_name}</div>
        {champion.coach_name && <div className="champion-meta">Coach: {champion.coach_name}</div>}
        {champion.home_city  && <div className="champion-meta">📍 {champion.home_city}</div>}
        {runnerUp && (
          <div className="champion-runner-up">🥈 Runner-up: <strong>{runnerUp.team_name}</strong></div>
        )}
        <div className="champion-tournament-name">{tournament.name} · {tournament.sport_type}</div>
      </div>
    </div>
  );
}

function MetricCards({ matchSummary }) {
  const cards = [
    { icon: '🧑‍🤝‍🧑', label: 'Teams',           value: matchSummary.team_count,        cls: 'primary' },
    { icon: '👤',      label: 'Players',         value: matchSummary.player_count,      cls: 'info'    },
    { icon: '🏟️',      label: 'Venues',          value: matchSummary.venue_count,       cls: 'success' },
    { icon: '📅',      label: 'Total Matches',   value: matchSummary.total_matches,     cls: 'warning' },
    { icon: '✅',      label: 'Completed',       value: matchSummary.completed_matches, cls: 'success' },
    { icon: '⏳',      label: 'Pending',         value: matchSummary.scheduled_matches, cls: 'primary' },
  ];
  return (
    <div className="report-metrics-grid">
      {cards.map((c) => (
        <div key={c.label} className="stat-card">
          <div className={`stat-icon ${c.cls}`}>{c.icon}</div>
          <div className="stat-info">
            <div className="stat-label">{c.label}</div>
            <div className="stat-value">{c.value ?? 0}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StandingsTable({ standings }) {
  if (!standings.length) return <EmptyState icon="📋" title="No standings yet" />;
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>#</th><th>Team</th><th>MP</th><th>W</th><th>L</th><th>D</th><th>Pts</th><th>Win%</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s) => (
            <tr key={s.standing_id} className={s.rank <= 2 ? 'stats-leader-row' : ''}>
              <td><span className="rank-badge top" style={{ minWidth: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{medal(s.rank)}</span></td>
              <td><strong style={{ color: 'var(--clr-text-primary)' }}>{s.team_name}</strong>{s.short_name && <span className="badge badge-muted" style={{ marginLeft: 6 }}>{s.short_name}</span>}</td>
              <td>{s.matches_played}</td>
              <td style={{ color: 'var(--clr-success)', fontWeight: 700 }}>{s.wins}</td>
              <td style={{ color: 'var(--clr-danger)' }}>{s.losses}</td>
              <td>{s.draws}</td>
              <td><strong>{s.points}</strong></td>
              <td><span className="badge badge-info">{s.win_percentage}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPerformers({ topScorers, topWickets, topMOM }) {
  return (
    <div className="report-performers-grid">
      {/* Top Scorers */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">🏏 Top Scorers</h3></div>
        {topScorers.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--clr-text-muted)', textAlign: 'center' }}>No data</div>
        ) : (
          <div className="performers-list">
            {topScorers.map((p, i) => (
              <div key={p.player_id} className="performer-row">
                <span className="performer-rank">{medal(i + 1)}</span>
                <div className="performer-info">
                  <span className="performer-name">{p.full_name}</span>
                  <span className="performer-team">{p.team_short || p.team_name}</span>
                </div>
                <div className="performer-stat">
                  <span className="performer-val">{p.runs_scored || p.goals_scored || 0}</span>
                  <span className="performer-stat-label">runs</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Wickets */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">🎯 Top Wicket Takers</h3></div>
        {topWickets.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--clr-text-muted)', textAlign: 'center' }}>No data</div>
        ) : (
          <div className="performers-list">
            {topWickets.map((p, i) => (
              <div key={p.player_id} className="performer-row">
                <span className="performer-rank">{medal(i + 1)}</span>
                <div className="performer-info">
                  <span className="performer-name">{p.full_name}</span>
                  <span className="performer-team">{p.team_short || p.team_name}</span>
                </div>
                <div className="performer-stat">
                  <span className="performer-val">{p.wickets_taken || p.assists || 0}</span>
                  <span className="performer-stat-label">wkts</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Man of Match */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">⭐ Player of Tournament</h3></div>
        {topMOM.length === 0 ? (
          <div style={{ padding: '16px', color: 'var(--clr-text-muted)', textAlign: 'center' }}>No data</div>
        ) : (
          <div className="performers-list">
            {topMOM.map((p, i) => (
              <div key={p.player_id} className="performer-row">
                <span className="performer-rank">{medal(i + 1)}</span>
                <div className="performer-info">
                  <span className="performer-name">{p.full_name}</span>
                  <span className="performer-team">{p.team_short || p.team_name}</span>
                </div>
                <div className="performer-stat">
                  <span className="performer-val">⭐{p.man_of_match_count}</span>
                  <span className="performer-stat-label">MOM</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KnockoutSummary({ knockoutBracket }) {
  if (!knockoutBracket.length) return null;
  const semis = knockoutBracket.filter((b) => b.stage === 'semi_final');
  const final = knockoutBracket.find((b) => b.stage === 'final');
  return (
    <div className="report-knockout-summary">
      {semis.length > 0 && (
        <div className="knockout-stage-group">
          <div className="knockout-stage-label">Semi-Finals</div>
          <div className="knockout-stage-matches">
            {semis.map((b, i) => (
              <div key={i} className="knockout-mini-card">
                <span className={b.winner_name === b.team1_name ? 'ko-winner' : ''}>{b.team1_name || 'TBD'}</span>
                <span className="ko-vs">vs</span>
                <span className={b.winner_name === b.team2_name ? 'ko-winner' : ''}>{b.team2_name || 'TBD'}</span>
                {b.winner_name && <span className="ko-result">→ {b.winner_name}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {final && (
        <div className="knockout-stage-group">
          <div className="knockout-stage-label">🏆 Final</div>
          <div className="knockout-stage-matches">
            <div className="knockout-mini-card final-card">
              <span className={final.winner_name === final.team1_name ? 'ko-winner' : ''}>{final.team1_name || 'TBD'}</span>
              <span className="ko-vs">vs</span>
              <span className={final.winner_name === final.team2_name ? 'ko-winner' : ''}>{final.team2_name || 'TBD'}</span>
              {final.winner_name && <span className="ko-result champion-result">🏆 {final.winner_name}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchResultsTable({ matchResults, onExportCSV }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📅 All Match Results ({matchResults.length})</h3>
        <button id="btn-export-results" className="btn btn-secondary btn-sm" onClick={onExportCSV}>
          ⬇ Export CSV
        </button>
      </div>
      {matchResults.length === 0 ? (
        <EmptyState icon="📅" title="No completed matches" desc="Results will appear here after matches are completed." />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th><th>Round</th><th>Date</th><th>Home</th><th>Score</th><th>Away</th><th>Winner</th><th>MOM</th><th>Venue</th>
              </tr>
            </thead>
            <tbody>
              {matchResults.map((m, i) => (
                <tr key={m.match_id}>
                  <td className="text-muted">{i + 1}</td>
                  <td><span className="badge badge-info">{m.round}</span></td>
                  <td style={{ fontSize: '12px' }}>{fmt(m.match_date)}</td>
                  <td><strong>{m.home_short || m.home_team}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--clr-accent)' }}>
                    {m.home_score || '—'} — {m.away_score || '—'}
                  </td>
                  <td><strong>{m.away_short || m.away_team}</strong></td>
                  <td>
                    {m.is_draw ? (
                      <span className="badge badge-warning">Draw</span>
                    ) : m.winner_name ? (
                      <span className="badge badge-success">🏆 {m.winner_short || m.winner_name}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--clr-text-secondary)' }}>{m.man_of_match || '—'}</td>
                  <td style={{ fontSize: '11px', color: 'var(--clr-text-muted)' }}>{m.venue_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tournaments,        setTournaments]        = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [report,             setReport]             = useState(null);
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState('');
  const [activeTab,          setActiveTab]          = useState('summary');

  // Load tournament list on mount
  useEffect(() => {
    reportApi.listTournaments()
      .then((data) => {
        setTournaments(data);
        if (data.length > 0) setSelectedTournament(data[0].tournament_id);
      })
      .catch(() => setError('Failed to load tournaments'));
  }, []);

  // Load report when tournament changes
  useEffect(() => {
    if (!selectedTournament) { setReport(null); return; }
    setLoading(true);
    setError('');
    reportApi.summary(selectedTournament)
      .then(setReport)
      .catch((e) => setError(e.message || 'Failed to load report'))
      .finally(() => setLoading(false));
  }, [selectedTournament]);

  // Export standings CSV
  const exportStandings = () => {
    if (!report) return;
    exportCSV(
      `${report.tournament.name}_standings.csv`,
      ['Rank', 'Team', 'Played', 'Wins', 'Losses', 'Draws', 'Points', 'Win%'],
      report.standings.map((s) => [s.rank, s.team_name, s.matches_played, s.wins, s.losses, s.draws, s.points, s.win_percentage + '%'])
    );
  };

  // Export match results CSV
  const exportResults = () => {
    if (!report) return;
    exportCSV(
      `${report.tournament.name}_results.csv`,
      ['#', 'Round', 'Date', 'Home Team', 'Home Score', 'Away Team', 'Away Score', 'Winner', 'Man of Match', 'Venue'],
      report.matchResults.map((m, i) => [
        i + 1, m.round, fmt(m.match_date),
        m.home_team, m.home_score || '', m.away_team, m.away_score || '',
        m.is_draw ? 'Draw' : (m.winner_name || ''), m.man_of_match || '', m.venue_name || ''
      ])
    );
  };

  const tabs = [
    { id: 'summary',    label: '📊 Summary'     },
    { id: 'standings',  label: '📋 Standings'   },
    { id: 'performers', label: '⭐ Performers'   },
    { id: 'results',    label: '📅 Results'      },
    { id: 'knockout',   label: '🥇 Knockout'    },
  ];

  return (
    <>
      <TopBar
        title="📄 Tournament Reports"
        actions={
          report && (
            <div className="flex gap-sm">
              <button id="btn-export-standings" className="btn btn-secondary btn-sm" onClick={exportStandings}>
                ⬇ Standings CSV
              </button>
              <button id="btn-export-all-results" className="btn btn-secondary btn-sm" onClick={exportResults}>
                ⬇ Results CSV
              </button>
              <button id="btn-print-report" className="btn btn-primary btn-sm" onClick={() => window.print()}>
                🖨 Print Report
              </button>
            </div>
          )
        }
      />

      <div className="page-wrapper">
        {error && <Alert type="danger">❌ {error}</Alert>}

        {/* Tournament Selector */}
        <div className="report-selector-bar">
          <div className="form-group" style={{ minWidth: '280px', marginBottom: 0 }}>
            <label className="form-label">Select Tournament</label>
            <select
              id="report-tournament-select"
              className="form-control"
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
            >
              <option value="">— Choose a tournament —</option>
              {tournaments.map((t) => (
                <option key={t.tournament_id} value={t.tournament_id}>
                  {t.name} ({t.sport_type}) · {t.status}
                </option>
              ))}
            </select>
          </div>
          {report && (
            <div className="report-tournament-meta">
              <span className="badge badge-info">{report.tournament.sport_type}</span>
              <span className="badge badge-muted">{fmt(report.tournament.start_date)} → {fmt(report.tournament.end_date)}</span>
              <span className={`badge ${report.tournament.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                {report.tournament.status}
              </span>
            </div>
          )}
        </div>

        {!selectedTournament ? (
          <EmptyState icon="📄" title="Select a Tournament" desc="Choose a tournament above to generate its full report." />
        ) : loading ? (
          <Spinner text="Generating report..." />
        ) : !report ? null : (
          <>
            {/* Champion Banner */}
            <ChampionBanner
              champion={report.champion}
              runnerUp={report.runnerUp}
              tournament={report.tournament}
            />

            {/* Metric Cards */}
            <MetricCards matchSummary={report.matchSummary} />

            {/* Tabs */}
            <div className="result-tabs report-tabs" style={{ marginBottom: '24px' }}>
              {tabs.map((t) => (
                <button
                  key={t.id}
                  id={`report-tab-${t.id}`}
                  className={`result-tab ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'summary' && (
              <div className="report-summary-section">
                <div className="card">
                  <div className="card-header"><h3 className="card-title">🏆 Tournament Details</h3></div>
                  <div className="report-detail-grid">
                    {[
                      ['Tournament Name', report.tournament.name],
                      ['Sport', report.tournament.sport_type],
                      ['Format', report.tournament.format],
                      ['Location', report.tournament.location || '—'],
                      ['Start Date', fmt(report.tournament.start_date)],
                      ['End Date', fmt(report.tournament.end_date)],
                      ['Status', report.tournament.status],
                      ['Organizer', report.tournament.organizer_name || '—'],
                      ['Max Teams', report.tournament.max_teams],
                      ['Description', report.tournament.description || '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="report-detail-item">
                        <div className="report-detail-label">{k}</div>
                        <div className="report-detail-value">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Knockout summary inside Summary tab */}
                <div className="card" style={{ marginTop: '20px' }}>
                  <div className="card-header"><h3 className="card-title">🥊 Knockout Progression</h3></div>
                  {report.knockoutBracket.length === 0
                    ? <EmptyState icon="🥊" title="Knockout not started" desc="Generate bracket from the Knockout page." />
                    : <KnockoutSummary knockoutBracket={report.knockoutBracket} />
                  }
                </div>
              </div>
            )}

            {activeTab === 'standings' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">📋 Final Standings</h3>
                  <button className="btn btn-secondary btn-sm" onClick={exportStandings}>⬇ Export CSV</button>
                </div>
                <StandingsTable standings={report.standings} />
              </div>
            )}

            {activeTab === 'performers' && (
              <TopPerformers
                topScorers={report.topScorers}
                topWickets={report.topWickets}
                topMOM={report.topMOM}
              />
            )}

            {activeTab === 'results' && (
              <MatchResultsTable matchResults={report.matchResults} onExportCSV={exportResults} />
            )}

            {activeTab === 'knockout' && (
              <div className="card">
                <div className="card-header"><h3 className="card-title">🥇 Knockout Bracket</h3></div>
                {report.knockoutBracket.length === 0
                  ? <EmptyState icon="🥊" title="Knockout not generated" desc="Complete group stage matches and generate the knockout bracket." />
                  : <KnockoutSummary knockoutBracket={report.knockoutBracket} />
                }
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
