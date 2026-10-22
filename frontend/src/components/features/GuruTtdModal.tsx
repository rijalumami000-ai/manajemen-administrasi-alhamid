import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { useToast } from '../common';
import { Award, Trash2, Upload, Loader2 } from 'lucide-react';
import { guruService } from '../../services/guruService';
import { GuruItem } from '../../types/guru';

export interface GuruTtdModalProps {
  isOpen: boolean;
  onClose: () => void;
  guru: GuruItem | null;
  onSuccess: () => void;
}

export function GuruTtdModal({ isOpen, onClose, guru, onSuccess }: GuruTtdModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (guru?.ttd_url) {
      setPreviewUrl(guru.ttd_url);
    } else {
      setPreviewUrl(null);
    }
  }, [guru]);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !guru) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload immediately
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('ttd', file);
      
      await guruService.uploadTtd(guru.id, formData);
      toast.success('Tanda tangan berhasil diupload');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengupload tanda tangan');
      // Reset preview on error
      setPreviewUrl(guru?.ttd_url || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!guru) return;
    try {
      setIsUploading(true);
      await guruService.deleteTtd(guru.id);
      toast.success('Tanda tangan berhasil dihapus');
      setPreviewUrl(null);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus tanda tangan');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title="Tanda Tangan Digital Guru"
      subtitle={`Upload tanda tangan transparan untuk ustadz/ustadzah ${guru?.nama || ''}`}
      icon={<Award />}
      width={440}
      destroyOnClose
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px 0' }}>
        {previewUrl ? (
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            height: '140px', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            border: '2px solid #6366f1', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            background: '#ffffff', // typical for sign transparency contrast
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px'
          }}>
            <img 
              src={previewUrl} 
              alt="Preview Tanda Tangan" 
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
            />
            {isUploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', borderRadius: '10px' }}>
                <Loader2 className="animate-spin" size={32} />
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            style={{ 
              width: '100%', 
              height: '140px', 
              borderRadius: '12px', 
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
            onMouseOver={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
          >
            <Upload size={24} />
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Upload Tanda Tangan</span>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Format PNG transparan direkomendasikan</span>
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
              className="tactile-modal-btn danger" 
              onClick={handleDelete}
              disabled={isUploading}
            >
              <Trash2 size={15} />
              <span>Hapus TTD</span>
            </button>
          )}
          <button 
            type="button" 
            className="tactile-modal-btn secondary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload size={15} />
            <span>Pilih File</span>
          </button>
        </div>
      </div>
    </CustomModal>
  );
}

export default GuruTtdModal;
