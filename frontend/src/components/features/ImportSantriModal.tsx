import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  AlertCircle,
  X,
  CheckCircle,
  FileSpreadsheet,
  ArrowRight,
  Info,
  Check,
  FileCheck
} from 'lucide-react';
import { santriService } from '../../services/santriService';
import { downloadTemplate } from '../../utils/exportUtils';
import { CustomModal } from '../ui/CustomModal';
import './ImportSantriModal.scss';

export interface ImportSantriModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tahunAjaranId?: string | number;
  tahunAjaranKode?: string;
}

export function ImportSantriModal({
  isOpen,
  onClose,
  onSuccess,
  tahunAjaranId,
  tahunAjaranKode
}: ImportSantriModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) {
      alert('Pilih file terlebih dahulu');
      return;
    }

    const parsedId = Number(tahunAjaranId);
    if (!tahunAjaranId || isNaN(parsedId) || parsedId <= 0) {
      alert('Tahun ajaran belum tersedia. Pastikan tahun ajaran aktif sudah disetel sebelum mengimpor data.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tahun_ajaran_id', String(parsedId));

      const res = await santriService.importExcel(formData);
      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const isExcel =
      selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      selectedFile.type === 'application/vnd.ms-excel' ||
      selectedFile.name.endsWith('.xlsx') ||
      selectedFile.name.endsWith('.xls');

    if (!isExcel) {
      alert(`${selectedFile.name} bukan format file Excel (.xlsx / .xls).`);
      return;
    }
    setFile(selectedFile);
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={handleCancel}
      title={`Impor Data Santri — TA ${tahunAjaranKode || 'Aktif'}`}
      subtitle="Tambahkan atau perbarui data santri secara massal via spreadsheet Excel"
      icon={<Upload />}
      size="md"
      destroyOnClose
    >
      <div className="import-santri-modal-vision">
        {!result ? (
          <>
            {/* Liquid Glass Instruction Card */}
            <div className="instruction-glass-card">
              <div className="instruction-card-header">
                <div className="instruction-icon-pill">
                  <Info size={15} />
                </div>
                <h4>Petunjuk & Format Pengunggahan</h4>
              </div>

              <ul className="instruction-steps">
                <li>
                  <span className="step-bullet" />
                  <span>Gunakan template resmi sistem agar urutan kolom dan tipe data sesuai.</span>
                </li>
                <li>
                  <span className="step-bullet" />
                  <span>Data dengan <strong>NIS</strong> yang sudah ada akan otomatis diperbarui (update data terkini).</span>
                </li>
                <li>
                  <span className="step-bullet" />
                  <span>Santri baru akan otomatis disinkronkan ke <strong>Tahun Ajaran {tahunAjaranKode || 'Aktif'}</strong>.</span>
                </li>
                <li>
                  <span className="step-bullet" />
                  <span>Nama <strong>Kelas</strong> dan <strong>Kamar</strong> harus cocok dengan data master di sistem.</span>
                </li>
              </ul>
            </div>

            {/* Template Download Glass Action */}
            <div className="template-action-row">
              <button
                type="button"
                className="download-template-pill-btn"
                onClick={downloadTemplate}
                title="Unduh format spreadsheet .xlsx yang sudah disesuaikan"
              >
                <div className="excel-lens-badge">
                  <FileSpreadsheet size={15} />
                </div>
                <div className="btn-text-group">
                  <span className="primary-text">Unduh Template Excel</span>
                  <span className="sub-text">Format baku .xlsx siap isi</span>
                </div>
                <Download size={15} className="download-arrow-icon" />
              </button>
            </div>

            {/* Frosted Liquid Glass Dropzone */}
            <div
              className={`upload-dropzone-glass ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {!file ? (
                <div className="dropzone-idle-content">
                  <div className="dropzone-orb">
                    <Upload size={28} />
                  </div>
                  <h4 className="dropzone-prompt">Klik atau seret file Excel ke sini</h4>
                  <p className="dropzone-hint">Mendukung format spreadsheet .xlsx dan .xls</p>
                </div>
              ) : (
                <div className="dropzone-file-selected">
                  <div className="file-emerald-orb">
                    <FileSpreadsheet size={28} />
                  </div>
                  <div className="file-info-details">
                    <span className="file-title">{file.name}</span>
                    <span className="file-meta">
                      {(file.size / 1024).toFixed(1)} KB &bull; Siap diproses
                    </span>
                  </div>
                  <button
                    type="button"
                    className="file-remove-chip"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    title="Ganti atau hapus file"
                  >
                    <X size={14} />
                    <span>Hapus</span>
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                accept=".xlsx, .xls"
              />
            </div>

            {/* Modal Bottom Action Pills */}
            <div className="modal-footer-pills">
              <button
                type="button"
                className="action-pill-btn secondary-pill"
                onClick={handleCancel}
                disabled={isUploading}
              >
                Batal
              </button>

              <button
                type="button"
                className="action-pill-btn primary-pill"
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="loading-spinner-ring" />
                    <span>Memproses Data...</span>
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    <span>Mulai Impor</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Result Outcome View */
          <div className="import-result-vision">
            <div className={`result-hero-banner ${result.errors && result.errors.length > 0 ? 'warning' : 'success'}`}>
              <div className="result-banner-icon">
                {result.errors && result.errors.length > 0 ? (
                  <AlertCircle size={22} />
                ) : (
                  <CheckCircle size={22} />
                )}
              </div>
              <div className="result-banner-text">
                <h4>Proses Impor Selesai</h4>
                <p>
                  Total <strong>{result.total}</strong> baris data telah diproses oleh sistem.
                </p>
              </div>
            </div>

            <div className="result-stat-cards">
              <div className="res-card res-success">
                <span className="res-label">Berhasil Ditambah</span>
                <span className="res-value">{result.imported || 0}</span>
              </div>
              <div className="res-card res-info">
                <span className="res-label">Diperbarui</span>
                <span className="res-value">{result.updated || 0}</span>
              </div>
              <div className="res-card res-danger">
                <span className="res-label">Gagal / Dilewati</span>
                <span className="res-value">{result.errors ? result.errors.length : 0}</span>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="error-log-card">
                <h5>Rincian Baris Gagal ({result.errors.length}):</h5>
                <ul className="error-log-list">
                  {result.errors.map((err: string, idx: number) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-footer-pills">
              <button
                type="button"
                className="action-pill-btn primary-pill"
                onClick={handleCancel}
              >
                <Check size={15} />
                <span>Selesai</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
}
