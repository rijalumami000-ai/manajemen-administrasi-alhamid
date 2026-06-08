import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Upload, X, Crop, Image as ImageIcon } from 'lucide-react';
import { CustomModal } from './CustomModal';
import './PhotoUploadModal.scss';

export function PhotoUploadModal({ open, onClose, santri, onUpload, isUploading }) {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleClose = () => {
    setImgSrc('');
    setCrop(null);
    setCompletedCrop(null);
    onClose();
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e) => {
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

    // Create canvas to draw the cropped image
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
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

    // Convert to blob and send
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
      title="Upload Foto Profil"
      subtitle={`Pilih dan potong foto untuk ${santri?.nama}`}
      icon={<ImageIcon />}
      size="sm"
    >
      <div className="photo-upload-modal">
        {!imgSrc ? (
          <div 
            className="upload-dropzone"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-dropzone__icon"><Upload size={32} /></div>
            <h4>Klik untuk mengunggah</h4>
            <p>Format JPG, PNG. Maksimal 2MB.</p>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={onSelectFile}
              className="hidden-input"
            />
          </div>
        ) : (
          <div className="crop-container">
            <ReactCrop
              crop={crop}
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
            
            <div className="crop-actions">
              <button className="btn-secondary" onClick={() => setImgSrc('')} disabled={isUploading}>
                <X size={16} /> Ganti Foto
              </button>
              <button className="btn-primary" onClick={handleUpload} disabled={isUploading || !completedCrop}>
                {isUploading ? <span className="loading-spinner"></span> : <><Crop size={16} /> Potong & Simpan</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </CustomModal>
  );
}
