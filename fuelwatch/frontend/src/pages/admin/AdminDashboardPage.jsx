import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.js';
import { submissionsApi } from '../../api/submissions.js';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import { formatPHP, formatDateTime } from '../../utils/formatters.js';

function StatCard({ icon, label, value, color = 'var(--color-primary)' }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color, marginTop: '4px' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.getDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleApprove = async (id) => {
    setApproving(id);
    try {
      await submissionsApi.approve(id);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setApproving(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  const { stats, recent_pending } = data;

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>

      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <StatCard icon="⛽" label="Active Stations" value={stats.total_stations} />
        <StatCard icon="👥" label="Registered Users" value={stats.total_users} />
        <StatCard icon="⏳" label="Pending Submissions" value={stats.pending_submissions} color={stats.pending_submissions > 0 ? 'var(--color-warning)' : 'var(--color-success)'} />
        <StatCard icon="🚩" label="Open Reports" value={stats.open_reports} color={stats.open_reports > 0 ? 'var(--color-danger)' : 'var(--color-success)'} />
      </div>

      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '4px' }}>Submission Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {[
              { label: 'Total', value: stats.total_submissions, color: 'var(--color-text)' },
              { label: 'Approved', value: stats.approved_submissions, color: 'var(--color-success)' },
              { label: 'Pending', value: stats.pending_submissions, color: 'var(--color-warning)' },
              { label: 'Rejected', value: stats.rejected_submissions, color: 'var(--color-danger)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{label}</span>
                <span style={{ fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link to="/admin/submissions" className="btn btn-primary btn-sm">Review Pending Submissions</Link>
            <Link to="/admin/stations" className="btn btn-secondary btn-sm">Manage Stations</Link>
            <Link to="/admin/reports" className="btn btn-secondary btn-sm">View Reports</Link>
          </div>
        </div>
      </div>

      {/* Recent pending */}
      {recent_pending.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>Oldest Pending Submissions</h3>
            <Link to="/admin/submissions?status=pending" className="btn btn-secondary btn-sm">View All Pending</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Submitted By</th>
                  <th>Submitted At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent_pending.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.station_name}</td>
                    <td>{s.product_name}</td>
                    <td style={{ fontWeight: 600 }}>{formatPHP(s.submitted_price)}</td>
                    <td className="text-sm">{s.submitter_name || 'Unknown'}</td>
                    <td className="text-sm">{formatDateTime(s.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-success btn-sm"
                        disabled={approving === s.id}
                        onClick={() => handleApprove(s.id)}
                      >
                        {approving === s.id ? '...' : 'Approve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
