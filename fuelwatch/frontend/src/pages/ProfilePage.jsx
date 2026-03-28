import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.js';
import { stationsApi } from '../api/stations.js';
import { useAuth } from '../hooks/useAuth.js';
import StatusBadge from '../components/common/StatusBadge.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatPHP, formatDateTime } from '../utils/formatters.js';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [stationSubmissions, setStationSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('prices');

  useEffect(() => {
    Promise.all([
      submissionsApi.getMy(),
      stationsApi.getMySubmissions(),
    ])
      .then(([priceData, stationData]) => {
        setSubmissions(priceData.submissions);
        setStationSubmissions(stationData.stations);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Profile Card */}
          <div>
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 700, margin: '0 auto 12px',
                }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <h3 style={{ margin: 0 }}>{user?.name}</h3>
                <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>{user?.email}</p>
                <div style={{ marginTop: '8px' }}>
                  <StatusBadge status={user?.role} />
                </div>
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/submit-price" className="btn btn-primary btn-full">
                  📝 Submit Price
                </Link>
                <button onClick={logout} className="btn btn-secondary btn-full">
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Submissions */}
          <div>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={`btn btn-sm ${tab === 'prices' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('prices')}>
                  Price Submissions {submissions.length > 0 && `(${submissions.length})`}
                </button>
                <button className={`btn btn-sm ${tab === 'stations' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('stations')}>
                  Station Submissions {stationSubmissions.length > 0 && `(${stationSubmissions.length})`}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Link to="/submit-price" className="btn btn-sm btn-secondary">+ Submit Price</Link>
                <Link to="/submit-station" className="btn btn-sm btn-primary">+ Submit Station</Link>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? <LoadingSpinner /> : tab === 'prices' ? (
              submissions.length === 0 ? (
                <EmptyState icon="📋" title="No price submissions yet"
                  action={<Link to="/submit-price" className="btn btn-primary btn-sm">Submit a Price</Link>} />
              ) : (
                <div className="card">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>Station</th><th>Product</th><th>Price</th><th>Submitted</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {submissions.map((s) => (
                          <tr key={s.id}>
                            <td><Link to={`/stations/${s.station_id}`} style={{ fontWeight: 500 }}>{s.station_name}</Link></td>
                            <td>{s.product_name}</td>
                            <td style={{ fontWeight: 600 }}>{formatPHP(s.submitted_price)}</td>
                            <td className="text-sm">{formatDateTime(s.created_at)}</td>
                            <td>
                              <StatusBadge status={s.status} />
                              {s.moderation_notes && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{s.moderation_notes}</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              stationSubmissions.length === 0 ? (
                <EmptyState icon="⛽" title="No station submissions yet"
                  action={<Link to="/submit-station" className="btn btn-primary btn-sm">Submit a Station</Link>} />
              ) : (
                <div className="card">
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>Station Name</th><th>Brand</th><th>Barangay</th><th>Submitted</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {stationSubmissions.map((s) => (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 500 }}>
                              {s.status === 'approved'
                                ? <Link to={`/stations/${s.id}`}>{s.name}</Link>
                                : s.name}
                            </td>
                            <td>{s.brand || '—'}</td>
                            <td>{s.barangay || '—'}</td>
                            <td className="text-sm">{formatDateTime(s.created_at)}</td>
                            <td>
                              <StatusBadge status={s.status} />
                              {s.rejection_note && <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '2px' }}>Note: {s.rejection_note}</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
