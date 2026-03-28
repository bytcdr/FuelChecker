import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submissionsApi } from '../api/submissions.js';
import { useAuth } from '../hooks/useAuth.js';
import StatusBadge from '../components/common/StatusBadge.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatPHP, formatDateTime } from '../utils/formatters.js';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    submissionsApi.getMy()
      .then((data) => setSubmissions(data.submissions))
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
            <h2 style={{ marginBottom: '16px' }}>My Submissions</h2>
            {error && <div className="alert alert-error">{error}</div>}
            {loading ? (
              <LoadingSpinner />
            ) : submissions.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No submissions yet"
                message="Help the community by submitting fuel prices at your local station."
                action={<Link to="/submit-price" className="btn btn-primary btn-sm">Submit Now</Link>}
              />
            ) : (
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Station</th>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Submitted</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <Link to={`/stations/${s.station_id}`} style={{ fontWeight: 500 }}>
                              {s.station_name}
                            </Link>
                          </td>
                          <td>{s.product_name}</td>
                          <td style={{ fontWeight: 600 }}>{formatPHP(s.submitted_price)}</td>
                          <td className="text-sm">{formatDateTime(s.created_at)}</td>
                          <td>
                            <StatusBadge status={s.status} />
                            {s.moderation_notes && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                Note: {s.moderation_notes}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
