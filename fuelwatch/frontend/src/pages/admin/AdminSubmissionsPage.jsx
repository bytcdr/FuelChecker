import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { submissionsApi } from '../../api/submissions.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatPHP, formatDateTime } from '../../utils/formatters.js';

export default function AdminSubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'pending');
  const [actionPending, setActionPending] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    submissionsApi.getAll(params)
      .then((d) => setSubmissions(d.submissions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSearchParams(statusFilter ? { status: statusFilter } : {});
    load();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    setActionPending(id);
    try {
      await submissionsApi.approve(id);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionPending(null);
    }
  };

  const handleReject = async () => {
    setActionPending(rejectModal.id);
    try {
      await submissionsApi.reject(rejectModal.id, rejectNote);
      setRejectModal(null);
      setRejectNote('');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionPending(null);
    }
  };

  const handleEditApprove = async () => {
    setActionPending(editModal.id);
    try {
      await submissionsApi.editAndApprove(editModal.id, editForm);
      setEditModal(null);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionPending(null);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h1>Submissions</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['pending', 'approved', 'rejected', ''].map((s) => (
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

      {loading ? <LoadingSpinner /> : submissions.length === 0 ? (
        <EmptyState icon="📋" title="No submissions found" />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Station</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Observed</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                  <th>Proof</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.station_name}<br /><span className="text-muted">{s.station_brand}</span></td>
                    <td>{s.product_name}</td>
                    <td style={{ fontWeight: 700 }}>{formatPHP(s.submitted_price)}</td>
                    <td className="text-sm">{formatDateTime(s.observed_at)}</td>
                    <td className="text-sm">{s.submitter_name || 'Unknown'}</td>
                    <td>
                      <StatusBadge status={s.status} />
                      {s.moderation_notes && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{s.moderation_notes}</div>}
                    </td>
                    <td>
                      {s.proof_image_path
                        ? <a href={s.proof_image_path} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">View</a>
                        : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {s.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button className="btn btn-success btn-sm" disabled={actionPending === s.id} onClick={() => handleApprove(s.id)}>✓ Approve</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setEditModal(s); setEditForm({ submitted_price: s.submitted_price, moderation_notes: '' }); }}>✏️ Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setRejectModal(s)}>✗ Reject</button>
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

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 style={{ marginBottom: '12px' }}>Reject Submission</h3>
            <p style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
              Rejecting: <strong>{formatPHP(rejectModal.submitted_price)}</strong> for {rejectModal.product_name} at {rejectModal.station_name}
            </p>
            <div className="form-group">
              <label className="form-label">Moderation Note (optional)</label>
              <textarea className="form-control" rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Reason for rejection..." />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-danger" onClick={handleReject} disabled={!!actionPending}>Confirm Reject</button>
              <button className="btn btn-secondary" onClick={() => { setRejectModal(null); setRejectNote(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 style={{ marginBottom: '12px' }}>Edit & Approve Submission</h3>
            <p style={{ marginBottom: '16px', fontSize: '0.9rem' }}>{editModal.product_name} at {editModal.station_name}</p>
            <div className="form-group">
              <label className="form-label">Corrected Price (₱)</label>
              <input type="number" className="form-control" step="0.01" min="0.01" value={editForm.submitted_price} onChange={(e) => setEditForm((f) => ({ ...f, submitted_price: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Moderation Note (optional)</label>
              <textarea className="form-control" rows={2} value={editForm.moderation_notes} onChange={(e) => setEditForm((f) => ({ ...f, moderation_notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-success" onClick={handleEditApprove} disabled={!!actionPending}>Edit & Approve</button>
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
