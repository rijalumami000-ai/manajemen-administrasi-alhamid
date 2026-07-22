import { useState, useEffect, useMemo } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { CustomTag } from '../ui/CustomTag';
import { SmartAlert } from '../ui/SmartAlert';
import { SearchInput } from '../common/SearchInput';
import { RefreshCw, ArrowRight, Award } from 'lucide-react';
import './MigrationModal.scss';

// Helper function to extract tingkat from class name
function extractTingkat(kelasNama) {
  if (!kelasNama) return null;
  if (kelasNama.toLowerCase() === 'sp') return 1;
  if (kelasNama.toLowerCase().includes('sifir')) return 0;
  const match = kelasNama.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Helper function to determine next class level label
function getNextClass(currentClass) {
  if (!currentClass) return null;
  const tingkat = extractTingkat(currentClass);
  if (tingkat === null) return null;
  if (tingkat === 0) return 'Kelas 1';
  if (tingkat >= 1 && tingkat < 6) return `Kelas ${tingkat + 1}`;
  if (tingkat === 6) return '🎓 Lulus Diniyah';
  return null;
}

// Helper function to get next tingkat level
function getNextTingkatAndSP(currentClassNama) {
  if (!currentClassNama) return { tingkat: null, isSp: false };
  const tingkat = extractTingkat(currentClassNama);
  if (tingkat === null) return { tingkat: null, isSp: false };

  if (tingkat === 0) return { tingkat: 1, isSp: false };
  if (tingkat >= 1 && tingkat < 6) return { tingkat: tingkat + 1, isSp: false };
  return { tingkat: null, isSp: false };
}

export function MigrationModal({
  isOpen,
  onClose,
  onSubmit,
  santriList = [],
  targetYear,
  sourceYear,
  isSubmitting = false,
  targetClasses = []
}) {
  const [excludedIds, setExcludedIds] = useState([]);
  const [customTargetClasses, setCustomTargetClasses] = useState({});
  const [activeClassTab, setActiveClassTab] = useState('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState('');

  const classTabs = useMemo(() => {
    const classNames = Array.from(
      new Set(santriList.map(s => s.nama_diniyah).filter(Boolean))
    ).sort();
    return ['Semua Kelas', ...classNames];
  }, [santriList]);

  const targetDiniyahClasses = useMemo(() => {
    return targetClasses.filter(k => k.jenis === 'Diniyah');
  }, [targetClasses]);

  const getAvailableTargetOptions = (currentClassNama) => {
    if (!currentClassNama) return [];
    const { tingkat } = getNextTingkatAndSP(currentClassNama);
    if (tingkat === null) return [];

    return targetDiniyahClasses.filter(k => k.tingkat === tingkat);
  };

  useEffect(() => {
    if (isOpen && santriList.length > 0) {
      const initialMap = {};

      santriList.forEach(santri => {
        const availableOptions = getAvailableTargetOptions(santri.nama_diniyah);
        const { tingkat } = getNextTingkatAndSP(santri.nama_diniyah);

        if (tingkat !== null && availableOptions.length > 0) {
          const matchedBySuffix = availableOptions.find(k => {
            const currentSub = santri.nama_diniyah ? santri.nama_diniyah.replace(/\d+/g, '').trim() : '';
            const targetSub = k.nama ? k.nama.replace(/\d+/g, '').trim() : '';
            return currentSub && targetSub && currentSub === targetSub;
          });

          initialMap[santri.id] = matchedBySuffix ? matchedBySuffix.id : availableOptions[0].id;
        }
      });

      setCustomTargetClasses(initialMap);
      setExcludedIds([]);
      setActiveClassTab('Semua Kelas');
      setSearchQuery('');
    }
  }, [isOpen, santriList, targetDiniyahClasses]);

  const filteredSantri = useMemo(() => {
    return santriList.filter(s => {
      const matchesTab = activeClassTab === 'Semua Kelas' || s.nama_diniyah === activeClassTab;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || (
        (s.nama && s.nama.toLowerCase().includes(q)) ||
        (s.nis && s.nis.toLowerCase().includes(q))
      );

      return matchesTab && matchesQuery;
    });
  }, [santriList, activeClassTab, searchQuery]);

  const toggleExclude = (id) => {
    setExcludedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllTab = (checked) => {
    const currentTabIds = filteredSantri.map(s => s.id);
    if (checked) {
      setExcludedIds(prev => prev.filter(id => !currentTabIds.includes(id)));
    } else {
      setExcludedIds(prev => Array.from(new Set([...prev, ...currentTabIds])));
    }
  };

  const handleCustomClassChange = (santriId, classId) => {
    setCustomTargetClasses(prev => ({
      ...prev,
      [santriId]: classId ? Number(classId) : null
    }));
  };

  const isAllTabSelected = useMemo(() => {
    if (filteredSantri.length === 0) return false;
    return filteredSantri.every(s => !excludedIds.includes(s.id));
  }, [filteredSantri, excludedIds]);

  const migratingCount = santriList.length - excludedIds.length;
  const notPromotedCount = excludedIds.length;

  const alumniCount = useMemo(() => {
    return santriList.filter(s => {
      if (excludedIds.includes(s.id)) return false;
      const tingkat = extractTingkat(s.nama_diniyah);
      return tingkat === 6;
    }).length;
  }, [santriList, excludedIds]);

  const handleConfirm = () => {
    if (migratingCount === 0) return;

    onSubmit({
      excludedIds,
      customTargetClasses
    });
  };

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title="Migrasi Periode Akademik Diniyah"
      subtitle={`Proses menaikkan kelas Diniyah secara massal dari ${sourceYear?.kode} ke ${targetYear}`}
      icon={<RefreshCw />}
      width={1020}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
          <button type="button" className="btn-custom btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button
            type="button"
            className="btn-custom btn-danger"
            onClick={handleConfirm}
            disabled={isSubmitting || migratingCount === 0}
          >
            {isSubmitting ? 'Memproses Migrasi...' : 'Proses Migrasi Massal'}
          </button>
        </div>
      }
    >
      <div className="migration-modal-container">
        <SmartAlert
          message="💡 Informasi Migrasi & Pembagian Kelas Diniyah"
          description="Hanya santri aktif Semester Genap yang dimigrasikan. Pilih kelas tujuan spesifik sebelum mengeksekusi."
          type="info"
        />

        {/* Statistics Summary Strip */}
        <div className="migration-stats-strip">
          <div className="stat-pill-card">
            <span className="stat-pill-label">Total Santri</span>
            <span className="stat-pill-val">{santriList.length}</span>
          </div>
          <div className="stat-pill-card success">
            <span className="stat-pill-label">Akan Naik Kelas</span>
            <span className="stat-pill-val">{migratingCount}</span>
          </div>
          <div className="stat-pill-card danger">
            <span className="stat-pill-label">Tinggal Kelas</span>
            <span className="stat-pill-val">{notPromotedCount}</span>
          </div>
          <div className="stat-pill-card warning">
            <span className="stat-pill-label">Lulus Diniyah</span>
            <span className="stat-pill-val">{alumniCount}</span>
          </div>
        </div>

        {/* Dynamic Class Tabs Filter & Search Controls */}
        <div className="migration-controls-row">
          <div className="class-tabs-container">
            <div className="class-tabs-track">
              {classTabs.map((tab) => {
                const isActive = activeClassTab === tab;
                const count = tab === 'Semua Kelas'
                  ? santriList.length
                  : santriList.filter(s => s.nama_diniyah === tab).length;

                return (
                  <button
                    key={tab}
                    type="button"
                    className={`class-pill-tab ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveClassTab(tab)}
                  >
                    <span>{tab}</span>
                    <span className="class-count-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="modal-search-wrapper" style={{ width: '240px' }}>
            <SearchInput
              placeholder="Cari nama / NIS..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        </div>

        {/* Custom Table */}
        <div className="migration-table-wrap">
          <table className="custom-migration-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={isAllTabSelected}
                    onChange={(e) => toggleSelectAllTab(e.target.checked)}
                  />
                </th>
                <th>NIS</th>
                <th>Nama Santri</th>
                <th>Kelas Lama</th>
                <th>Perkiraan Progresi</th>
                <th>Kelas Diniyah Baru</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSantri.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Tidak ada data santri untuk kelas atau pencarian ini.
                  </td>
                </tr>
              ) : (
                filteredSantri.map((record) => {
                  const isExcluded = excludedIds.includes(record.id);
                  const currentClass = record.nama_diniyah;
                  const currentTingkat = extractTingkat(currentClass);
                  const isClass6 = currentTingkat === 6;
                  const nextClassLabel = getNextClass(currentClass);
                  const availableOptions = getAvailableTargetOptions(currentClass);

                  return (
                    <tr key={record.id} className={isExcluded ? 'not-promoted-row' : 'promoted-row'}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleExclude(record.id)}
                        />
                      </td>
                      <td>{record.nis}</td>
                      <td><strong>{record.nama}</strong></td>
                      <td><CustomTag color="blue">{currentClass || '-'}</CustomTag></td>
                      <td>
                        {isClass6 ? (
                          <CustomTag color="purple"><Award size={12} /> Lulus Diniyah</CustomTag>
                        ) : nextClassLabel ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#16a34a' }}>
                            <ArrowRight size={14} /> {nextClassLabel}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td>
                        {isExcluded || isClass6 || availableOptions.length === 0 ? (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {isClass6 ? 'Menjadi Alumni Diniyah' : isExcluded ? 'Tinggal Kelas' : '-'}
                          </span>
                        ) : (
                          <select
                            className="custom-native-select mini"
                            value={customTargetClasses[record.id] || ''}
                            onChange={(e) => handleCustomClassChange(record.id, e.target.value)}
                          >
                            {availableOptions.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.nama}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        <CustomTag color={record.status_tahun_ajaran === 'aktif' ? 'green' : 'default'}>
                          {record.status_tahun_ajaran || 'aktif'}
                        </CustomTag>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </CustomModal>
  );
}
