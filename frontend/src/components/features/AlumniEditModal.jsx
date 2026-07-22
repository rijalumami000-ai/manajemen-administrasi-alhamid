import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { CustomDatePicker } from '../ui/CustomDatePicker';
import { SmartAlert } from '../ui/SmartAlert';
import { User, IdCard, Home, Phone, Mail, Briefcase, GraduationCap, Save } from 'lucide-react';
import './AlumniEditModal.scss';

export function AlumniEditModal({ isOpen, onClose, onSubmit, editData, isSubmitting, error }) {
  const [formData, setFormData] = useState({
    nis: '',
    nik: '',
    nama: '',
    jenis_kelamin: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    tahun_lulus: '',
    angkatan: '',
    alamat: '',
    no_hp: '',
    email: '',
    pekerjaan: '',
    instansi: '',
    status_alumni: 'Alumni'
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
          tahun_lulus: editData.tahun_lulus ? String(editData.tahun_lulus) : '',
          angkatan: editData.angkatan || '',
          alamat: editData.alamat || '',
          no_hp: editData.no_hp || '',
          email: editData.email || '',
          pekerjaan: editData.pekerjaan || '',
          instansi: editData.instansi || '',
          status_alumni: editData.status_alumni || 'Alumni'
        });
      } else {
        setFormData({
          nis: '',
          nik: '',
          nama: '',
          jenis_kelamin: '',
          tempat_lahir: '',
          tanggal_lahir: '',
          tahun_lulus: '',
          angkatan: '',
          alamat: '',
          no_hp: '',
          email: '',
          pekerjaan: '',
          instansi: '',
          status_alumni: 'Alumni'
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
    if (!formData.nama || !formData.nama.trim()) errors.nama = 'Nama lengkap wajib diisi';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSubmit({
      ...formData,
      nama: formData.nama.trim(),
      nis: formData.nis ? formData.nis.trim() : null,
      nik: formData.nik ? formData.nik.trim() : null,
      tempat_lahir: formData.tempat_lahir ? formData.tempat_lahir.trim() : null,
      tanggal_lahir: formData.tanggal_lahir || null,
      tahun_lulus: formData.tahun_lulus ? Number(formData.tahun_lulus) : null,
      angkatan: formData.angkatan ? formData.angkatan.trim() : null,
      alamat: formData.alamat ? formData.alamat.trim() : null,
      no_hp: formData.no_hp ? formData.no_hp.trim() : null,
      email: formData.email ? formData.email.trim() : null,
      pekerjaan: formData.pekerjaan ? formData.pekerjaan.trim() : null,
      instansi: formData.instansi ? formData.instansi.trim() : null,
      status_alumni: formData.status_alumni || 'Alumni'
    });
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Data Alumni' : 'Tambah Alumni Baru'}
      subtitle={editData ? 'Perbarui data alumni lulusan' : 'Daftarkan alumni lulusan baru'}
      icon={<GraduationCap />}
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
      <div className="alumni-form-container">
        {error && <div style={{ marginBottom: '16px' }}><SmartAlert message={error} type="error" /></div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Data Identitas */}
          <div className="form-group-section">
            <h4 className="section-title">Data Identitas Alumni</h4>
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
                label="NIS Santri"
                name="nis"
                icon={IdCard}
                value={formData.nis}
                onChange={(e) => handleChange('nis', e.target.value)}
                disabled={isSubmitting}
              />

              <FloatingInput
                label="NIK"
                name="nik"
                icon={IdCard}
                value={formData.nik}
                onChange={(e) => handleChange('nik', e.target.value)}
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
              />

              <CustomDatePicker
                label="Tanggal Lahir"
                value={formData.tanggal_lahir}
                onChange={(v) => handleChange('tanggal_lahir', v)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Section 2: Data Kelulusan & Kontak */}
          <div className="form-group-section">
            <h4 className="section-title">Data Kelulusan & Kontak</h4>
            <div className="form-grid-2">
              <FloatingInput
                label="Tahun Lulus"
                name="tahun_lulus"
                type="number"
                icon={GraduationCap}
                value={formData.tahun_lulus}
                onChange={(e) => handleChange('tahun_lulus', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: 2025"
              />

              <FloatingInput
                label="Angkatan"
                name="angkatan"
                icon={GraduationCap}
                value={formData.angkatan}
                onChange={(e) => handleChange('angkatan', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: Angkatan 15"
              />
            </div>

            <div className="form-grid-2">
              <FloatingInput
                label="No. HP / WhatsApp"
                name="no_hp"
                icon={Phone}
                value={formData.no_hp}
                onChange={(e) => handleChange('no_hp', e.target.value)}
                disabled={isSubmitting}
              />

              <FloatingInput
                label="Email"
                name="email"
                type="email"
                icon={Mail}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-grid-2">
              <FloatingInput
                label="Pekerjaan / Kegiatan saat ini"
                name="pekerjaan"
                icon={Briefcase}
                value={formData.pekerjaan}
                onChange={(e) => handleChange('pekerjaan', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: Mahasiswa, Guru"
              />

              <FloatingInput
                label="Instansi / Kampus"
                name="instansi"
                icon={Building}
                value={formData.instansi}
                onChange={(e) => handleChange('instansi', e.target.value)}
                disabled={isSubmitting}
                placeholder="Nama tempat kuliah/kerja"
              />
            </div>

            <FloatingInput
              label="Alamat Tempat Tinggal"
              name="alamat"
              icon={Home}
              value={formData.alamat}
              onChange={(e) => handleChange('alamat', e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
    </CustomModal>
  );
}
