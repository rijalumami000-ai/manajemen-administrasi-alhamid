import React, { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { SmartAlert } from '../ui/SmartAlert';
import { User, Mail, Phone, Lock, Eye, EyeOff, Save, Shield } from 'lucide-react';
import { UserItem, UserFormData } from '../../types/user';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
  editData?: UserItem | null;
  isSubmitting?: boolean;
  error?: string | null;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin (Hak Akses Penuh)' },
  { value: 'madrasah_diniyah', label: 'Madrasah Diniyah (Akademik & Nilai)' },
  { value: 'bendahara', label: 'Bendahara (Keuangan & SPP)' }
];

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData,
  isSubmitting = false,
  error = null
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'madrasah_diniyah',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          username: editData.username || '',
          full_name: editData.full_name || '',
          email: editData.email || '',
          phone: editData.phone || '',
          role: editData.role || 'madrasah_diniyah',
          password: ''
        });
      } else {
        setFormData({
          username: '',
          full_name: '',
          email: '',
          phone: '',
          role: 'madrasah_diniyah',
          password: ''
        });
      }
      setValidationErrors({});
      setShowPassword(false);
    }
  }, [isOpen, editData]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.username.trim()) {
      errs.username = 'Username wajib diisi!';
    } else if (formData.username.trim().length < 3) {
      errs.username = 'Username minimal 3 karakter!';
    }

    if (!formData.full_name.trim()) {
      errs.full_name = 'Nama lengkap wajib diisi!';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Format email tidak valid!';
    }

    if (formData.phone && !/^[0-9+\-\s()]*$/.test(formData.phone)) {
      errs.phone = 'Format nomor telepon tidak valid!';
    }

    if (!formData.role) {
      errs.role = 'Role akses wajib dipilih!';
    }

    if (!editData && !formData.password) {
      errs.password = 'Password wajib diisi untuk pengguna baru!';
    } else if (formData.password && formData.password.length < 8) {
      errs.password = 'Password minimal 8 karakter!';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: UserFormData = { ...formData };
    if (editData && !payload.password) {
      delete payload.password;
    }
    onSubmit(payload);
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Pengguna Sistem' : 'Tambah Pengguna Baru'}
      subtitle={editData ? `Memperbarui akun @${editData.username}` : 'Daftarkan pengguna baru dengan hak akses yang sesuai'}
      icon={<Shield size={20} />}
      width={520}
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
                <span>{editData ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
              </span>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <SmartAlert message={error} type="error" />}

        <FloatingInput
          label="Username Login"
          name="username"
          icon={User}
          value={formData.username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('username', e.target.value)}
          required
          disabled={isSubmitting || !!editData}
          error={validationErrors.username}
        />

        <FloatingInput
          label="Nama Lengkap Pengguna"
          name="full_name"
          icon={User}
          value={formData.full_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('full_name', e.target.value)}
          required
          disabled={isSubmitting}
          error={validationErrors.full_name}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <FloatingInput
            label="Email"
            name="email"
            type="email"
            icon={Mail}
            value={formData.email || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('email', e.target.value)}
            disabled={isSubmitting}
            error={validationErrors.email}
          />

          <FloatingInput
            label="Nomor WhatsApp / HP"
            name="phone"
            icon={Phone}
            value={formData.phone || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('phone', e.target.value)}
            disabled={isSubmitting}
            error={validationErrors.phone}
          />
        </div>

        <CustomSelect
          label="Role & Hak Akses"
          value={formData.role}
          onChange={(val: string) => handleChange('role', val)}
          options={ROLE_OPTIONS}
          required
        />

        <div style={{ position: 'relative' }}>
          <FloatingInput
            label={editData ? 'Password Baru (Kosongkan bila tidak diubah)' : 'Password Pengguna (Min. 8 karakter)'}
            name="password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={formData.password || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('password', e.target.value)}
            required={!editData}
            disabled={isSubmitting}
            error={validationErrors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '12px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
            title={showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </form>
    </CustomModal>
  );
};
