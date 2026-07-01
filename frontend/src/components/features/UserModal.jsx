import { useState, useEffect, useRef } from 'react';
import { X, User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'madrasah_diniyah', label: 'Madrasah Diniyah' },
  { value: 'bendahara', label: 'Bendahara' },
];

export function UserModal({ isOpen, onClose, onSubmit, editData, isSubmitting, error }) {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          username: editData.username || '',
          full_name: editData.full_name || '',
          email: editData.email || '',
          phone: editData.phone || '',
          role: editData.role || '',
          password: '',
        });
      } else {
        setFormData({ username: '', full_name: '', email: '', phone: '', role: '', password: '' });
      }
      setValidationErrors({});
      setShowPassword(false);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, editData]);

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) errors.username = 'Username wajib diisi!';
    else if (formData.username.trim().length < 3) errors.username = 'Username minimal 3 karakter!';
    if (!formData.full_name.trim()) errors.full_name = 'Nama lengkap wajib diisi!';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format email tidak valid!';
    }
    if (formData.phone && !/^[0-9+\-\s()]*$/.test(formData.phone)) {
      errors.phone = 'Format nomor HP tidak valid!';
    }
    if (!formData.role) errors.role = 'Role wajib dipilih!';
    if (!editData && !formData.password) errors.password = 'Password wajib diisi untuk user baru!';
    if (formData.password && formData.password.length < 8) errors.password = 'Password minimal 8 karakter!';
    return errors;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    const submitData = { ...formData };
    if (editData && !submitData.password) delete submitData.password;
    onSubmit(submitData);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="user-modal-overlay" onClick={handleOverlayClick}>
      <div className="user-modal">
        {/* Header */}
        <div className="user-modal__header">
          <h2 className="user-modal__title">
            {editData ? 'Edit User' : 'Tambah User Baru'}
          </h2>
          <button className="user-modal__close" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="user-modal__error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="user-modal__form" onSubmit={handleSubmit}>
          <div className="user-modal__grid">
            {/* Username */}
            <div className={`form-field ${validationErrors.username ? 'has-error' : ''}`}>
              <label>Username</label>
              <div className="input-icon-wrapper">
                <User size={15} className="input-icon" />
                <input
                  ref={firstInputRef}
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="Masukkan username"
                  disabled={!!editData || isSubmitting}
                  autoComplete="off"
                />
              </div>
              {validationErrors.username && (
                <span className="field-error">{validationErrors.username}</span>
              )}
            </div>

            {/* Full Name */}
            <div className={`form-field ${validationErrors.full_name ? 'has-error' : ''}`}>
              <label>Nama Lengkap</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Masukkan nama lengkap"
                disabled={isSubmitting}
              />
              {validationErrors.full_name && (
                <span className="field-error">{validationErrors.full_name}</span>
              )}
            </div>

            {/* Email */}
            <div className={`form-field ${validationErrors.email ? 'has-error' : ''}`}>
              <label>Email <span className="optional">(opsional)</span></label>
              <div className="input-icon-wrapper">
                <Mail size={15} className="input-icon" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Masukkan email"
                  disabled={isSubmitting}
                />
              </div>
              {validationErrors.email && (
                <span className="field-error">{validationErrors.email}</span>
              )}
            </div>

            {/* Phone */}
            <div className={`form-field ${validationErrors.phone ? 'has-error' : ''}`}>
              <label>No. HP <span className="optional">(opsional)</span></label>
              <div className="input-icon-wrapper">
                <Phone size={15} className="input-icon" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Masukkan nomor HP"
                  disabled={isSubmitting}
                />
              </div>
              {validationErrors.phone && (
                <span className="field-error">{validationErrors.phone}</span>
              )}
            </div>

            {/* Role */}
            <div className={`form-field ${validationErrors.role ? 'has-error' : ''}`}>
              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">-- Pilih Role --</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {validationErrors.role && (
                <span className="field-error">{validationErrors.role}</span>
              )}
            </div>

            {/* Password */}
            <div className={`form-field ${validationErrors.password ? 'has-error' : ''}`}>
              <label>Password {editData && <span className="optional">(opsional)</span>}</label>
              <div className="input-icon-wrapper">
                <Lock size={15} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={editData ? 'Kosongkan jika tidak ingin mengubah' : 'Masukkan password'}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {validationErrors.password && (
                <span className="field-error">{validationErrors.password}</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="user-modal__footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-sm" />
                  Menyimpan...
                </>
              ) : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
