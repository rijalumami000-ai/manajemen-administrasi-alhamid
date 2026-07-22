import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { SmartAlert } from '../ui/SmartAlert';
import { AlertTriangle, Save, FileText, ShieldAlert } from 'lucide-react';
import { SantriAutocomplete } from './SantriAutocomplete';
import './PelanggaranModal.scss';

export function PelanggaranModal({ isOpen, onClose, onSubmit, editData, isSubmitting, error }) {
  const [formData, setFormData] = useState({
    santri_id: '',
    jenis: '',
    tanggal: '',
    deskripsi: '',
    sanksi: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          santri_id: editData.santri_id || '',
          jenis: editData.jenis || '',
          tanggal: editData.tanggal ? editData.tanggal.split('T')[0] : '',
          deskripsi: editData.deskripsi || '',
          sanksi: editData.sanksi || ''
        });
      } else {
        setFormData({
          santri_id: '',
          jenis: '',
          tanggal: new Date().toISOString().split('T')[0],
          deskripsi: '',
          sanksi: ''
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
    if (!formData.santri_id) errors.santri_id = 'Santri wajib dipilih';
    if (!formData.jenis || !formData.jenis.trim()) errors.jenis = 'Jenis pelanggaran wajib diisi';
    if (!formData.tanggal) errors.tanggal = 'Tanggal wajib diisi';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSubmit({
      santri_id: formData.santri_id,
      jenis: formData.jenis.trim(),
      tanggal: formData.tanggal,
      deskripsi: formData.deskripsi ? formData.deskripsi.trim() : null,
      sanksi: formData.sanksi ? formData.sanksi.trim() : null
    });
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Data Pelanggaran' : 'Tambah Data Pelanggaran'}
      subtitle={editData ? 'Perbarui catatan pelanggaran santri' : 'Catat pelanggaran santri baru'}
      icon={<AlertTriangle style={{ color: '#ef4444' }} />}
      width={560}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button type="button" className="btn-custom btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button type="button" className="btn-custom btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={16} /> {editData ? 'Perbarui' : 'Simpan'}</span>}
          </button>
        </div>
      }
    >
      <div className="pelanggaran-form-container">
        {error && <div style={{ marginBottom: '16px' }}><SmartAlert message={error} type="error" /></div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--lt-text-secondary, #475569)' }}>
              Santri <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <SantriAutocomplete
              value={formData.santri_id}
              onChange={(val) => handleChange('santri_id', val)}
              error={formErrors.santri_id}
            />
          </div>

          <FloatingInput
            label="Jenis Pelanggaran"
            name="jenis"
            icon={AlertTriangle}
            value={formData.jenis}
            onChange={(e) => handleChange('jenis', e.target.value)}
            error={formErrors.jenis}
            required
            disabled={isSubmitting}
            placeholder="Contoh: Terlambat, Tidak Mengerjakan Tugas"
          />

          <CustomDatePicker
            label="Tanggal Pelanggaran"
            value={formData.tanggal}
            onChange={(val) => handleChange('tanggal', val)}
            error={formErrors.tanggal}
            required
            disabled={isSubmitting}
          />

          <FloatingInput
            label="Deskripsi Pelanggaran"
            name="deskripsi"
            icon={FileText}
            value={formData.deskripsi}
            onChange={(e) => handleChange('deskripsi', e.target.value)}
            disabled={isSubmitting}
            placeholder="Detail penjelasan pelanggaran..."
          />

          <FloatingInput
            label="Sanksi yang Diberikan"
            name="sanksi"
            icon={ShieldAlert}
            value={formData.sanksi}
            onChange={(e) => handleChange('sanksi', e.target.value)}
            disabled={isSubmitting}
            placeholder="Catatan sanksi..."
          />
        </form>
      </div>
    </CustomModal>
  );
}
