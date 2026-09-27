// Generic CRUD page template used for Venues and Umpires
import { useState, useEffect } from 'react';
import { venueApi, tournamentApi } from '../api/api';
import { Spinner, EmptyState, ConfirmDialog, Alert } from '../components/UI';
import TopBar from '../components/TopBar';
import Modal from '../components/Modal';

const EMPTY = { tournament_id: '', name: '', city: '', country: 'India', capacity: '', address: '' };

export default function VenuesPage() {
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
    Promise.all([venueApi.getAll(filterTid || undefined), tournamentApi.getAll()])
      .then(([v, ts]) => { setItems(v); setTournaments(ts); })
      .catch(() => setError('Load failed'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [filterTid]);

  const openCreate = () => { setForm({ ...EMPTY, tournament_id: filterTid }); setEditItem(null); setError(''); setShowModal(true); };
  const openEdit   = (v) => { setForm({ tournament_id: v.tournament_id, name: v.name, city: v.city || '', country: v.country || 'India', capacity: v.capacity || '', address: v.address || '' }); setEditItem(v); setError(''); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      editItem ? await venueApi.update(editItem.venue_id, { ...form, is_available: true }) : await venueApi.create(form);
      setShowModal(false); load();
      setSuccess(editItem ? 'Venue updated!' : 'Venue added!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { await venueApi.remove(deleteTarget.venue_id); load(); } catch (err) { setError(err.message); }
    finally { setDeleteTarget(null); }
  };

  return (
    <>
      <TopBar title="🏟️ Venues" actions={<button id="btn-add-venue" className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Venue</button>} />
      <div className="page-wrapper">
        {success && <Alert type="success">✅ {success}</Alert>}
        <div className="flex flex-between gap-md mb-lg" style={{ marginBottom: '24px' }}>
          <select id="venue-filter-tournament" className="form-control" style={{ maxWidth: '280px' }} value={filterTid} onChange={e => setFilterTid(e.target.value)}>
            <option value="">All Tournaments</option>
            {tournaments.map(t => <option key={t.tournament_id} value={t.tournament_id}>{t.name}</option>)}
          </select>
          <span className="text-muted text-sm">{items.length} venue{items.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? <Spinner /> : items.length === 0 ? (
          <EmptyState icon="🏟️" title="No venues yet" desc="Add match venues for your tournament" action={<button className="btn btn-primary" onClick={openCreate}>+ Add Venue</button>} />
        ) : (
          <div className="grid grid-auto">
            {items.map(v => (
              <div key={v.venue_id} className="card">
                <div className="flex flex-between mb-lg">
                  <div style={{ fontSize: '32px' }}>🏟️</div>
                  <span className={`badge ${v.is_available ? 'badge-success' : 'badge-danger'}`}>
                    {v.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{v.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--clr-text-muted)', marginBottom: '12px' }}>
                  📍 {[v.city, v.country].filter(Boolean).join(', ') || 'Location TBD'}
                </p>
                {v.capacity && <p style={{ fontSize: '12px', color: 'var(--clr-text-muted)' }}>👥 Capacity: {Number(v.capacity).toLocaleString()}</p>}
                <div className="flex gap-sm" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--clr-border)' }}>
                  <button id={`edit-venue-${v.venue_id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(v)}>✏️ Edit</button>
                  <button id={`del-venue-${v.venue_id}`}  className="btn btn-danger btn-sm"                      onClick={() => setDeleteTarget(v)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editItem ? '✏️ Edit Venue' : '+ Add Venue'} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
            <button id="btn-save-venue" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editItem ? 'Save' : 'Add'}</button>
          </>}>
          {error && <Alert type="danger">{error}</Alert>}
          <div className="form-group">
            <label className="form-label" htmlFor="v-tid">Tournament *</label>
            <select id="v-tid" className="form-control" required value={form.tournament_id} onChange={e => setForm(f => ({...f, tournament_id: e.target.value}))}>
              <option value="">Select...</option>
              {tournaments.map(t => <option key={t.tournament_id} value={t.tournament_id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label" htmlFor="v-name">Venue Name *</label>
              <input id="v-name" className="form-control" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Wankhede Stadium" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="v-city">City</label>
              <input id="v-city" className="form-control" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} placeholder="Mumbai" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="v-country">Country</label>
              <input id="v-country" className="form-control" value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} placeholder="India" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="v-cap">Capacity</label>
              <input id="v-cap" type="number" className="form-control" value={form.capacity} onChange={e => setForm(f => ({...f, capacity: e.target.value}))} placeholder="33000" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="v-addr">Address</label>
              <input id="v-addr" className="form-control" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="Full address..." />
            </div>
          </div>
        </Modal>
      )}
      {deleteTarget && <ConfirmDialog message={`Delete venue "${deleteTarget.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </>
  );
}
