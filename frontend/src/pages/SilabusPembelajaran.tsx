import React, { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Save, 
  Edit3, 
  X, 
  Plus, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../components/common';
import { nilaiService } from '../services/nilaiService';
import { useAuth } from '../context/AuthContext';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import type { 
  SilabusItem, 
  TahunAjaranItem, 
  DeleteConfirmState 
} from '../types/silabus';
import './SilabusPembelajaran.scss';

export function SilabusPembelajaran() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  // Reference lists
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);

  // Selected filters
  const [selectedTahunId, setSelectedTahunId] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>('Ganjil');
  const [selectedTingkat, setSelectedTingkat] = useState<number>(0);

  // Data states
  const [silabusList, setSilabusList] = useState<SilabusItem[]>([]);
  const [editList, setEditList] = useState<SilabusItem[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Custom Delete Row Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    isOpen: false,
    rowIndex: null
  });

  // Initialize filters
  useEffect(() => {
    const initFilters = async () => {
      try {
        setLoading(true);
        const years: TahunAjaranItem[] = await nilaiService.fetchTahunAjaran();
        setTahunAjaranList(years);
        const activeYear = years.find(y => y.is_active);
        if (activeYear) {
          setSelectedTahunId(activeYear.id);
        } else if (years.length > 0) {
          setSelectedTahunId(years[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat filter referensi.');
      } finally {
        setLoading(false);
      }
    };
    initFilters();
  }, []);

  // Fetch Silabus data
  const fetchSilabus = async () => {
    if (!selectedTahunId || selectedTingkat === null || selectedTingkat === undefined || !selectedSemester) return;
    try {
      setDataLoading(true);
      setIsEditing(false);
      const data = await nilaiService.fetchSilabus(selectedTahunId, selectedSemester, selectedTingkat);
      const list: SilabusItem[] = Array.isArray(data) ? data : [];
      setSilabusList(list);
      setEditList(JSON.parse(JSON.stringify(list)));
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal memuat silabus pembelajaran: ' + (err?.message || 'Error'));
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchSilabus();
  }, [selectedTahunId, selectedSemester, selectedTingkat]);

  // Actions
  const handleSave = async () => {
    if (!selectedTahunId) {
      toast.error('Tahun ajaran belum dipilih.');
      return;
    }
    try {
      setSaveLoading(true);
      await nilaiService.saveSilabus({
        tahun_ajaran_id: selectedTahunId,
        semester: selectedSemester,
        tingkat: selectedTingkat,
        data: editList
      });
      toast.success('Silabus pembelajaran berhasil disimpan!');
      setSilabusList(JSON.parse(JSON.stringify(editList)));
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan silabus.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRowChange = (index: number, field: keyof SilabusItem, value: any) => {
    const updated = [...editList];
    updated[index] = { ...updated[index], [field]: value };
    setEditList(updated);
  };

  const handleAddRow = () => {
    const defaultMonth = selectedSemester === 'Ganjil' ? 'Juli' : 'Januari';
    setEditList([...editList, {
      bulan: defaultMonth,
      pelajaran: '',
      pengajar: 'Mustahiq',
      ketentuan: '',
      target_materi: '',
      target_pencapaian: '',
      target_muhafadzoh: ''
    }]);
  };

  const handleRemoveRowClick = (index: number) => {
    setDeleteConfirm({
      isOpen: true,
      rowIndex: index
    });
  };

  const handleConfirmRemoveRow = () => {
    const idx = deleteConfirm.rowIndex;
    if (idx !== null && idx !== undefined) {
      setEditList(editList.filter((_, i) => i !== idx));
    }
    setDeleteConfirm({ isOpen: false, rowIndex: null });
  };

  const moveRow = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editList.length) return;
    const updated = [...editList];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setEditList(updated);
  };

  const getMonthOptions = () => {
    const months = selectedSemester === 'Ganjil' 
      ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];
      
    return months.map(m => ({ value: m, label: m }));
  };

  const getBulanSpan = (value: string, index: number, listToUse: SilabusItem[]) => {
    let firstOccurrenceIndex = index;
    while (firstOccurrenceIndex > 0 && listToUse[firstOccurrenceIndex - 1].bulan === value) {
      firstOccurrenceIndex--;
    }
    
    if (index === firstOccurrenceIndex) {
      let spanCount = 1;
      while (index + spanCount < listToUse.length && listToUse[index + spanCount].bulan === value) {
        spanCount++;
      }
      return spanCount;
    }
    return 0;
  };

  const getMuhafadzohSpan = (value: string | undefined, index: number, listToUse: SilabusItem[]) => {
    if (!value || value.trim() === '') return 1;

    let firstOccurrenceIndex = index;
    while (firstOccurrenceIndex > 0 && listToUse[firstOccurrenceIndex - 1].target_muhafadzoh === value) {
      firstOccurrenceIndex--;
    }

    if (index === firstOccurrenceIndex) {
      let spanCount = 1;
      while (index + spanCount < listToUse.length && listToUse[index + spanCount].target_muhafadzoh === value) {
        spanCount++;
      }
      return spanCount;
    }
    return 0;
  };

  const taOptions = tahunAjaranList.map(ta => ({
    value: String(ta.id),
    label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`
  }));

  const tingkatOptions = [
    { value: '0', label: 'Tingkat Sifir' },
    { value: '99', label: 'Tingkat SP' },
    { value: '1', label: 'Tingkat 1' },
    { value: '2', label: 'Tingkat 2' },
    { value: '3', label: 'Tingkat 3' },
    { value: '4', label: 'Tingkat 4' },
    { value: '5', label: 'Tingkat 5' },
    { value: '6', label: 'Tingkat 6' },
  ];

  const pengajarOptions = [
    { value: 'Mustahiq', label: 'Mustahiq' },
    { value: 'Munawib', label: 'Munawib' }
  ];

  return (
    <div className="silabus-page">
      {/* ─── 1. APPLE FLOATING DOCK HEADER (NO ICON ORB) ─────────── */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Silabus Pembelajaran</h2>
          <p className="page-subtitle">Kelola target materi, pencapaian, ketentuan, serta muhafadzoh Madrasah Diniyyah per tingkatan</p>
        </div>

        <div className="header-actions-row">
          {isAdmin() && (
            <>
              {isEditing ? (
                <div className="edit-btn-group">
                  <button
                    type="button"
                    className="action-pill-btn"
                    onClick={() => {
                      setEditList(JSON.parse(JSON.stringify(silabusList)));
                      setIsEditing(false);
                    }}
                    disabled={saveLoading}
                  >
                    <X size={15} />
                    <span>Batal</span>
                  </button>
                  <button
                    type="button"
                    className="action-pill-btn primary-pill"
                    onClick={handleSave}
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <RefreshCw size={15} className="spin-anim" />
                    ) : (
                      <Save size={15} />
                    )}
                    <span>Simpan Silabus</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="action-pill-btn primary-pill"
                  onClick={() => setIsEditing(true)}
                  disabled={dataLoading || loading}
                >
                  <Edit3 size={15} />
                  <span>Ubah Silabus</span>
                </button>
              )}
            </>
          )}

          <button
            type="button"
            className="action-pill-btn"
            onClick={fetchSilabus}
            disabled={dataLoading}
            title="Segarkan Silabus"
          >
            <RefreshCw size={14} className={dataLoading ? 'spin-anim' : ''} />
          </button>
        </div>
      </header>

      {/* ─── 2. APPLE GLASS FILTER BAR ───────────────────────────── */}
      <div className="silabus-filter-bar">
        {/* Filter Tahun Ajaran */}
        <div className="filter-pill-item ta-filter">
          <label className="filter-item-label">Tahun Ajaran</label>
          <div className="filter-select-wrap">
            <CustomSelect
              value={selectedTahunId ? String(selectedTahunId) : ''}
              onChange={(val) => setSelectedTahunId(val ? Number(val) : null)}
              options={taOptions}
              disabled={loading || isEditing}
              placeholder="Pilih Tahun Ajaran"
            />
          </div>
        </div>

        {/* Filter Semester Segmented Control */}
        <div className="filter-pill-item semester-filter">
          <label className="filter-item-label">Semester</label>
          <div className="tactile-segmented-control" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={selectedSemester === 'Ganjil'}
              className={`segment-btn ${selectedSemester === 'Ganjil' ? 'active' : ''}`}
              onClick={() => setSelectedSemester('Ganjil')}
              disabled={isEditing}
            >
              <span>Semester Ganjil</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selectedSemester === 'Genap'}
              className={`segment-btn ${selectedSemester === 'Genap' ? 'active' : ''}`}
              onClick={() => setSelectedSemester('Genap')}
              disabled={isEditing}
            >
              <span>Semester Genap</span>
            </button>
          </div>
        </div>

        {/* Filter Tingkat */}
        <div className="filter-pill-item tingkat-filter">
          <label className="filter-item-label">Tingkat Diniyah</label>
          <div className="filter-select-wrap">
            <CustomSelect
              value={String(selectedTingkat)}
              onChange={(val) => setSelectedTingkat(val !== null && val !== undefined ? Number(val) : 0)}
              options={tingkatOptions}
              disabled={isEditing}
              placeholder="Pilih Tingkat"
            />
          </div>
        </div>
      </div>

      {/* ─── 3. SILABUS CONTENT CARD ─────────────────────────────── */}
      <div className="silabus-card-container">
        <div className="silabus-card-notice">
          <SmartAlert
            message="Silabus ini mengatur pembagian materi ajar bulanan beserta target pencapaian & muhafadzoh di masing-masing tingkat Diniyah."
            type="info"
          />
        </div>

        {dataLoading ? (
          <div className="loading-container">
            <RefreshCw size={28} className="spin-anim" />
            <span className="loading-label">Memuat data silabus...</span>
          </div>
        ) : isEditing ? (
          /* ── EDIT MODE ── */
          <div className="edit-table-wrapper">
            <table className="tactile-glass-table edit-mode-table">
              <thead>
                <tr>
                  <th style={{ width: '135px' }}>Bulan</th>
                  <th style={{ width: '180px' }}>Pelajaran</th>
                  <th style={{ width: '130px' }}>Pengajar</th>
                  <th style={{ minWidth: '180px' }}>Ketentuan</th>
                  <th style={{ minWidth: '180px' }}>Target Materi</th>
                  <th style={{ minWidth: '180px' }}>Target Pencapaian</th>
                  <th style={{ minWidth: '180px' }}>Target Muhafadzoh</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {editList.map((row, idx) => (
                  <tr key={idx}>
                    <td className="cell-pad">
                      <CustomSelect
                        value={row.bulan}
                        onChange={val => handleRowChange(idx, 'bulan', val)}
                        options={getMonthOptions()}
                      />
                    </td>
                    <td className="cell-pad">
                      <input 
                        type="text"
                        className="table-cell-input"
                        placeholder="Nama Pelajaran" 
                        value={row.pelajaran || ''} 
                        onChange={e => handleRowChange(idx, 'pelajaran', e.target.value)} 
                      />
                    </td>
                    <td className="cell-pad">
                      <CustomSelect
                        value={row.pengajar}
                        onChange={val => handleRowChange(idx, 'pengajar', val)}
                        options={pengajarOptions}
                      />
                    </td>
                    <td className="cell-pad">
                      <textarea 
                        className="table-cell-textarea"
                        placeholder="Ketentuan / Instruksi (pisahkan baris)" 
                        rows={2}
                        value={row.ketentuan || ''} 
                        onChange={e => handleRowChange(idx, 'ketentuan', e.target.value)} 
                      />
                    </td>
                    <td className="cell-pad">
                      <textarea 
                        className="table-cell-textarea"
                        placeholder="Bab / Halaman" 
                        rows={2}
                        value={row.target_materi || ''} 
                        onChange={e => handleRowChange(idx, 'target_materi', e.target.value)} 
                      />
                    </td>
                    <td className="cell-pad">
                      <textarea 
                        className="table-cell-textarea"
                        placeholder="Kriteria Kelulusan" 
                        rows={2}
                        value={row.target_pencapaian || ''} 
                        onChange={e => handleRowChange(idx, 'target_pencapaian', e.target.value)} 
                      />
                    </td>
                    <td className="cell-pad">
                      <textarea 
                        className="table-cell-textarea"
                        placeholder="Target Hafalan" 
                        rows={2}
                        value={row.target_muhafadzoh || ''} 
                        onChange={e => handleRowChange(idx, 'target_muhafadzoh', e.target.value)} 
                      />
                    </td>
                    <td className="cell-pad cell-actions">
                      <div className="row-action-btns">
                        <button
                          type="button"
                          className="btn-row-act move-act"
                          disabled={idx === 0}
                          onClick={() => moveRow(idx, 'up')}
                          title="Pindahkan Ke Atas"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-row-act move-act"
                          disabled={idx === editList.length - 1}
                          onClick={() => moveRow(idx, 'down')}
                          title="Pindahkan Ke Bawah"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          className="btn-row-act delete-act"
                          onClick={() => handleRemoveRowClick(idx)}
                          title="Hapus Baris"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              type="button"
              className="add-row-tactile-btn"
              onClick={handleAddRow}
            >
              <Plus size={15} />
              <span>Tambah Baris Silabus</span>
            </button>
          </div>
        ) : silabusList.length > 0 ? (
          /* ── VIEW MODE ── */
          <div className="read-table-wrapper">
            <table className="tactile-glass-table read-mode-table">
              <thead>
                <tr>
                  <th style={{ width: '120px', textAlign: 'center' }}>Bulan</th>
                  <th style={{ width: '170px' }}>Pelajaran</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Pengajar</th>
                  <th>Ketentuan</th>
                  <th>Target Materi</th>
                  <th>Target Pencapaian</th>
                  <th style={{ width: '180px' }}>Target Muhafadzoh</th>
                </tr>
              </thead>
              <tbody>
                {silabusList.map((row, idx) => {
                  const bulanSpan = getBulanSpan(row.bulan, idx, silabusList);
                  const muhafadzohSpan = getMuhafadzohSpan(row.target_muhafadzoh, idx, silabusList);

                  return (
                    <tr key={idx}>
                      {bulanSpan !== 0 && (
                        <td 
                          rowSpan={bulanSpan} 
                          className="matrix-bulan-cell"
                        >
                          <span className="bulan-badge-tag">{row.bulan}</span>
                        </td>
                      )}
                      <td className="pelajaran-cell">
                        <span className="pelajaran-title">{row.pelajaran || '-'}</span>
                      </td>
                      <td className="pengajar-cell">
                        <span className={`status-pill ${row.pengajar === 'Mustahiq' ? 'success' : 'warning'}`}>
                          {row.pengajar}
                        </span>
                      </td>
                      <td className="ketentuan-cell">
                        <ul className="ketentuan-list">
                          {(row.ketentuan || '').split('\n').filter(Boolean).map((bullet, bIdx) => (
                            <li key={bIdx}>{bullet}</li>
                          ))}
                          {!row.ketentuan && <span className="empty-dash">-</span>}
                        </ul>
                      </td>
                      <td className="materi-cell">
                        {row.target_materi || '-'}
                      </td>
                      <td className="pencapaian-cell">
                        {row.target_pencapaian || '-'}
                      </td>
                      {muhafadzohSpan !== 0 && (
                        <td 
                          rowSpan={muhafadzohSpan} 
                          className="muhafadzoh-cell"
                        >
                          {row.target_muhafadzoh || '-'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── EMPTY STATE ── */
          <div className="silabus-empty-state">
            <p className="empty-state-title">
              Belum ada data silabus pembelajaran untuk tingkat ini.
            </p>
            <p className="empty-state-desc">
              Silakan klik tombol di bawah untuk mulai menyusun target materi, pencapaian, dan muhafadzoh.
            </p>
            {isAdmin() && (
              <button
                type="button"
                className="action-pill-btn primary-pill"
                onClick={() => setIsEditing(true)}
              >
                <Plus size={15} />
                <span>Buat Silabus Baru</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── 4. MODAL KONFIRMASI HAPUS BARIS ─────────────────────── */}
      <CustomModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, rowIndex: null })}
        title="Hapus Baris Silabus"
        maxWidth="max-w-md"
      >
        <div>
          <div className="delete-confirm-box">
            <AlertTriangle className="delete-warning-icon" size={24} />
            <div className="delete-warning-text">
              Apakah Anda yakin ingin menghapus baris silabus ini dari draf?
              <p style={{ marginTop: '6px', marginBottom: 0, fontSize: '12.5px', color: '#64748b' }}>
                Tindakan ini hanya berlaku pada draf editor lokal dan tidak akan tersimpan secara permanen ke server sebelum Anda mengklik <strong>Simpan Silabus</strong>.
              </p>
            </div>
          </div>
          <div className="modal-footer-row">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={() => setDeleteConfirm({ isOpen: false, rowIndex: null })}
            >
              Batal
            </button>
            <button
              type="button"
              className="modal-btn-submit"
              style={{ background: 'linear-gradient(180deg, #f43f5e 0%, #e11d48 100%)', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)' }}
              onClick={handleConfirmRemoveRow}
            >
              Ya, Hapus Baris
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default SilabusPembelajaran;
