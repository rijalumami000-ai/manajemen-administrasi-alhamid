import { useState, useEffect, useRef } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { useToast } from '../common';
import { Camera, Trash2, Upload, Loader2 } from 'lucide-react';
import { guruService } from '../../services/guruService';

export function GuruFotoModal({ isOpen, onClose, guru, onSuccess }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (guru?.foto_url) {
      setPreviewUrl(guru.foto_url);
    } else {
      setPreviewUrl(null);
    }
  }, [guru]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('foto', file);
      
      await guruService.uploadFoto(guru.id, formData);
      toast.success('Foto profil berhasil diupload');
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Gagal mengupload foto profil');
      // Reset preview on error
      setPreviewUrl(guru?.foto_url || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsUploading(true);
      await guruService.deleteFoto(guru.id);
      toast.success('Foto profil berhasil dihapus');
      setPreviewUrl(null);
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus foto profil');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title="Foto Profil Guru"
      subtitle={`Upload foto profil untuk ustadz/ustadzah ${guru?.nama || ''}`}
      icon={<Camera />}
      width={400}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
        {previewUrl ? (
          <div style={{ position: 'relative', width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #6366f1', boxShadow: '0 4px 15px rgba(0,0,0,0.15)' }}>
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            {isUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Loader2 className="animate-spin" size={32} />
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            style={{ 
              width: '160px', 
              height: '160px', 
              borderRadius: '50%', 
              border: '2px dashed #cbd5e1', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              color: '#475569',
              gap: '8px',
              background: '#f8fafc',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#6366f1'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
          >
            <Upload size={24} />
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Upload Foto</span>
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={handleFileSelect} 
          disabled={isUploading}
        />

        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'center' }}>
          {previewUrl && (
            <button 
              type="button" 
              className="btn-custom btn-danger" 
              onClick={handleDelete}
              disabled={isUploading}
            >
              <Trash2 size={16} />
              <span>Hapus Foto</span>
            </button>
          )}
          <button 
            type="button" 
            className="btn-custom btn-secondary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload size={16} />
            <span>Pilih File</span>
          </button>
        </div>
      </div>
    </CustomModal>
  );
}
