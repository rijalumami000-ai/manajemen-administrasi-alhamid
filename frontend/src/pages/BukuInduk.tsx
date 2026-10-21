import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ImportSantriModal } from '../components/features/ImportSantriModal';
import { exportToExcel } from '../utils/exportUtils';
import {
  calculateProfileCompleteness,
  formatDateDMY,
  normalizeGender,
  formatGender,
  isMaleGender,
  isFemaleGender
} from '../utils/studentUtils';

// Custom UI Components
import { StatCard } from '../components/ui/StatCard';
import { InsightBanner } from '../components/ui/InsightBanner';
import { SearchToolbar } from '../components/ui/SearchToolbar';
import { DataGrid } from '../components/ui/DataGrid';
import { ProgressRing } from '../components/ui/ProgressRing';

// Modals
import { CustomModal } from '../components/ui/CustomModal';
import { EditStudentModal } from '../components/ui/EditStudentModal';
import { PhotoUploadModal } from '../components/ui/PhotoUploadModal';
import { StudentDetailDrawer } from '../components/ui/StudentDetailDrawer';

// Icons
import {
  Users,
  UserPlus,
  User,
  FileSpreadsheet,
  Upload,
  Edit2,
  Camera,
  Eye,
  Trash2,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

import { BukuIndukSantri, BukuIndukStats } from '../types/bukuInduk';
import './BukuInduk.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Authorization': `Bearer ${token}`, ...(options.headers || {}) },
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
  const [santriList, setSantriList] = useState<BukuIndukSantri[]>([]);
  const [tahunMasukList, setTahunMasukList] = useState<string[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [kamarList, setKamarList] = useState<any[]>([]);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters
  const [filterTahun, setFilterTahun] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [filterKelamin, setFilterKelamin] = useState<string>('');

  // Modals & Drawers State
  const [detailDrawerOpen, setDetailDrawerOpen] = useState<boolean>(false);
  const [selectedSantri, setSelectedSantri] = useState<BukuIndukSantri | null>(null);
  const [hoveredAvatar, setHoveredAvatar] = useState<BukuIndukSantri | null>(null);

  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string>('');

  const [photoModalOpen, setPhotoModalOpen] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; nama: string } | null>(null);

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
      setSantriList(Array.isArray(data) ? data : []);
      setTahunMasukList(Array.isArray(tahunData) ? tahunData : []);
      setKelasList(Array.isArray(kelasData) ? kelasData : []);
      setKamarList(Array.isArray(kamarData) ? kamarData : []);
      if (taAktif) setActiveTahunAjaran(taAktif);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived Statistics
  const stats: BukuIndukStats = useMemo(() => {
    const total = santriList.length;
    const putra = santriList.filter(s => isMaleGender(s.jenis_kelamin)).length;
    const putri = santriList.filter(s => isFemaleGender(s.jenis_kelamin)).length;
    const withPhoto = santriList.filter(s => s.foto_url).length;

    return { total, putra, putri, withPhoto };
  }, [santriList]);

  // Insights Banner Data
  const insights = useMemo(() => {
    const alerts: any[] = [];
    if (!stats.total) return alerts;

    const photoPercent = Math.round((stats.withPhoto / stats.total) * 100) || 0;
    const missingTahun = santriList.filter(s => !s.tahun_masuk).length;

    alerts.push({
      type: photoPercent > 90 ? 'success' : photoPercent < 50 ? 'error' : 'info',
      icon: <UserCheck size={14} />,
      text: `${photoPercent}% santri memiliki foto profil terdata`
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
      const keyword = searchText.toLowerCase().trim();
      const searchable = [
        s.nis,
        s.nik,
        s.nama,
        s.kelas_diniyah,
        s.kelas_sekolah,
        s.nama_kamar,
      ].join(' ').toLowerCase();
      const matchSearch = !keyword || searchable.includes(keyword);

      const matchTahun = !filterTahun || String(s.tahun_masuk ?? '') === String(filterTahun);
      const matchKelamin = !filterKelamin || normalizeGender(s.jenis_kelamin) === filterKelamin;

      return matchSearch && matchTahun && matchKelamin;
    });
  }, [santriList, searchText, filterTahun, filterKelamin]);

  // Actions
  const handleEditSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setModalError('');
    try {
      const formatNullableDate = (d: any) => {
        if (!d) return null;
        if (typeof d === 'string') {
          const trimmed = d.trim();
          if (!trimmed) return null;
          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
        }
        try {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return null;
          return dt.toISOString().split('T')[0];
        } catch {
          return null;
        }
      };

      const payload = {
        ...formData,
        tanggal_lahir: formatNullableDate(formData.tanggal_lahir),
        diterima_tanggal_madin: formatNullableDate(formData.diterima_tanggal_madin),
        keluar_madin_tanggal: formatNullableDate(formData.keluar_madin_tanggal),
        keluar_pondok_tanggal: formatNullableDate(formData.keluar_pondok_tanggal),
        keluar_sekolah_tanggal: formatNullableDate(formData.keluar_sekolah_tanggal),
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
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number, nama: string) => {
    setDeleteConfirm({ id, nama });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await apiFetch(`/api/buku-induk/${deleteConfirm.id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePhotoUpload = async (file: File) => {
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = santriList.map(s => ({
      'NIS': s.nis,
      'NIK': s.nik || '-',
      'Nama': s.nama,
      'Jenis Kelamin': formatGender(s.jenis_kelamin),
      'Anak Ke': s.anak_ke ?? '-',
      'Agama': s.agama || 'Islam',
      'Status Keluarga': s.status_keluarga || 'Kandung',
      'Tempat Lahir': s.tempat_lahir || '-',
      'Tanggal Lahir': formatDateDMY(s.tanggal_lahir),
      'Alamat': s.alamat || '-',
      'Kelas Diniyah': s.kelas_diniyah || '-',
      'Kelas Sekolah': s.kelas_sekolah || '-',
      'Kamar': s.nama_kamar || '-',
      'Tahun Masuk': s.tahun_masuk || '-',
      'Nama Ayah': s.nama_ayah || '-',
      'NIK Ayah': s.nik_ayah || '-',
      'Pekerjaan Ayah': s.pekerjaan_ayah || '-',
      'No HP Ayah': s.no_hp_ayah || '-',
      'Nama Ibu': s.nama_ibu || '-',
      'NIK Ibu': s.nik_ibu || '-',
      'Pekerjaan Ibu': s.pekerjaan_ibu || '-',
      'No HP Ibu': s.no_hp_ibu || '-',
      'Status Masuk': s.status_masuk || 'Baru',
      'Pesantren Sebelumnya': s.pesantren_sebelumnya || '-',
      'Sekolah Asal': s.sekolah_asal_nama || '-',
      'Alamat Sekolah Asal': s.sekolah_asal_alamat || '-',
      'Diterima Kelas Madin': s.diterima_kelas_madin || '-',
      'Diterima Tanggal Madin': formatDateDMY(s.diterima_tanggal_madin),
      'Keluar Madin Tanggal': formatDateDMY(s.keluar_madin_tanggal),
      'Keluar Madin Status': s.keluar_madin_status || '-',
      'Keluar Pondok Tanggal': formatDateDMY(s.keluar_pondok_tanggal),
      'Keluar Pondok Status': s.keluar_pondok_status || '-',
      'Keluar Sekolah Tingkat': s.keluar_sekolah_tingkat || '-',
      'Keluar Sekolah Tanggal': formatDateDMY(s.keluar_sekolah_tanggal),
      'Keluar Sekolah Status': s.keluar_sekolah_status || '-',
    }));
    exportToExcel(dataToExport, `Buku_Induk_Santri.xlsx`);
  };

  const getStatusBadgeClass = (status?: string | null) => {
    if (!status || status === 'Aktif') return 'active';
    const s = String(status).toLowerCase();
    if (s.includes('lulus')) return 'lulus';
    if (s.includes('boyong')) return 'boyong';
    if (s.includes('keluar') || s.includes('dikeluarkan')) return 'out';
    return 'out';
  };

  // Columns for DataGrid
  const columns = [
    {
      title: 'Profil Santri',
      dataIndex: 'nama',
      width: '30%',
      render: (nama: string, row: BukuIndukSantri) => (
        <div className="datagrid-profile">
          <div 
            className="datagrid-avatar-wrapper"
            onMouseEnter={() => setHoveredAvatar(row)}
            onMouseLeave={() => setHoveredAvatar(null)}
          >
            <div className="datagrid-avatar">
              {row.foto_url && (
                <img 
                  src={`${API_BASE}${row.foto_url}`} 
                  alt={nama} 
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement?.classList.add('fallback-active');
                  }} 
                />
              )}
              <User 
                size={20} 
                className="fallback-user-icon" 
                style={{ display: row.foto_url ? 'none' : 'block' }} 
              />
            </div>

            {/* Pop up besar berukuran lingkar gelas */}
            {hoveredAvatar?.id === row.id && (
              <div className="avatar-lingkar-gelas-popup">
                {row.foto_url ? (
                  <img 
                    src={`${API_BASE}${row.foto_url}`} 
                    alt={nama} 
                    className="avatar-lingkar-img"
                  />
                ) : (
                  <div className="avatar-lingkar-fallback">
                    <User size={54} />
                  </div>
                )}
                <span className="avatar-lingkar-name">{nama}</span>
              </div>
            )}
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
      width: '8%',
      render: (jk: string) => {
        const isMale = isMaleGender(jk);
        const isFemale = isFemaleGender(jk);
        if (!isMale && !isFemale) {
          return <span className="gender-badge empty">-</span>;
        }
        return (
          <span className={`gender-badge ${isMale ? 'male' : 'female'}`}>
            {isMale ? 'Putra' : 'Putri'}
          </span>
        );
      }
    },
    {
      title: 'Tahun Masuk',
      dataIndex: 'tahun_masuk',
      width: '12%',
      render: (thn: any) => <span className="year-badge">{thn || '-'}</span>
    },
    {
      title: 'Status Keaktifan',
      key: 'status_keaktifan',
      width: '26%',
      render: (_: any, row: BukuIndukSantri) => (
        <div className="status-keaktifan-group">
          <span className={`status-pill-mini ${getStatusBadgeClass(row.keluar_madin_status)}`} title={`Madin: ${row.keluar_madin_status || 'Aktif'}`}>
            <span className="pill-dot"></span>
            <span className="pill-key">Madin:</span> {row.keluar_madin_status || 'Aktif'}
          </span>
          <span className={`status-pill-mini ${getStatusBadgeClass(row.keluar_pondok_status)}`} title={`Pondok: ${row.keluar_pondok_status || 'Aktif'}`}>
            <span className="pill-dot"></span>
            <span className="pill-key">Pondok:</span> {row.keluar_pondok_status || 'Aktif'}
          </span>
          <span className={`status-pill-mini ${getStatusBadgeClass(row.keluar_sekolah_status)}`} title={`Sekolah: ${row.keluar_sekolah_status || 'Aktif'}`}>
            <span className="pill-dot"></span>
            <span className="pill-key">Sekolah:</span> {row.keluar_sekolah_status || 'Aktif'}
          </span>
        </div>
      )
    },
    {
      title: 'Kelengkapan',
      key: 'completion',
      width: '10%',
      align: 'center',
      render: (_: any, row: BukuIndukSantri) => {
        const percent = calculateProfileCompleteness(row);
        return <ProgressRing percent={percent} size={32} strokeWidth={3} />;
      }
    },
    {
      title: 'Aksi',
      key: 'actions',
      width: '14%',
      align: 'right',
      render: (_: any, row: BukuIndukSantri) => (
        <div className="action-group">
          <button
            type="button"
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); setSelectedSantri(row); setDetailDrawerOpen(true); }}
            title="Lihat Profil Santri"
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); setSelectedSantri(row); setEditModalOpen(true); }}
            title="Edit Data Santri"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={(e) => { e.stopPropagation(); setSelectedSantri(row); setPhotoModalOpen(true); }}
            title="Unggah Foto Santri"
          >
            <Camera size={16} />
          </button>
          <button
            type="button"
            className="action-btn danger"
            onClick={(e) => { e.stopPropagation(); handleDelete(row.id, row.nama); }}
            title="Hapus Data Santri"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="module-buku-induk">
      {/* TACTILE PAGE HEADER (NO ICONS IN TITLE, CLEAN TYPOGRAPHY) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Buku Induk Santri</h2>
          <p className="page-subtitle">Manajemen pusat data santri dan arsip kesiswaan lengkap</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={handleExportExcel}
            disabled={!santriList.length}
            title="Ekspor Seluruh Buku Induk ke Excel"
          >
            <FileSpreadsheet size={16} />
            <span>Ekspor Excel</span>
          </button>

          {(isAdmin() || isStaff()) && (
            <>
              <button
                type="button"
                className="action-pill-btn secondary-pill"
                onClick={() => setImportModalOpen(true)}
                title="Impor Data Santri Baru dari Excel"
              >
                <Upload size={16} />
                <span>Impor Data</span>
              </button>

              <button
                type="button"
                className="action-pill-btn primary-pill"
                onClick={() => { setSelectedSantri(null); setEditModalOpen(true); }}
                title="Tambah Santri Baru ke Buku Induk"
              >
                <UserPlus size={16} />
                <span>Tambah Santri</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Insight Banner */}
      <InsightBanner insights={insights} />

      {/* Analytics Grid */}
      <div className="analytics-grid">
        <StatCard icon={<Users />} label="Total Santri" value={stats.total} accent="indigo" />
        <StatCard icon={<Users />} label="Santri Putra" value={stats.putra} accent="blue" />
        <StatCard icon={<Users />} label="Santri Putri" value={stats.putri} accent="pink" />
        <StatCard icon={<Camera />} label="Santri Berfoto" value={stats.withPhoto} accent="green" />
      </div>

      {/* Toolbar Search & Filter */}
      <SearchToolbar
        searchValue={searchText}
        onSearchChange={setSearchText}
        totalItems={filteredData.length}
        onReset={() => {
          setSearchText('');
          setFilterTahun('');
          setFilterKelamin('');
        }}
        filters={[
          {
            placeholder: 'Semua Tahun Masuk',
            value: filterTahun,
            onChange: setFilterTahun,
            options: tahunMasukList.map(t => ({ label: `Tahun ${t}`, value: String(t) }))
          },
          {
            placeholder: 'Semua Kelamin',
            value: filterKelamin,
            onChange: setFilterKelamin,
            options: [
              { label: 'Putra', value: 'L' },
              { label: 'Putri', value: 'P' }
            ]
          }
        ]}
      />

      {/* Data Grid */}
      {loading ? (
        <div className="loading-state">Memuat data buku induk santri...</div>
      ) : (
        <DataGrid 
          columns={columns} 
          data={filteredData} 
          rowKey="id"
          onRowClick={(row: BukuIndukSantri) => {
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
        title="Konfirmasi Hapus Santri"
        subtitle="Tindakan ini akan menghapus data santri secara permanen"
        icon={<AlertTriangle style={{ color: '#ef4444' }} />}
        size="sm"
      >
        <div style={{ paddingTop: '8px' }}>
          <p style={{ margin: '0 0 24px', color: '#475569', fontSize: '13.5px', lineHeight: 1.5 }}>
            Apakah Anda yakin ingin menghapus data santri <strong>{deleteConfirm?.nama}</strong> secara permanen dari Buku Induk?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="action-pill-btn secondary-pill"
              onClick={() => setDeleteConfirm(null)}
            >
              Batal
            </button>
            <button 
              type="button"
              className="action-pill-btn danger-pill"
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

export default BukuInduk;
