import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';
import { submissionsApi } from '../api/submissions.js';
import client from '../api/client.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export default function SubmitPricePage() {
  const { stationId } = useParams();
  const navigate = useNavigate();

  const [stations, setStations]     = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [results, setResults]       = useState(null); // { submitted, skipped }

  // Per-product state: { [productId]: { price: '', outOfStock: false } }
  const [entries, setEntries] = useState({});

  const [selectedStation, setSelectedStation] = useState(stationId || '');
  const [observedAt, setObservedAt]           = useState(new Date().toISOString().slice(0, 16));
  const [proofImage, setProofImage]           = useState(null);
  const [notes, setNotes]                     = useState('');

  // ── Load stations + fuel products ─────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      stationsApi.getAll(),
      client.get('/fuel-products').then((r) => r.data),
    ])
      .then(([stationsData, productsData]) => {
        setStations(stationsData.stations);
        const prods = productsData.fuel_products || [];
        setProducts(prods);
        // Initialise per-product entry state
        const init = {};
        prods.forEach((p) => { init[p.id] = { price: '', outOfStock: false }; });
        setEntries(init);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const setEntry = (productId, field, value) => {
    setEntries((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const toggleOutOfStock = (productId) => {
    setEntries((prev) => {
      const current = prev[productId];
      return {
        ...prev,
        [productId]: {
          price: current.outOfStock ? current.price : '',  // clear price when marking OOS
          outOfStock: !current.outOfStock,
        },
      };
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStation) { setError('Please select a station.'); return; }

    const toSubmit = products.filter((p) => {
      const entry = entries[p.id];
      return !entry.outOfStock && entry.price !== '' && parseFloat(entry.price) > 0;
    });

    if (toSubmit.length === 0) {
      setError('Please enter at least one price.');
      return;
    }

    setError('');
    setSubmitting(true);

    const timestamp = new Date(observedAt).toISOString();
    let submitted = 0;
    let failed    = 0;

    await Promise.allSettled(
      toSubmit.map(async (p) => {
        const fd = new FormData();
        fd.append('station_id',      selectedStation);
        fd.append('fuel_product_id', p.id);
        fd.append('submitted_price', entries[p.id].price);
        fd.append('observed_at',     timestamp);
        if (notes)      fd.append('notes', notes);
        if (proofImage) fd.append('proof_image', proofImage);
        return submissionsApi.submit(fd);
      })
    ).then((outcomes) => {
      outcomes.forEach((o) => (o.status === 'fulfilled' ? submitted++ : failed++));
    });

    setSubmitting(false);

    if (submitted > 0) {
      setResults({ submitted, failed });
    } else {
      setError('All submissions failed. Please try again.');
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page"><div className="container"><LoadingSpinner /></div></div>
    );
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (results) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '480px', width: '100%' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
            <h2>Submitted!</h2>
            <p style={{ marginTop: '8px', color: 'var(--color-text-muted)' }}>
              <strong>{results.submitted}</strong> price{results.submitted !== 1 ? 's' : ''} submitted for review.
              {results.failed > 0 && ` (${results.failed} failed)`}
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Thank you for helping the community!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
              {selectedStation && (
                <Link to={`/stations/${selectedStation}`} className="btn btn-primary">
                  View Station
                </Link>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setResults(null);
                  setNotes('');
                  setProofImage(null);
                  const reset = {};
                  products.forEach((p) => { reset[p.id] = { price: '', outOfStock: false }; });
                  setEntries(reset);
                }}
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedStationObj = stations.find((s) => s.id === selectedStation);
  const filledCount = products.filter((p) => {
    const e = entries[p.id];
    return !e?.outOfStock && e?.price !== '' && parseFloat(e?.price) > 0;
  }).length;

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: '640px', width: '100%' }}>
        <h1 style={{ marginBottom: '6px' }}>Submit Fuel Prices</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Fill in the prices you observed. Leave blank for products you didn't check, or mark as Out of Stock.
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* ── Station ────────────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Station *</label>
              <select
                className="form-control"
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                required
                disabled={!!stationId}
              >
                <option value="">Select a station…</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.city ? ` — ${s.city}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedStationObj && (
              <div style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {selectedStationObj.brand && (
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{selectedStationObj.brand}</span>
                )}
                {(selectedStationObj.city || selectedStationObj.province) && (
                  <span>📍 {[selectedStationObj.city, selectedStationObj.province].filter(Boolean).join(', ')}</span>
                )}
                {selectedStationObj.address && <span>{selectedStationObj.address}</span>}
              </div>
            )}

            <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
              <label className="form-label">Date/Time Observed *</label>
              <input
                type="datetime-local"
                className="form-control"
                value={observedAt}
                onChange={(e) => setObservedAt(e.target.value)}
                required
                max={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {/* ── Product price grid ─────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px', color: 'var(--color-text)' }}>
              Prices per Litre (₱)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 120px', gap: '12px', padding: '6px 0', borderBottom: '2px solid var(--color-border)', marginBottom: '4px' }}>
                <span style={colLabel}>Fuel Product</span>
                <span style={{ ...colLabel, textAlign: 'right' }}>Price / L</span>
                <span style={{ ...colLabel, textAlign: 'center' }}>Availability</span>
              </div>

              {products.map((p) => {
                const entry = entries[p.id] || { price: '', outOfStock: false };
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 140px 120px',
                      gap: '12px',
                      alignItems: 'center',
                      padding: '10px 0',
                      borderBottom: '1px solid var(--color-border)',
                      opacity: entry.outOfStock ? 0.45 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {/* Product name */}
                    <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{p.name}</span>

                    {/* Price input */}
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>₱</span>
                      <input
                        type="number"
                        className="form-control"
                        value={entry.price}
                        onChange={(e) => setEntry(p.id, 'price', e.target.value)}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        disabled={entry.outOfStock}
                        style={{ paddingLeft: '24px', textAlign: 'right' }}
                      />
                    </div>

                    {/* Out of stock toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', color: entry.outOfStock ? '#dc2626' : 'var(--color-text-muted)', fontWeight: entry.outOfStock ? 700 : 400 }}>
                      <input
                        type="checkbox"
                        checked={entry.outOfStock}
                        onChange={() => toggleOutOfStock(p.id)}
                        style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#dc2626' }}
                      />
                      Out of stock
                    </label>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {filledCount > 0
                ? <span style={{ color: '#059669', fontWeight: 600 }}>✓ {filledCount} price{filledCount !== 1 ? 's' : ''} ready to submit</span>
                : 'Enter at least one price to submit.'}
            </div>
          </div>

          {/* ── Optional extras ────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: '16px', padding: '20px' }}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-control"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. promo price, member discount…"
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Proof Image (optional)</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(e) => setProofImage(e.target.files[0] || null)}
              />
              <span className="form-hint">Photo of the price board for verification. Max 5 MB.</span>
            </div>
          </div>

          {/* ── Actions ────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || filledCount === 0}
            >
              {submitting ? 'Submitting…' : `Submit ${filledCount > 0 ? `${filledCount} Price${filledCount !== 1 ? 's' : ''}` : 'Prices'}`}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </form>

        <div className="alert alert-info" style={{ marginTop: '16px' }}>
          💡 Submissions are reviewed by a moderator before being displayed publicly.
        </div>
      </div>
    </div>
  );
}

const colLabel = {
  fontSize: '0.72rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
};
