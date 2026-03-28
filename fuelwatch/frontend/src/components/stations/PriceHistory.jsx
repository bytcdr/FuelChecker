import React from 'react';
import { formatPHP, formatDateTime } from '../../utils/formatters.js';

export default function PriceHistory({ history }) {
  if (!history || history.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No price history yet.</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Fuel Type</th>
            <th>Price</th>
            <th>Observed At</th>
            <th>Submitted By</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.id}>
              <td>{h.product_name}</td>
              <td style={{ fontWeight: 600 }}>{formatPHP(h.submitted_price)}</td>
              <td className="text-sm">{formatDateTime(h.observed_at)}</td>
              <td className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {h.submitter_name || 'Anonymous'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
