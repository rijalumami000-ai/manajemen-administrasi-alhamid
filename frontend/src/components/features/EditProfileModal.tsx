import React, { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { SmartAlert } from '../ui/SmartAlert';
import { User, Mail, Phone, Save } from 'lucide-react';
import { UserProfile, EditProfileFormData } from '../../types/profile';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditProfileFormData) => void;
  profileData?: UserProfile | null;
  isSubmitting?: boolean;
  error?: string | null;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  profileData,
  isSubmitting = false,
  error = null
}) => {
  const [formData, setFormData] = useState<EditProfileFormData>({
    full_name: '',
    email: '',
    phone: ''
  });
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (isOpen && profileData) {
      setFormData({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        phone: profileData.phone || ''
      });
      setFormError('');
    }
  }, [isOpen, profileData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || formData.full_name.trim().length < 3) {
      setFormError('Nama lengkap minimal 3 karakter!');
      return;
    }
    setFormError('');
    onSubmit(formData);
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title="Edit Profil Saya"
      subtitle="Perbarui data kontak dan informasi personal akun Anda"
      icon={<User size={20} />}
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
              'Menyimpan...'
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Save size={15} />
                <span>Simpan Perubahan</span>
              </span>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {(error || formError) && <SmartAlert message={formError || error} type="error" />}

        <FloatingInput
          label="Nama Lengkap"
          name="full_name"
          icon={User}
          value={formData.full_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          required
          disabled={isSubmitting}
        />

        <FloatingInput
          label="Alamat Email"
          name="email"
          type="email"
          icon={Mail}
          value={formData.email || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          disabled={isSubmitting}
        />

        <FloatingInput
          label="Nomor WhatsApp / HP"
          name="phone"
          icon={Phone}
          value={formData.phone || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          disabled={isSubmitting}
        />
      </form>
    </CustomModal>
  );
};
