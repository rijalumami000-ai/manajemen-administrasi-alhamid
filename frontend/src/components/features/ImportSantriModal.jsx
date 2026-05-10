import { useState } from 'react';
import { Modal, Upload, Button, Table, Space, Alert, message as antMessage, Progress } from 'antd';
import { InboxOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { santriService } from '../../services/santriService';
import { downloadTemplate } from '../../utils/exportUtils';

const { Dragger } = Upload;

export function ImportSantriModal({ isOpen, onClose, onSuccess, tahunAjaranId, tahunAjaranKode }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      antMessage.warning('Pilih file terlebih dahulu');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tahun_ajaran_id', tahunAjaranId);

      const res = await santriService.importExcel(formData);
      setResult(res);
      antMessage.success('Impor berhasil diselesaikan');
      if (onSuccess) onSuccess();
    } catch (err) {
      antMessage.error(err.message || 'Gagal mengimpor data');
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

  const handleFile = (file) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isExcel) {
      antMessage.error(`${file.name} bukan file Excel.`);
      return;
    }
    setFile(file);
  };

  return (
    <Modal
      title={`Impor Data Santri - TA ${tahunAjaranKode}`}
      open={isOpen}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {result ? 'Tutup' : 'Batal'}
        </Button>,
        !result && (
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleUpload} 
            loading={isUploading}
            disabled={!file}
          >
            Mulai Impor
          </Button>
        ),
      ]}
      width={700}
    >
      {!result ? (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message="Petunjuk Impor"
            description={
              <ul>
                <li>Gunakan template yang sudah disediakan agar format data sesuai.</li>
                <li>Data dengan NIS yang sudah ada akan diperbarui (update).</li>
                <li>Data baru akan ditambahkan ke database dan disinkronkan ke Tahun Ajaran terpilih.</li>
                <li>Nama Kelas dan Kamar harus sama persis dengan yang ada di sistem (case-insensitive).</li>
              </ul>
            }
            type="info"
            showIcon
          />
          
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={downloadTemplate}
            >
              Download Template Excel
            </Button>
          </div>

          <div 
            style={{ 
              border: isDragging ? '2px dashed #1890ff' : '2px dashed #d9d9d9', 
              borderRadius: 8, 
              padding: '30px 20px', 
              textAlign: 'center', 
              backgroundColor: isDragging ? '#e6f7ff' : '#fafafa',
              cursor: 'pointer'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('excel-input').click()}
          >
            <p style={{ fontSize: 40, color: '#1890ff', marginBottom: 8 }}><InboxOutlined /></p>
            <p style={{ margin: '0 0 4px 0' }}>Klik atau seret file ke area ini untuk mengunggah</p>
            <p style={{ margin: 0, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>Hanya mendukung file .xlsx atau .xls</p>
            <input
              id="excel-input"
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
              accept=".xlsx, .xls"
            />
          </div>

          {file && (
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <span style={{ color: '#1890ff' }}>File terpilih: <strong>{file.name}</strong></span>
              <Button type="link" danger onClick={() => setFile(null)}>
                Hapus
              </Button>
            </div>
          )}
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Alert
            message="Hasil Impor Selesai"
            description={
              <div>
                <p>Total Baris Diproses: <strong>{result.total}</strong></p>
                <p>Berhasil Ditambah: <strong style={{ color: 'green' }}>{result.imported}</strong></p>
                <p>Berhasil Diperbarui: <strong style={{ color: 'blue' }}>{result.updated}</strong></p>
                <p>Gagal: <strong style={{ color: 'red' }}>{result.errors.length}</strong></p>
              </div>
            }
            type={result.errors.length > 0 ? "warning" : "success"}
            showIcon
          />

          {result.errors.length > 0 && (
            <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid #f0f0f0', padding: 8 }}>
              <h4 style={{ color: 'red' }}>Daftar Kesalahan:</h4>
              <ul style={{ color: 'red', fontSize: '12px' }}>
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </Space>
      )}
    </Modal>
  );
}
