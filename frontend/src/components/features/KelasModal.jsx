import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { SmartAlert } from '../ui/SmartAlert';
import { BookOpen, Save } from 'lucide-react';

export function KelasModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  isSubmitting = false,
  error = null,
  guruList = [],
  mapelList = []
}) {
  const [formData, setFormData] = useState({
    jenis: '',
    nama: '',
    tingkat: '',
    mustahiq_id: '',
    muhafadzoh_mapel_id: '',
    qiroatul_mapel_id: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          jenis: editData.jenis || '',
          nama: editData.nama || '',
          tingkat: editData.tingkat !== null && editData.tingkat !== undefined ? String(editData.tingkat) : '',
          mustahiq_id: editData.mustahiq_id !== null && editData.mustahiq_id !== undefined ? String(editData.mustahiq_id) : '',
          muhafadzoh_mapel_id: editData.muhafadzoh_mapel_id !== null && editData.muhafadzoh_mapel_id !== undefined ? String(editData.muhafadzoh_mapel_id) : '',
          qiroatul_mapel_id: editData.qiroatul_mapel_id !== null && editData.qiroatul_mapel_id !== undefined ? String(editData.qiroatul_mapel_id) : ''
        });
      } else {
        setFormData({
          jenis: '',
          nama: '',
          tingkat: '',
          mustahiq_id: '',
          muhafadzoh_mapel_id: '',
          qiroatul_mapel_id: ''
        });
      }
      setFormErrors({});
    }
  }, [isOpen, editData]);

  const autoDetectTingkat = (namaVal) => {
    if (!namaVal) return '';
    const lower = namaVal.toLowerCase();
    if (lower.includes('sifir')) return '0';
    if (lower.includes('sp')) return '1';
    const match = namaVal.match(/(\d+)/);
    return match ? String(match[1]) : '1';
  };

  const handleChange = (name, value) => {
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'nama' && !editData && (!prev.tingkat || prev.tingkat === '')) {
        next.tingkat = autoDetectTingkat(value);
      }
      return next;
    });
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    
    const errors = {};
    if (!formData.jenis) {
      errors.jenis = 'Jenis kelas wajib dipilih';
    }
    if (!formData.nama || !formData.nama.trim()) {
      errors.nama = 'Nama kelas wajib diisi';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const submissionData = {
      jenis: formData.jenis,
      nama: formData.nama.trim(),
      tingkat: formData.tingkat !== '' && formData.tingkat !== null ? Number(formData.tingkat) : null,
      mustahiq_id: formData.mustahiq_id ? Number(formData.mustahiq_id) : null,
      muhafadzoh_mapel_id: formData.muhafadzoh_mapel_id ? Number(formData.muhafadzoh_mapel_id) : null,
      qiroatul_mapel_id: formData.qiroatul_mapel_id ? Number(formData.qiroatul_mapel_id) : null
    };

    onSubmit(submissionData);
  };

  const handleCancel = () => {
    onClose();
  };

  // Prepare options for CustomSelects
  const guruOptions = guruList.map(guru => ({
    value: String(guru.id),
    label: guru.nama
  }));

  const mapelOptions = mapelList
    .filter(m => m.jenis === 'Reguler')
    .map(mapel => ({
      value: String(mapel.id),
      label: mapel.nama
    }));

  const tingkatOptions = [
    { label: 'Tingkat 0 (Sifir)', value: '0' },
    { label: 'Tingkat 1 (SP / Kelas 1)', value: '1' },
    { label: 'Tingkat 2 (Kelas 2)', value: '2' },
    { label: 'Tingkat 3 (Kelas 3)', value: '3' },
    { label: 'Tingkat 4 (Kelas 4)', value: '4' },
    { label: 'Tingkat 5 (Kelas 5)', value: '5' },
    { label: 'Tingkat 6 (Kelas 6)', value: '6' },
    { label: 'Tingkat 7 (Kelas 7 / MTs 1)', value: '7' },
    { label: 'Tingkat 8 (Kelas 8 / MTs 2)', value: '8' },
    { label: 'Tingkat 9 (Kelas 9 / MTs 3)', value: '9' },
    { label: 'Tingkat 10 (Kelas 10 / MA 1)', value: '10' },
    { label: 'Tingkat 11 (Kelas 11 / MA 2)', value: '11' },
    { label: 'Tingkat 12 (Kelas 12 / MA 3)', value: '12' }
  ];

  return (
    <CustomModal
      open={isOpen}
      onClose={handleCancel}
      title={editData ? 'Edit Kelas' : 'Tambah Kelas'}
      subtitle={editData ? 'Perbarui informasi kelas Diniyah/Sekolah' : 'Tambahkan kelas baru ke sistem akademik'}
      icon={<BookOpen />}
      width={500}
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
      <div className="kelas-form-container">
        {error && (
          <div style={{ marginBottom: '16px' }}>
            <SmartAlert message={error} type="error" />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <SmartAlert 
            message="Informasi: Setiap entri hanya menyimpan satu kelas. Pilih jenis lalu isi nama kelasnya." 
            type="info" 
          />
        </div>

        <form onSubmit={handleSubmit} className="kelas-form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <CustomSelect
              label="Jenis Kelas"
              value={formData.jenis}
              onChange={(v) => handleChange('jenis', v)}
              options={[
                { label: 'Diniyah', value: 'Diniyah' },
                { label: 'Sekolah', value: 'Sekolah' }
              ]}
              error={formErrors.jenis}
              required
              disabled={isSubmitting}
            />

            <FloatingInput
              label="Nama Kelas"
              name="nama"
              icon={BookOpen}
              value={formData.nama}
              onChange={(e) => handleChange('nama', e.target.value)}
              error={formErrors.nama}
              required
              disabled={isSubmitting}
            />

            <CustomSelect
              label="Tingkat Kelas (Jenjang Progresi)"
              value={formData.tingkat}
              onChange={(v) => handleChange('tingkat', v)}
              options={tingkatOptions}
              disabled={isSubmitting}
            />

            <CustomSelect
              label="Mustahiq / Wali Kelas"
              value={formData.mustahiq_id}
              onChange={(v) => handleChange('mustahiq_id', v)}
              options={guruOptions}
              allowClear
              disabled={isSubmitting}
            />

            <CustomSelect
              label="Kitab Muhafadzoh Kelas (Untuk Rapor)"
              value={formData.muhafadzoh_mapel_id}
              onChange={(v) => handleChange('muhafadzoh_mapel_id', v)}
              options={mapelOptions}
              allowClear
              disabled={isSubmitting}
            />

            <CustomSelect
              label="Kitab Qiroatul Kitab Kelas (Untuk Rapor)"
              value={formData.qiroatul_mapel_id}
              onChange={(v) => handleChange('qiroatul_mapel_id', v)}
              options={mapelOptions}
              allowClear
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
    </CustomModal>
  );
}
