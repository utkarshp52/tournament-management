import { useState, useEffect } from 'react';
import { knockoutApi, tournamentApi, resultApi } from '../api/api';
import { Spinner, EmptyState, StatusBadge, ConfirmDialog, Alert } from '../components/UI';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';

export default function KnockoutPage() {
  const [tournaments, setTournaments]     = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [bracketData, setBracketData]     = useState({ brackets: [], champion: null });
  const [loading, setLoading]             = useState(false);
  const [generating, setGenerating]       = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [confirmClear, setConfirmClear]   = useState(false);

  // Winner recording modal
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedBracket, setSelectedBracket] = useState(null);
  const [selectedWinner, setSelectedWinner]   = useState('');
  const [saving, setSaving]               = useState(false);

  // Result entry for knockout match
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultForm, setResultForm] = useState({
    home_score: '', away_score: '', margin: '', result_notes: ''
  });

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
    loadBrackets();
  }, [selectedTournament]);

  const loadBrackets = () => {
    setLoading(true);
    knockoutApi.get(selectedTournament)
      .then(setBracketData)
      .catch(() => setError('Failed to load knockout bracket'))
      .finally(() => setLoading(false));
  };

  // Generate knockout bracket
  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const result = await knockoutApi.generate({ tournament_id: selectedTournament });
      setSuccess(result.message);
      loadBrackets();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Clear bracket
  const handleClear = async () => {
    setConfirmClear(false);
    try {
      await knockoutApi.clear(selectedTournament);
      setSuccess('Knockout bracket cleared');
      loadBrackets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Open winner recording
  const openRecordWinner = (bracket) => {
    setSelectedBracket(bracket);
    setSelectedWinner('');
    setResultForm({ home_score: '', away_score: '', margin: '', result_notes: '' });
    setError('');
    setShowWinnerModal(true);
  };

  // Save winner
  const handleRecordWinner = async () => {
    if (!selectedWinner) {
      setError('Please select a winner');
      return;
    }

    setSaving(true);
    setError('');
    try {
      // First record the match result if scores provided
      if (resultForm.home_score && resultForm.away_score && selectedBracket.match_id) {
        await resultApi.save({
          match_id: selectedBracket.match_id,
          winner_team_id: selectedWinner,
          home_score: resultForm.home_score,
          away_score: resultForm.away_score,
          margin: resultForm.margin,
          is_draw: false,
          result_notes: resultForm.result_notes,
        });
      }

      // Then record the knockout winner
      await knockoutApi.recordWinner({
        bracket_id: selectedBracket.bracket_id,
        winner_id: parseInt(selectedWinner),
      });

      setShowWinnerModal(false);
      setSuccess(
        selectedBracket.stage === 'final'
          ? '🏆 Champion declared! Tournament completed!'
          : 'Winner recorded and progressed to final!'
      );
      loadBrackets();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const { brackets, champion } = bracketData;
  const semiFinals = brackets.filter(b => b.stage === 'semi_final');
  const final = brackets.find(b => b.stage === 'final');
  const currentTournament = tournaments.find(t => t.tournament_id == selectedTournament);

  return (
    <>
      <TopBar
        title="🥇 Knockout Stage"
        actions={
          <div className="flex gap-sm">
            {brackets.length > 0 && (
              <button
                id="btn-clear-bracket"
                className="btn btn-danger btn-sm"
                onClick={() => setConfirmClear(true)}
              >
                🗑 Clear Bracket
              </button>
            )}
            <button
              id="btn-generate-bracket"
              className="btn btn-primary btn-sm"
              onClick={handleGenerate}
              disabled={generating || !selectedTournament}
            >
              {generating ? '⚙️ Generating...' : '⚡ Generate Bracket'}
            </button>
          </div>
        }
      />

      <div className="page-wrapper">
        {success && <Alert type="success">✅ {success}</Alert>}
        {error && !showWinnerModal && <Alert type="danger">❌ {error}</Alert>}

        {/* Tournament selector */}
        <div className="schedule-filters" style={{ marginBottom: '24px' }}>
          <div className="form-group" style={{ minWidth: '220px' }}>
            <label className="form-label">Tournament</label>
            <select
              id="knockout-tournament-select"
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

        {!selectedTournament ? (
          <EmptyState icon="🏆" title="Select a Tournament" desc="Choose a tournament to view the knockout bracket." />
        ) : loading ? (
          <Spinner text="Loading bracket..." />
        ) : brackets.length === 0 ? (
          <EmptyState
            icon="🥇"
            title="No Knockout Bracket"
            desc="Complete all group stage matches, then generate the knockout bracket. The top 4 teams will qualify."
            action={
              <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? '⚙️ Generating...' : '⚡ Generate Knockout Bracket'}
              </button>
            }
          />
        ) : (
          <>
            {/* Champion Banner */}
            {champion && (
              <div className="knockout-champion-banner">
                <div className="champion-trophy">🏆</div>
                <div className="champion-info">
                  <div className="champion-label">Tournament Champion</div>
                  <div className="champion-name">{champion.team_name}</div>
                  <div className="champion-tournament">{currentTournament?.name}</div>
                </div>
                <div className="champion-confetti">🎉</div>
              </div>
            )}

            {/* Bracket Visualization */}
            <div className="knockout-bracket">
              {/* Semi-Finals Column */}
              <div className="knockout-column">
                <div className="knockout-column-title">Semi-Finals</div>
                <div className="knockout-matches">
                  {semiFinals.map(sf => (
                    <div key={sf.bracket_id} className={`knockout-match-card ${sf.winner_id ? 'decided' : ''}`}>
                      <div className="knockout-match-label">
                        {sf.bracket_order === 1 ? 'Semi-Final 1' : 'Semi-Final 2'}
                      </div>

                      <div className={`knockout-team ${sf.winner_id === sf.team1_id ? 'winner' : sf.winner_id ? 'loser' : ''}`}>
                        <span className="knockout-team-seed">#1</span>
                        <span className="knockout-team-name">{sf.team1_name || 'TBD'}</span>
                        {sf.winner_id === sf.team1_id && <span className="knockout-winner-icon">✓</span>}
                      </div>

                      <div className="knockout-vs">VS</div>

                      <div className={`knockout-team ${sf.winner_id === sf.team2_id ? 'winner' : sf.winner_id ? 'loser' : ''}`}>
                        <span className="knockout-team-seed">#4</span>
                        <span className="knockout-team-name">{sf.team2_name || 'TBD'}</span>
                        {sf.winner_id === sf.team2_id && <span className="knockout-winner-icon">✓</span>}
                      </div>

                      <div className="knockout-match-meta">
                        {sf.match_date && (
                          <span>📅 {new Date(sf.match_date.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        )}
                        {sf.venue_name && <span>🏟️ {sf.venue_name}</span>}
                        {sf.match_status && <StatusBadge status={sf.match_status} />}
                      </div>

                      {!sf.winner_id && sf.team1_id && sf.team2_id && (
                        <button
                          className="btn btn-success btn-sm w-full"
                          onClick={() => openRecordWinner(sf)}
                          style={{ marginTop: '8px' }}
                        >
                          📝 Record Winner
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Connector */}
              <div className="knockout-connector">
                <div className="knockout-connector-line top"></div>
                <div className="knockout-connector-line bottom"></div>
                <div className="knockout-connector-merge"></div>
              </div>

              {/* Final Column */}
              <div className="knockout-column final-column">
                <div className="knockout-column-title">🏆 Final</div>
                <div className="knockout-matches">
                  {final && (
                    <div className={`knockout-match-card final ${final.winner_id ? 'decided champion-match' : ''}`}>
                      <div className="knockout-match-label">Grand Final</div>

                      <div className={`knockout-team ${final.winner_id === final.team1_id ? 'winner' : final.winner_id ? 'loser' : ''}`}>
                        <span className="knockout-team-seed">SF1 Winner</span>
                        <span className="knockout-team-name">{final.team1_name || '—'}</span>
                        {final.winner_id === final.team1_id && <span className="knockout-winner-icon">🏆</span>}
                      </div>

                      <div className="knockout-vs">VS</div>

                      <div className={`knockout-team ${final.winner_id === final.team2_id ? 'winner' : final.winner_id ? 'loser' : ''}`}>
                        <span className="knockout-team-seed">SF2 Winner</span>
                        <span className="knockout-team-name">{final.team2_name || '—'}</span>
                        {final.winner_id === final.team2_id && <span className="knockout-winner-icon">🏆</span>}
                      </div>

                      <div className="knockout-match-meta">
                        {final.match_date && (
                          <span>📅 {new Date(final.match_date.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        )}
                        {final.venue_name && <span>🏟️ {final.venue_name}</span>}
                        {final.match_status && <StatusBadge status={final.match_status} />}
                      </div>

                      {!final.winner_id && final.team1_id && final.team2_id && (
                        <button
                          className="btn btn-success btn-sm w-full"
                          onClick={() => openRecordWinner(final)}
                          style={{ marginTop: '8px' }}
                        >
                          👑 Declare Champion
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Record Winner Modal */}
      {showWinnerModal && selectedBracket && (
        <Modal
          title={`📝 Record ${selectedBracket.stage === 'final' ? 'Final' : 'Semi-Final'} Winner`}
          onClose={() => setShowWinnerModal(false)}
          size="md"
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowWinnerModal(false)}>Cancel</button>
              <button
                id="btn-record-knockout-winner"
                className="btn btn-primary btn-sm"
                onClick={handleRecordWinner}
                disabled={saving || !selectedWinner}
              >
                {saving ? 'Saving...' : selectedBracket.stage === 'final' ? '👑 Declare Champion' : '✅ Record Winner'}
              </button>
            </>
          }
        >
          {error && <Alert type="danger">{error}</Alert>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Score entry */}
            <div className="result-modal-matchup">
              <div className="result-modal-team">
                <div className="result-modal-team-name">{selectedBracket.team1_name}</div>
                <input
                  className="form-control result-score-input"
                  value={resultForm.home_score}
                  onChange={e => setResultForm(f => ({ ...f, home_score: e.target.value }))}
                  placeholder="Score"
                />
              </div>
              <div className="result-modal-vs">VS</div>
              <div className="result-modal-team">
                <div className="result-modal-team-name">{selectedBracket.team2_name}</div>
                <input
                  className="form-control result-score-input"
                  value={resultForm.away_score}
                  onChange={e => setResultForm(f => ({ ...f, away_score: e.target.value }))}
                  placeholder="Score"
                />
              </div>
            </div>

            {/* Winner selection */}
            <div className="form-group">
              <label className="form-label">Winner *</label>
              <div className="result-winner-buttons">
                <button
                  type="button"
                  className={`result-winner-btn ${selectedWinner == selectedBracket.team1_id ? 'selected' : ''}`}
                  onClick={() => setSelectedWinner(selectedBracket.team1_id)}
                >
                  🏆 {selectedBracket.team1_name}
                </button>
                <button
                  type="button"
                  className={`result-winner-btn ${selectedWinner == selectedBracket.team2_id ? 'selected' : ''}`}
                  onClick={() => setSelectedWinner(selectedBracket.team2_id)}
                >
                  🏆 {selectedBracket.team2_name}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Margin</label>
              <input
                className="form-control"
                value={resultForm.margin}
                onChange={e => setResultForm(f => ({ ...f, margin: e.target.value }))}
                placeholder="e.g. 5 wickets, 2 goals"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Clear Confirm */}
      {confirmClear && (
        <ConfirmDialog
          message="Are you sure you want to clear the knockout bracket? This will delete all semi-final and final matches."
          onConfirm={handleClear}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </>
  );
}
