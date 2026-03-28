import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';

const BRANDS = ['Petron', 'Shell', 'Caltex', 'Phoenix', 'PTT', 'Flying V', 'Seaoil', 'Jetti', 'Other'];

export default function SubmitStationPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', brand: '', address: '', barangay: '',
    city: 'Tuguegarao', province: 'Cagayan',
    latitude: '', longitude: '',
  });
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]   = useState(false);

  const fc = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await stationsApi.submit(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '520px', width: '100%' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
            <h2>Station Submitted!</h2>
            <p style={{ marginTop: '8px' }}>
              Your station has been submitted for review. An admin will approve it shortly
              before it becomes visible to the public.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
              <Link to="/stations" className="btn btn-primary">Browse Stations</Link>
              <button className="btn btn-secondary" onClick={() => { setSuccess(false); setForm({ name: '', brand: '', address: '', barangay: '', city: 'Tuguegarao', province: 'Cagayan', latitude: '', longitude: '' }); }}>
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '580px', width: '100%' }}>
        <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          <Link to="/stations">Stations</Link> › Submit New Station
        </nav>

        <h1 style={{ marginBottom: '8px' }}>Submit a Fuel Station</h1>
        <p style={{ marginBottom: '24px' }}>
          Know a station that's not listed yet? Submit it and an admin will approve it for public display.
        </p>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Station Name *</label>
              <input className="form-control" value={form.name} onChange={(e) => fc('name', e.target.value)}
                placeholder="e.g. Petron Station - Centro 5" required />
            </div>

            <div className="form-group">
              <label className="form-label">Brand</label>
              <select className="form-control" value={form.brand} onChange={(e) => fc('brand', e.target.value)}>
                <option value="">Select brand...</option>
                {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-control" value={form.address} onChange={(e) => fc('address', e.target.value)}
                placeholder="e.g. Mabini Street" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Barangay</label>
                <input className="form-control" value={form.barangay} onChange={(e) => fc('barangay', e.target.value)}
                  placeholder="e.g. Centro 5" />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-control" value={form.city} onChange={(e) => fc('city', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Latitude *</label>
                <input className="form-control" type="number" step="any" value={form.latitude}
                  onChange={(e) => fc('latitude', e.target.value)}
                  placeholder="e.g. 17.6132" required />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude *</label>
                <input className="form-control" type="number" step="any" value={form.longitude}
                  onChange={(e) => fc('longitude', e.target.value)}
                  placeholder="e.g. 121.7270" required />
              </div>
            </div>
            <p className="form-hint" style={{ marginTop: '-8px', marginBottom: '16px' }}>
              📍 Get coordinates from{' '}
              <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">Google Maps</a>
              {' '}— right-click on the station location and copy the coordinates.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            </div>
          </form>
        </div>

        <div className="alert alert-info" style={{ marginTop: '16px' }}>
          💡 Your submission will be reviewed by an admin before it appears publicly. You can track the status under <Link to="/profile">My Profile</Link>.
        </div>
      </div>
    </div>
  );
}
