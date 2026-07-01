import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { FloatingInput } from '../ui/FloatingInput';
import { SmartAlert } from '../ui/SmartAlert';
import { BookOpen, Briefcase, Save } from 'lucide-react';

export function MasterModal({
  isOpen,
  onClose,
  onSubmit,
  editData = null,
  title,
  placeholder,
  isSubmitting = false,
  error = null,
  type = 'master'
}) {
  const [formData, setFormData] = useState({
    nama: '',
    nama_arab: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          nama: editData.nama || '',
          nama_arab: editData.nama_arab || ''
        });
      } else {
        setFormData({
          nama: '',
          nama_arab: ''
        });
      }
      setFormErrors({});
    }
  }, [isOpen, editData]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const errors = {};
    if (!formData.nama || !formData.nama.trim()) {
      errors.nama = `Nama ${title.toLowerCase()} wajib diisi!`;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSubmit({
      nama: formData.nama.trim(),
      nama_arab: type === 'mapel' ? formData.nama_arab.trim() : undefined
    });
  };

  const handleCancel = () => {
    onClose();
  };

  const isMapel = type === 'mapel';

  return (
    <CustomModal
      open={isOpen}
      onClose={handleCancel}
      title={editData ? `Edit ${title}` : `Tambah ${title}`}
      subtitle={editData ? `Perbarui informasi ${title.toLowerCase()}` : `Tambahkan entri ${title.toLowerCase()} baru ke sistem`}
      icon={isMapel ? <BookOpen /> : <Briefcase />}
      width={440}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button
            type="button"
            className="btn-custom btn-secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn-custom btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="loading-spinner"></span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={16} /> {editData ? 'Perbarui' : 'Simpan'}
              </span>
            )}
          </button>
        </div>
      }
    >
      <div className="master-form-container">
        {error && (
          <div style={{ marginBottom: '16px' }}>
            <SmartAlert message={error} type="error" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="master-form" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <FloatingInput
            label={`Nama ${title}`}
            name="nama"
            value={formData.nama}
            onChange={(e) => handleChange('nama', e.target.value)}
            error={formErrors.nama}
            required
            disabled={isSubmitting}
            placeholder={placeholder}
          />

          {isMapel && (
            <div className="arabic-input-field" style={{ marginTop: '4px' }}>
              <div className={`ui-floating-input ${formData.nama_arab ? 'active' : ''} ${isSubmitting ? 'disabled' : ''}`}>
                <div className="ui-floating-input__wrapper">
                  <input
                    type="text"
                    name="nama_arab"
                    className="ui-floating-input__field"
                    value={formData.nama_arab || ''}
                    onChange={(e) => handleChange('nama_arab', e.target.value)}
                    disabled={isSubmitting}
                    dir="rtl"
                    style={{ 
                      fontFamily: 'Amiri, serif', 
                      fontSize: '1.25rem', 
                      textAlign: 'right', 
                      paddingRight: '12px',
                      paddingLeft: '12px',
                      paddingTop: '20px',
                      height: '48px'
                    }}
                  />
                  <label className="ui-floating-input__label" style={{ left: 'auto', right: '12px', transformOrigin: 'top right' }}>
                    Nama Arab (Khusus Mapel Rapor)
                  </label>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </CustomModal>
  );
}
