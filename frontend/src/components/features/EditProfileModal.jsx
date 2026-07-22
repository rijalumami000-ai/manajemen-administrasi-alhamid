import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { SmartAlert } from '../ui/SmartAlert';
import { User, Mail, Phone, Save } from 'lucide-react';

export function EditProfileModal({ isOpen, onClose, onSubmit, profileData, isSubmitting, error }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const [formError, setFormError] = useState('');

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

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
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
      subtitle="Perbarui data profil personal Anda"
      icon={<User />}
      width={480}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button type="button" className="btn-custom btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button type="button" className="btn-custom btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={16} /> Simpan</span>}
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
          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
          required
          disabled={isSubmitting}
        />

        <FloatingInput
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          disabled={isSubmitting}
        />

        <FloatingInput
          label="No. HP"
          name="phone"
          icon={Phone}
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          disabled={isSubmitting}
        />
      </form>
    </CustomModal>
  );
}
