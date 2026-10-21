import React, { useState, useEffect } from 'react';
import { CustomModal } from './CustomModal';
import { FloatingInput } from './FloatingInput';
import { CustomSelect } from './CustomSelect';
import {
  UserPlus,
  User,
  Save,
  Building,
  Phone,
  GraduationCap,
  Award,
  FileText,
  Calendar,
  Check
} from 'lucide-react';
import { normalizeGender } from '../../utils/studentUtils';
import './EditStudentModal.scss';

export interface EditStudentModalProps {
  open: boolean;
  onClose: () => void;
  santri?: any | null;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
  error?: string | null;
  kelasDiniyah?: any[];
  kelasSekolah?: any[];
  kamarList?: any[];
  tahunMasukList?: any[];
}

export function EditStudentModal({
  open,
  onClose,
  santri,
  onSubmit,
  isSubmitting = false,
  error = '',
  kelasDiniyah = [],
  kelasSekolah = [],
  kamarList = [],
  tahunMasukList = []
}: EditStudentModalProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (open) {
      if (santri) {
        setFormData({
          ...santri,
          jenis_kelamin: normalizeGender(santri.jenis_kelamin) || 'L',
          agama: santri.agama || 'Islam',
          status_keluarga: santri.status_keluarga || 'Kandung',
          status_masuk: santri.status_masuk || 'Baru',
        });
      } else {
        setFormData({
          masukkan_ke_ta_aktif: true,
          jenis_kelamin: 'L',
          agama: 'Islam',
          status_keluarga: 'Kandung',
          status_masuk: 'Baru',
        });
      }
    }
  }, [open, santri]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.status_masuk === 'Pindahan' &&
      (!formData.pesantren_sebelumnya || !formData.pesantren_sebelumnya.trim())
    ) {
      alert('Untuk santri pindahan, Nama Pesantren Asal wajib diisi.');
      return;
    }
    onSubmit(formData);
  };

  const tahunOptions = Array.from({ length: 30 }, (_, i) => {
    const y = 2000 + i;
    return { label: y.toString(), value: y };
  });

  const formatDateValue = (val: any) => {
    if (!val) return '';
    try {
      return new Date(val).toISOString().split('T')[0];
    } catch {
      return val;
    }
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title={santri ? 'Edit Data Santri' : 'Tambah Santri Baru'}
      subtitle={
        santri
          ? 'Perbarui informasi profil, administratif, dan penempatan santri'
          : 'Daftarkan santri baru ke dalam Buku Induk pesantren'
      }
      icon={santri ? <User /> : <UserPlus />}
      size="lg"
      destroyOnClose
    >
      <form onSubmit={handleSubmit} className="edit-student-form-vision">
        {error && <div className="form-error-glass-banner">{error}</div>}

        {/* SECTION: IDENTITAS */}
        <div className="form-bento-section">
          <div className="bento-section-title">
            <User size={16} />
            <span>Data Identitas & Kependudukan</span>
          </div>

          <div className="form-grid">
            <FloatingInput
              label="NIS / Nomor Induk"
              name="nis"
              value={formData.nis || ''}
              onChange={(e) => handleChange('nis', e.target.value)}
              required
            />
            <FloatingInput
              label="Nomor Induk Kependudukan (NIK)"
              name="nik"
              value={formData.nik || ''}
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
              value={formData.nama || ''}
              onChange={(e) => handleChange('nama', e.target.value)}
              required
            />
            <CustomSelect
              label="Jenis Kelamin"
              value={formData.jenis_kelamin}
              onChange={(v) => handleChange('jenis_kelamin', v)}
              options={[
                { label: 'Putra', value: 'L' },
                { label: 'Putri', value: 'P' }
              ]}
            />
            <FloatingInput
              label="Anak Ke"
              type="number"
              name="anak_ke"
              value={formData.anak_ke ?? ''}
              onChange={(e) =>
                handleChange('anak_ke', e.target.value ? parseInt(e.target.value) : '')
              }
            />
            <FloatingInput
              label="Agama"
              name="agama"
              value={formData.agama || 'Islam'}
              onChange={(e) => handleChange('agama', e.target.value)}
              readOnly
            />
            <CustomSelect
              label="Status dalam Keluarga"
              value={formData.status_keluarga || 'Kandung'}
              onChange={(v) => handleChange('status_keluarga', v)}
              options={[
                { label: 'Kandung', value: 'Kandung' },
                { label: 'Bukan Kandung', value: 'Bukan Kandung' }
              ]}
            />
            <FloatingInput
              label="Tempat Lahir"
              name="tempat_lahir"
              value={formData.tempat_lahir || ''}
              onChange={(e) => handleChange('tempat_lahir', e.target.value)}
            />
            <FloatingInput
              label="Tanggal Lahir"
              type="date"
              name="tanggal_lahir"
              value={formatDateValue(formData.tanggal_lahir)}
              onChange={(e) => handleChange('tanggal_lahir', e.target.value)}
            />
            <div className="form-grid-full">
              <FloatingInput
                label="Alamat Lengkap"
                name="alamat"
                value={formData.alamat || ''}
                onChange={(e) => handleChange('alamat', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION: ORANG TUA */}
        <div className="form-bento-section">
          <div className="bento-section-title">
            <User size={16} />
            <span>Data Orang Tua / Wali</span>
          </div>

          <div className="form-grid">
            <FloatingInput
              label="Nama Ayah"
              name="nama_ayah"
              value={formData.nama_ayah || ''}
              onChange={(e) => handleChange('nama_ayah', e.target.value)}
            />
            <FloatingInput
              label="NIK Ayah"
              name="nik_ayah"
              value={formData.nik_ayah || ''}
              onChange={(e) => handleChange('nik_ayah', e.target.value)}
            />
            <FloatingInput
              label="Pekerjaan Ayah"
              name="pekerjaan_ayah"
              value={formData.pekerjaan_ayah || ''}
              onChange={(e) => handleChange('pekerjaan_ayah', e.target.value)}
            />
            <FloatingInput
              label="No. HP Ayah"
              name="no_hp_ayah"
              icon={Phone}
              value={formData.no_hp_ayah || ''}
              onChange={(e) => handleChange('no_hp_ayah', e.target.value)}
            />
            <FloatingInput
              label="Nama Ibu"
              name="nama_ibu"
              value={formData.nama_ibu || ''}
              onChange={(e) => handleChange('nama_ibu', e.target.value)}
            />
            <FloatingInput
              label="NIK Ibu"
              name="nik_ibu"
              value={formData.nik_ibu || ''}
              onChange={(e) => handleChange('nik_ibu', e.target.value)}
            />
            <FloatingInput
              label="Pekerjaan Ibu"
              name="pekerjaan_ibu"
              value={formData.pekerjaan_ibu || ''}
              onChange={(e) => handleChange('pekerjaan_ibu', e.target.value)}
            />
            <FloatingInput
              label="No. HP Ibu"
              name="no_hp_ibu"
              icon={Phone}
              value={formData.no_hp_ibu || ''}
              onChange={(e) => handleChange('no_hp_ibu', e.target.value)}
            />
          </div>
        </div>

        {/* SECTION: INFO ADMINISTRATIF INSTANSI */}
        <div className="form-bento-section">
          <div className="bento-section-title">
            <FileText size={16} />
            <span>Informasi Administratif Instansi</span>
          </div>

          <div className="form-grid">
            <CustomSelect
              label="Status Masuk Pesantren"
              value={formData.status_masuk || 'Baru'}
              onChange={(v) => handleChange('status_masuk', v)}
              options={[
                { label: 'Baru', value: 'Baru' },
                { label: 'Pindahan', value: 'Pindahan' }
              ]}
            />
            {formData.status_masuk === 'Pindahan' && (
              <FloatingInput
                label="Nama Pesantren Asal *"
                name="pesantren_sebelumnya"
                value={formData.pesantren_sebelumnya || ''}
                onChange={(e) => handleChange('pesantren_sebelumnya', e.target.value)}
                required={formData.status_masuk === 'Pindahan'}
              />
            )}
            <FloatingInput
              label="Nama Sekolah Asal (Sebelum di sini)"
              name="sekolah_asal_nama"
              value={formData.sekolah_asal_nama || ''}
              onChange={(e) => handleChange('sekolah_asal_nama', e.target.value)}
            />
            <div className="form-grid-full">
              <FloatingInput
                label="Alamat Sekolah/Madrasah Asal"
                name="sekolah_asal_alamat"
                value={formData.sekolah_asal_alamat || ''}
                onChange={(e) => handleChange('sekolah_asal_alamat', e.target.value)}
              />
            </div>
            <FloatingInput
              label="Diterima di Kelas Madin"
              name="diterima_kelas_madin"
              value={formData.diterima_kelas_madin || ''}
              onChange={(e) => handleChange('diterima_kelas_madin', e.target.value)}
            />
            <FloatingInput
              label="Tanggal Masuk Madin"
              type="date"
              name="diterima_tanggal_madin"
              value={formatDateValue(formData.diterima_tanggal_madin)}
              onChange={(e) => handleChange('diterima_tanggal_madin', e.target.value)}
            />
          </div>
        </div>

        {/* SECTION: DATA KELULUSAN / ALUMNI */}
        <div className="form-bento-section">
          <div className="bento-section-title">
            <Award size={16} />
            <span>Riwayat Kelulusan & Arsip Alumni</span>
          </div>

          {/* Keluar/Lulus dari Madin */}
          <div className="sub-section-group">
            <span className="sub-section-label">1. Kelulusan Diniyah (Madin)</span>
            <div className="form-grid">
              <CustomSelect
                label="Status Madin"
                value={formData.keluar_madin_status}
                onChange={(v) => handleChange('keluar_madin_status', v)}
                options={[
                  { label: 'Belum Lulus / Keluar', value: '' },
                  { label: 'Lulus', value: 'Lulus' },
                  { label: 'Keluar', value: 'Keluar' }
                ]}
              />
              <FloatingInput
                label="Tanggal Keluar / Lulus"
                type="date"
                name="keluar_madin_tanggal"
                value={formatDateValue(formData.keluar_madin_tanggal)}
                onChange={(e) => handleChange('keluar_madin_tanggal', e.target.value)}
              />
            </div>
          </div>

          {/* Keluar/Boyong dari Pondok */}
          <div className="sub-section-group">
            <span className="sub-section-label">2. Status Keberadaan di Pondok</span>
            <div className="form-grid">
              <CustomSelect
                label="Status Pondok"
                value={formData.keluar_pondok_status}
                onChange={(v) => handleChange('keluar_pondok_status', v)}
                options={[
                  { label: 'Belum Boyong / Keluar', value: '' },
                  { label: 'Boyong', value: 'Boyong' },
                  { label: 'Diboyongkan', value: 'Diboyongkan' }
                ]}
              />
              <FloatingInput
                label="Tanggal Boyong"
                type="date"
                name="keluar_pondok_tanggal"
                value={formatDateValue(formData.keluar_pondok_tanggal)}
                onChange={(e) => handleChange('keluar_pondok_tanggal', e.target.value)}
              />
            </div>
          </div>

          {/* Lulus/Keluar dari Sekolah */}
          <div className="sub-section-group">
            <span className="sub-section-label">3. Status Sekolah Formal</span>
            <div className="form-grid">
              <CustomSelect
                label="Jenjang Sekolah"
                value={formData.keluar_sekolah_tingkat}
                onChange={(v) => handleChange('keluar_sekolah_tingkat', v)}
                options={[
                  { label: 'Pilih Jenjang', value: '' },
                  { label: 'MTs', value: 'MTs' },
                  { label: 'Aliyah', value: 'Aliyah' }
                ]}
              />
              <CustomSelect
                label="Status Sekolah"
                value={formData.keluar_sekolah_status}
                onChange={(v) => handleChange('keluar_sekolah_status', v)}
                options={[
                  { label: 'Pilih Status', value: '' },
                  { label: 'Lulus', value: 'Lulus' },
                  { label: 'Keluar', value: 'Keluar' },
                  { label: 'Dikeluarkan', value: 'Dikeluarkan' }
                ]}
              />
              <FloatingInput
                label="Tanggal Keluar / Lulus"
                type="date"
                name="keluar_sekolah_tanggal"
                value={formatDateValue(formData.keluar_sekolah_tanggal)}
                onChange={(e) => handleChange('keluar_sekolah_tanggal', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION: PENEMPATAN AWAL (Hanya saat santri baru) */}
        {!santri && (
          <div className="form-bento-section">
            <div className="bento-section-title">
              <Building size={16} />
              <span>Penempatan Awal Periode Berjalan</span>
            </div>

            <label className="checkbox-container-custom">
              <input
                type="checkbox"
                checked={Boolean(formData.masukkan_ke_ta_aktif)}
                onChange={(e) => handleChange('masukkan_ke_ta_aktif', e.target.checked)}
              />
              <span className="checkmark" />
              <span className="checkbox-text">Langsung masukkan ke Tahun Ajaran Aktif</span>
            </label>
            <p className="form-hint-text">
              Santri akan otomatis terdaftar dan disinkronkan ke periode ajaran berjalan.
            </p>

            <div className="form-grid">
              <CustomSelect
                label="Kelas Diniyah"
                value={formData.kelas_diniyah_id}
                onChange={(v) => handleChange('kelas_diniyah_id', v)}
                options={kelasDiniyah.map((k) => ({ label: k.nama, value: k.id }))}
              />
              <CustomSelect
                label="Kelas Sekolah"
                value={formData.kelas_sekolah_id}
                onChange={(v) => handleChange('kelas_sekolah_id', v)}
                options={kelasSekolah.map((k) => ({ label: k.nama, value: k.id }))}
              />
              <CustomSelect
                label="Kamar Asrama"
                value={formData.kamar_id}
                onChange={(v) => handleChange('kamar_id', v)}
                options={kamarList.map((k) => ({ label: `${k.nama} (${k.jenis})`, value: k.id }))}
              />
            </div>
          </div>
        )}

        {/* Form Sticky Actions Footer with Standard Action Pills */}
        <div className="form-sticky-footer-shelf">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="action-pill-btn primary-pill"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-pill" />
                <span>Menyimpan Data...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>{santri ? 'Simpan Perubahan' : 'Tambahkan Santri'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </CustomModal>
  );
}
