import React, { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { SmartAlert } from '../ui/SmartAlert';
import { Home, Save, Building, Layers, Users, Wrench, FileText } from 'lucide-react';
import { KamarItem, KamarFormData } from '../../types/kamar';
import './KamarModal.scss';

interface KamarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: KamarFormData) => void;
  editData?: KamarItem | null;
  isSubmitting?: boolean;
  error?: string | null;
}

export const KamarModal: React.FC<KamarModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  isSubmitting = false,
  error = null
}) => {
  const [formData, setFormData] = useState<KamarFormData>({
    nama: '',
    jenis: 'Putra',
    gedung: '',
    lantai: 1,
    kapasitas: 4,
    terisi: 0,
    status: 'Tersedia',
    fasilitas: '',
    keterangan: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          nama: editData.nama || '',
          jenis: editData.jenis || 'Putra',
          gedung: editData.gedung || '',
          lantai: editData.lantai !== null && editData.lantai !== undefined ? Number(editData.lantai) : 1,
          kapasitas: editData.kapasitas !== null && editData.kapasitas !== undefined ? Number(editData.kapasitas) : 4,
          terisi: editData.terisi !== null && editData.terisi !== undefined ? Number(editData.terisi) : 0,
          status: editData.status || 'Tersedia',
          fasilitas: editData.fasilitas || '',
          keterangan: editData.keterangan || ''
        });
      } else {
        setFormData({
          nama: '',
          jenis: 'Putra',
          gedung: '',
          lantai: 1,
          kapasitas: 4,
          terisi: 0,
          status: 'Tersedia',
          fasilitas: '',
          keterangan: ''
        });
      }
      setFormErrors({});
    }
  }, [isOpen, editData]);

  const handleChange = (name: keyof KamarFormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.nama || !formData.nama.trim()) {
      errors.nama = 'Nama kamar wajib diisi';
    }
    if (!formData.jenis) {
      errors.jenis = 'Jenis kamar wajib dipilih';
    }
    if (!formData.kapasitas || Number(formData.kapasitas) < 1) {
      errors.kapasitas = 'Kapasitas minimal 1 orang';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const submissionData: KamarFormData = {
      nama: formData.nama.trim(),
      jenis: formData.jenis,
      gedung: formData.gedung ? formData.gedung.trim() : null,
      lantai: formData.lantai ? Number(formData.lantai) : 1,
      kapasitas: Number(formData.kapasitas),
      terisi: formData.terisi !== undefined ? Number(formData.terisi) : 0,
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
      icon={<Home size={20} />}
      width={560}
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
                <span>{editData ? 'Perbarui Data' : 'Simpan Kamar'}</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="kamar-form-container">
        {error && (
          <div className="modal-alert-wrap">
            <SmartAlert message={error} type="error" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="kamar-form">
          {/* Section 1: Informasi Kamar */}
          <div className="form-group-section">
            <h4 className="section-title">Identitas Kamar</h4>
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
                placeholder="Contoh: Abu Bakar 01, Khadijah 02"
              />

              <CustomSelect
                label="Komplek Asrama"
                value={formData.jenis}
                onChange={(v) => handleChange('jenis', v)}
                options={[
                  { label: '👦 Komplek Putra', value: 'Putra' },
                  { label: '👧 Komplek Putri', value: 'Putri' }
                ]}
                error={formErrors.jenis}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-grid-2">
              <FloatingInput
                label="Gedung / Asrama"
                name="gedung"
                icon={Building}
                value={formData.gedung || ''}
                onChange={(e) => handleChange('gedung', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: Gedung Al-Falah"
              />

              <FloatingInput
                label="Lantai"
                name="lantai"
                type="number"
                icon={Layers}
                value={formData.lantai !== undefined ? String(formData.lantai) : '1'}
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
                label="Kapasitas (Tempat)"
                name="kapasitas"
                type="number"
                icon={Users}
                value={String(formData.kapasitas || '')}
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
                value={String(formData.terisi !== undefined ? formData.terisi : '0')}
                onChange={(e) => handleChange('terisi', e.target.value)}
                disabled={isSubmitting}
                placeholder="Terisi saat ini"
              />

              <CustomSelect
                label="Status Kamar"
                value={formData.status || 'Tersedia'}
                onChange={(v) => handleChange('status', v)}
                options={[
                  { label: '🟢 Tersedia', value: 'Tersedia' },
                  { label: '🔴 Penuh', value: 'Penuh' },
                  { label: '🟡 Maintenance', value: 'Maintenance' }
                ]}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Section 3: Detail Fasilitas & Catatan */}
          <div className="form-group-section">
            <h4 className="section-title">Fasilitas & Catatan</h4>
            <div className="form-full-stack">
              <FloatingInput
                label="Fasilitas Kamar"
                name="fasilitas"
                icon={Wrench}
                value={formData.fasilitas || ''}
                onChange={(e) => handleChange('fasilitas', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: AC, Lemari Santri, Ranjang Susun, Kipas Angin"
              />

              <FloatingInput
                label="Keterangan Catatan"
                name="keterangan"
                icon={FileText}
                value={formData.keterangan || ''}
                onChange={(e) => handleChange('keterangan', e.target.value)}
                disabled={isSubmitting}
                placeholder="Catatan inventaris atau kondisi khusus (opsional)"
              />
            </div>
          </div>
        </form>
      </div>
    </CustomModal>
  );
};

export default KamarModal;
