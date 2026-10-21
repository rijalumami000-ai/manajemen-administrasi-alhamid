import React, { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { SmartAlert } from '../ui/SmartAlert';
import { AlertTriangle, Save, Calendar, ShieldAlert, FileText, User } from 'lucide-react';
import { SantriAutocomplete } from './SantriAutocomplete';
import { PelanggaranItem, PelanggaranFormData, TahunAjaranSimple } from '../../types/pelanggaranPrestasi';
import './PelanggaranModal.scss';

interface PelanggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PelanggaranFormData) => void;
  editData?: PelanggaranItem | null;
  isSubmitting?: boolean;
  error?: string | null;
  tahunAjaranList?: TahunAjaranSimple[];
  defaultTahunAjaranId?: number | string | null;
}

export const PelanggaranModal: React.FC<PelanggaranModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  isSubmitting = false,
  error = null,
  tahunAjaranList = [],
  defaultTahunAjaranId = null
}) => {
  const [formData, setFormData] = useState<PelanggaranFormData>({
    santri_id: '',
    tahun_ajaran_id: defaultTahunAjaranId || '',
    jenis: '',
    tanggal: '',
    deskripsi: '',
    sanksi: ''
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
          sanksi: editData.sanksi || ''
        });
      } else {
        setFormData({
          santri_id: '',
          tahun_ajaran_id: defaultTahunAjaranId || '',
          jenis: '',
          tanggal: new Date().toISOString().split('T')[0],
          deskripsi: '',
          sanksi: ''
        });
      }
      setFormErrors({});
    }
  }, [isOpen, editData, defaultTahunAjaranId]);

  const handleChange = (name: keyof PelanggaranFormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.santri_id) errors.santri_id = 'Santri wajib dipilih';
    if (!formData.jenis || !formData.jenis.trim()) errors.jenis = 'Jenis pelanggaran wajib diisi';
    if (!formData.tanggal) errors.tanggal = 'Tanggal kejadian wajib diisi';

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
      title={editData ? 'Edit Data Pelanggaran' : 'Tambah Catatan Pelanggaran'}
      subtitle={editData ? 'Perbarui catatan pelanggaran santri' : 'Catat riwayat pelanggaran dan sanksi kedisiplinan santri'}
      icon={<AlertTriangle size={20} style={{ color: '#ef4444' }} />}
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
                <span>{editData ? 'Perbarui Catatan' : 'Simpan Pelanggaran'}</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="pelanggaran-form-container">
        {error && (
          <div className="modal-alert-wrap">
            <SmartAlert message={error} type="error" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="pelanggaran-form">
          {/* Section 1: Santri & Tahun Ajaran */}
          <div className="form-group-section">
            <h4 className="section-title">Informasi Santri & Periode</h4>
            <div className="form-full-stack">
              <label className="field-custom-label">
                <User size={13} className="inline-icon" /> Santri yang Melanggar *
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
                label="Tanggal Kejadian"
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

          {/* Section 2: Detail Pelanggaran & Sanksi */}
          <div className="form-group-section">
            <h4 className="section-title">Detail Pelanggaran & Tindakan</h4>
            <div className="form-full-stack">
              <FloatingInput
                label="Jenis / Kategori Pelanggaran"
                name="jenis"
                icon={ShieldAlert}
                value={formData.jenis}
                onChange={(e) => handleChange('jenis', e.target.value)}
                error={formErrors.jenis}
                required
                disabled={isSubmitting}
                placeholder="Contoh: Terlambat Sholat Berjamaah, Keluar Tanpa Izin, Merokok"
              />

              <FloatingInput
                label="Tindakan / Sanksi Diberikan"
                name="sanksi"
                icon={FileText}
                value={formData.sanksi || ''}
                onChange={(e) => handleChange('sanksi', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: Peringatan Lisan, Ta'zir Membaca Al-Qur'an 1 Juz"
              />

              <FloatingInput
                label="Deskripsi / Kronologi Kejadian"
                name="deskripsi"
                icon={FileText}
                value={formData.deskripsi || ''}
                onChange={(e) => handleChange('deskripsi', e.target.value)}
                disabled={isSubmitting}
                placeholder="Rincian kronologi atau catatan saksi (opsional)"
              />
            </div>
          </div>
        </form>
      </div>
    </CustomModal>
  );
};

export default PelanggaranModal;
