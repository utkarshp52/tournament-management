import { useState, useEffect } from 'react';
import { matchApi, tournamentApi, teamApi, venueApi, umpireApi } from '../api/api';
import { Spinner, EmptyState, StatusBadge, ConfirmDialog, Alert } from '../components/UI';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';

const STATUS_FILTERS = [
  { value: '',           label: 'All Matches' },
  { value: 'scheduled',  label: '📅 Scheduled' },
  { value: 'ongoing',    label: '🟢 Ongoing' },
  { value: 'completed',  label: '✅ Completed' },
  { value: 'postponed',  label: '⚠️ Postponed' },
  { value: 'cancelled',  label: '❌ Cancelled' },
];

export default function MatchesPage() {
  const [tournaments, setTournaments]     = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [matches, setMatches]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [generating, setGenerating]       = useState(false);
  const [statusFilter, setStatusFilter]   = useState('');
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [confirmClear, setConfirmClear]   = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Match edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMatch, setEditMatch]         = useState(null);
  const [editForm, setEditForm]           = useState({});
  const [venues, setVenues]               = useState([]);
  const [umpires, setUmpires]             = useState([]);
  const [saving, setSaving]               = useState(false);

  // Load tournaments
  useEffect(() => {
    tournamentApi.getAll()
      .then(data => {
        setTournaments(data);
        if (data.length > 0) setSelectedTournament(data[0].tournament_id);
      })
      .catch(() => setError('Failed to load tournaments'));
  }, []);

  // Load matches when tournament changes
  useEffect(() => {
    if (!selectedTournament) return;
    loadMatches();
    // Load venues and umpires for editing
    venueApi.getAll(selectedTournament).then(setVenues).catch(() => {});
    umpireApi.getAll(selectedTournament).then(setUmpires).catch(() => {});
  }, [selectedTournament]);

  const loadMatches = () => {
    if (!selectedTournament) return;
    setLoading(true);
    const params = { tournament_id: selectedTournament };
    if (statusFilter) params.status = statusFilter;
    matchApi.getAll(params)
      .then(setMatches)
      .catch(() => setError('Failed to load matches'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedTournament) loadMatches();
  }, [statusFilter]);

  // Generate fixtures
  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const result = await matchApi.generateFixtures({ tournament_id: selectedTournament });
      setSuccess(result.message);
      loadMatches();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Clear fixtures
  const handleClear = async () => {
    setConfirmClear(false);
    setError('');
    try {
      await matchApi.clearFixtures(selectedTournament);
      setSuccess('All group stage fixtures cleared');
      loadMatches();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit match
  const openEdit = (m) => {
    setEditMatch(m);
    setEditForm({
      venue_id:   m.venue_id || '',
      umpire_id:  m.umpire_id || '',
      match_date: m.match_date?.slice(0, 10) || '',
      match_time: m.match_time || '',
      round:      m.round || 'Group Stage',
      status:     m.status || 'scheduled',
      notes:      m.notes || '',
    });
    setShowEditModal(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await matchApi.update(editMatch.match_id, editForm);
      setShowEditModal(false);
      setSuccess('Match updated');
      loadMatches();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Counts
  const totalMatches     = matches.length;
  const completedMatches = matches.filter(m => m.status === 'completed').length;
  const scheduledMatches = matches.filter(m => m.status === 'scheduled').length;

  const filtered = statusFilter
    ? matches.filter(m => m.status === statusFilter)
    : matches;

  // Group by date
  const groupedByDate = {};
  filtered.forEach(m => {
    const dateKey = m.match_date?.slice(0, 10) || 'TBD';
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(m);
  });
  const sortedDates = Object.keys(groupedByDate).sort();

  const currentTournament = tournaments.find(t => t.tournament_id == selectedTournament);

  return (
    <>
      <TopBar
        title="📅 Match Schedule"
        actions={
          <div className="flex gap-sm">
            {matches.length > 0 && (
              <button
                id="btn-clear-fixtures"
                className="btn btn-danger btn-sm"
                onClick={() => setConfirmClear(true)}
              >
                🗑 Clear Fixtures
              </button>
            )}
            <button
              id="btn-generate-fixtures"
              className="btn btn-primary btn-sm"
              onClick={handleGenerate}
              disabled={generating || !selectedTournament}
            >
              {generating ? '⚙️ Generating...' : '⚡ Generate Fixtures'}
            </button>
          </div>
        }
      />

      <div className="page-wrapper">
        {success && <Alert type="success">✅ {success}</Alert>}
        {error && <Alert type="danger">❌ {error}</Alert>}

        {/* Filters Bar */}
        <div className="schedule-filters">
          <div className="form-group" style={{ minWidth: '220px' }}>
            <label className="form-label">Tournament</label>
            <select
              id="schedule-tournament-select"
              className="form-control"
              value={selectedTournament}
              onChange={e => setSelectedTournament(e.target.value)}
            >
              <option value="">Select tournament...</option>
              {tournaments.map(t => (
                <option key={t.tournament_id} value={t.tournament_id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ minWidth: '180px' }}>
            <label className="form-label">Filter Status</label>
            <select
              id="schedule-status-filter"
              className="form-control"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Stats mini-cards */}
          <div className="schedule-stats">
            <div className="schedule-stat-chip">
              <span className="schedule-stat-number">{totalMatches}</span>
              <span className="schedule-stat-label">Total</span>
            </div>
            <div className="schedule-stat-chip completed">
              <span className="schedule-stat-number">{completedMatches}</span>
              <span className="schedule-stat-label">Played</span>
            </div>
            <div className="schedule-stat-chip scheduled">
              <span className="schedule-stat-number">{scheduledMatches}</span>
              <span className="schedule-stat-label">Upcoming</span>
            </div>
          </div>
        </div>

        {/* Matches Content */}
        {!selectedTournament ? (
          <EmptyState icon="🏆" title="Select a Tournament" desc="Choose a tournament to view or generate its match schedule." />
        ) : loading ? (
          <Spinner text="Loading fixtures..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📅"
            title={matches.length === 0 ? 'No Fixtures Yet' : 'No matches match the filter'}
            desc={matches.length === 0
              ? `Generate round-robin fixtures for "${currentTournament?.name || 'this tournament'}". Make sure you have at least 2 teams registered.`
              : 'Try changing the status filter above.'}
            action={matches.length === 0 && (
              <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? '⚙️ Generating...' : '⚡ Generate Fixtures'}
              </button>
            )}
          />
        ) : (
          <div className="schedule-timeline">
            {sortedDates.map(dateKey => (
              <div key={dateKey} className="schedule-date-group">
                <div className="schedule-date-header">
                  <div className="schedule-date-badge">
                    <span className="schedule-date-day">
                      {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="schedule-date-full">
                      {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <span className="text-muted text-sm">
                    {groupedByDate[dateKey].length} match{groupedByDate[dateKey].length !== 1 ? 'es' : ''}
                  </span>
                </div>

                <div className="schedule-matches-list">
                  {groupedByDate[dateKey].map(m => (
                    <div key={m.match_id} className={`match-card ${m.status}`}>
                      <div className="match-card-number">M{m.match_number || '—'}</div>

                      <div className="match-card-teams">
                        <div className={`match-team home ${m.winner_team_id === m.home_team_id ? 'winner' : ''}`}>
                          <span className="team-name">{m.home_team_name}</span>
                          {m.status === 'completed' && (
                            <span className="team-score">{m.home_score || '—'}</span>
                          )}
                        </div>
                        <div className="match-vs">
                          {m.status === 'completed'
                            ? (m.is_draw ? 'DRAW' : 'vs')
                            : 'vs'}
                        </div>
                        <div className={`match-team away ${m.winner_team_id === m.away_team_id ? 'winner' : ''}`}>
                          <span className="team-name">{m.away_team_name}</span>
                          {m.status === 'completed' && (
                            <span className="team-score">{m.away_score || '—'}</span>
                          )}
                        </div>
                      </div>

                      <div className="match-card-info">
                        {m.match_time && (
                          <span className="match-info-item">🕐 {m.match_time.slice(0, 5)}</span>
                        )}
                        {m.venue_name && (
                          <span className="match-info-item">🏟️ {m.venue_name}</span>
                        )}
                        {m.umpire_name && (
                          <span className="match-info-item">🧑‍⚖️ {m.umpire_name}</span>
                        )}
                      </div>

                      <div className="match-card-actions">
                        <StatusBadge status={m.status} />
                        <button
                          id={`edit-match-${m.match_id}`}
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEdit(m)}
                          title="Edit match"
                        >
                          ✏️
                        </button>
                      </div>

                      {m.status === 'completed' && m.winner_team_name && (
                        <div className="match-card-result">
                          🏆 {m.winner_team_name} won{m.margin ? ` by ${m.margin}` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Match Modal */}
      {showEditModal && editMatch && (
        <Modal
          title={`✏️ Edit Match #${editMatch.match_number || editMatch.match_id}`}
          onClose={() => setShowEditModal(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button id="btn-save-match" className="btn btn-primary btn-sm" onClick={handleEditSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          }
        >
          <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="match-edit-teams">
              <span className="badge badge-primary">{editMatch.home_team_name}</span>
              <span className="text-muted">vs</span>
              <span className="badge badge-danger">{editMatch.away_team_name}</span>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={editForm.match_date}
                  onChange={e => setEditForm(f => ({ ...f, match_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input type="time" className="form-control" value={editForm.match_time?.slice(0, 5) || ''}
                  onChange={e => setEditForm(f => ({ ...f, match_time: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Venue</label>
                <select className="form-control" value={editForm.venue_id}
                  onChange={e => setEditForm(f => ({ ...f, venue_id: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {venues.map(v => (
                    <option key={v.venue_id} value={v.venue_id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Umpire</label>
                <select className="form-control" value={editForm.umpire_id}
                  onChange={e => setEditForm(f => ({ ...f, umpire_id: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {umpires.map(u => (
                    <option key={u.umpire_id} value={u.umpire_id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Round</label>
                <select className="form-control" value={editForm.round}
                  onChange={e => setEditForm(f => ({ ...f, round: e.target.value }))}>
                  {['Group Stage', 'Semi-Final 1', 'Semi-Final 2', 'Final'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  {['scheduled', 'ongoing', 'completed', 'postponed', 'cancelled'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows="2" value={editForm.notes}
                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional match notes..." />
            </div>
          </form>
        </Modal>
      )}

      {/* Clear Confirm */}
      {confirmClear && (
        <ConfirmDialog
          message={`Are you sure you want to clear all group-stage fixtures for this tournament? This will also reset the standings table.`}
          onConfirm={handleClear}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </>
  );
}
