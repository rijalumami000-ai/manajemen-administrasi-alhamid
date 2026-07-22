import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { SmartAlert } from '../ui/SmartAlert';
import { Lock, KeyRound } from 'lucide-react';

export function ChangePasswordModal({ isOpen, onClose, onSubmit, isSubmitting, error }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFormError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

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
      subtitle="Perbarui kata sandi akun Anda untuk menjaga keamanan"
      icon={<KeyRound />}
      width={480}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button type="button" className="btn-custom btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button type="button" className="btn-custom btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Mengubah...' : 'Ubah Password'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {(error || formError) && <SmartAlert message={formError || error} type="error" />}

        <FloatingInput
          label="Password Lama"
          name="currentPassword"
          type="password"
          icon={Lock}
          value={formData.currentPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
          required
          disabled={isSubmitting}
        />

        <FloatingInput
          label="Password Baru (min. 8 karakter)"
          name="newPassword"
          type="password"
          icon={Lock}
          value={formData.newPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
          required
          disabled={isSubmitting}
        />

        <FloatingInput
          label="Konfirmasi Password Baru"
          name="confirmPassword"
          type="password"
          icon={Lock}
          value={formData.confirmPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          required
          disabled={isSubmitting}
        />
      </form>
    </CustomModal>
  );
}
