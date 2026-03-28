import React, { useState, useEffect } from 'react';
import { stationsApi } from '../../api/stations.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

const EMPTY_FORM = {
  name: '', brand: '', address: '', barangay: '',
  city: 'Tuguegarao', province: 'Cagayan',
  latitude: '', longitude: '', is_active: true,
};

export default function AdminStationsPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // station or 'new'
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    stationsApi.getAll({ search })
      .then((d) => setStations(d.stations))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditing('new');
    setFormError('');
  };

  const openEdit = (station) => {
    setForm({ ...station, is_active: !!station.is_active });
    setEditing(station);
    setFormError('');
  };

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
    } catch (err) {
      alert(err.message);
    }
  };

  const fc = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <div className="section-header">
        <h1>Manage Stations</h1>
        <button className="btn btn-primary" onClick={openNew}>+ Add Station</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginBottom: '24px', padding: '12px 16px' }}>
        <input
          className="form-control"
          placeholder="Search stations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? <LoadingSpinner /> : stations.length === 0 ? (
        <EmptyState icon="⛽" title="No stations" />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Barangay</th>
                  <th>Coordinates</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.brand}</td>
                    <td>{s.barangay}</td>
                    <td className="text-sm">{s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}</td>
                    <td>
                      <span className={`badge ${s.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        {s.is_active && (
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

      {/* Edit/Create Modal */}
      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '24px',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '20px' }}>{editing === 'new' ? 'Add New Station' : 'Edit Station'}</h3>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSave}>
              {[
                { key: 'name', label: 'Station Name *', required: true },
                { key: 'brand', label: 'Brand' },
                { key: 'address', label: 'Address' },
                { key: 'barangay', label: 'Barangay' },
                { key: 'city', label: 'City' },
                { key: 'province', label: 'Province' },
              ].map(({ key, label, required }) => (
                <div key={key} className="form-group">
                  <label className="form-label">{label}</label>
                  <input
                    className="form-control"
                    value={form[key] || ''}
                    onChange={(e) => fc(key, e.target.value)}
                    required={required}
                  />
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
                  <label className="form-label">Status</label>
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
