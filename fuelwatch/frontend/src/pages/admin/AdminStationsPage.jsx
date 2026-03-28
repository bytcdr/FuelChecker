import React, { useState, useEffect } from 'react';
import { stationsApi } from '../../api/stations.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDateTime } from '../../utils/formatters.js';

const EMPTY_FORM = {
  name: '', brand: '', address: '', barangay: '',
  city: 'Tuguegarao', province: 'Cagayan',
  latitude: '', longitude: '', is_active: true,
};

const STATUS_COLORS = {
  approved: { bg: '#d1fae5', color: '#065f46' },
  pending:  { bg: '#fef9c3', color: '#92400e' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
};

function StatusPill({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{
      background: s.bg, color: s.color, padding: '2px 10px',
      borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
      textTransform: 'capitalize',
    }}>{status}</span>
  );
}

export default function AdminStationsPage() {
  const [tab, setTab]           = useState('pending');
  const [stations, setStations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote]   = useState('');

  const load = () => {
    setLoading(true);
    const req = tab === 'pending'
      ? stationsApi.adminGetPending()
      : stationsApi.adminGetAll({ status: tab === 'all' ? undefined : tab });
    req
      .then((d) => setStations(d.stations))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab, search]);

  const handleApprove = async (id) => {
    if (!confirm('Approve this station? It will become visible to the public.')) return;
    try {
      await stationsApi.approve(id);
      load();
    } catch (err) { alert(err.message); }
  };

  const openReject = (station) => { setRejectModal(station); setRejectNote(''); };

  const confirmReject = async () => {
    try {
      await stationsApi.reject(rejectModal.id, rejectNote);
      setRejectModal(null);
      load();
    } catch (err) { alert(err.message); }
  };

  const openNew = () => { setForm(EMPTY_FORM); setEditing('new'); setFormError(''); };
  const openEdit = (station) => { setForm({ ...station, is_active: !!station.is_active }); setEditing(station); setFormError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editing === 'new') {
        await stationsApi.create(form);
      } else {
        await stationsApi.update(editing.id, form);
      }
      setEditing(null);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this station?')) return;
    try {
      await stationsApi.deactivate(id);
      load();
    } catch (err) { alert(err.message); }
  };

  const fc = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const filtered = search
    ? stations.filter((s) => [s.name, s.brand, s.barangay].some((v) => v?.toLowerCase().includes(search.toLowerCase())))
    : stations;

  return (
    <div>
      <div className="section-header">
        <h1>Manage Stations</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Add Station</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'pending',  label: '🕐 Pending Approval' },
          { key: 'approved', label: '✅ Approved' },
          { key: 'rejected', label: '❌ Rejected' },
          { key: 'all',      label: '📋 All' },
        ].map(({ key, label }) => (
          <button key={key}
            className={`btn btn-sm ${tab === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(key)}
          >{label}</button>
        ))}
      </div>

      {/* Search (for non-pending tabs) */}
      {tab !== 'pending' && (
        <div className="card" style={{ marginBottom: '20px', padding: '10px 14px' }}>
          <input className="form-control" placeholder="Search stations..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={tab === 'pending' ? '🕐' : '⛽'}
          title={tab === 'pending' ? 'No pending station submissions' : 'No stations found'} />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Barangay</th>
                  {tab === 'pending' && <th>Submitted By</th>}
                  {tab === 'pending' && <th>Submitted At</th>}
                  {tab !== 'pending' && <th>Coordinates</th>}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.brand || '—'}</td>
                    <td>{s.barangay || '—'}</td>
                    {tab === 'pending' && (
                      <td className="text-sm">{s.submitter_name || '—'}<br />
                        <span style={{ color: 'var(--color-text-muted)' }}>{s.submitter_email}</span>
                      </td>
                    )}
                    {tab === 'pending' && (
                      <td className="text-sm">{formatDateTime(s.created_at)}</td>
                    )}
                    {tab !== 'pending' && (
                      <td className="text-sm">{s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}</td>
                    )}
                    <td>
                      <StatusPill status={s.status} />
                      {s.rejection_note && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-danger)', marginTop: '3px' }}>
                          {s.rejection_note}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {s.status === 'pending' && (
                          <>
                            <button className="btn btn-sm" style={{ background: '#059669', color: '#fff' }}
                              onClick={() => handleApprove(s.id)}>Approve</button>
                            <button className="btn btn-sm btn-danger"
                              onClick={() => openReject(s)}>Reject</button>
                          </>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        {s.is_active && s.status === 'approved' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(s.id)}>Deactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '24px' }}>
          <div className="card" style={{ maxWidth: '460px', width: '100%' }}>
            <h3 style={{ marginBottom: '8px' }}>Reject Station</h3>
            <p style={{ marginBottom: '16px' }}>
              Rejecting <strong>{rejectModal.name}</strong>. Optionally provide a reason:
            </p>
            <div className="form-group">
              <textarea className="form-control" rows={3} placeholder="Reason for rejection (optional)..."
                value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button className="btn btn-danger" onClick={confirmReject}>Confirm Reject</button>
              <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>{editing === 'new' ? 'Add New Station' : 'Edit Station'}</h3>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSave}>
              {[
                { key: 'name',     label: 'Station Name *', required: true },
                { key: 'brand',    label: 'Brand' },
                { key: 'address',  label: 'Address' },
                { key: 'barangay', label: 'Barangay' },
                { key: 'city',     label: 'City' },
                { key: 'province', label: 'Province' },
              ].map(({ key, label, required }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input className="form-control" value={form[key] || ''} onChange={(e) => fc(key, e.target.value)} required={required} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Latitude *</label>
                  <input className="form-control" type="number" step="any" value={form.latitude || ''} onChange={(e) => fc('latitude', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude *</label>
                  <input className="form-control" type="number" step="any" value={form.longitude || ''} onChange={(e) => fc('longitude', e.target.value)} required />
                </div>
              </div>
              {editing !== 'new' && (
                <div className="form-group">
                  <label className="form-label">Active Status</label>
                  <select className="form-control" value={form.is_active ? '1' : '0'} onChange={(e) => fc('is_active', e.target.value === '1')}>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Station'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
