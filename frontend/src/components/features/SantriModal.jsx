import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { SmartAlert } from '../ui/SmartAlert';
import { User, IdCard, Home, Phone, Briefcase, FileText, Save } from 'lucide-react';
import './SantriModal.scss';

export function SantriModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  kelasList = [],
  kamarList = [],
  isSubmitting = false,
  error = null
}) {
  const [formData, setFormData] = useState({
    nis: '',
    nik: '',
    nama: '',
    jenis_kelamin: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    kelas_diniyah_id: '',
    kelas_sekolah_id: '',
    kamar_id: '',
    status_tahun_ajaran: 'aktif',
    catatan_tahun_ajaran: '',
    alamat: '',
    nama_ayah: '',
    pekerjaan_ayah: '',
    no_hp_ayah: '',
    nama_ibu: '',
    pekerjaan_ibu: '',
    no_hp_ibu: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          nis: editData.nis || '',
          nik: editData.nik || '',
          nama: editData.nama || '',
          jenis_kelamin: editData.jenis_kelamin || '',
          tempat_lahir: editData.tempat_lahir || '',
          tanggal_lahir: editData.tanggal_lahir ? editData.tanggal_lahir.split('T')[0] : '',
          kelas_diniyah_id: editData.kelas_diniyah_id ? String(editData.kelas_diniyah_id) : '',
          kelas_sekolah_id: editData.kelas_sekolah_id ? String(editData.kelas_sekolah_id) : '',
          kamar_id: editData.kamar_id ? String(editData.kamar_id) : '',
          status_tahun_ajaran: editData.status_tahun_ajaran || 'aktif',
          catatan_tahun_ajaran: editData.catatan_tahun_ajaran || '',
          alamat: editData.alamat || '',
          nama_ayah: editData.nama_ayah || '',
          pekerjaan_ayah: editData.pekerjaan_ayah || '',
          no_hp_ayah: editData.no_hp_ayah || '',
          nama_ibu: editData.nama_ibu || '',
          pekerjaan_ibu: editData.pekerjaan_ibu || '',
          no_hp_ibu: editData.no_hp_ibu || ''
        });
      } else {
        setFormData({
          nis: '',
          nik: '',
          nama: '',
          jenis_kelamin: '',
          tempat_lahir: '',
          tanggal_lahir: '',
          kelas_diniyah_id: '',
          kelas_sekolah_id: '',
          kamar_id: '',
          status_tahun_ajaran: 'aktif',
          catatan_tahun_ajaran: '',
          alamat: '',
          nama_ayah: '',
          pekerjaan_ayah: '',
          no_hp_ayah: '',
          nama_ibu: '',
          pekerjaan_ibu: '',
          no_hp_ibu: ''
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
    if (!formData.nis || !formData.nis.trim()) errors.nis = 'NIS wajib diisi';
    if (!formData.nama || !formData.nama.trim()) errors.nama = 'Nama lengkap wajib diisi';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const submissionData = {
      ...formData,
      nis: formData.nis.trim(),
      nama: formData.nama.trim(),
      nik: formData.nik ? formData.nik.trim() : null,
      tempat_lahir: formData.tempat_lahir ? formData.tempat_lahir.trim() : null,
      tanggal_lahir: formData.tanggal_lahir || null,
      kelas_diniyah_id: formData.kelas_diniyah_id ? Number(formData.kelas_diniyah_id) : null,
      kelas_sekolah_id: formData.kelas_sekolah_id ? Number(formData.kelas_sekolah_id) : null,
      kamar_id: formData.kamar_id ? Number(formData.kamar_id) : null,
      alamat: formData.alamat ? formData.alamat.trim() : null,
      catatan_tahun_ajaran: formData.catatan_tahun_ajaran ? formData.catatan_tahun_ajaran.trim() : null,
      nama_ayah: formData.nama_ayah ? formData.nama_ayah.trim() : null,
      pekerjaan_ayah: formData.pekerjaan_ayah ? formData.pekerjaan_ayah.trim() : null,
      no_hp_ayah: formData.no_hp_ayah ? formData.no_hp_ayah.trim() : null,
      nama_ibu: formData.nama_ibu ? formData.nama_ibu.trim() : null,
      pekerjaan_ibu: formData.pekerjaan_ibu ? formData.pekerjaan_ibu.trim() : null,
      no_hp_ibu: formData.no_hp_ibu ? formData.no_hp_ibu.trim() : null
    };

    onSubmit(submissionData);
  };

  const kelasDiniyahOptions = kelasList
    .filter(k => k.jenis === 'Diniyah')
    .map(k => ({ label: k.nama, value: String(k.id) }));

  const kelasSekolahOptions = kelasList
    .filter(k => k.jenis === 'Sekolah')
    .map(k => ({ label: k.nama, value: String(k.id) }));

  const kamarOptions = kamarList.map(k => ({
    label: `${k.nama} (${k.jenis}) - ${k.terisi}/${k.kapasitas}`,
    value: String(k.id)
  }));

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Data Santri' : 'Tambah Santri Baru'}
      subtitle={editData ? 'Perbarui informasi identitas & akademik santri' : 'Daftarkan santri baru ke dalam sistem'}
      icon={<User />}
      width={720}
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
      <div className="santri-form-container">
        {error && <div style={{ marginBottom: '16px' }}><SmartAlert message={error} type="error" /></div>}

        <form onSubmit={handleSubmit} className="santri-modal-form">
          {/* Section 1: Data Santri */}
          <div className="form-group-section">
            <h4 className="section-title">Data Identitas Santri</h4>
            <div className="form-grid-2">
              <FloatingInput
                label="NIS Santri"
                name="nis"
                icon={IdCard}
                value={formData.nis}
                onChange={(e) => handleChange('nis', e.target.value)}
                error={formErrors.nis}
                required
                disabled={isSubmitting}
                placeholder="Masukkan NIS"
              />

              <FloatingInput
                label="NIK (No. KTP/KK)"
                name="nik"
                icon={IdCard}
                value={formData.nik}
                onChange={(e) => handleChange('nik', e.target.value)}
                disabled={isSubmitting}
                placeholder="Masukkan NIK"
              />
            </div>

            <div className="form-grid-2">
              <FloatingInput
                label="Nama Lengkap"
                name="nama"
                icon={User}
                value={formData.nama}
                onChange={(e) => handleChange('nama', e.target.value)}
                error={formErrors.nama}
                required
                disabled={isSubmitting}
                placeholder="Masukkan nama lengkap"
              />

              <CustomSelect
                label="Jenis Kelamin"
                value={formData.jenis_kelamin}
                onChange={(v) => handleChange('jenis_kelamin', v)}
                options={[
                  { label: 'Laki-laki', value: 'Laki-laki' },
                  { label: 'Perempuan', value: 'Perempuan' }
                ]}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-grid-2">
              <FloatingInput
                label="Tempat Lahir"
                name="tempat_lahir"
                icon={Home}
                value={formData.tempat_lahir}
                onChange={(e) => handleChange('tempat_lahir', e.target.value)}
                disabled={isSubmitting}
                placeholder="Kota lahir"
              />

              <CustomDatePicker
                label="Tanggal Lahir"
                value={formData.tanggal_lahir}
                onChange={(v) => handleChange('tanggal_lahir', v)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-grid-2">
              <CustomSelect
                label="Kelas Diniyah"
                value={formData.kelas_diniyah_id}
                onChange={(v) => handleChange('kelas_diniyah_id', v)}
                options={kelasDiniyahOptions}
                placeholder="Pilih kelas Diniyah"
                disabled={isSubmitting}
              />

              <CustomSelect
                label="Kelas Sekolah"
                value={formData.kelas_sekolah_id}
                onChange={(v) => handleChange('kelas_sekolah_id', v)}
                options={kelasSekolahOptions}
                placeholder="Pilih kelas Sekolah"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-grid-2">
              <CustomSelect
                label="Kamar Asrama"
                value={formData.kamar_id}
                onChange={(v) => handleChange('kamar_id', v)}
                options={kamarOptions}
                placeholder="Pilih kamar asrama"
                disabled={isSubmitting}
              />

              <CustomSelect
                label="Status Periode"
                value={formData.status_tahun_ajaran}
                onChange={(v) => handleChange('status_tahun_ajaran', v)}
                options={[
                  { label: 'Aktif', value: 'aktif' },
                  { label: 'Draft', value: 'draft' },
                  { label: 'Tidak Naik', value: 'tidak_naik' },
                  { label: 'Lulus', value: 'lulus' },
                  { label: 'Alumni', value: 'alumni' },
                  { label: 'Pindah', value: 'pindah' },
                  { label: 'Keluar', value: 'keluar' }
                ]}
                disabled={isSubmitting}
              />
            </div>

            <FloatingInput
              label="Alamat Tempat Tinggal"
              name="alamat"
              icon={Home}
              value={formData.alamat}
              onChange={(e) => handleChange('alamat', e.target.value)}
              disabled={isSubmitting}
              placeholder="Alamat lengkap"
            />

            <FloatingInput
              label="Catatan Periode Akademik"
              name="catatan_tahun_ajaran"
              icon={FileText}
              value={formData.catatan_tahun_ajaran}
              onChange={(e) => handleChange('catatan_tahun_ajaran', e.target.value)}
              disabled={isSubmitting}
              placeholder="Catatan tambahan santri"
            />
          </div>

          {/* Section 2: Data Orang Tua */}
          <div className="form-group-section">
            <h4 className="section-title">Data Orang Tua / Wali</h4>
            <div className="form-grid-2">
              <FloatingInput
                label="Nama Ayah"
                name="nama_ayah"
                icon={User}
                value={formData.nama_ayah}
                onChange={(e) => handleChange('nama_ayah', e.target.value)}
                disabled={isSubmitting}
                placeholder="Nama ayah kandung/wali"
              />

              <FloatingInput
                label="Pekerjaan Ayah"
                name="pekerjaan_ayah"
                icon={Briefcase}
                value={formData.pekerjaan_ayah}
                onChange={(e) => handleChange('pekerjaan_ayah', e.target.value)}
                disabled={isSubmitting}
                placeholder="Pekerjaan ayah"
              />
            </div>

            <div className="form-grid-2">
              <FloatingInput
                label="No. HP Ayah"
                name="no_hp_ayah"
                icon={Phone}
                value={formData.no_hp_ayah}
                onChange={(e) => handleChange('no_hp_ayah', e.target.value)}
                disabled={isSubmitting}
                placeholder="Nomor HP WhatsApp"
              />

              <FloatingInput
                label="Nama Ibu"
                name="nama_ibu"
                icon={User}
                value={formData.nama_ibu}
                onChange={(e) => handleChange('nama_ibu', e.target.value)}
                disabled={isSubmitting}
                placeholder="Nama ibu kandung"
              />
            </div>

            <div className="form-grid-2">
              <FloatingInput
                label="Pekerjaan Ibu"
                name="pekerjaan_ibu"
                icon={Briefcase}
                value={formData.pekerjaan_ibu}
                onChange={(e) => handleChange('pekerjaan_ibu', e.target.value)}
                disabled={isSubmitting}
                placeholder="Pekerjaan ibu"
              />

              <FloatingInput
                label="No. HP Ibu"
                name="no_hp_ibu"
                icon={Phone}
                value={formData.no_hp_ibu}
                onChange={(e) => handleChange('no_hp_ibu', e.target.value)}
                disabled={isSubmitting}
                placeholder="Nomor HP WhatsApp"
              />
            </div>
          </div>
        </form>
      </div>
    </CustomModal>
  );
}
