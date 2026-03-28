import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../api/reports.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDateTime } from '../../utils/formatters.js';

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    reportsApi.getAll(statusFilter ? { status: statusFilter } : {})
      .then((d) => setReports(d.reports))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleUpdate = async (id, status) => {
    setUpdating(id);
    try {
      await reportsApi.updateStatus(id, status);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h1>Reports</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['open', 'resolved', 'dismissed', ''].map((s) => (
            <button
              key={s || 'all'}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(s)}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <LoadingSpinner /> : reports.length === 0 ? (
        <EmptyState icon="🚩" title="No reports found" message="No reports match the current filter." />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Reason</th>
                  <th>Reported By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.station_name || '—'}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap' }}>{r.reason}</td>
                    <td className="text-sm">{r.reporter_name || 'Anonymous'}</td>
                    <td className="text-sm">{formatDateTime(r.created_at)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      {r.status === 'open' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-success btn-sm" disabled={updating === r.id} onClick={() => handleUpdate(r.id, 'resolved')}>Resolve</button>
                          <button className="btn btn-secondary btn-sm" disabled={updating === r.id} onClick={() => handleUpdate(r.id, 'dismissed')}>Dismiss</button>
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
  );
}
