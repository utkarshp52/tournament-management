import { useState, useEffect } from 'react';
import { teamApi, tournamentApi } from '../api/api';
import { Spinner, EmptyState, ConfirmDialog, Alert } from '../components/UI';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';

const EMPTY = { tournament_id: '', name: '', short_name: '', home_city: '', coach_name: '' };

export default function TeamsPage() {
  const [teams, setTeams]               = useState([]);
  const [tournaments, setTournaments]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterTid, setFilterTid]       = useState('');
  const [showModal, setShowModal]       = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([teamApi.getAll(filterTid || undefined), tournamentApi.getAll()])
      .then(([t, ts]) => { setTeams(t); setTournaments(ts); })
      .catch(() => setError('Load failed'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filterTid]);

  const openCreate = () => { setForm({ ...EMPTY, tournament_id: filterTid || '' }); setEditItem(null); setError(''); setShowModal(true); };
  const openEdit   = (t)  => { setForm({ tournament_id: t.tournament_id, name: t.name, short_name: t.short_name || '', home_city: t.home_city || '', coach_name: t.coach_name || '' }); setEditItem(t); setError(''); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      editItem ? await teamApi.update(editItem.team_id, form) : await teamApi.create(form);
      setShowModal(false); load();
      setSuccess(editItem ? 'Team updated!' : 'Team created!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await teamApi.remove(deleteTarget.team_id); load(); } catch (err) { setError(err.message); }
    finally { setDeleteTarget(null); }
  };

  return (
    <>
      <TopBar title="🧑‍🤝‍🧑 Teams" actions={
        <button id="btn-create-team" className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Team</button>
      } />
      <div className="page-wrapper">
        {success && <Alert type="success">✅ {success}</Alert>}
        <div className="flex flex-between gap-md mb-lg" style={{ marginBottom: '24px' }}>
          <select id="filter-tournament" className="form-control" style={{ maxWidth: '280px' }} value={filterTid} onChange={e => setFilterTid(e.target.value)}>
            <option value="">All Tournaments</option>
            {tournaments.map(t => <option key={t.tournament_id} value={t.tournament_id}>{t.name}</option>)}
          </select>
          <span className="text-muted text-sm">{teams.length} team{teams.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? <Spinner /> : teams.length === 0 ? (
          <EmptyState icon="🧑‍🤝‍🧑" title="No teams yet" desc="Add teams to your tournament" action={<button className="btn btn-primary" onClick={openCreate}>+ Add Team</button>} />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>Team Name</th><th>Short</th><th>City</th><th>Coach</th><th>Tournament</th><th>Actions</th></tr></thead>
              <tbody>
                {teams.map((t, i) => (
                  <tr key={t.team_id}>
                    <td className="text-muted">{i+1}</td>
                    <td><strong style={{color:'var(--clr-text-primary)'}}>{t.name}</strong></td>
                    <td><span className="badge badge-muted">{t.short_name || '—'}</span></td>
                    <td>{t.home_city || '—'}</td>
                    <td>{t.coach_name || '—'}</td>
                    <td className="text-muted text-sm">{tournaments.find(x => x.tournament_id === t.tournament_id)?.name || '—'}</td>
                    <td>
                      <div className="flex gap-sm">
                        <button id={`edit-team-${t.team_id}`} className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>✏️</button>
                        <button id={`del-team-${t.team_id}`}  className="btn btn-danger btn-sm"    onClick={() => setDeleteTarget(t)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editItem ? '✏️ Edit Team' : '+ Add Team'} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button id="btn-save-team" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Save' : 'Create'}</button>
          </>}>
          {error && <Alert type="danger">{error}</Alert>}
          <div className="form-group">
            <label className="form-label" htmlFor="t-tid">Tournament *</label>
            <select id="t-tid" className="form-control" required value={form.tournament_id} onChange={e => setForm(f => ({...f, tournament_id: e.target.value}))}>
              <option value="">Select tournament...</option>
              {tournaments.map(t => <option key={t.tournament_id} value={t.tournament_id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="t-name">Team Name *</label>
              <input id="t-name" className="form-control" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Mumbai Lions" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="t-short">Short Name</label>
              <input id="t-short" className="form-control" maxLength="10" value={form.short_name} onChange={e => setForm(f => ({...f, short_name: e.target.value}))} placeholder="MLI" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="t-city">Home City</label>
              <input id="t-city" className="form-control" value={form.home_city} onChange={e => setForm(f => ({...f, home_city: e.target.value}))} placeholder="Mumbai" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="t-coach">Coach</label>
              <input id="t-coach" className="form-control" value={form.coach_name} onChange={e => setForm(f => ({...f, coach_name: e.target.value}))} placeholder="Coach Name" />
            </div>
          </div>
        </Modal>
      )}
      {deleteTarget && <ConfirmDialog message={`Delete team "${deleteTarget.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
}
