import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stationsApi } from '../api/stations.js';
import { pricesApi } from '../api/prices.js';
import { reportsApi } from '../api/reports.js';
import PriceTable from '../components/stations/PriceTable.jsx';
import PriceHistory from '../components/stations/PriceHistory.jsx';
import MapComponent from '../components/map/MapComponent.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { formatDateTime } from '../utils/formatters.js';

export default function StationDetailsPage() {
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [prices, setPrices] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      stationsApi.getById(id),
      pricesApi.getByStation(id),
      pricesApi.getHistory(id),
    ])
      .then(([stationData, pricesData, historyData]) => {
        setStation(stationData.station);
        setPrices(pricesData.prices);
        setHistory(historyData.history);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReport = async (e) => {
    e.preventDefault();
    setReportError('');
    try {
      await reportsApi.create({ station_id: id, reason: reportReason });
      setReportSuccess('Thank you for your report!');
      setReportReason('');
    } catch (err) {
      setReportError(err.message);
    }
  };

  if (loading) return <div className="page"><div className="container"><LoadingSpinner /></div></div>;
  if (error) return <div className="page"><div className="container"><div className="alert alert-error">{error}</div></div></div>;
  if (!station) return null;

  const lastUpdated = prices.length > 0
    ? Math.max(...prices.map((p) => new Date(p.updated_at).getTime()))
    : null;

  return (
    <div className="page">
      <div className="container">
        {/* Breadcrumb */}
        <nav style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          <Link to="/stations">Stations</Link> › {station.name}
        </nav>

        {/* Station Header */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>{station.name}</h1>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                {station.brand && <span>🏷️ {station.brand}</span>}
                {station.barangay && <span>📍 {station.barangay}</span>}
                {station.address && <span>🏠 {station.address}</span>}
              </div>
              {lastUpdated && (
                <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Last updated: {formatDateTime(new Date(lastUpdated).toISOString())}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to={`/submit-price/${id}`} className="btn btn-primary">
                📝 Submit Price Update
              </Link>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Prices */}
          <div>
            <div className="card">
              <h3 style={{ marginBottom: '16px' }}>Latest Fuel Prices</h3>
              <PriceTable prices={prices} />
            </div>
          </div>

          {/* Map */}
          <div className="card" style={{ padding: '12px' }}>
            <MapComponent
              stations={[station]}
              height="300px"
              center={[station.longitude, station.latitude]}
              zoom={16}
            />
          </div>
        </div>

        {/* Price History */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Recent Price History</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? 'Hide' : 'Show'} History
            </button>
          </div>
          {showHistory && <PriceHistory history={history} />}
          {!showHistory && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Click "Show History" to view recent approved submissions.</p>}
        </div>

        {/* Report */}
        <div className="card" style={{ marginTop: '24px' }}>
          <h4 style={{ marginBottom: '12px' }}>Report an Issue</h4>
          {reportSuccess ? (
            <div className="alert alert-success">{reportSuccess}</div>
          ) : (
            <form onSubmit={handleReport}>
              {reportError && <div className="alert alert-error">{reportError}</div>}
              <div className="form-group">
                <label className="form-label">Reason</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Describe the issue (e.g., wrong location, price seems off)"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm">Submit Report</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
