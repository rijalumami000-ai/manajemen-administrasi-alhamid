import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { SmartAlert } from '../ui/SmartAlert';
import { Trophy, Save, FileText, Award, Calendar } from 'lucide-react';
import { SantriAutocomplete } from './SantriAutocomplete';
import './PrestasiModal.scss';

export function PrestasiModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editData, 
  isSubmitting, 
  error,
  tahunAjaranList = [],
  defaultTahunAjaranId = null
}) {
  const [formData, setFormData] = useState({
    santri_id: '',
    tahun_ajaran_id: defaultTahunAjaranId || '',
    jenis: '',
    tanggal: '',
    deskripsi: '',
    penghargaan: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          santri_id: editData.santri_id || '',
          tahun_ajaran_id: editData.tahun_ajaran_id || defaultTahunAjaranId || '',
          jenis: editData.jenis || '',
          tanggal: editData.tanggal ? editData.tanggal.split('T')[0] : '',
          deskripsi: editData.deskripsi || '',
          penghargaan: editData.penghargaan || ''
        });
      } else {
        setFormData({
          santri_id: '',
          tahun_ajaran_id: defaultTahunAjaranId || '',
          jenis: '',
          tanggal: new Date().toISOString().split('T')[0],
          deskripsi: '',
          penghargaan: ''
        });
      }
      setFormErrors({});
    }
  }, [isOpen, editData, defaultTahunAjaranId]);

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
    if (!formData.jenis || !formData.jenis.trim()) errors.jenis = 'Jenis prestasi wajib diisi';
    if (!formData.tanggal) errors.tanggal = 'Tanggal wajib diisi';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSubmit(formData);
  };

  const tahunOptions = tahunAjaranList.map(t => ({
    value: String(t.id),
    label: `${t.kode} ${t.is_active ? '(Aktif)' : ''}`
  }));

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Data Prestasi' : 'Tambah Data Prestasi'}
      subtitle={editData ? 'Perbarui catatan prestasi santri' : 'Catat prestasi santri baru'}
      icon={<Trophy style={{ color: '#f59e0b' }} />}
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
      <div className="prestasi-form-container">
        {error && <div style={{ marginBottom: '16px' }}><SmartAlert message={error} type="error" /></div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tahunOptions.length > 0 && (
            <div>
              <CustomSelect
                label="Tahun Ajaran"
                value={formData.tahun_ajaran_id ? String(formData.tahun_ajaran_id) : ''}
                onChange={(val) => handleChange('tahun_ajaran_id', val ? Number(val) : null)}
                options={tahunOptions}
                placeholder="Pilih Tahun Ajaran"
                disabled={isSubmitting}
              />
            </div>
          )}

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
            label="Jenis / Nama Prestasi"
            name="jenis"
            icon={Trophy}
            value={formData.jenis}
            onChange={(e) => handleChange('jenis', e.target.value)}
            error={formErrors.jenis}
            required
            disabled={isSubmitting}
            placeholder="Contoh: Juara 1 MQK Tingkat Kabupaten, Hafal 30 Juz"
          />

          <CustomDatePicker
            label="Tanggal Prestasi"
            value={formData.tanggal}
            onChange={(val) => handleChange('tanggal', val)}
            error={formErrors.tanggal}
            required
            disabled={isSubmitting}
          />

          <FloatingInput
            label="Deskripsi / Keterangan"
            name="deskripsi"
            icon={FileText}
            value={formData.deskripsi}
            onChange={(e) => handleChange('deskripsi', e.target.value)}
            disabled={isSubmitting}
            placeholder="Keterangan acara, penyelenggara, atau rincian prestasi..."
          />

          <FloatingInput
            label="Penghargaan / Hadiah"
            name="penghargaan"
            icon={Award}
            value={formData.penghargaan}
            onChange={(e) => handleChange('penghargaan', e.target.value)}
            disabled={isSubmitting}
            placeholder="Contoh: Piala, Sertifikat, Beasiswa"
          />
        </form>
      </div>
    </CustomModal>
  );
}
export default PrestasiModal;
