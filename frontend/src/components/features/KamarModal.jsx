import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { SmartAlert } from '../ui/SmartAlert';
import { Home, Save, Building, Layers, Users, Wrench, FileText } from 'lucide-react';
import './KamarModal.scss';

export function KamarModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  isSubmitting = false,
  error = null
}) {
  const [formData, setFormData] = useState({
    nama: '',
    jenis: '',
    gedung: '',
    lantai: '1',
    kapasitas: '',
    terisi: '0',
    status: 'Tersedia',
    fasilitas: '',
    keterangan: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          nama: editData.nama || '',
          jenis: editData.jenis || '',
          gedung: editData.gedung || '',
          lantai: editData.lantai !== null && editData.lantai !== undefined ? String(editData.lantai) : '1',
          kapasitas: editData.kapasitas !== null && editData.kapasitas !== undefined ? String(editData.kapasitas) : '',
          terisi: editData.terisi !== null && editData.terisi !== undefined ? String(editData.terisi) : '0',
          status: editData.status || 'Tersedia',
          fasilitas: editData.fasilitas || '',
          keterangan: editData.keterangan || ''
        });
      } else {
        setFormData({
          nama: '',
          jenis: '',
          gedung: '',
          lantai: '1',
          kapasitas: '',
          terisi: '0',
          status: 'Tersedia',
          fasilitas: '',
          keterangan: ''
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
      errors.nama = 'Nama kamar wajib diisi';
    }
    if (!formData.jenis) {
      errors.jenis = 'Jenis kamar wajib dipilih';
    }
    if (!formData.kapasitas || Number(formData.kapasitas) < 1) {
      errors.kapasitas = 'Kapasitas minimal 1';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const submissionData = {
      nama: formData.nama.trim(),
      jenis: formData.jenis,
      gedung: formData.gedung ? formData.gedung.trim() : null,
      lantai: formData.lantai ? Number(formData.lantai) : 1,
      kapasitas: Number(formData.kapasitas),
      terisi: formData.terisi ? Number(formData.terisi) : 0,
      status: formData.status || 'Tersedia',
      fasilitas: formData.fasilitas ? formData.fasilitas.trim() : null,
      keterangan: formData.keterangan ? formData.keterangan.trim() : null
    };

    onSubmit(submissionData);
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Kamar Asrama' : 'Tambah Kamar Asrama'}
      subtitle={editData ? 'Perbarui informasi kamar asrama santri' : 'Tambahkan kamar asrama baru ke sistem'}
      icon={<Home />}
      width={560}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button
            type="button"
            className="btn-custom btn-secondary"
            onClick={onClose}
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
      <div className="kamar-form-container">
        {error && (
          <div style={{ marginBottom: '16px' }}>
            <SmartAlert message={error} type="error" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="kamar-form">
          {/* Section 1: Informasi Kamar */}
          <div className="form-group-section">
            <h4 className="section-title">Informasi Kamar</h4>
            <div className="form-grid-2">
              <FloatingInput
                label="Nama Kamar"
                name="nama"
                icon={Home}
                value={formData.nama}
                onChange={(e) => handleChange('nama', e.target.value)}
                error={formErrors.nama}
                required
                disabled={isSubmitting}
                placeholder="Contoh: A1, B2"
              />

              <CustomSelect
                label="Jenis Kamar"
                value={formData.jenis}
                onChange={(v) => handleChange('jenis', v)}
                options={[
                  { label: 'Putra', value: 'Putra' },
                  { label: 'Putri', value: 'Putri' }
                ]}
                error={formErrors.jenis}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-grid-2">
              <FloatingInput
                label="Gedung"
                name="gedung"
                icon={Building}
                value={formData.gedung}
                onChange={(e) => handleChange('gedung', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: Gedung A"
              />

              <FloatingInput
                label="Lantai"
                name="lantai"
                type="number"
                icon={Layers}
                value={formData.lantai}
                onChange={(e) => handleChange('lantai', e.target.value)}
                disabled={isSubmitting}
                placeholder="1, 2, 3..."
              />
            </div>
          </div>

          {/* Section 2: Kapasitas & Status */}
          <div className="form-group-section">
            <h4 className="section-title">Kapasitas & Status</h4>
            <div className="form-grid-3">
              <FloatingInput
                label="Kapasitas Tempat"
                name="kapasitas"
                type="number"
                icon={Users}
                value={formData.kapasitas}
                onChange={(e) => handleChange('kapasitas', e.target.value)}
                error={formErrors.kapasitas}
                required
                disabled={isSubmitting}
                placeholder="Jumlah tempat"
              />

              <FloatingInput
                label="Terisi (Santri)"
                name="terisi"
                type="number"
                icon={Users}
                value={formData.terisi}
                onChange={(e) => handleChange('terisi', e.target.value)}
                disabled={isSubmitting}
                placeholder="Jumlah santri"
              />

              <CustomSelect
                label="Status Kamar"
                value={formData.status}
                onChange={(v) => handleChange('status', v)}
                options={[
                  { label: 'Tersedia', value: 'Tersedia' },
                  { label: 'Penuh', value: 'Penuh' },
                  { label: 'Maintenance', value: 'Maintenance' }
                ]}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Section 3: Detail Tambahan */}
          <div className="form-group-section">
            <h4 className="section-title">Detail Tambahan</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <FloatingInput
                label="Fasilitas Kamar"
                name="fasilitas"
                icon={Wrench}
                value={formData.fasilitas}
                onChange={(e) => handleChange('fasilitas', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: AC, Lemari, Kasur"
              />

              <FloatingInput
                label="Keterangan Catatan"
                name="keterangan"
                icon={FileText}
                value={formData.keterangan}
                onChange={(e) => handleChange('keterangan', e.target.value)}
                disabled={isSubmitting}
                placeholder="Catatan tambahan (opsional)"
              />
            </div>
          </div>
        </form>
      </div>
    </CustomModal>
  );
}
