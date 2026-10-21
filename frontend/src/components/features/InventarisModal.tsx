import React, { useState, useEffect } from 'react';
import { Package, Save, MapPin, User, FileText, Layers, Tag, Hash } from 'lucide-react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { CustomSelect } from '../ui/CustomSelect';
import { SmartAlert } from '../ui/SmartAlert';
import { InventarisItem, InventarisFormData, InventarisKategori } from '../../types/inventaris';
import './InventarisModal.scss';

interface InventarisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InventarisFormData) => void;
  editData?: InventarisItem | null;
  defaultCategory?: InventarisKategori | string;
  isSubmitting?: boolean;
  error?: string | null;
}

export const InventarisModal: React.FC<InventarisModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  defaultCategory = 'pondok',
  isSubmitting = false,
  error = null
}) => {
  const [formData, setFormData] = useState<InventarisFormData>({
    kategori: defaultCategory,
    nama_barang: '',
    kode_barang: '',
    jumlah: 1,
    satuan: 'Unit',
    kondisi: 'Baik',
    lokasi: '',
    penanggung_jawab: '',
    keterangan: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          kategori: editData.kategori || defaultCategory,
          nama_barang: editData.nama_barang || '',
          kode_barang: editData.kode_barang || '',
          jumlah: Number(editData.jumlah) || 1,
          satuan: editData.satuan || 'Unit',
          kondisi: editData.kondisi || 'Baik',
          lokasi: editData.lokasi || '',
          penanggung_jawab: editData.penanggung_jawab || '',
          keterangan: editData.keterangan || ''
        });
      } else {
        setFormData({
          kategori: defaultCategory,
          nama_barang: '',
          kode_barang: '',
          jumlah: 1,
          satuan: 'Unit',
          kondisi: 'Baik',
          lokasi: '',
          penanggung_jawab: '',
          keterangan: ''
        });
      }
      setFormErrors({});
    }
  }, [isOpen, editData, defaultCategory]);

  const handleChange = (name: keyof InventarisFormData, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.nama_barang || !formData.nama_barang.trim()) {
      errors.nama_barang = 'Nama barang wajib diisi';
    }
    if (!formData.kategori) {
      errors.kategori = 'Kategori inventaris wajib dipilih';
    }
    if (!formData.jumlah || Number(formData.jumlah) < 1) {
      errors.jumlah = 'Jumlah barang minimal 1';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const submissionData: InventarisFormData = {
      kategori: formData.kategori,
      nama_barang: formData.nama_barang.trim(),
      kode_barang: formData.kode_barang ? formData.kode_barang.trim() : null,
      jumlah: Number(formData.jumlah),
      satuan: formData.satuan || 'Unit',
      kondisi: formData.kondisi || 'Baik',
      lokasi: formData.lokasi ? formData.lokasi.trim() : null,
      penanggung_jawab: formData.penanggung_jawab ? formData.penanggung_jawab.trim() : null,
      keterangan: formData.keterangan ? formData.keterangan.trim() : null
    };

    onSubmit(submissionData);
  };

  const kategoriOptions = [
    { label: '🏛️ Inventaris Pondok', value: 'pondok' },
    { label: '📚 Inventaris Madin', value: 'madin' },
    { label: '📖 Inventaris PMQ', value: 'pmq' }
  ];

  const kondisiOptions = [
    { label: '🟢 Baik (Siap Pakai)', value: 'Baik' },
    { label: '🟡 Rusak Ringan (Bisa Digunakan)', value: 'Rusak Ringan' },
    { label: '🔴 Rusak Berat (Perlu Diganti/Diservis)', value: 'Rusak Berat' }
  ];

  const satuanOptions = [
    { label: 'Unit', value: 'Unit' },
    { label: 'Buah', value: 'Buah' },
    { label: 'Set', value: 'Set' },
    { label: 'Eksemplar', value: 'Eksemplar' },
    { label: 'Pcs', value: 'Pcs' },
    { label: 'Kotak', value: 'Kotak' },
    { label: 'Lembar', value: 'Lembar' },
    { label: 'Paket', value: 'Paket' }
  ];

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title={editData ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris'}
      subtitle={editData ? 'Perbarui informasi aset sarana & prasarana pesantren' : 'Catat aset sarana & prasarana fisik baru ke sistem'}
      icon={<Package size={20} />}
      width={600}
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
                <span>{editData ? 'Perbarui Barang' : 'Simpan Barang'}</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="inventaris-form-container">
        {error && (
          <div className="modal-alert-wrap">
            <SmartAlert message={error} type="error" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="inventaris-form">
          {/* Section 1: Kategori & Status */}
          <div className="form-group-section">
            <h4 className="section-title">Klasifikasi & Kondisi Aset</h4>
            <div className="form-grid-2">
              <CustomSelect
                label="Kategori Inventaris"
                value={formData.kategori}
                onChange={(v) => handleChange('kategori', v)}
                options={kategoriOptions}
                error={formErrors.kategori}
                required
                disabled={isSubmitting}
              />

              <CustomSelect
                label="Kondisi Fisik Barang"
                value={formData.kondisi}
                onChange={(v) => handleChange('kondisi', v)}
                options={kondisiOptions}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Section 2: Identitas Barang & Kuantitas */}
          <div className="form-group-section">
            <h4 className="section-title">Rincian Barang</h4>
            <div className="form-full-stack">
              <FloatingInput
                label="Nama Barang / Aset Fisik"
                name="nama_barang"
                icon={Package}
                value={formData.nama_barang}
                onChange={(e) => handleChange('nama_barang', e.target.value)}
                error={formErrors.nama_barang}
                required
                disabled={isSubmitting}
                placeholder="Contoh: Lemari Santri 2 Pintu, Papan Tulis Whiteboard, Al-Qur'an Standar"
              />
            </div>

            <div className="form-grid-3">
              <FloatingInput
                label="Kode Barang"
                name="kode_barang"
                icon={Tag}
                value={formData.kode_barang || ''}
                onChange={(e) => handleChange('kode_barang', e.target.value)}
                disabled={isSubmitting}
                placeholder="INV-PDK-001"
              />

              <FloatingInput
                label="Jumlah Kuantitas"
                name="jumlah"
                type="number"
                icon={Hash}
                value={String(formData.jumlah || '')}
                onChange={(e) => handleChange('jumlah', e.target.value)}
                error={formErrors.jumlah}
                required
                disabled={isSubmitting}
                placeholder="Jumlah unit"
              />

              <CustomSelect
                label="Satuan"
                value={formData.satuan}
                onChange={(v) => handleChange('satuan', v)}
                options={satuanOptions}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Section 3: Lokasi & Penanggung Jawab */}
          <div className="form-group-section">
            <h4 className="section-title">Penempatan & Pengelola</h4>
            <div className="form-grid-2">
              <FloatingInput
                label="Lokasi Penempatan"
                name="lokasi"
                icon={MapPin}
                value={formData.lokasi || ''}
                onChange={(e) => handleChange('lokasi', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: Asrama Lt. 1, Kantor Madin, Musholla"
              />

              <FloatingInput
                label="Penanggung Jawab"
                name="penanggung_jawab"
                icon={User}
                value={formData.penanggung_jawab || ''}
                onChange={(e) => handleChange('penanggung_jawab', e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: Ustadz Ahmad, Pengurus Kamar"
              />
            </div>

            <div className="form-full-stack" style={{ marginTop: '8px' }}>
              <FloatingInput
                label="Keterangan Catatan Tambahan"
                name="keterangan"
                icon={FileText}
                value={formData.keterangan || ''}
                onChange={(e) => handleChange('keterangan', e.target.value)}
                disabled={isSubmitting}
                placeholder="Catatan riwayat perbaikan, asal dana wakaf, atau spesifikasi barang (opsional)"
              />
            </div>
          </div>
        </form>
      </div>
    </CustomModal>
  );
};

export default InventarisModal;
