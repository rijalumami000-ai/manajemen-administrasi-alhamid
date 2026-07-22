import React, { useState } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { SmartAlert } from '../ui/SmartAlert';
import { Lock, ShieldCheck } from 'lucide-react';

export function PasswordConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Password Keamanan',
  subtitle = 'Masukkan password akun Anda untuk melanjutkan tindakan ini',
  isLoading = false
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!password) {
      setError('Password wajib diisi');
      return;
    }
    setError('');
    onConfirm(password);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      icon={<ShieldCheck />}
      width={440}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button
            type="button"
            className="btn-custom btn-secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn-custom btn-primary"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : 'Konfirmasi'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <SmartAlert message={error} type="error" />}
        <FloatingInput
          label="Password Anda"
          name="password"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          required
          disabled={isLoading}
        />
      </form>
    </CustomModal>
  );
}
