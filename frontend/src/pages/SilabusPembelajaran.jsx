import { useState, useEffect } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Save, 
  Edit3, 
  X, 
  BookOpen, 
  Plus, 
  AlertTriangle 
} from 'lucide-react';
import { PageHeader, LoadingState, useToast } from '../components/common';
import { nilaiService } from '../services/nilaiService';
import { useAuth } from '../context/AuthContext';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import './SilabusPembelajaran.scss';

export function SilabusPembelajaran() {
  const { isAdmin } = useAuth();
  const toast = useToast();

  // Reference lists
  const [tahunAjaranList, setTahunAjaranList] = useState([]);

  // Selected filters
  const [selectedTahunId, setSelectedTahunId] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [selectedTingkat, setSelectedTingkat] = useState(0);

  // Data states
  const [silabusList, setSilabusList] = useState([]);
  const [editList, setEditList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Custom Delete Row Modal State
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    rowIndex: null
  });

  // Initialize filters
  useEffect(() => {
    const initFilters = async () => {
      try {
        setLoading(true);
        // Fetch Tahun Ajaran
        const years = await nilaiService.fetchTahunAjaran();
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
      const list = Array.isArray(data) ? data : [];
      setSilabusList(list);
      setEditList(JSON.parse(JSON.stringify(list)));
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat silabus pembelajaran.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchSilabus();
  }, [selectedTahunId, selectedSemester, selectedTingkat]);

  // Actions
  const handleSave = async () => {
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
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan silabus.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRowChange = (index, field, value) => {
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

  const handleRemoveRowClick = (index) => {
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

  const moveRow = (index, direction) => {
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

  const getBulanSpan = (value, index, listToUse) => {
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

  const getMuhafadzohSpan = (value, index, listToUse) => {
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

  if (loading) {
    return <LoadingState message="Memuat filter referensi..." />;
  }

  const taOptions = tahunAjaranList.map(ta => ({
    value: String(ta.id),
    label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`
  }));

  const tingkatOptions = [
    { value: '0', label: 'Tingkat Sifir' },
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
      <PageHeader
        title="📚 Silabus Pembelajaran"
        subtitle="Kelola target materi, pencapaian, ketentuan, serta muhafadzoh Madrasah Diniyyah per tingkatan"
      />

      {/* Filters Card */}
      <div className="filters-card">
        <div className="filter-group">
          <label className="filter-label">Tahun Ajaran</label>
          <CustomSelect
            value={selectedTahunId ? String(selectedTahunId) : ''}
            onChange={(val) => setSelectedTahunId(val ? Number(val) : null)}
            options={taOptions}
            placeholder="Pilih Tahun Ajaran"
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">Semester</label>
          <div className="custom-segmented-control">
            <button
              type="button"
              className={`segmented-btn ${selectedSemester === 'Ganjil' ? 'active' : ''}`}
              onClick={() => setSelectedSemester('Ganjil')}
            >
              Ganjil
            </button>
            <button
              type="button"
              className={`segmented-btn ${selectedSemester === 'Genap' ? 'active' : ''}`}
              onClick={() => setSelectedSemester('Genap')}
            >
              Genap
            </button>
          </div>
        </div>

        <div className="filter-group class-filter">
          <label className="filter-label">Tingkat Diniyah</label>
          <CustomSelect
            value={String(selectedTingkat)}
            onChange={(val) => setSelectedTingkat(val !== null && val !== undefined ? Number(val) : 0)}
            options={tingkatOptions}
            placeholder="Pilih Tingkat"
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className="silabus-card-container">
        <div className="silabus-card-header">
          <div className="header-left">
            <BookOpen className="header-icon" />
            <h2 className="header-title">Silabus Pembelajaran Tingkat Diniyah</h2>
          </div>
          {isAdmin() && (
            <div className="header-actions">
              {isEditing ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-custom btn-secondary"
                    onClick={() => {
                      setEditList(JSON.parse(JSON.stringify(silabusList)));
                      setIsEditing(false);
                    }}
                    disabled={saveLoading}
                  >
                    <X size={16} />
                    <span>Batal</span>
                  </button>
                  <button
                    type="button"
                    className="btn-custom btn-primary"
                    onClick={handleSave}
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Save size={16} /> Simpan Silabus
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-custom btn-primary"
                  onClick={() => setIsEditing(true)}
                  disabled={dataLoading}
                >
                  <Edit3 size={16} />
                  <span>Ubah Silabus</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="silabus-card-body">
          <div style={{ marginBottom: '16px' }}>
            <SmartAlert
              message="Syllabus ini mengatur pembagian materi ajar bulanan beserta target pencapaian & muhafadzoh di masing-masing kelas Diniyah."
              type="info"
            />
          </div>

          {dataLoading ? (
            <div className="loading-container">
              <div className="loading-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
              <span style={{ marginTop: '12px', fontSize: '14px', fontWeight: 500, color: 'var(--lt-text-secondary, #64748b)' }}>Memuat data silabus...</span>
            </div>
          ) : isEditing ? (
            <div className="edit-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
              <table className="custom-data-table edit-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1200px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>Bulan</th>
                    <th style={{ width: '170px' }}>Pelajaran</th>
                    <th style={{ width: '120px' }}>Pengajar</th>
                    <th>Ketentuan</th>
                    <th>Target Materi</th>
                    <th>Target Pencapaian</th>
                    <th>Target Muhafadzoh</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {editList.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '6px' }}>
                        <CustomSelect
                          value={row.bulan}
                          onChange={val => handleRowChange(idx, 'bulan', val)}
                          options={getMonthOptions()}
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <input 
                          type="text"
                          className="table-cell-input"
                          placeholder="Nama Pelajaran" 
                          value={row.pelajaran || ''} 
                          onChange={e => handleRowChange(idx, 'pelajaran', e.target.value)} 
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <CustomSelect
                          value={row.pengajar}
                          onChange={val => handleRowChange(idx, 'pengajar', val)}
                          options={pengajarOptions}
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <textarea 
                          className="table-cell-textarea"
                          placeholder="Ketentuan / Instruksi" 
                          rows={2}
                          value={row.ketentuan || ''} 
                          onChange={e => handleRowChange(idx, 'ketentuan', e.target.value)} 
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <textarea 
                          className="table-cell-textarea"
                          placeholder="Bab / Halaman" 
                          rows={2}
                          value={row.target_materi || ''} 
                          onChange={e => handleRowChange(idx, 'target_materi', e.target.value)} 
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <textarea 
                          className="table-cell-textarea"
                          placeholder="Kriteria Kelulusan" 
                          rows={2}
                          value={row.target_pencapaian || ''} 
                          onChange={e => handleRowChange(idx, 'target_pencapaian', e.target.value)} 
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <textarea 
                          className="table-cell-textarea"
                          placeholder="Target Hafalan" 
                          rows={2}
                          value={row.target_muhafadzoh || ''} 
                          onChange={e => handleRowChange(idx, 'target_muhafadzoh', e.target.value)} 
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="action-icon-btn edit-btn"
                            disabled={idx === 0}
                            onClick={() => moveRow(idx, 'up')}
                            title="Pindahkan Keatas"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn edit-btn"
                            disabled={idx === editList.length - 1}
                            onClick={() => moveRow(idx, 'down')}
                            title="Pindahkan Kebawah"
                          >
                            <ArrowDown size={13} />
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn delete-btn"
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
                className="add-row-dashed-btn"
                onClick={handleAddRow}
                style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '10px', border: '2px dashed rgba(226,232,240,0.8)', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--lt-text-secondary, #64748b)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(226,232,240,0.8)'; e.currentTarget.style.color = 'var(--lt-text-secondary, #64748b)'; }}
              >
                <Plus size={14} />
                <span>Tambah Baris Silabus</span>
              </button>
            </div>
          ) : silabusList.length > 0 ? (
            <div className="read-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
              <table className="custom-data-table read-table" style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1100px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '110px', textAlign: 'center' }}>Bulan</th>
                    <th style={{ width: '160px' }}>Pelajaran</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Pengajar</th>
                    <th>Ketentuan</th>
                    <th>Target Materi</th>
                    <th>Target Pencapaian</th>
                    <th style={{ width: '160px' }}>Target Muhafadzoh</th>
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
                            className="matrix-malam-label-cell" 
                            style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', background: 'var(--lt-bg-secondary, rgba(20,24,33,0.01))' }}
                          >
                            <span className="matrix-malam-label" style={{ fontSize: '14px', color: 'var(--lt-text-primary, #1e293b)' }}>{row.bulan}</span>
                          </td>
                        )}
                        <td style={{ fontWeight: 600, color: 'var(--lt-text-primary, #0f172a)' }}>
                          {row.pelajaran || '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-pill ${row.pengajar === 'Mustahiq' ? 'success' : 'warning'}`} style={{ display: 'inline-block', minWidth: '76px', textAlign: 'center' }}>
                            {row.pengajar}
                          </span>
                        </td>
                        <td>
                          <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12.5px', color: 'var(--lt-text-secondary, #334155)', lineHeight: 1.5 }}>
                            {(row.ketentuan || '').split('\n').filter(Boolean).map((bullet, bIdx) => (
                              <li key={bIdx}>{bullet}</li>
                            ))}
                            {!row.ketentuan && <span>-</span>}
                          </ul>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--lt-text-primary, #1e293b)', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                          {row.target_materi || '-'}
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--lt-text-secondary, #475569)', whiteSpace: 'pre-wrap' }}>
                          {row.target_pencapaian || '-'}
                        </td>
                        {muhafadzohSpan !== 0 && (
                          <td 
                            rowSpan={muhafadzohSpan} 
                            style={{ verticalAlign: 'middle', whiteSpace: 'pre-wrap', fontSize: '12.5px', color: 'var(--lt-text-secondary, #475569)' }}
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
            <div className="empty-state-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--lt-text-tertiary, #94a3b8)', marginBottom: '12px' }}>
                <BookOpen size={48} style={{ opacity: 0.5 }} />
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 500, color: 'var(--lt-text-secondary, #64748b)' }}>
                Belum ada data silabus pembelajaran tingkat ini. Silakan klik 'Ubah Silabus' untuk mulai mengisi.
              </p>
              {isAdmin() && (
                <button
                  type="button"
                  className="btn-custom btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <Plus size={16} />
                  <span>Buat Silabus Baru</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Draft Row Confirmation Modal */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, rowIndex: null })}
        title="Hapus Baris Silabus"
        subtitle="Konfirmasi Penghapusan Draft"
        icon={<AlertTriangle color="#ef4444" />}
        width={400}
        destroyOnClose
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              className="btn-custom btn-secondary"
              onClick={() => setDeleteConfirm({ isOpen: false, rowIndex: null })}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn-custom btn-danger"
              onClick={handleConfirmRemoveRow}
            >
              Ya, Hapus
            </button>
          </div>
        }
      >
        <div style={{ padding: '4px 0' }}>
          <p style={{ margin: 0, color: 'var(--lt-text-primary, #0f172a)', fontSize: '14px', fontWeight: 500 }}>
            Apakah Anda yakin ingin menghapus baris silabus ini dari draft?
          </p>
          <p style={{ marginTop: '10px', marginBottom: 0, color: 'var(--lt-text-secondary, #64748b)', fontSize: '13px', lineHeight: 1.5 }}>
            Tindakan ini hanya akan menghapus secara lokal pada draft editor dan tidak akan disimpan secara permanen hingga Anda mengklik "Simpan Silabus".
          </p>
        </div>
      </CustomModal>
    </div>
  );
}
