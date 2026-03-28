import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { formatDateTime } from '../../utils/formatters.js';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.getUsers()
      .then((d) => setUsers(d.users))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleActive = async (user) => {
    setUpdating(user.id);
    try {
      await adminApi.updateUser(user.id, { is_active: user.is_active ? 0 : 1 });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const toggleRole = async (user) => {
    if (!confirm(`Change role to ${user.role === 'admin' ? 'user' : 'admin'}?`)) return;
    setUpdating(user.id);
    try {
      await adminApi.updateUser(user.id, { role: user.role === 'admin' ? 'user' : 'admin' });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>User Management</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? <LoadingSpinner /> : users.length === 0 ? (
        <EmptyState icon="👥" title="No users found" />
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td className="text-sm">{u.email}</td>
                    <td><StatusBadge status={u.role} /></td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-sm">{formatDateTime(u.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                          disabled={updating === u.id}
                          onClick={() => toggleActive(u)}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={updating === u.id}
                          onClick={() => toggleRole(u)}
                        >
                          {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                        </button>
                      </div>
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
