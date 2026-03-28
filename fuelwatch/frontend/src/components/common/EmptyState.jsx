import React from 'react';

export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', textAlign: 'center', gap: '12px',
    }}>
      <div style={{ fontSize: '3rem', lineHeight: 1 }}>{icon}</div>
      {title && <h3 style={{ color: 'var(--color-text)', margin: 0 }}>{title}</h3>}
      {message && <p style={{ maxWidth: '400px', margin: 0 }}>{message}</p>}
      {action}
    </div>
  );
}
