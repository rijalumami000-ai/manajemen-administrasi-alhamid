import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { SmartAlert } from '../ui/SmartAlert';
import { User, Save } from 'lucide-react';

export function GuruModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  mataPelajaranList = [],
  jabatanList = [],
  isSubmitting = false,
  error = null
}) {
  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    mata_pelajaran_id: '',
    jabatan_id: '',
    no_hp: '',
    status: '',
    alamat: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [alamatFocused, setAlamatFocused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          nip: editData.nip || '',
          nama: editData.nama || '',
          mata_pelajaran_id: editData.mata_pelajaran_id !== null && editData.mata_pelajaran_id !== undefined ? String(editData.mata_pelajaran_id) : '',
          jabatan_id: editData.jabatan_id !== null && editData.jabatan_id !== undefined ? String(editData.jabatan_id) : '',
          no_hp: editData.no_hp || '',
          status: editData.status || '',
          alamat: editData.alamat || ''
        });
      } else {
        setFormData({
          nip: '',
          nama: '',
          mata_pelajaran_id: '',
          jabatan_id: '',
          no_hp: '',
          status: '',
          alamat: ''
        });
      }
      setFormErrors({});
    }
  }, [isOpen, editData]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const errors = {};
    if (!formData.nama || !formData.nama.trim()) {
      errors.nama = 'Nama wajib diisi';
    }
    if (!formData.mata_pelajaran_id) {
      errors.mata_pelajaran_id = 'Mata pelajaran wajib dipilih';
    }
    if (!formData.jabatan_id) {
      errors.jabatan_id = 'Jabatan wajib dipilih';
    }
    if (!formData.no_hp || !formData.no_hp.trim()) {
      errors.no_hp = 'No. HP wajib diisi';
    }
    if (!formData.status) {
      errors.status = 'Status wajib dipilih';
    }
    if (!formData.alamat || !formData.alamat.trim()) {
      errors.alamat = 'Alamat wajib diisi';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const submitData = {
      nip: formData.nip.trim() || null,
      nama: formData.nama.trim(),
      mata_pelajaran_id: formData.mata_pelajaran_id ? Number(formData.mata_pelajaran_id) : null,
      jabatan_id: formData.jabatan_id ? Number(formData.jabatan_id) : null,
      no_hp: formData.no_hp.trim(),
      status: formData.status,
      alamat: formData.alamat.trim()
    };

    onSubmit(submitData);
  };

  const handleCancel = () => {
    onClose();
  };

  // Options
  const mapelOptions = mataPelajaranList.map(mapel => ({
    value: String(mapel.id),
    label: mapel.nama
  }));

  const jabatanOptions = jabatanList.map(jab => ({
    value: String(jab.id),
    label: jab.nama
  }));

  const statusOptions = [
    { label: 'Aktif', value: 'Aktif' },
    { label: 'Cuti', value: 'Cuti' },
    { label: 'Pensiun', value: 'Pensiun' }
  ];

  return (
    <CustomModal
      open={isOpen}
      onClose={handleCancel}
      title={editData ? 'Edit Guru' : 'Tambah Guru'}
      subtitle={editData ? 'Perbarui informasi profil dan penugasan guru' : 'Daftarkan ustadz/ustadzah baru ke sistem'}
      icon={<User />}
      width={680}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button
            type="button"
            className="btn-custom btn-secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn-custom btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading-spinner"></span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} /> {editData ? 'Perbarui' : 'Simpan'}
              </span>
            )}
          </button>
        </div>
      }
    >
      <div className="guru-form-container">
        {error && (
          <div style={{ marginBottom: '16px' }}>
            <SmartAlert message={error} type="error" />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <SmartAlert 
            message="Catatan: Jika mata pelajaran atau jabatan belum tersedia, tambahkan terlebih dahulu lewat tab di halaman utama." 
            type="info" 
          />
        </div>

        <form onSubmit={handleSubmit} className="guru-form">
          <div className="guru-form-grid">
            <FloatingInput
              label="NIP (Opsional)"
              name="nip"
              value={formData.nip}
              onChange={(e) => handleChange('nip', e.target.value)}
              error={formErrors.nip}
              disabled={isSubmitting}
            />

            <FloatingInput
              label="Nama Lengkap"
              name="nama"
              value={formData.nama}
              onChange={(e) => handleChange('nama', e.target.value)}
              error={formErrors.nama}
              required
              disabled={isSubmitting}
            />

            <CustomSelect
              label="Mata Pelajaran"
              value={formData.mata_pelajaran_id}
              onChange={(v) => handleChange('mata_pelajaran_id', v)}
              options={mapelOptions}
              error={formErrors.mata_pelajaran_id}
              required
              disabled={isSubmitting}
            />

            <CustomSelect
              label="Jabatan Utama"
              value={formData.jabatan_id}
              onChange={(v) => handleChange('jabatan_id', v)}
              options={jabatanOptions}
              error={formErrors.jabatan_id}
              required
              disabled={isSubmitting}
            />

            <FloatingInput
              label="Nomor HP / WhatsApp"
              name="no_hp"
              value={formData.no_hp}
              onChange={(e) => handleChange('no_hp', e.target.value)}
              error={formErrors.no_hp}
              required
              disabled={isSubmitting}
            />

            <CustomSelect
              label="Status Keaktifan"
              value={formData.status}
              onChange={(v) => handleChange('status', v)}
              options={statusOptions}
              error={formErrors.status}
              required
              disabled={isSubmitting}
            />

            <div className="guru-form-full">
              <div className={`ui-floating-input ${(alamatFocused || formData.alamat) ? 'active' : ''} ${formErrors.alamat ? 'has-error' : ''} ${isSubmitting ? 'disabled' : ''}`}>
                <div className="ui-floating-input__wrapper textarea-wrapper">
                  <textarea
                    name="alamat"
                    className="ui-floating-input__field textarea-field"
                    value={formData.alamat || ''}
                    onChange={(e) => handleChange('alamat', e.target.value)}
                    onFocus={() => setAlamatFocused(true)}
                    onBlur={() => setAlamatFocused(false)}
                    rows={3}
                    disabled={isSubmitting}
                    style={{ resize: 'vertical', paddingTop: '20px', minHeight: '80px' }}
                  />
                  <label className="ui-floating-input__label">
                    Alamat Lengkap <span className="required-asterisk">*</span>
                  </label>
                </div>
                {formErrors.alamat && <div className="ui-floating-input__error">{formErrors.alamat}</div>}
              </div>
            </div>
          </div>
        </form>
      </div>
    </CustomModal>
  );
}
