import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';
import { submissionsApi } from '../api/submissions.js';
import { useAuth } from '../hooks/useAuth.js';
import client from '../api/client.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function SubmitPricePage() {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stations, setStations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    station_id: stationId || '',
    fuel_product_id: '',
    submitted_price: '',
    observed_at: new Date().toISOString().slice(0, 16),
    notes: '',
    proof_image: null,
  });

  useEffect(() => {
    Promise.all([
      stationsApi.getAll(),
      client.get('/fuel-products').then((r) => r.data),
    ])
      .then(([stationsData, productsData]) => {
        setStations(stationsData.stations);
        setProducts(productsData.fuel_products);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('station_id', form.station_id);
      formData.append('fuel_product_id', form.fuel_product_id);
      formData.append('submitted_price', form.submitted_price);
      formData.append('observed_at', new Date(form.observed_at).toISOString());
      if (form.notes) formData.append('notes', form.notes);
      if (form.proof_image) formData.append('proof_image', form.proof_image);

      await submissionsApi.submit(formData);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><div className="container"><LoadingSpinner /></div></div>;

  if (success) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
            <h2>Submission Received!</h2>
            <p style={{ marginTop: '8px' }}>
              Your price update has been submitted and is pending review.
              Thank you for helping the community!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
              {form.station_id && (
                <Link to={`/stations/${form.station_id}`} className="btn btn-primary">
                  View Station
                </Link>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => { setSuccess(false); setForm({ ...form, submitted_price: '', notes: '', proof_image: null }); }}
              >
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
      <div style={{ maxWidth: '560px', width: '100%' }}>
        <h1 style={{ marginBottom: '24px' }}>Submit Fuel Price</h1>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Station *</label>
              <select
                className="form-control"
                value={form.station_id}
                onChange={(e) => handleChange('station_id', e.target.value)}
                required
                disabled={!!stationId}
              >
                <option value="">Select a station...</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} – {s.barangay}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fuel Product *</label>
              <select
                className="form-control"
                value={form.fuel_product_id}
                onChange={(e) => handleChange('fuel_product_id', e.target.value)}
                required
              >
                <option value="">Select fuel type...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Price per Liter (₱) *</label>
              <input
                type="number"
                className="form-control"
                value={form.submitted_price}
                onChange={(e) => handleChange('submitted_price', e.target.value)}
                placeholder="e.g. 65.50"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date/Time Observed *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={form.observed_at}
                onChange={(e) => handleChange('observed_at', e.target.value)}
                required
                max={new Date().toISOString().slice(0, 16)}
              />
              <span className="form-hint">When did you see this price?</span>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-control"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any notes (e.g. promo price, member price)"
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Proof Image (optional)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(e) => handleChange('proof_image', e.target.files[0] || null)}
              />
              <span className="form-hint">Upload a photo of the price board for verification. Max 5MB.</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Price Update'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="alert alert-info" style={{ marginTop: '16px' }}>
          💡 Your submission will be reviewed by a moderator before it's displayed publicly.
          {user
            ? <span> Submitted as <strong>{user.name}</strong>.</span>
            : <span> Submitting anonymously. <Link to="/register">Create an account</Link> to track your submissions.</span>
          }
        </div>
      </div>
    </div>
  );
}
