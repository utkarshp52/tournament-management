import { useState, useEffect } from 'react';
import { matchApi, resultApi, tournamentApi, playerApi } from '../api/api';
import { Spinner, EmptyState, StatusBadge, Alert } from '../components/UI';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';

export default function ResultsPage() {
  const [tournaments, setTournaments]     = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [matches, setMatches]             = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');

  // Result entry modal
  const [showModal, setShowModal]         = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [players, setPlayers]             = useState([]);
  const [saving, setSaving]               = useState(false);
  const [resultForm, setResultForm]       = useState({
    home_score: '',
    away_score: '',
    winner_team_id: '',
    margin: '',
    is_draw: false,
    man_of_match_id: '',
    result_notes: '',
  });

  // Tabs
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'completed'

  // Load tournaments
  useEffect(() => {
    tournamentApi.getAll()
      .then(data => {
        setTournaments(data);
        if (data.length > 0) setSelectedTournament(data[0].tournament_id);
      })
      .catch(() => setError('Failed to load tournaments'));
  }, []);

  // Load matches
  useEffect(() => {
    if (!selectedTournament) return;
    loadMatches();
  }, [selectedTournament]);

  const loadMatches = () => {
    setLoading(true);
    matchApi.getAll({ tournament_id: selectedTournament })
      .then(setMatches)
      .catch(() => setError('Failed to load matches'))
      .finally(() => setLoading(false));
  };

  const pendingMatches   = matches.filter(m => m.status === 'scheduled' || m.status === 'ongoing');
  const completedMatches = matches.filter(m => m.status === 'completed');

  const displayMatches = activeTab === 'pending' ? pendingMatches : completedMatches;

  // Open result entry modal
  const openResultEntry = (match) => {
    setSelectedMatch(match);
    setResultForm({
      home_score: match.home_score || '',
      away_score: match.away_score || '',
      winner_team_id: match.winner_team_id || '',
      margin: match.margin || '',
      is_draw: match.is_draw || false,
      man_of_match_id: match.man_of_match_id || '',
      result_notes: match.result_notes || '',
    });
    setError('');

    // Load players from both teams
    playerApi.getAll({ tournament_id: selectedTournament })
      .then(data => {
        const teamPlayers = data.filter(
          p => p.team_id === match.home_team_id || p.team_id === match.away_team_id
        );
        setPlayers(teamPlayers);
      })
      .catch(() => setPlayers([]));

    setShowModal(true);
  };

  // Save result
  const handleSaveResult = async (e) => {
    e.preventDefault();
    if (!resultForm.home_score || !resultForm.away_score) {
      setError('Both scores are required');
      return;
    }
    if (!resultForm.is_draw && !resultForm.winner_team_id) {
      setError('Select a winner or mark as draw');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await resultApi.save({
        match_id: selectedMatch.match_id,
        winner_team_id: resultForm.is_draw ? null : resultForm.winner_team_id,
        home_score: resultForm.home_score,
        away_score: resultForm.away_score,
        margin: resultForm.margin,
        is_draw: resultForm.is_draw,
        man_of_match_id: resultForm.man_of_match_id || null,
        result_notes: resultForm.result_notes,
      });
      setShowModal(false);
      setSuccess('Result recorded & standings updated!');
      loadMatches();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDrawToggle = (checked) => {
    setResultForm(f => ({
      ...f,
      is_draw: checked,
      winner_team_id: checked ? '' : f.winner_team_id,
    }));
  };

  return (
    <>
      <TopBar title="✅ Match Results" />

      <div className="page-wrapper">
        {success && <Alert type="success">✅ {success}</Alert>}
        {error && !showModal && <Alert type="danger">❌ {error}</Alert>}

        {/* Tournament selector */}
        <div className="schedule-filters" style={{ marginBottom: '24px' }}>
          <div className="form-group" style={{ minWidth: '220px' }}>
            <label className="form-label">Tournament</label>
            <select
              id="result-tournament-select"
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

          <div className="schedule-stats">
            <div className="schedule-stat-chip scheduled">
              <span className="schedule-stat-number">{pendingMatches.length}</span>
              <span className="schedule-stat-label">Pending</span>
            </div>
            <div className="schedule-stat-chip completed">
              <span className="schedule-stat-number">{completedMatches.length}</span>
              <span className="schedule-stat-label">Completed</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="result-tabs">
          <button
            className={`result-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            📅 Pending Results ({pendingMatches.length})
          </button>
          <button
            className={`result-tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            ✅ Completed ({completedMatches.length})
          </button>
        </div>

        {/* Content */}
        {!selectedTournament ? (
          <EmptyState icon="🏆" title="Select a Tournament" desc="Choose a tournament to manage results." />
        ) : loading ? (
          <Spinner text="Loading matches..." />
        ) : displayMatches.length === 0 ? (
          <EmptyState
            icon={activeTab === 'pending' ? '🎉' : '📅'}
            title={activeTab === 'pending' ? 'All Results Recorded!' : 'No Completed Matches'}
            desc={activeTab === 'pending'
              ? 'All scheduled matches have results. Great job!'
              : 'No matches have been completed yet. Record results from the Pending tab.'}
          />
        ) : (
          <div className="results-grid">
            {displayMatches.map(m => (
              <div key={m.match_id} className={`result-card ${m.status}`}>
                {/* Match header */}
                <div className="result-card-header">
                  <span className="result-match-num">Match #{m.match_number || m.match_id}</span>
                  <StatusBadge status={m.status} />
                </div>

                {/* Teams & Score */}
                <div className="result-card-body">
                  <div className={`result-team ${m.winner_team_id === m.home_team_id ? 'winner' : ''}`}>
                    <span className="result-team-name">{m.home_team_name}</span>
                    <span className="result-team-score">
                      {m.status === 'completed' ? (m.home_score || '0') : '—'}
                    </span>
                  </div>

                  <div className="result-divider">
                    {m.status === 'completed'
                      ? (m.is_draw ? <span className="result-draw-badge">DRAW</span> : <span className="result-vs">vs</span>)
                      : <span className="result-vs">vs</span>
                    }
                  </div>

                  <div className={`result-team ${m.winner_team_id === m.away_team_id ? 'winner' : ''}`}>
                    <span className="result-team-name">{m.away_team_name}</span>
                    <span className="result-team-score">
                      {m.status === 'completed' ? (m.away_score || '0') : '—'}
                    </span>
                  </div>
                </div>

                {/* Meta */}
                <div className="result-card-meta">
                  {m.match_date && (
                    <span>📅 {new Date(m.match_date.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  )}
                  {m.venue_name && <span>🏟️ {m.venue_name}</span>}
                  {m.winner_team_name && <span>🏆 {m.winner_team_name}</span>}
                </div>

                {/* Action */}
                <div className="result-card-action">
                  <button
                    id={`record-result-${m.match_id}`}
                    className={`btn ${m.status === 'completed' ? 'btn-secondary' : 'btn-success'} btn-sm w-full`}
                    onClick={() => openResultEntry(m)}
                  >
                    {m.status === 'completed' ? '✏️ Edit Result' : '📝 Record Result'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Result Entry Modal */}
      {showModal && selectedMatch && (
        <Modal
          title={`📝 Record Result — Match #${selectedMatch.match_number || selectedMatch.match_id}`}
          onClose={() => setShowModal(false)}
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="btn-save-result" className="btn btn-primary btn-sm" onClick={handleSaveResult} disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Result'}
              </button>
            </>
          }
        >
          {error && <Alert type="danger">{error}</Alert>}

          <form onSubmit={handleSaveResult} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Team matchup display */}
            <div className="result-modal-matchup">
              <div className="result-modal-team home">
                <div className="result-modal-team-name">{selectedMatch.home_team_name}</div>
                <div className="form-group">
                  <label className="form-label">Score *</label>
                  <input
                    id="home-score"
                    className="form-control result-score-input"
                    value={resultForm.home_score}
                    onChange={e => setResultForm(f => ({ ...f, home_score: e.target.value }))}
                    placeholder="e.g. 245/8 or 3"
                    required
                  />
                </div>
              </div>

              <div className="result-modal-vs">VS</div>

              <div className="result-modal-team away">
                <div className="result-modal-team-name">{selectedMatch.away_team_name}</div>
                <div className="form-group">
                  <label className="form-label">Score *</label>
                  <input
                    id="away-score"
                    className="form-control result-score-input"
                    value={resultForm.away_score}
                    onChange={e => setResultForm(f => ({ ...f, away_score: e.target.value }))}
                    placeholder="e.g. 230/10 or 1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Draw toggle */}
            <div className="result-draw-toggle">
              <label className="result-checkbox-label">
                <input
                  type="checkbox"
                  checked={resultForm.is_draw}
                  onChange={e => handleDrawToggle(e.target.checked)}
                />
                <span>Match ended in a Draw / No Result</span>
              </label>
            </div>

            {/* Winner selection (if not draw) */}
            {!resultForm.is_draw && (
              <div className="form-group">
                <label className="form-label">Winner *</label>
                <div className="result-winner-buttons">
                  <button
                    type="button"
                    className={`result-winner-btn ${resultForm.winner_team_id == selectedMatch.home_team_id ? 'selected' : ''}`}
                    onClick={() => setResultForm(f => ({ ...f, winner_team_id: selectedMatch.home_team_id }))}
                  >
                    🏆 {selectedMatch.home_team_name}
                  </button>
                  <button
                    type="button"
                    className={`result-winner-btn ${resultForm.winner_team_id == selectedMatch.away_team_id ? 'selected' : ''}`}
                    onClick={() => setResultForm(f => ({ ...f, winner_team_id: selectedMatch.away_team_id }))}
                  >
                    🏆 {selectedMatch.away_team_name}
                  </button>
                </div>
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Margin</label>
                <input
                  className="form-control"
                  value={resultForm.margin}
                  onChange={e => setResultForm(f => ({ ...f, margin: e.target.value }))}
                  placeholder="e.g. 7 wickets, 2 goals"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Man of the Match</label>
                <select
                  className="form-control"
                  value={resultForm.man_of_match_id}
                  onChange={e => setResultForm(f => ({ ...f, man_of_match_id: e.target.value }))}
                >
                  <option value="">Select player...</option>
                  {players.map(p => (
                    <option key={p.player_id} value={p.player_id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-control"
                rows="2"
                value={resultForm.result_notes}
                onChange={e => setResultForm(f => ({ ...f, result_notes: e.target.value }))}
                placeholder="Optional match summary..."
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
