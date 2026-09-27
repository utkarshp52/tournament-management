import { useState, useEffect } from 'react';
import { umpireApi, tournamentApi } from '../api/api';
import { Spinner, EmptyState, ConfirmDialog, Alert } from '../components/UI';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';

const EMPTY = { tournament_id: '', full_name: '', nationality: '', experience_years: 0, email: '', phone: '' };

export default function UmpiresPage() {
  const [items, setItems]             = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filterTid, setFilterTid]     = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [form, setForm]               = useState(EMPTY);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([umpireApi.getAll(filterTid || undefined), tournamentApi.getAll()])
      .then(([u, ts]) => { setItems(u); setTournaments(ts); })
      .catch(() => setError('Load failed'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filterTid]);

  const openCreate = () => { setForm({ ...EMPTY, tournament_id: filterTid }); setEditItem(null); setError(''); setShowModal(true); };
  const openEdit   = (u) => { setForm({ tournament_id: u.tournament_id, full_name: u.full_name, nationality: u.nationality || '', experience_years: u.experience_years || 0, email: u.email || '', phone: u.phone || '' }); setEditItem(u); setError(''); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      editItem ? await umpireApi.update(editItem.umpire_id, { ...form, is_available: true }) : await umpireApi.create(form);
      setShowModal(false); load();
      setSuccess(editItem ? 'Umpire updated!' : 'Umpire added!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await umpireApi.remove(deleteTarget.umpire_id); load(); } catch (err) { setError(err.message); }
    finally { setDeleteTarget(null); }
  };

  return (
    <>
      <TopBar title="🧑‍⚖️ Umpires" actions={<button id="btn-add-umpire" className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Umpire</button>} />
      <div className="page-wrapper">
        {success && <Alert type="success">✅ {success}</Alert>}
        <div className="flex flex-between gap-md mb-lg" style={{ marginBottom: '24px' }}>
          <select id="umpire-filter-tournament" className="form-control" style={{ maxWidth: '280px' }} value={filterTid} onChange={e => setFilterTid(e.target.value)}>
            <option value="">All Tournaments</option>
            {tournaments.map(t => <option key={t.tournament_id} value={t.tournament_id}>{t.name}</option>)}
          </select>
          <span className="text-muted text-sm">{items.length} umpire{items.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? <Spinner /> : items.length === 0 ? (
          <EmptyState icon="🧑‍⚖️" title="No umpires yet" desc="Add umpires to assign them to matches" action={<button className="btn btn-primary" onClick={openCreate}>+ Add Umpire</button>} />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>#</th><th>Name</th><th>Nationality</th><th>Experience</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map((u, i) => (
                  <tr key={u.umpire_id}>
                    <td className="text-muted">{i+1}</td>
                    <td><strong style={{color:'var(--clr-text-primary)'}}>{u.full_name}</strong></td>
                    <td>{u.nationality || '—'}</td>
                    <td>{u.experience_years ? `${u.experience_years} yrs` : '—'}</td>
                    <td className="text-sm">{u.email || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td><span className={`badge ${u.is_available ? 'badge-success' : 'badge-danger'}`}>{u.is_available ? 'Available' : 'Busy'}</span></td>
                    <td>
                      <div className="flex gap-sm">
                        <button id={`edit-umpire-${u.umpire_id}`} className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏️</button>
                        <button id={`del-umpire-${u.umpire_id}`}  className="btn btn-danger btn-sm"    onClick={() => setDeleteTarget(u)}>🗑</button>
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
        <Modal title={editItem ? '✏️ Edit Umpire' : '+ Add Umpire'} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button id="btn-save-umpire" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Save' : 'Add'}</button>
          </>}>
          {error && <Alert type="danger">{error}</Alert>}
          <div className="form-group">
            <label className="form-label" htmlFor="u-tid">Tournament *</label>
            <select id="u-tid" className="form-control" required value={form.tournament_id} onChange={e => setForm(f => ({...f, tournament_id: e.target.value}))}>
              <option value="">Select...</option>
              {tournaments.map(t => <option key={t.tournament_id} value={t.tournament_id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label" htmlFor="u-name">Full Name *</label>
              <input id="u-name" className="form-control" required value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} placeholder="Umpire full name" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="u-nat">Nationality</label>
              <input id="u-nat" className="form-control" value={form.nationality} onChange={e => setForm(f => ({...f, nationality: e.target.value}))} placeholder="Indian" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="u-exp">Experience (yrs)</label>
              <input id="u-exp" type="number" min="0" className="form-control" value={form.experience_years} onChange={e => setForm(f => ({...f, experience_years: parseInt(e.target.value)}))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="u-email">Email</label>
              <input id="u-email" type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="u-phone">Phone</label>
              <input id="u-phone" className="form-control" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 9876543210" />
            </div>
          </div>
        </Modal>
      )}
      {deleteTarget && <ConfirmDialog message={`Delete umpire "${deleteTarget.full_name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
}
