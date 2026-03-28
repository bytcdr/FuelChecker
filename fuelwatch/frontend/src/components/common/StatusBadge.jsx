import React from 'react';

const STATUS_MAP = {
  pending:   { label: 'Pending',   cls: 'badge-pending' },
  approved:  { label: 'Approved',  cls: 'badge-approved' },
  rejected:  { label: 'Rejected',  cls: 'badge-rejected' },
  stale:     { label: 'Stale',     cls: 'badge-stale' },
  fresh:     { label: 'Fresh',     cls: 'badge-fresh' },
  open:      { label: 'Open',      cls: 'badge-open' },
  resolved:  { label: 'Resolved',  cls: 'badge-resolved' },
  dismissed: { label: 'Dismissed', cls: 'badge-dismissed' },
  admin:     { label: 'Admin',     cls: 'badge-info' },
  user:      { label: 'User',      cls: 'badge-pending' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: status, cls: 'badge-info' };
  return <span className={`badge ${config.cls}`}>{config.label}</span>;
}
