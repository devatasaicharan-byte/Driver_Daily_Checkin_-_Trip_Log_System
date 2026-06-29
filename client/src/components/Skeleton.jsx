import React from 'react';

export const CardSkeleton = () => (
  <div className="kpi-card skeleton-card">
    <div className="skeleton skeleton-title" style={{ width: '40%' }}></div>
    <div className="skeleton skeleton-text" style={{ height: '32px', width: '70%', margin: '10px 0' }}></div>
    <div className="skeleton skeleton-text" style={{ width: '50%' }}></div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="table-card" style={{ padding: '1.5rem' }}>
    <div className="skeleton skeleton-title" style={{ marginBottom: '2rem' }}></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div className="skeleton skeleton-text" style={{ flex: 1, height: '24px' }}></div>
        <div className="skeleton skeleton-text" style={{ flex: 1, height: '24px' }}></div>
        <div className="skeleton skeleton-text" style={{ flex: 1, height: '24px' }}></div>
        <div className="skeleton skeleton-text" style={{ flex: 1, height: '24px' }}></div>
      </div>
    ))}
  </div>
);

export const FormSkeleton = () => (
  <div className="form-container">
    <div className="skeleton skeleton-title" style={{ marginBottom: '2.5rem' }}></div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div className="skeleton skeleton-text" style={{ height: '40px' }}></div>
      <div className="skeleton skeleton-text" style={{ height: '40px' }}></div>
      <div className="skeleton skeleton-text" style={{ height: '40px' }}></div>
      <div className="skeleton skeleton-text" style={{ height: '40px' }}></div>
      <div className="skeleton skeleton-text" style={{ height: '100px', gridColumn: 'span 2' }}></div>
    </div>
  </div>
);
