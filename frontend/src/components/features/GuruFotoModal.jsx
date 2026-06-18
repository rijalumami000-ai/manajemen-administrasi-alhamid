import { useState, useEffect } from 'react';
import { Modal, Upload, Button, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { guruService } from '../../services/guruService';

export function GuruFotoModal({ isOpen, onClose, guru, onSuccess }) {
  const [fileList, setFileList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (guru?.foto_url) {
      setFileList([{
        uid: '-1',
        name: 'foto_saat_ini.png',
        status: 'done',
        url: guru.foto_url
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
      formData.append('foto', file);
      
      const response = await guruService.uploadFoto(guru.id, formData);
      message.success('Foto profil berhasil diupload');
      uploadSuccess(response);
      onSuccess();
    } catch (err) {
      message.error(err.message || 'Gagal mengupload foto profil');
      onError(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsUploading(true);
      await guruService.deleteFoto(guru.id);
      message.success('Foto profil berhasil dihapus');
      setFileList([]);
      onSuccess();
    } catch (err) {
      message.error(err.message || 'Gagal menghapus foto profil');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      title={`Foto Profil Guru: ${guru?.nama}`}
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
              <div style={{ marginTop: 8 }}>Upload Foto</div>
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
              Hapus Foto Profil
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
