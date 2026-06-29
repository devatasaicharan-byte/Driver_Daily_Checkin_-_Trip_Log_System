import React from 'react';
import { Database } from 'lucide-react';

const EmptyState = ({ title = 'No records found', description = 'Try adjusting your search filters or add a new record to get started.', actionLabel, onAction }) => {
  return (
    <div className="empty-state">
      <Database size={48} className="empty-state-icon" />
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
