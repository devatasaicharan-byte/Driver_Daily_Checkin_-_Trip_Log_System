import React from 'react';
import { AlertCircle } from 'lucide-react';

const NotFound = ({ setCurrentPage }) => {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <AlertCircle size={64} style={{ color: 'var(--danger-color)', marginBottom: '1.5rem' }} />
      <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '2rem' }}>
        The operations panel page you are looking for does not exist or has been shifted.
      </p>
      <button className="btn btn-primary" onClick={() => setCurrentPage('dashboard')}>
        Return to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
