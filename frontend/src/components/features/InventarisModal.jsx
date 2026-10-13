import React, { useState, useEffect } from 'react';
import { X, Package, Layers, MapPin, User, FileText, CheckCircle2 } from 'lucide-react';
import './InventarisModal.scss';

export function InventarisModal({ isOpen, onClose, onSubmit, editData, defaultCategory = 'pondok', isSubmitting, error }) {
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (editData) {
      setFormData({
        kategori: editData.kategori || defaultCategory,
        nama_barang: editData.nama_barang || '',
        kode_barang: editData.kode_barang || '',
        jumlah: editData.jumlah || 1,
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
  }, [editData, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jumlah' ? (parseInt(value, 10) || 0) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama_barang.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="inventaris-modal-overlay" onClick={onClose}>
      <div className="inventaris-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-icon">
            <Package size={20} />
          </div>
          <div>
            <h3>{editData ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris Baru'}</h3>
            <p>Kelola data sarana & prasarana pondok, madin, dan PMQ</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="modal-error-alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Kategori Inventaris *</label>
              <select
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                required
              >
                <option value="pondok">🏛️ Inventaris Pondok</option>
                <option value="madin">📚 Inventaris Madin</option>
                <option value="pmq">📖 Inventaris PMQ</option>
              </select>
            </div>

            <div className="form-group">
              <label>Kondisi Barang *</label>
              <select
                name="kondisi"
                value={formData.kondisi}
                onChange={handleChange}
                required
              >
                <option value="Baik">🟢 Baik (Siap Pakai)</option>
                <option value="Rusak Ringan">🟡 Rusak Ringan</option>
                <option value="Rusak Berat">🔴 Rusak Berat</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Nama Barang / Aset *</label>
            <input
              type="text"
              name="nama_barang"
              placeholder="Contoh: Lemari Santri 2 Pintu, Papan Tulis Whiteboard, Al-Qur'an"
              value={formData.nama_barang}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kode Barang (Opsional)</label>
              <input
                type="text"
                name="kode_barang"
                placeholder="Contoh: INV-PDK-001"
                value={formData.kode_barang}
                onChange={handleChange}
              />
            </div>

            <div className="form-group split">
              <div>
                <label>Jumlah *</label>
                <input
                  type="number"
                  name="jumlah"
                  min="1"
                  value={formData.jumlah}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Satuan</label>
                <select
                  name="satuan"
                  value={formData.satuan}
                  onChange={handleChange}
                >
                  <option value="Unit">Unit</option>
                  <option value="Buah">Buah</option>
                  <option value="Set">Set</option>
                  <option value="Eksemplar">Eksemplar</option>
                  <option value="Pcs">Pcs</option>
                  <option value="Kotak">Kotak</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Lokasi Penempatan</label>
              <input
                type="text"
                name="lokasi"
                placeholder="Contoh: Gedung Asrama Lt. 1, Kantor Madin, Musholla PMQ"
                value={formData.lokasi}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label><User size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Penanggung Jawab</label>
              <input
                type="text"
                name="penanggung_jawab"
                placeholder="Contoh: Ustadz Ahmad, Kang Zaid"
                value={formData.penanggung_jawab}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label><FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Keterangan Tambahan</label>
            <textarea
              name="keterangan"
              rows={2}
              placeholder="Catatan kondisi, riwayat perbaikan, atau spesifikasi barang..."
              value={formData.keterangan}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
              Batal
            </button>
            <button type="submit" className="btn-save" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
