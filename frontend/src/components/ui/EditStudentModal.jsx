import { useState, useEffect } from 'react';
import { CustomModal } from './CustomModal';
import { FloatingInput } from './FloatingInput';
import { CustomSelect } from './CustomSelect';
import { UserPlus, User, Save, Building, Phone } from 'lucide-react';
import './EditStudentModal.scss';

export function EditStudentModal({ 
  open, 
  onClose, 
  santri, 
  onSubmit, 
  isSubmitting, 
  error,
  kelasDiniyah = [],
  kelasSekolah = [],
  kamarList = [],
  tahunMasukList = []
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (open) {
      if (santri) {
        setFormData({ ...santri });
      } else {
        setFormData({
          masukkan_ke_ta_aktif: true,
          jenis_kelamin: 'Laki-laki'
        });
      }
    }
  }, [open, santri]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const tahunOptions = Array.from({ length: 30 }, (_, i) => {
    const y = 2000 + i;
    return { label: y.toString(), value: y };
  });

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={santri ? 'Edit Data Santri' : 'Tambah Santri Baru'}
      subtitle={santri ? 'Perbarui informasi profil dan akademik' : 'Daftarkan santri baru ke sistem'}
      icon={santri ? <User /> : <UserPlus />}
      size="lg"
      destroyOnClose
    >
      <form onSubmit={handleSubmit} className="edit-student-form">
        {error && <div className="form-error-banner">{error}</div>}
        
        {/* SECTION: IDENTITAS */}
        <div className="form-section">
          <h4 className="form-section__title"><User size={16} /> Data Identitas</h4>
          <div className="form-grid">
            <FloatingInput 
              label="NIS / Nomor Induk" 
              name="nis"
              value={formData.nis} 
              onChange={(e) => handleChange('nis', e.target.value)} 
              required
            />
            <FloatingInput 
              label="NIK" 
              name="nik"
              value={formData.nik} 
              onChange={(e) => handleChange('nik', e.target.value)} 
            />
            <CustomSelect 
              label="Tahun Masuk" 
              value={formData.tahun_masuk} 
              onChange={(v) => handleChange('tahun_masuk', v)}
              options={tahunOptions}
            />
            <FloatingInput 
              label="Nama Lengkap" 
              name="nama"
              value={formData.nama} 
              onChange={(e) => handleChange('nama', e.target.value)} 
              required
            />
            <CustomSelect 
              label="Jenis Kelamin" 
              value={formData.jenis_kelamin} 
              onChange={(v) => handleChange('jenis_kelamin', v)}
              options={[
                { label: 'Laki-laki', value: 'Laki-laki' },
                { label: 'Perempuan', value: 'Perempuan' }
              ]}
            />
            <FloatingInput 
              label="Tempat Lahir" 
              name="tempat_lahir"
              value={formData.tempat_lahir} 
              onChange={(e) => handleChange('tempat_lahir', e.target.value)} 
            />
            <FloatingInput 
              label="Tanggal Lahir" 
              type="date"
              name="tanggal_lahir"
              value={formData.tanggal_lahir ? new Date(formData.tanggal_lahir).toISOString().split('T')[0] : ''} 
              onChange={(e) => handleChange('tanggal_lahir', e.target.value)} 
            />
            <div className="form-grid-full">
              <FloatingInput 
                label="Alamat Lengkap" 
                name="alamat"
                value={formData.alamat} 
                onChange={(e) => handleChange('alamat', e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* SECTION: ORANG TUA */}
        <div className="form-section">
          <h4 className="form-section__title"><User size={16} /> Data Orang Tua</h4>
          <div className="form-grid">
            <FloatingInput 
              label="Nama Ayah" 
              name="nama_ayah"
              value={formData.nama_ayah} 
              onChange={(e) => handleChange('nama_ayah', e.target.value)} 
            />
            <FloatingInput 
              label="Pekerjaan Ayah" 
              name="pekerjaan_ayah"
              value={formData.pekerjaan_ayah} 
              onChange={(e) => handleChange('pekerjaan_ayah', e.target.value)} 
            />
            <FloatingInput 
              label="No. HP Ayah" 
              name="no_hp_ayah"
              icon={Phone}
              value={formData.no_hp_ayah} 
              onChange={(e) => handleChange('no_hp_ayah', e.target.value)} 
            />
            <FloatingInput 
              label="Nama Ibu" 
              name="nama_ibu"
              value={formData.nama_ibu} 
              onChange={(e) => handleChange('nama_ibu', e.target.value)} 
            />
            <FloatingInput 
              label="Pekerjaan Ibu" 
              name="pekerjaan_ibu"
              value={formData.pekerjaan_ibu} 
              onChange={(e) => handleChange('pekerjaan_ibu', e.target.value)} 
            />
            <FloatingInput 
              label="No. HP Ibu" 
              name="no_hp_ibu"
              icon={Phone}
              value={formData.no_hp_ibu} 
              onChange={(e) => handleChange('no_hp_ibu', e.target.value)} 
            />
          </div>
        </div>

        {/* SECTION: AKADEMIK (Hanya saat tambah baru) */}
        {!santri && (
          <div className="form-section">
            <h4 className="form-section__title"><Building size={16} /> Penempatan Awal</h4>
            
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={formData.masukkan_ke_ta_aktif}
                onChange={(e) => handleChange('masukkan_ke_ta_aktif', e.target.checked)}
              />
              <span className="checkmark"></span>
              Langsung masukkan ke Tahun Ajaran Aktif
            </label>
            <p className="form-hint">Jika dicentang, santri akan otomatis terdaftar di periode aktif.</p>

            <div className="form-grid">
              <CustomSelect 
                label="Kelas Diniyah" 
                value={formData.kelas_diniyah_id} 
                onChange={(v) => handleChange('kelas_diniyah_id', v)}
                options={kelasDiniyah.map(k => ({ label: k.nama, value: k.id }))}
              />
              <CustomSelect 
                label="Kelas Sekolah" 
                value={formData.kelas_sekolah_id} 
                onChange={(v) => handleChange('kelas_sekolah_id', v)}
                options={kelasSekolah.map(k => ({ label: k.nama, value: k.id }))}
              />
              <CustomSelect 
                label="Kamar Asrama" 
                value={formData.kamar_id} 
                onChange={(v) => handleChange('kamar_id', v)}
                options={kamarList.map(k => ({ label: `${k.nama} (${k.jenis})`, value: k.id }))}
              />
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions-sticky">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="loading-spinner"></span>
            ) : (
              <><Save size={16}/> {santri ? 'Simpan Perubahan' : 'Tambahkan Santri'}</>
            )}
          </button>
        </div>
      </form>
    </CustomModal>
  );
}
