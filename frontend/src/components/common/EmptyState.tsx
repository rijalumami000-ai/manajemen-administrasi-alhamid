import React, { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import './EmptyState.scss';

export interface EmptyStateProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title = 'Tidak Ada Data',
  description = 'Belum ada data yang tersedia untuk ditampilkan.',
  action
}: EmptyStateProps) {
  return (
    <div className="custom-empty-state">
      <div className="empty-icon-wrapper">
        <Inbox size={40} />
      </div>
      <h4 className="empty-title">{title}</h4>
      <p className="empty-description">{description}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
