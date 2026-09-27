import { useState, useEffect } from 'react';
import { playerApi, teamApi, tournamentApi } from '../api/api';
import { Spinner, EmptyState, ConfirmDialog, Alert } from '../components/UI';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';

const EMPTY = { team_id: '', tournament_id: '', full_name: '', jersey_number: '', position: '', date_of_birth: '', nationality: '' };
const POSITIONS = ['Batsman','Bowler','All-rounder','Wicketkeeper','Goalkeeper','Striker','Midfielder','Defender','Forward','Guard','Center','Generic'];

export default function PlayersPage() {
  const [players, setPlayers]         = useState([]);
  const [teams, setTeams]             = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterTid, setFilterTid]     = useState('');
  const [filterTeam, setFilterTeam]   = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [form, setForm]               = useState(EMPTY);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    const q = {};
    if (filterTeam) q.team_id = filterTeam;
    else if (filterTid) q.tournament_id = filterTid;
    Promise.all([playerApi.getAll(q), teamApi.getAll(filterTid || undefined), tournamentApi.getAll()])
      .then(([p, t, ts]) => { setPlayers(p); setTeams(t); setTournaments(ts); })
      .catch(() => setError('Load failed'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filterTid, filterTeam]);

  const openCreate = () => { setForm({ ...EMPTY, tournament_id: filterTid, team_id: filterTeam }); setEditItem(null); setError(''); setShowModal(true); };
  const openEdit   = (p) => { setForm({ team_id: p.team_id, tournament_id: p.tournament_id, full_name: p.full_name, jersey_number: p.jersey_number || '', position: p.position || '', date_of_birth: p.date_of_birth?.slice(0,10) || '', nationality: p.nationality || '' }); setEditItem(p); setError(''); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      editItem ? await playerApi.update(editItem.player_id, form) : await playerApi.create(form);
      setShowModal(false); load();
      setSuccess(editItem ? 'Player updated!' : 'Player added!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await playerApi.remove(deleteTarget.player_id); load(); } catch (err) { setError(err.message); }
    finally { setDeleteTarget(null); }
  };

  const filteredTeams = filterTid ? teams.filter(t => String(t.tournament_id) === String(filterTid)) : teams;

  return (
    <>
      <TopBar title="👤 Players" actions={<button id="btn-add-player" className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Player</button>} />
      <div className="page-wrapper">
        {success && <Alert type="success">✅ {success}</Alert>}
        <div className="flex gap-md mb-lg" style={{ flexWrap: 'wrap', marginBottom: '24px' }}>
          <select id="player-filter-tournament" className="form-control" style={{ maxWidth: '240px' }} value={filterTid} onChange={e => { setFilterTid(e.target.value); setFilterTeam(''); }}>
            <option value="">All Tournaments</option>
            {tournaments.map(t => <option key={t.tournament_id} value={t.tournament_id}>{t.name}</option>)}
          </select>
          <select id="player-filter-team" className="form-control" style={{ maxWidth: '240px' }} value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
            <option value="">All Teams</option>
            {filteredTeams.map(t => <option key={t.team_id} value={t.team_id}>{t.name}</option>)}
          </select>
          <span className="text-muted text-sm" style={{ alignSelf: 'center' }}>{players.length} player{players.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? <Spinner /> : players.length === 0 ? (
          <EmptyState icon="👤" title="No players yet" desc="Add players to your teams" action={<button className="btn btn-primary" onClick={openCreate}>+ Add Player</button>} />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>Name</th><th>Jersey</th><th>Position</th><th>Nationality</th><th>Team</th><th>Actions</th></tr></thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.player_id}>
                    <td className="text-muted">{i+1}</td>
                    <td><strong style={{color:'var(--clr-text-primary)'}}>{p.full_name}</strong></td>
                    <td><span className="badge badge-primary">{p.jersey_number ?? '—'}</span></td>
                    <td>{p.position || '—'}</td>
                    <td>{p.nationality || '—'}</td>
                    <td className="text-muted text-sm">{p.team_name || '—'}</td>
                    <td>
                      <div className="flex gap-sm">
                        <button id={`edit-player-${p.player_id}`} className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️</button>
                        <button id={`del-player-${p.player_id}`}  className="btn btn-danger btn-sm"    onClick={() => setDeleteTarget(p)}>🗑</button>
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
        <Modal title={editItem ? '✏️ Edit Player' : '+ Add Player'} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button id="btn-save-player" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Save' : 'Add'}</button>
          </>}>
          {error && <Alert type="danger">{error}</Alert>}
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label" htmlFor="p-name">Full Name *</label>
              <input id="p-name" className="form-control" required value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Player full name" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-tid">Tournament *</label>
              <select id="p-tid" className="form-control" required value={form.tournament_id} onChange={e => { setForm(f => ({...f, tournament_id: e.target.value, team_id: ''})); }}>
                <option value="">Select...</option>
                {tournaments.map(t => <option key={t.tournament_id} value={t.tournament_id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-team">Team *</label>
              <select id="p-team" className="form-control" required value={form.team_id} onChange={e => setForm(f => ({...f, team_id: e.target.value}))}>
                <option value="">Select...</option>
                {teams.filter(t => String(t.tournament_id) === String(form.tournament_id)).map(t => <option key={t.team_id} value={t.team_id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-jersey">Jersey #</label>
              <input id="p-jersey" type="number" min="1" className="form-control" value={form.jersey_number} onChange={e => setForm(f => ({...f, jersey_number: e.target.value}))} placeholder="7" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-pos">Position</label>
              <select id="p-pos" className="form-control" value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))}>
                <option value="">Select...</option>
                {POSITIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-dob">Date of Birth</label>
              <input id="p-dob" type="date" className="form-control" value={form.date_of_birth} onChange={e => setForm(f => ({...f, date_of_birth: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="p-nat">Nationality</label>
              <input id="p-nat" className="form-control" value={form.nationality} onChange={e => setForm(f => ({...f, nationality: e.target.value}))} placeholder="Indian" />
            </div>
          </div>
        </Modal>
      )}
      {deleteTarget && <ConfirmDialog message={`Delete player "${deleteTarget.full_name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
}
