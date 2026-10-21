import React, { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { SmartAlert } from '../ui/SmartAlert';
import { Trophy, Save, Calendar, Award, FileText, User } from 'lucide-react';
import { SantriAutocomplete } from './SantriAutocomplete';
import { PrestasiItem, PrestasiFormData, TahunAjaranSimple } from '../../types/pelanggaranPrestasi';
import './PrestasiModal.scss';

interface PrestasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PrestasiFormData) => void;
  editData?: PrestasiItem | null;
  isSubmitting?: boolean;
  error?: string | null;
  tahunAjaranList?: TahunAjaranSimple[];
  defaultTahunAjaranId?: number | string | null;
}

export const PrestasiModal: React.FC<PrestasiModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  isSubmitting = false,
  error = null,
  tahunAjaranList = [],
  defaultTahunAjaranId = null
}) => {
  const [formData, setFormData] = useState<PrestasiFormData>({
    santri_id: '',
    tahun_ajaran_id: defaultTahunAjaranId || '',
    jenis: '',
    tanggal: '',
    deskripsi: '',
    penghargaan: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const handleChange = (name: keyof PrestasiFormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.santri_id) errors.santri_id = 'Santri wajib dipilih';
    if (!formData.jenis || !formData.jenis.trim()) errors.jenis = 'Jenis prestasi wajib diisi';
    if (!formData.tanggal) errors.tanggal = 'Tanggal perolehan wajib diisi';

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
      title={editData ? 'Edit Data Prestasi' : 'Tambah Catatan Prestasi'}
      subtitle={editData ? 'Perbarui catatan prestasi santri' : 'Catat capaian prestasi dan apresiasi santri'}
      icon={<Trophy size={20} style={{ color: '#f59e0b' }} />}
      width={580}
      destroyOnClose
      footer={
        <div className="modal-tactile-footer">
          <button
            type="button"
            className="action-pill-btn neutral-pill"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading-spinner" />
            ) : (
              <>
                <Save size={15} />
                <span>{editData ? 'Perbarui Catatan' : 'Simpan Prestasi'}</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="prestasi-form-container">
        {error && (
          <div className="modal-alert-wrap">
            <SmartAlert message={error} type="error" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="prestasi-form">
          {/* Section 1: Santri & Periode */}
          <div className="form-group-section">
            <h4 className="section-title">Informasi Santri Berprestasi</h4>
            <div className="form-full-stack">
              <label className="field-custom-label">
                <User size={13} className="inline-icon" /> Santri Peraih Prestasi *
              </label>
              <SantriAutocomplete
                value={formData.santri_id}
                onChange={(santriId: any) => handleChange('santri_id', santriId)}
                placeholder="Ketik nama atau NIS santri..."
                disabled={isSubmitting}
              />
              {formErrors.santri_id && (
                <span className="field-error-text">{formErrors.santri_id}</span>
              )}
            </div>

            <div className="form-grid-2" style={{ marginTop: '10px' }}>
              <CustomSelect
                label="Tahun Ajaran"
                value={String(formData.tahun_ajaran_id || '')}
                onChange={(v) => handleChange('tahun_ajaran_id', v)}
                options={tahunOptions}
                disabled={isSubmitting}
              />

              <FloatingInput
                label="Tanggal Perolehan"
                name="tanggal"
                type="date"
                icon={Calendar}
                value={formData.tanggal}
                onChange={(e) => handleChange('tanggal', e.target.value)}
                error={formErrors.tanggal}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Section 2: Detail Prestasi & Penghargaan */}
          <div className="form-group-section">
            <h4 className="section-title">Detail Prestasi & Penghargaan</h4>
            <div className="form-full-stack">
              <FloatingInput
                label="Jenis / Nama Prestasi"
                name="jenis"
                icon={Trophy}
                value={formData.jenis}
                onChange={(e) => handleChange('jenis', e.target.value)}
                error={formErrors.jenis}
                required
                disabled={isSubmitting}
                placeholder="Contoh: Juara 1 Musabaqah Hifdzil Qur'an 5 Juz, Juara Umum Imtihan"
              />

              <FloatingInput
                label="Bentuk Penghargaan"
                name="penghargaan"
                icon={Award}
                value={formData.penghargaan || ''}
                onChange={(e) => handleChange('penghargaan', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: Piagam Penghargaan, Piala Bergilir, Beasiswa SPP 3 Bulan"
              />

              <FloatingInput
                label="Deskripsi / Keterangan Tambahan"
                name="deskripsi"
                icon={FileText}
                value={formData.deskripsi || ''}
                onChange={(e) => handleChange('deskripsi', e.target.value)}
                disabled={isSubmitting}
                placeholder="Tingkat perlombaan (Kecamatan/Kabupaten/Provinsi) atau penyelenggara (opsional)"
              />
            </div>
          </div>
        </form>
      </div>
    </CustomModal>
  );
};

export default PrestasiModal;
