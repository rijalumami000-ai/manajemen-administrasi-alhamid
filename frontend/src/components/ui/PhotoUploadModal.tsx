import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, Crop as CropType, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Upload, X, Crop, Image as ImageIcon, Camera, Sparkles } from 'lucide-react';
import { CustomModal } from './CustomModal';
import './PhotoUploadModal.scss';

export interface PhotoUploadModalProps {
  open: boolean;
  onClose: () => void;
  santri?: { id?: number | string; nama?: string } | null;
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

export function PhotoUploadModal({
  open,
  onClose,
  santri,
  onUpload,
  isUploading = false
}: PhotoUploadModalProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<CropType | null>(null);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setImgSrc('');
    setCrop(null);
    setCompletedCrop(null);
    onClose();
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 3 / 4, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  };

  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo_${santri?.id}.jpg`, { type: 'image/jpeg' });
      onUpload(file);
    }, 'image/jpeg', 0.9);
  };

  return (
    <CustomModal
      open={open}
      onClose={handleClose}
      title="Upload Foto Profil Santri"
      subtitle={`Pilih dan potong pas foto 3x4 untuk ${santri?.nama || 'Santri'}`}
      icon={<Camera />}
      size="sm"
      destroyOnClose
    >
      <div className="photo-upload-modal-vision">
        {!imgSrc ? (
          <div
            className="photo-dropzone-glass"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="photo-dropzone-orb">
              <Upload size={28} />
            </div>
            <h4 className="dropzone-title">Klik atau seret pas foto ke sini</h4>
            <p className="dropzone-subtitle">Mendukung format JPG, PNG, atau WEBP. Maksimal 2MB.</p>

            <div className="photo-spec-chip">
              <Sparkles size={13} />
              <span>Rasio otomatis 3:4 (Pas Foto Formal)</span>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={onSelectFile}
              className="hidden-file-input"
            />
          </div>
        ) : (
          <div className="crop-workspace-glass">
            <div className="crop-preview-frame">
              <ReactCrop
                crop={crop || undefined}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={3 / 4}
                circularCrop={false}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  onLoad={onImageLoad}
                  alt="Crop preview"
                  className="crop-image"
                />
              </ReactCrop>
            </div>

            <div className="crop-modal-footer">
              <button
                type="button"
                className="action-pill-btn secondary-pill"
                onClick={() => setImgSrc('')}
                disabled={isUploading}
              >
                <X size={15} />
                <span>Ganti Foto</span>
              </button>

              <button
                type="button"
                className="action-pill-btn primary-pill"
                onClick={handleUpload}
                disabled={isUploading || !completedCrop}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-ring" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Crop size={15} />
                    <span>Potong & Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
}
