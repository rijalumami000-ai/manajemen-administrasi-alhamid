import { useState, useEffect } from 'react';
import { 
  Image, 
  User, 
  Trash2, 
  Save, 
  Edit3, 
  Upload 
} from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../common';
import './RaporSettingsTab.scss';

export function RaporSettingsTab() {
  const toast = useToast();
  
  const [logoUrl, setLogoUrl] = useState(null);
  const [ttdUrl, setTtdUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingText, setIsSavingText] = useState(false);

  // Text inputs form states
  const [baris1, setBaris1] = useState('مؤسسة معهد الحامد الإسلامي');
  const [size1, setSize1] = useState(24);
  const [baris2, setBaris2] = useState('YAYASAN PONDOK PESANTREN AL-HAMID');
  const [size2, setSize2] = useState(18);
  const [baris3, setBaris3] = useState('MADRASAH DINIYAH TAKMILIYAH AL-HAMID');
  const [size3, setSize3] = useState(20);
  const [baris4, setBaris4] = useState('Jl. Raya Cilangkap Baru RT.07/01 Cilangkap Cipayung Jakarta Timur 13870');
  const [size4, setSize4] = useState(14);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsService.fetchSettings();
      setLogoUrl(data.rapor_kop_logo_url || null);
      setTtdUrl(data.rapor_kepala_madrasah_ttd_url || null);

      setBaris1(data.rapor_kop_baris_1 || 'مؤسسة معهد الحامد الإسلامي');
      setSize1(data.rapor_kop_size_1 || 24);
      setBaris2(data.rapor_kop_baris_2 || 'YAYASAN PONDOK PESANTREN AL-HAMID');
      setSize2(data.rapor_kop_size_2 || 18);
      setBaris3(data.rapor_kop_baris_3 || 'MADRASAH DINIYAH TAKMILIYAH AL-HAMID');
      setSize3(data.rapor_kop_size_3 || 20);
      setBaris4(data.rapor_kop_baris_4 || 'Jl. Raya Cilangkap Baru RT.07/01 Cilangkap Cipayung Jakarta Timur 13870');
      setSize4(data.rapor_kop_size_4 || 14);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const handleFileUpload = async (e, key, setUrl) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await settingsService.uploadAset(key, formData);
      toast.success('Berkas gambar berhasil diunggah!');
      setUrl(response.url);
    } catch (err) {
      toast.error(err.message || 'Gagal mengunggah berkas gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (key, setUrl) => {
    try {
      setIsUploading(true);
      await settingsService.updateSetting(key, null);
      toast.success('Gambar berhasil dihapus');
      setUrl(null);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveText = async (e) => {
    e.preventDefault();
    try {
      setIsSavingText(true);
      const payload = {
        rapor_kop_baris_1: baris1,
        rapor_kop_size_1: Number(size1),
        rapor_kop_baris_2: baris2,
        rapor_kop_size_2: Number(size2),
        rapor_kop_baris_3: baris3,
        rapor_kop_size_3: Number(size3),
        rapor_kop_baris_4: baris4,
        rapor_kop_size_4: Number(size4)
      };

      for (const [key, value] of Object.entries(payload)) {
        await settingsService.updateSetting(key, value);
      }
      toast.success('Teks kop surat berhasil disimpan');
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengaturan teks');
    } finally {
      setIsSavingText(false);
    }
  };

  return (
    <div className="rapor-settings-container">
      {/* Upload Row (2 columns) */}
      <div className="settings-grid-two">
        
        {/* Card 1: Logo Kop */}
        <div className="settings-card frosted-card-set">
          <div className="card-header">
            <Image size={16} className="header-icon" />
            <h3 className="card-title">Logo Kop Rapor</h3>
          </div>
          <div className="card-body">
            <p className="card-desc">
              Unggah logo pesantren/yayasan untuk ditampilkan di pojok kiri atas kop surat rapor.
              Disarankan menggunakan gambar PNG dengan latar belakang transparan.
            </p>
            
            <div className="upload-section">
              {logoUrl ? (
                <div className="uploaded-preview-container">
                  <div className="image-preview-wrapper">
                    <img src={logoUrl} alt="Logo Kop" />
                  </div>
                  <button 
                    type="button" 
                    className="btn-custom btn-secondary delete-file-btn" 
                    onClick={() => handleDelete('rapor_kop_logo_url', setLogoUrl)}
                    disabled={isUploading}
                  >
                    <Trash2 size={14} />
                    <span>Hapus Logo</span>
                  </button>
                </div>
              ) : (
                <label className="custom-file-uploader-box">
                  <Upload size={24} className="upload-icon" />
                  <span className="upload-text">Pilih Logo Baru</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => handleFileUpload(e, 'rapor_kop_logo_url', setLogoUrl)}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: TTD Kepala Madrasah */}
        <div className="settings-card frosted-card-set">
          <div className="card-header">
            <User size={16} className="header-icon" />
            <h3 className="card-title">Tanda Tangan Kepala Madrasah</h3>
          </div>
          <div className="card-body">
            <p className="card-desc">
              Unggah tanda tangan Kepala Madrasah untuk ditampilkan di bagian kanan bawah rapor.
              Disarankan menggunakan gambar PNG dengan latar belakang transparan.
            </p>
            
            <div className="upload-section">
              {ttdUrl ? (
                <div className="uploaded-preview-container">
                  <div className="image-preview-wrapper">
                    <img src={ttdUrl} alt="TTD Kepala Madrasah" />
                  </div>
                  <button 
                    type="button" 
                    className="btn-custom btn-secondary delete-file-btn" 
                    onClick={() => handleDelete('rapor_kepala_madrasah_ttd_url', setTtdUrl)}
                    disabled={isUploading}
                  >
                    <Trash2 size={14} />
                    <span>Hapus Tanda Tangan</span>
                  </button>
                </div>
              ) : (
                <label className="custom-file-uploader-box">
                  <Upload size={24} className="upload-icon" />
                  <span className="upload-text">Pilih TTD Baru</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => handleFileUpload(e, 'rapor_kepala_madrasah_ttd_url', setTtdUrl)}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Teks Kop Surat */}
      <div className="settings-card full-width frosted-card-set" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <Edit3 size={16} className="header-icon" />
          <h3 className="card-title">Teks Kop Surat</h3>
        </div>
        <div className="card-body">
          <p className="card-desc" style={{ marginBottom: '20px' }}>
            Atur teks dan ukuran font yang akan ditampilkan pada kop surat di bagian atas Rapor.
          </p>

          <form onSubmit={handleSaveText} className="kop-settings-form">
            
            {/* Baris 1 */}
            <div className="form-row-settings">
              <div className="form-group text-col">
                <label>Baris 1 (Tulisan Arab)</label>
                <input 
                  type="text" 
                  className="settings-text-input arabic-align" 
                  value={baris1}
                  placeholder="مؤسسة معهد الحامد الإسلامي"
                  onChange={(e) => setBaris1(e.target.value)}
                />
              </div>
              <div className="form-group size-col">
                <label>Ukuran (px)</label>
                <input 
                  type="number" 
                  className="settings-num-input" 
                  min={10} 
                  max={40}
                  value={size1}
                  onChange={(e) => setSize1(e.target.value)}
                />
              </div>
            </div>

            {/* Baris 2 */}
            <div className="form-row-settings">
              <div className="form-group text-col">
                <label>Baris 2 (Yayasan)</label>
                <input 
                  type="text" 
                  className="settings-text-input" 
                  value={baris2}
                  placeholder="YAYASAN PONDOK PESANTREN AL-HAMID"
                  onChange={(e) => setBaris2(e.target.value)}
                />
              </div>
              <div className="form-group size-col">
                <label>Ukuran (px)</label>
                <input 
                  type="number" 
                  className="settings-num-input" 
                  min={10} 
                  max={40}
                  value={size2}
                  onChange={(e) => setSize2(e.target.value)}
                />
              </div>
            </div>

            {/* Baris 3 */}
            <div className="form-row-settings">
              <div className="form-group text-col">
                <label>Baris 3 (Madrasah)</label>
                <input 
                  type="text" 
                  className="settings-text-input" 
                  value={baris3}
                  placeholder="MADRASAH DINIYAH TAKMILIYAH AL-HAMID"
                  onChange={(e) => setBaris3(e.target.value)}
                />
              </div>
              <div className="form-group size-col">
                <label>Ukuran (px)</label>
                <input 
                  type="number" 
                  className="settings-num-input" 
                  min={10} 
                  max={40}
                  value={size3}
                  onChange={(e) => setSize3(e.target.value)}
                />
              </div>
            </div>

            {/* Baris 4 */}
            <div className="form-row-settings">
              <div className="form-group text-col">
                <label>Baris 4 (Alamat / Kontak)</label>
                <input 
                  type="text" 
                  className="settings-text-input" 
                  value={baris4}
                  placeholder="Jl. Raya Cilangkap Baru RT.07/01 Cilangkap Cipayung Jakarta Timur"
                  onChange={(e) => setBaris4(e.target.value)}
                />
              </div>
              <div className="form-group size-col">
                <label>Ukuran (px)</label>
                <input 
                  type="number" 
                  className="settings-num-input" 
                  min={10} 
                  max={40}
                  value={size4}
                  onChange={(e) => setSize4(e.target.value)}
                />
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button 
                type="submit" 
                className="btn-custom btn-primary"
                disabled={isSavingText}
              >
                {isSavingText ? <span className="loading-spinner"></span> : <><Save size={16} /><span>Simpan Teks Kop Surat</span></>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
export default RaporSettingsTab;
