import { useState, useRef } from 'react';
import { Upload, Download, Inbox, AlertCircle, X, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { santriService } from '../../services/santriService';
import { downloadTemplate } from '../../utils/exportUtils';
import { CustomModal } from '../ui/CustomModal';
import './ImportSantriModal.scss';

export function ImportSantriModal({ isOpen, onClose, onSuccess, tahunAjaranId, tahunAjaranKode }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    if (!file) {
      alert('Pilih file terlebih dahulu');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tahun_ajaran_id', tahunAjaranId);

      const res = await santriService.importExcel(formData);
      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.message || 'Gagal mengimpor data');
    } finally {
      setIsUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setIsUploading(false);
  };

  const handleCancel = () => {
    resetModal();
    onClose();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    const isExcel = selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                    selectedFile.type === 'application/vnd.ms-excel' || 
                    selectedFile.name.endsWith('.xlsx') || 
                    selectedFile.name.endsWith('.xls');
    if (!isExcel) {
      alert(`${selectedFile.name} bukan file Excel.`);
      return;
    }
    setFile(selectedFile);
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={handleCancel}
      title={`Impor Data Santri - TA ${tahunAjaranKode || 'Aktif'}`}
      subtitle="Tambahkan data santri secara massal via file Excel"
      icon={<Upload />}
      size="md"
      destroyOnClose
    >
      <div className="import-santri-modal">
        {!result ? (
          <>
            <div className="import-instructions">
              <div className="instruction-header">
                <AlertCircle size={18} />
                <span>Petunjuk Impor</span>
              </div>
              <ul className="instruction-list">
                <li>Gunakan template yang sudah disediakan agar format data sesuai.</li>
                <li>Data dengan NIS yang sudah ada akan diperbarui (update).</li>
                <li>Data baru akan ditambahkan ke database dan disinkronkan ke Tahun Ajaran terpilih.</li>
                <li>Nama Kelas dan Kamar harus sama persis dengan yang ada di sistem (case-insensitive).</li>
              </ul>
            </div>

            <div className="template-download">
              <button type="button" className="btn-outline" onClick={downloadTemplate}>
                <Download size={16} /> Download Template Excel
              </button>
            </div>

            <div 
              className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {!file ? (
                <>
                  <Inbox size={48} className="dropzone-icon" />
                  <h4>Klik atau seret file ke area ini untuk mengunggah</h4>
                  <p>Hanya mendukung file .xlsx atau .xls</p>
                </>
              ) : (
                <div className="selected-file">
                  <FileSpreadsheet size={32} className="file-icon" />
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
                accept=".xlsx, .xls"
              />
            </div>

            {file && (
              <div className="file-actions">
                <button type="button" className="btn-text-danger" onClick={() => setFile(null)}>
                  <X size={16} /> Hapus File
                </button>
              </div>
            )}

            <div className="modal-actions-right">
              <button type="button" className="btn-secondary" onClick={handleCancel}>Batal</button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleUpload} 
                disabled={!file || isUploading}
              >
                {isUploading ? <span className="loading-spinner"></span> : <><Upload size={16} /> Mulai Impor</>}
              </button>
            </div>
          </>
        ) : (
          <div className="import-result">
            <div className={`result-banner ${result.errors.length > 0 ? 'warning' : 'success'}`}>
              {result.errors.length > 0 ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
              <div>
                <h4>Hasil Impor Selesai</h4>
                <p>Total Baris Diproses: <strong>{result.total}</strong></p>
              </div>
            </div>

            <div className="result-stats">
              <div className="stat-item success">
                <span className="stat-label">Berhasil Ditambah</span>
                <span className="stat-value">{result.imported}</span>
              </div>
              <div className="stat-item info">
                <span className="stat-label">Berhasil Diperbarui</span>
                <span className="stat-value">{result.updated}</span>
              </div>
              <div className="stat-item danger">
                <span className="stat-label">Gagal</span>
                <span className="stat-value">{result.errors.length}</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="error-list-container">
                <h5>Daftar Kesalahan:</h5>
                <ul className="error-list">
                  {result.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-actions-right">
              <button type="button" className="btn-primary" onClick={handleCancel}>Tutup</button>
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
}
