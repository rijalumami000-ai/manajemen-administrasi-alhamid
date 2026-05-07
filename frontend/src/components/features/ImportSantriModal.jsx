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

  const uploadProps = {
    onRemove: () => {
      setFile(null);
    },
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        antMessage.error(`${file.name} bukan file Excel.`);
        return Upload.LIST_IGNORE;
      }
      setFile(file);
      return false; // Prevent auto-upload
    },
    fileList: file ? [file] : [],
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

          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Klik atau seret file ke area ini untuk mengunggah</p>
            <p className="ant-upload-hint">
              Hanya mendukung file .xlsx atau .xls
            </p>
          </Dragger>
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
