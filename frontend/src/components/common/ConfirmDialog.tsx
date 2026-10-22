import React, { ReactNode } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.scss';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: ReactNode;
  content?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  content,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  type = 'warning',
  isLoading = false
}: ConfirmDialogProps) {
  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title={title}
      icon={<AlertTriangle />}
      width={420}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button
            type="button"
            className="btn-custom btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn-custom ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </button>
        </div>
      }
    >
      <div className="confirm-dialog-content">
        {typeof content === 'string' ? <p>{content}</p> : content}
      </div>
    </CustomModal>
  );
}

export default ConfirmDialog;
