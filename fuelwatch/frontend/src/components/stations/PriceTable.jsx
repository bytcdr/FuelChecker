import React from 'react';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatPHP, timeAgo } from '../../utils/formatters.js';

export default function PriceTable({ prices }) {
  if (!prices || prices.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
        No approved prices yet. Be the first to submit!
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Fuel Type</th>
            <th>Price</th>
            <th>Observed</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p) => (
            <tr key={p.id}>
              <td style={{ fontWeight: 500 }}>{p.product_name}</td>
              <td style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)' }}>
                {formatPHP(p.current_price)}
              </td>
              <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {timeAgo(p.effective_at)}
              </td>
              <td>
                <StatusBadge status={p.is_stale ? 'stale' : 'fresh'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
