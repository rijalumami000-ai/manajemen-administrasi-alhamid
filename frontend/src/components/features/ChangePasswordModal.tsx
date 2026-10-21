import React, { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { SmartAlert } from '../ui/SmartAlert';
import { Lock, KeyRound, Eye, EyeOff, Save } from 'lucide-react';
import { ChangePasswordFormData } from '../../types/profile';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ChangePasswordFormData) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error = null
}) => {
  const [formData, setFormData] = useState<ChangePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFormError('');
      setShowCurrent(false);
      setShowNew(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentPassword) {
      setFormError('Password lama wajib diisi!');
      return;
    }
    if (!formData.newPassword || formData.newPassword.length < 8) {
      setFormError('Password baru minimal 8 karakter!');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setFormError('Password baru dan konfirmasi tidak cocok!');
      return;
    }

    setFormError('');
    onSubmit({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title="Ubah Password Akun"
      subtitle="Perbarui kata sandi akun Anda untuk menjaga keamanan sistem"
      icon={<KeyRound size={20} />}
      width={480}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Mengubah...'
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Save size={15} />
                <span>Simpan Password Baru</span>
              </span>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {(error || formError) && <SmartAlert message={formError || error} type="error" />}

        <div style={{ position: 'relative' }}>
          <FloatingInput
            label="Password Lama"
            name="currentPassword"
            type={showCurrent ? 'text' : 'password'}
            icon={Lock}
            value={formData.currentPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
            required
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowCurrent(p => !p)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title={showCurrent ? 'Sembunyikan' : 'Tampilkan'}
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <FloatingInput
            label="Password Baru (Min. 8 karakter)"
            name="newPassword"
            type={showNew ? 'text' : 'password'}
            icon={Lock}
            value={formData.newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
            required
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowNew(p => !p)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title={showNew ? 'Sembunyikan' : 'Tampilkan'}
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <FloatingInput
          label="Konfirmasi Password Baru"
          name="confirmPassword"
          type={showNew ? 'text' : 'password'}
          icon={Lock}
          value={formData.confirmPassword || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          required
          disabled={isSubmitting}
        />
      </form>
    </CustomModal>
  );
};
