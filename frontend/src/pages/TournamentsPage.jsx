import { useState, useEffect } from 'react';
import { tournamentApi } from '../api/api';
import { Spinner, EmptyState, StatusBadge, ConfirmDialog, Alert } from '../components/UI';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  name: '', sport_type: 'Cricket', start_date: '', end_date: '',
  location: '', description: '', format: 'league_knockout', max_teams: 8, status: 'upcoming'
};

const SPORTS = ['Cricket','Football','Basketball','Volleyball','Badminton','Tennis','Hockey','Generic'];
const FORMATS = [
  { value: 'league',            label: 'Round Robin (League)' },
  { value: 'knockout',          label: 'Knockout Only' },
  { value: 'league_knockout',   label: 'League + Knockout' },
];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch]           = useState('');

  const load = () => {
    setLoading(true);
    tournamentApi.getAll()
      .then(setTournaments)
      .catch(() => setError('Failed to load tournaments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditItem(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (t) => {
    setForm({
      name: t.name, sport_type: t.sport_type, start_date: t.start_date?.slice(0, 10),
      end_date: t.end_date?.slice(0, 10), location: t.location || '', description: t.description || '',
      format: t.format, max_teams: t.max_teams, status: t.status
    });
    setEditItem(t);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editItem) {
        await tournamentApi.update(editItem.tournament_id, form);
        setSuccess('Tournament updated!');
      } else {
        await tournamentApi.create(form);
        setSuccess('Tournament created!');
      }
      setShowModal(false);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tournamentApi.remove(deleteTarget.tournament_id);
      setSuccess('Tournament deleted');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = tournaments.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.sport_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <TopBar
        title="🏆 Tournaments"
        actions={
          <button id="btn-create-tournament" className="btn btn-primary btn-sm" onClick={openCreate}>
            + New Tournament
          </button>
        }
      />
      <div className="page-wrapper">
        {success && <Alert type="success">✅ {success}</Alert>}
        {error && !showModal && <Alert type="danger">❌ {error}</Alert>}

        {/* Search */}
        <div className="flex flex-between gap-md mb-lg" style={{ marginTop: '0', marginBottom: '24px' }}>
          <input
            id="tournament-search"
            className="form-control"
            placeholder="🔍 Search tournaments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: '320px' }}
          />
          <span className="text-muted text-sm">{filtered.length} tournament{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="No tournaments found"
            desc="Create your first tournament to get started"
            action={<button className="btn btn-primary" onClick={openCreate}>+ Create Tournament</button>}
          />
        ) : (
          <div className="grid grid-auto">
            {filtered.map(t => (
              <div key={t.tournament_id} className="tournament-card">
                <div className="tournament-card-accent" />
                <div className="tournament-card-body">
                  <div className="flex flex-between" style={{ marginBottom: '8px' }}>
                    <StatusBadge status={t.status} />
                    <span className="badge badge-info">{t.sport_type}</span>
                  </div>
                  <h3 className="tournament-card-title">{t.name}</h3>
                  <div className="tournament-card-meta">
                    <span>📅 {t.start_date?.slice(0,10)} → {t.end_date?.slice(0,10)}</span>
                    {t.location && <span>📍 {t.location}</span>}
                  </div>
                  {t.description && (
                    <p style={{ fontSize: '13px', color: 'var(--clr-text-muted)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description}
                    </p>
                  )}
                </div>
                <div className="tournament-card-footer">
                  <div style={{ fontSize: '13px', color: 'var(--clr-text-muted)' }}>
                    🧑‍🤝‍🧑 {t.team_count ?? 0} / {t.max_teams} teams
                  </div>
                  <div className="flex gap-sm">
                    <button id={`edit-tournament-${t.tournament_id}`} className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>
                      ✏️ Edit
                    </button>
                    <button id={`delete-tournament-${t.tournament_id}`} className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(t)}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal
          title={editItem ? '✏️ Edit Tournament' : '🏆 New Tournament'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
              <button id="btn-save-tournament" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Create'}
              </button>
            </>
          }
        >
          {error && <Alert type="danger">{error}</Alert>}
          <form id="tournament-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="f-name">Tournament Name *</label>
              <input id="f-name" className="form-control" required value={form.name}
                onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Premier League 2026" />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="f-sport">Sport Type</label>
                <select id="f-sport" className="form-control" value={form.sport_type}
                  onChange={e => setForm(f => ({...f, sport_type: e.target.value}))}>
                  {SPORTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="f-format">Format</label>
                <select id="f-format" className="form-control" value={form.format}
                  onChange={e => setForm(f => ({...f, format: e.target.value}))}>
                  {FORMATS.map(fm => <option key={fm.value} value={fm.value}>{fm.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="f-start">Start Date *</label>
                <input id="f-start" type="date" className="form-control" required value={form.start_date}
                  onChange={e => setForm(f => ({...f, start_date: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="f-end">End Date *</label>
                <input id="f-end" type="date" className="form-control" required value={form.end_date}
                  onChange={e => setForm(f => ({...f, end_date: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="f-max">Max Teams</label>
                <input id="f-max" type="number" min="2" max="64" className="form-control" value={form.max_teams}
                  onChange={e => setForm(f => ({...f, max_teams: parseInt(e.target.value)}))} />
              </div>
              {editItem && (
                <div className="form-group">
                  <label className="form-label" htmlFor="f-status">Status</label>
                  <select id="f-status" className="form-control" value={form.status}
                    onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    {['upcoming','ongoing','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="f-location">Location</label>
              <input id="f-location" className="form-control" value={form.location}
                onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="City, Country" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="f-desc">Description</label>
              <textarea id="f-desc" className="form-control" rows="3" value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Brief description..." />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will remove all associated teams, players, and matches.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
