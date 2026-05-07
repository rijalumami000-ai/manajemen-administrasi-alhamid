import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { SantriAutocomplete } from './SantriAutocomplete';
import { formatDate } from '../../utils/formatters';

export function MigrateSantriModal({ isOpen, onClose, onSubmit, santriList, isSubmitting, error }) {
  const [formData, setFormData] = useState({
    santri_id: '',
    tahun_lulus: '',
    keterangan: ''
  });

  const [errors, setErrors] = useState({});
  const [selectedSantri, setSelectedSantri] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        santri_id: '',
        tahun_lulus: new Date().getFullYear().toString(),
        keterangan: ''
      });
      setSelectedSantri(null);
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSantriChange = (santriId) => {
    setFormData(prev => ({ ...prev, santri_id: santriId }));
    if (errors.santri_id) {
      setErrors(prev => ({ ...prev, santri_id: '' }));
    }

    // Find and set selected santri for preview
    const santri = santriList.find(s => s.id === Number(santriId));
    setSelectedSantri(santri || null);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.santri_id) {
      newErrors.santri_id = 'Santri wajib dipilih';
    }
    if (!formData.tahun_lulus) {
      newErrors.tahun_lulus = 'Tahun lulus wajib diisi';
    } else {
      const year = parseInt(formData.tahun_lulus);
      if (year < 1900 || year > 2100) {
        newErrors.tahun_lulus = 'Tahun lulus tidak valid';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Alumni dari Data Santri"
      size="large"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="message error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <SantriAutocomplete
          value={formData.santri_id}
          onChange={handleSantriChange}
          error={errors.santri_id}
          santriList={santriList}
        />

        {selectedSantri && (
          <div className="santri-preview" style={{ marginBottom: '1rem' }}>
            <h4>Data Santri yang Akan Dipindahkan</h4>
            <div className="santri-preview-grid">
              <div><strong>NIS:</strong> {selectedSantri.nis || '-'}</div>
              <div><strong>NIK:</strong> {selectedSantri.nik || '-'}</div>
              <div><strong>Nama:</strong> {selectedSantri.nama || '-'}</div>
              <div><strong>Tempat Lahir:</strong> {selectedSantri.tempat_lahir || '-'}</div>
              <div><strong>Tanggal Lahir:</strong> {selectedSantri.tanggal_lahir ? formatDate(selectedSantri.tanggal_lahir) : '-'}</div>
              <div><strong>Kelas Diniyah:</strong> {selectedSantri.kelas_diniyah || '-'}</div>
              <div><strong>Kelas Sekolah:</strong> {selectedSantri.kelas_sekolah || '-'}</div>
              <div><strong>Kamar:</strong> {selectedSantri.kamar || '-'}</div>
              <div><strong>Ayah:</strong> {selectedSantri.nama_ayah || '-'}</div>
              <div><strong>Ibu:</strong> {selectedSantri.nama_ibu || '-'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Alamat:</strong> {selectedSantri.alamat || '-'}</div>
            </div>
          </div>
        )}

        <div className="modal-grid">
          <div className="form-group">
            <label htmlFor="tahun_lulus">
              Tahun Lulus <span className="required">*</span>
            </label>
            <input
              type="number"
              id="tahun_lulus"
              name="tahun_lulus"
              value={formData.tahun_lulus}
              onChange={handleChange}
              min="1900"
              max="2100"
              className={errors.tahun_lulus ? 'error' : ''}
            />
            {errors.tahun_lulus && <span className="error-message">{errors.tahun_lulus}</span>}
          </div>

          <div className="form-group full-width">
            <label htmlFor="keterangan">Keterangan</label>
            <textarea
              id="keterangan"
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows="3"
              placeholder="Catatan tambahan (opsional)"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="button secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Memproses...' : 'Pindahkan ke Alumni'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
