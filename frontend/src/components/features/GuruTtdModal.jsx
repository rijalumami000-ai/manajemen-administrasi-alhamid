import { useState, useEffect } from 'react';
import { Modal, Upload, Button, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { API_BASE, getAuthHeaders } from '../../services/apiClient';
import { guruService } from '../../services/guruService';

export function GuruTtdModal({ isOpen, onClose, guru, onSuccess }) {
  const [fileList, setFileList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (guru?.ttd_url) {
      setFileList([{
        uid: '-1',
        name: 'ttd_saat_ini.png',
        status: 'done',
        url: guru.ttd_url
      }]);
    } else {
      setFileList([]);
    }
  }, [guru]);

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const customRequest = async ({ file, onSuccess: uploadSuccess, onError }) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('ttd', file);
      
      const response = await guruService.uploadTtd(guru.id, formData);
      message.success('Tanda tangan berhasil diupload');
      uploadSuccess(response);
      onSuccess();
    } catch (err) {
      message.error(err.message || 'Gagal mengupload tanda tangan');
      onError(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsUploading(true);
      await guruService.deleteTtd(guru.id);
      message.success('Tanda tangan berhasil dihapus');
      setFileList([]);
      onSuccess();
    } catch (err) {
      message.error(err.message || 'Gagal menghapus tanda tangan');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      title={`Tanda Tangan Guru: ${guru?.nama}`}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Upload
          listType="picture-card"
          fileList={fileList}
          onChange={handleUploadChange}
          customRequest={customRequest}
          maxCount={1}
          accept="image/*"
        >
          {fileList.length < 1 && (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload TTD</div>
            </div>
          )}
        </Upload>
        
        {fileList.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleDelete}
              loading={isUploading}
            >
              Hapus Tanda Tangan
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
