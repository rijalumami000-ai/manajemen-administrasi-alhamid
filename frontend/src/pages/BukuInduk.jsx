import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ImportSantriModal } from '../components/features/ImportSantriModal';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { absensiSholatService } from '../services/absensiSholatService';
import dayjs from 'dayjs';

// Custom UI Components
import { StatCard } from '../components/ui/StatCard';
import { InsightBanner } from '../components/ui/InsightBanner';
import { SearchToolbar } from '../components/ui/SearchToolbar';
import { DataGrid } from '../components/ui/DataGrid';
import { StatusChip } from '../components/ui/StatusChip';
import { ProgressRing } from '../components/ui/ProgressRing';

// Modals
import { CustomModal } from '../components/ui/CustomModal';
import { EditStudentModal } from '../components/ui/EditStudentModal';
import { PhotoUploadModal } from '../components/ui/PhotoUploadModal';
import { FaceRegistrationModal } from '../components/ui/FaceRegistrationModal';
import { BiometrikModal } from '../components/ui/BiometrikModal';
import { StudentDetailDrawer } from '../components/ui/StudentDetailDrawer';

// Icons
import { 
  Users, UserPlus, User, FileSpreadsheet, FileText, Upload, BookOpen,
  Edit2, Camera, ScanFace, Fingerprint, Eye, Trash2, ShieldAlert,
  AlertTriangle, UserCheck
} from 'lucide-react';

import './BukuInduk.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Authorization': `Bearer ${token}`, ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Terjadi kesalahan server.');
  }
  return res.json();
}

export function BukuInduk() {
  const { isAdmin, isStaff } = useAuth();
  const [santriList, setSantriList] = useState([]);
  const [tahunMasukList, setTahunMasukList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filterTahun, setFilterTahun] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterBiometrik, setFilterBiometrik] = useState('');
  const [filterKelamin, setFilterKelamin] = useState('');

  // Modals & Drawers State
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState(null);
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [isRegisteringFace, setIsRegisteringFace] = useState(false);
  const [faceRegisterResult, setFaceRegisterResult] = useState(null);
  
  const [biometrikModalOpen, setBiometrikModalOpen] = useState(false);
  const [isRegisteringBiometrik, setIsRegisteringBiometrik] = useState(false);
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, tahunData, kelasData, kamarData, taAktif] = await Promise.all([
        apiFetch('/api/buku-induk'),
        apiFetch('/api/buku-induk/tahun-masuk'),
        apiFetch('/api/kelas'),
        apiFetch('/api/kamar'),
        apiFetch('/api/tahun-ajaran/active').catch(() => null),
      ]);
      setSantriList(data);
      setTahunMasukList(tahunData);
      setKelasList(kelasData);
      setKamarList(kamarData);
      if (taAktif) setActiveTahunAjaran(taAktif);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived Statistics
  const stats = useMemo(() => {
    const total = santriList.length;
    const putra = santriList.filter(s => s.jenis_kelamin === 'Laki-laki').length;
    const putri = santriList.filter(s => s.jenis_kelamin === 'Perempuan').length;
    const withPhoto = santriList.filter(s => s.foto_url).length;
    const withBio = santriList.filter(s => s.is_face_registered || s.nfc_uid || s.qr_code || s.fingerprint_id).length;
    
    return { total, putra, putri, withPhoto, withBio };
  }, [santriList]);

  // Insights Banner Data
  const insights = useMemo(() => {
    const alerts = [];
    if (!stats.total) return alerts;
    
    const photoPercent = Math.round((stats.withPhoto / stats.total) * 100) || 0;
    const bioPercent = Math.round((stats.withBio / stats.total) * 100) || 0;
    const missingTahun = santriList.filter(s => !s.tahun_masuk).length;

    alerts.push({
      type: photoPercent > 90 ? 'success' : photoPercent < 50 ? 'error' : 'info',
      icon: <UserCheck size={14} />,
      text: `${photoPercent}% santri memiliki foto profil`
    });

    alerts.push({
      type: bioPercent > 80 ? 'success' : bioPercent < 30 ? 'warning' : 'info',
      icon: <Fingerprint size={14} />,
      text: `${bioPercent}% santri terdaftar biometrik`
    });

    if (missingTahun > 0) {
      alerts.push({
        type: 'error',
        icon: <AlertTriangle size={14} />,
        text: `${missingTahun} santri belum memiliki tahun masuk`
      });
    }

    return alerts;
  }, [stats, santriList]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return santriList.filter(s => {
      // Search — join all searchable fields into a safe string to avoid TypeError
      // when fields are null, undefined, or non-string (e.g. numeric NIS)
      const keyword = searchText.toLowerCase();
      const searchable = [
        s.nis,
        s.nik,
        s.nama,
        s.kelas_diniyah,
        s.kelas_sekolah,
        s.nama_kamar,
      ].join(' ').toLowerCase();
      const matchSearch = !keyword || searchable.includes(keyword);
      
      // Filter Tahun
      const matchTahun = !filterTahun || String(s.tahun_masuk ?? '') === String(filterTahun);
      
      // Filter Kelamin
      const matchKelamin = !filterKelamin || s.jenis_kelamin === filterKelamin;

      // Filter Biometrik
      let matchBio = true;
      if (filterBiometrik === 'registered') {
        matchBio = s.is_face_registered || s.nfc_uid || s.qr_code || s.fingerprint_id;
      } else if (filterBiometrik === 'not_registered') {
        matchBio = !s.is_face_registered && !s.nfc_uid && !s.qr_code && !s.fingerprint_id;
      }

      return matchSearch && matchTahun && matchKelamin && matchBio;
    });
  }, [santriList, searchText, filterTahun, filterKelamin, filterBiometrik]);

  // Actions
  const handleEditSubmit = async (formData) => {
    setIsSubmitting(true);
    setModalError('');
    try {
      const payload = {
        ...formData,
        tanggal_lahir: formData.tanggal_lahir ? dayjs(formData.tanggal_lahir).format('YYYY-MM-DD') : null,
      };

      if (selectedSantri) {
        await apiFetch(`/api/buku-induk/${selectedSantri.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/buku-induk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id, nama) => {
    setDeleteConfirm({ id, nama });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await apiFetch(`/api/buku-induk/${deleteConfirm.id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePhotoUpload = async (file) => {
    if (!selectedSantri) return;
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('foto', file);
      await fetch(`${API_BASE}/api/buku-induk/${selectedSantri.id}/foto`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      setPhotoModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleFaceRegister = async (santriId, descriptors) => {
    setIsRegisteringFace(true);
    try {
      await absensiSholatService.registerFace(santriId, descriptors);
      setFaceRegisterResult({ success: true, message: 'Wajah berhasil didaftarkan dengan 3 sudut pandang.' });
      fetchData();
    } catch (err) {
      setFaceRegisterResult({ success: false, message: err.message });
    } finally {
      setIsRegisteringFace(false);
    }
  };

  const handleBiometrikRegister = async (type, dataValue) => {
    if (!selectedSantri || !dataValue) return;
    setIsRegisteringBiometrik(true);
    try {
      await apiFetch(`/api/buku-induk/${selectedSantri.id}/biometrik`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: dataValue })
      });
      fetchData();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan data biometrik');
    } finally {
      setIsRegisteringBiometrik(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = santriList.map(s => ({
      'NIS': s.nis,
      'Nama': s.nama,
      'Jenis Kelamin': s.jenis_kelamin,
      'Kelas Diniyah': s.kelas_diniyah,
      'Tahun Masuk': s.tahun_masuk,
    }));
    exportToExcel(dataToExport, `Buku_Induk_Santri.xlsx`);
  };

  // Columns for DataGrid
  const columns = [
    {
      title: 'Profil Santri',
      dataIndex: 'nama',
      width: '30%',
      render: (nama, row) => (
        <div className="datagrid-profile">
          <div className="datagrid-avatar">
            {row.foto_url && (
              <img 
                src={`${API_BASE}${row.foto_url}`} 
                alt={nama} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentElement.classList.add('fallback-active');
                }} 
              />
            )}
            <User 
              size={20} 
              className="fallback-user-icon" 
              style={{ display: row.foto_url ? 'none' : 'block' }} 
            />
          </div>
          <div className="datagrid-info">
            <span className="datagrid-name">{nama}</span>
            <span className="datagrid-meta">{row.nis} • {row.kelas_diniyah || 'Belum ada kelas'}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Kelamin',
      dataIndex: 'jenis_kelamin',
      width: '10%',
      render: (jk) => (
        <span className={`gender-badge ${jk === 'Laki-laki' ? 'male' : 'female'}`}>
          {jk === 'Laki-laki' ? 'Putra' : 'Putri'}
        </span>
      )
    },
    {
      title: 'Tahun',
      dataIndex: 'tahun_masuk',
      width: '10%',
      render: (thn) => <span className="year-badge">{thn || '-'}</span>
    },
    {
      title: 'Biometrik Aktif',
      key: 'biometric',
      width: '25%',
      render: (_, row) => (
        <div className="bio-chips-inline">
          {row.is_face_registered && <StatusChip active={true} label="Face" size="sm" />}
          {row.qr_code && <StatusChip active={true} label="QR" size="sm" />}
          {row.nfc_uid && <StatusChip active={true} label="NFC" size="sm" />}
          {row.fingerprint_id && <StatusChip active={true} label="Jari" size="sm" />}
          {(!row.is_face_registered && !row.qr_code && !row.nfc_uid && !row.fingerprint_id) && (
            <span className="text-muted text-sm">Belum Ada</span>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      key: 'completion',
      width: '10%',
      align: 'center',
      render: (_, row) => {
        let score = 30;
        if(row.foto_url) score += 20;
        if(row.nama_ayah) score += 20;
        if(row.is_face_registered || row.nfc_uid) score += 30;
        return <ProgressRing percent={score} size={32} strokeWidth={3} />;
      }
    },
    {
      title: 'Aksi',
      key: 'actions',
      width: '15%',
      align: 'right',
      render: (_, row) => (
        <div className="action-group">
          <button className="action-btn" onClick={(e) => { e.stopPropagation(); setSelectedSantri(row); setDetailDrawerOpen(true); }} title="Lihat Profil"><Eye size={16}/></button>
          <button className="action-btn" onClick={(e) => { e.stopPropagation(); setSelectedSantri(row); setEditModalOpen(true); }} title="Edit"><Edit2 size={16}/></button>
          <button className="action-btn" onClick={(e) => { e.stopPropagation(); setSelectedSantri(row); setPhotoModalOpen(true); }} title="Foto"><Camera size={16}/></button>
          <button className="action-btn" onClick={(e) => { e.stopPropagation(); setSelectedSantri(row); setFaceRegisterResult(null); setFaceModalOpen(true); }} title="Face ID"><ScanFace size={16}/></button>
          <button className="action-btn" onClick={(e) => { e.stopPropagation(); setSelectedSantri(row); setBiometrikModalOpen(true); }} title="NFC/QR/Jari"><Fingerprint size={16}/></button>
          <button className="action-btn danger" onClick={(e) => { e.stopPropagation(); handleDelete(row.id, row.nama); }} title="Hapus"><Trash2 size={16}/></button>
        </div>
      )
    }
  ];

  return (
    <div className="module-buku-induk">
      {/* Page Header */}
      <div className="module-header">
        <div className="module-header__title">
          <div className="icon-wrap"><BookOpen size={24} /></div>
          <div>
            <h1>Buku Induk Santri</h1>
            <p>Manajemen pusat data santri dan identitas biometrik</p>
          </div>
        </div>
        <div className="module-header__actions">
          <button className="btn-outline" onClick={handleExportExcel} disabled={!santriList.length}>
            <FileSpreadsheet size={16}/> Ekspor
          </button>
          {(isAdmin() || isStaff()) && (
            <>
              <button className="btn-outline" onClick={() => setImportModalOpen(true)}>
                <Upload size={16}/> Impor
              </button>
              <button className="btn-primary" onClick={() => { setSelectedSantri(null); setEditModalOpen(true); }}>
                <UserPlus size={16}/> Tambah Santri
              </button>
            </>
          )}
        </div>
      </div>

      {/* Insight Banner */}
      <InsightBanner insights={insights} />

      {/* Analytics Grid */}
      <div className="analytics-grid">
        <StatCard icon={<Users />} label="Total Santri" value={stats.total} accent="indigo" />
        <StatCard icon={<Users />} label="Santri Putra" value={stats.putra} accent="blue" />
        <StatCard icon={<Users />} label="Santri Putri" value={stats.putri} accent="pink" />
        <StatCard icon={<ShieldAlert />} label="Terdaftar Biometrik" value={stats.withBio} accent="green" />
      </div>

      {/* Toolbar */}
      <SearchToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        totalItems={filteredData.length}
        onReset={() => {
          setSearchText('');
          setFilterTahun('');
          setFilterKelamin('');
          setFilterBiometrik('');
        }}
        filters={[
          {
            placeholder: 'Semua Tahun Masuk',
            value: filterTahun,
            onChange: setFilterTahun,
            options: tahunMasukList.map(t => ({ label: t, value: t }))
          },
          {
            placeholder: 'Semua Kelamin',
            value: filterKelamin,
            onChange: setFilterKelamin,
            options: [
              { label: 'Putra', value: 'Laki-laki' },
              { label: 'Putri', value: 'Perempuan' }
            ]
          },
          {
            placeholder: 'Semua Status Biometrik',
            value: filterBiometrik,
            onChange: setFilterBiometrik,
            options: [
              { label: 'Sudah Terdaftar', value: 'registered' },
              { label: 'Belum Terdaftar', value: 'not_registered' }
            ]
          }
        ]}
      />

      {/* Data Grid */}
      {loading ? (
        <div className="loading-state">Memuat data santri...</div>
      ) : (
        <DataGrid 
          columns={columns} 
          data={filteredData} 
          rowKey="id"
          onRowClick={(row) => {
            setSelectedSantri(row);
            setDetailDrawerOpen(true);
          }}
        />
      )}

      {/* Drawers & Modals */}
      <StudentDetailDrawer 
        open={detailDrawerOpen} 
        onClose={() => setDetailDrawerOpen(false)} 
        santri={selectedSantri} 
      />

      <EditStudentModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        santri={selectedSantri}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
        error={modalError}
        kelasDiniyah={kelasList.filter(k => k.jenis === 'Diniyah')}
        kelasSekolah={kelasList.filter(k => k.jenis === 'Sekolah')}
        kamarList={kamarList}
      />

      <PhotoUploadModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        santri={selectedSantri}
        onUpload={handlePhotoUpload}
        isUploading={isUploadingPhoto}
      />

      <FaceRegistrationModal
        open={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        santri={selectedSantri}
        onRegister={handleFaceRegister}
        isRegistering={isRegisteringFace}
        registerResult={faceRegisterResult}
      />

      <BiometrikModal
        open={biometrikModalOpen}
        onClose={() => setBiometrikModalOpen(false)}
        santri={selectedSantri}
        onRegister={handleBiometrikRegister}
        isRegistering={isRegisteringBiometrik}
      />

      <ImportSantriModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchData}
        tahunAjaranId={activeTahunAjaran?.id}
        tahunAjaranKode={activeTahunAjaran?.kode || 'Aktif'}
      />

      {/* Delete Confirmation Modal */}
      <CustomModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Konfirmasi Hapus"
        subtitle="Tindakan ini tidak dapat dibatalkan"
        icon={<AlertTriangle className="text-red-500" style={{ color: '#EF4444' }} />}
        size="sm"
      >
        <div style={{ paddingTop: '8px' }}>
          <p style={{ margin: '0 0 24px', color: '#475569' }}>
            Apakah Anda yakin ingin menghapus data santri <strong>{deleteConfirm?.nama}</strong> secara permanen?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
            <button 
              className="btn-primary" 
              style={{ background: '#EF4444', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.25)' }}
              onClick={handleConfirmDelete}
            >
              Hapus Permanen
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
