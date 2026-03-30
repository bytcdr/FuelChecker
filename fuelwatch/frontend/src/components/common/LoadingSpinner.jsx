import React from 'react';

export default function LoadingSpinner({ text = 'Loading...', size }) {
  if (size === 'sm') {
    return (
      <div
        style={{
          display: 'inline-block',
          width: '14px',
          height: '14px',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          opacity: 0.7,
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div className="loading-center">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}
