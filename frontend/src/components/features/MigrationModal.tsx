import React, { useState, useEffect, useMemo } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { CustomTag } from '../ui/CustomTag';
import { SmartAlert } from '../ui/SmartAlert';
import { SearchInput } from '../common/SearchInput';
import {
  RefreshCw,
  ArrowRight,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Sparkles,
  Search
} from 'lucide-react';
import './MigrationModal.scss';

// Helper function to extract tingkat from class name
function extractTingkat(kelasNama?: string | null): number | null {
  if (!kelasNama) return null;
  if (kelasNama.toLowerCase() === 'sp') return 1;
  if (kelasNama.toLowerCase().includes('sifir')) return 0;
  const match = kelasNama.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// Helper function to determine next class level label
function getNextClass(currentClass?: string | null): string | null {
  if (!currentClass) return null;
  const tingkat = extractTingkat(currentClass);
  if (tingkat === null) return null;
  if (tingkat === 0) return 'Kelas 1';
  if (tingkat >= 1 && tingkat < 6) return `Kelas ${tingkat + 1}`;
  if (tingkat === 6) return '🎓 Lulus Diniyah';
  return null;
}

// Helper function to get next tingkat level
function getNextTingkatAndSP(currentClassNama?: string | null): { tingkat: number | null; isSp: boolean } {
  if (!currentClassNama) return { tingkat: null, isSp: false };
  const tingkat = extractTingkat(currentClassNama);
  if (tingkat === null) return { tingkat: null, isSp: false };

  if (tingkat === 0) return { tingkat: 1, isSp: false };
  if (tingkat >= 1 && tingkat < 6) return { tingkat: tingkat + 1, isSp: false };
  return { tingkat: null, isSp: false };
}

export interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { excludedIds: (number | string)[]; customTargetClasses: Record<string | number, number | null> }) => void;
  santriList?: any[];
  targetYear?: string;
  sourceYear?: { id?: number | string; kode?: string } | null;
  isSubmitting?: boolean;
  targetClasses?: any[];
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
}: MigrationModalProps) {
  const [excludedIds, setExcludedIds] = useState<(number | string)[]>([]);
  const [customTargetClasses, setCustomTargetClasses] = useState<Record<string | number, number | null>>({});
  const [activeClassTab, setActiveClassTab] = useState<string>('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const classTabs = useMemo(() => {
    const classNames = Array.from(
      new Set(santriList.map(s => s.nama_diniyah).filter(Boolean))
    ).sort();
    return ['Semua Kelas', ...classNames];
  }, [santriList]);

  const targetDiniyahClasses = useMemo(() => {
    return targetClasses.filter(k => k.jenis === 'Diniyah');
  }, [targetClasses]);

  const getAvailableTargetOptions = (currentClassNama?: string | null) => {
    if (!currentClassNama) return [];
    const { tingkat } = getNextTingkatAndSP(currentClassNama);
    if (tingkat === null) return [];

    return targetDiniyahClasses.filter(k => k.tingkat === tingkat);
  };

  useEffect(() => {
    if (isOpen && santriList.length > 0) {
      const initialMap: Record<string | number, number | null> = {};

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

  const toggleExclude = (id: number | string) => {
    setExcludedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAllTab = (checked: boolean) => {
    const currentTabIds = filteredSantri.map(s => s.id);
    if (checked) {
      setExcludedIds(prev => prev.filter(id => !currentTabIds.includes(id)));
    } else {
      setExcludedIds(prev => Array.from(new Set([...prev, ...currentTabIds])));
    }
  };

  const handleCustomClassChange = (santriId: number | string, classId: string) => {
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
      subtitle={`Proses kenaikan kelas Diniyah secara massal dari ${sourceYear?.kode || '-'} ke ${targetYear || '-'}`}
      icon={<RefreshCw />}
      width={1060}
      footer={
        <div className="migration-modal-footer">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            type="button"
            className="action-pill-btn primary-pill"
            onClick={handleConfirm}
            disabled={isSubmitting || migratingCount === 0}
            title="Eksekusi kenaikan kelas Diniyah santri terpilih"
          >
            {isSubmitting ? (
              <>
                <span className="spinner-orbit" />
                <span>Memproses Migrasi...</span>
              </>
            ) : (
              <>
                <RefreshCw size={15} />
                <span>Proses Migrasi Massal ({migratingCount} Santri)</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="migration-modal-liquid-container">
        {/* Smart Notice */}
        <div className="migration-notice-banner">
          <div className="notice-icon-orb">
            <Sparkles size={16} />
          </div>
          <div className="notice-text">
            <strong>Kenaikan Kelas Semester Baru:</strong> Hanya santri aktif yang akan dipromosikan ke jenjang berikutnya. Santri kelas 6 otomatis diarahkan menjadi Alumni Diniyah.
          </div>
        </div>

        {/* 4 KPI Glass Stat Capsules */}
        <div className="migration-stats-capsules-grid">
          <div className="stat-capsule accent-sapphire">
            <div className="capsule-icon-wrap">
              <Users size={16} />
            </div>
            <div className="capsule-data">
              <span className="c-label">Total Santri</span>
              <span className="c-val">{santriList.length}</span>
            </div>
          </div>

          <div className="stat-capsule accent-emerald">
            <div className="capsule-icon-wrap">
              <CheckCircle2 size={16} />
            </div>
            <div className="capsule-data">
              <span className="c-label">Akan Naik Kelas</span>
              <span className="c-val">{migratingCount}</span>
            </div>
          </div>

          <div className="stat-capsule accent-rose">
            <div className="capsule-icon-wrap">
              <XCircle size={16} />
            </div>
            <div className="capsule-data">
              <span className="c-label">Tinggal Kelas</span>
              <span className="c-val">{notPromotedCount}</span>
            </div>
          </div>

          <div className="stat-capsule accent-amber">
            <div className="capsule-icon-wrap">
              <GraduationCap size={16} />
            </div>
            <div className="capsule-data">
              <span className="c-label">Lulus Diniyah</span>
              <span className="c-val">{alumniCount}</span>
            </div>
          </div>
        </div>

        {/* Controls: Segmented Class Tabs & Search */}
        <div className="migration-controls-glass">
          <div className="class-tabs-scroller">
            <div className="class-tabs-dock">
              {classTabs.map((tab) => {
                const isActive = activeClassTab === tab;
                const count = tab === 'Semua Kelas'
                  ? santriList.length
                  : santriList.filter(s => s.nama_diniyah === tab).length;

                return (
                  <button
                    key={tab}
                    type="button"
                    className={`class-dock-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveClassTab(tab)}
                  >
                    <span>{tab}</span>
                    <span className="count-chip">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="migration-search-pill">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Cari nama atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bare-input"
            />
          </div>
        </div>

        {/* Migration Glass Table */}
        <div className="migration-glass-table-wrap">
          <table className="migration-liquid-table">
            <thead>
              <tr>
                <th style={{ width: '42px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={isAllTabSelected}
                    onChange={(e) => toggleSelectAllTab(e.target.checked)}
                  />
                </th>
                <th style={{ width: '130px' }}>NIS</th>
                <th>Nama Santri</th>
                <th style={{ width: '110px' }}>Kelas Asal</th>
                <th style={{ width: '150px' }}>Perkiraan Progres</th>
                <th style={{ width: '180px' }}>Kelas Diniyah Baru</th>
                <th style={{ width: '90px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSantri.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-row">
                    Tidak ditemukan data santri pada kelas atau kata kunci ini.
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
                    <tr key={record.id} className={isExcluded ? 'row-not-promoted' : 'row-promoted'}>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          className="custom-checkbox"
                          checked={!isExcluded}
                          onChange={() => toggleExclude(record.id)}
                        />
                      </td>
                      <td className="nis-col">{record.nis}</td>
                      <td className="name-col">
                        <strong>{record.nama}</strong>
                      </td>
                      <td>
                        <span className="origin-class-pill">{currentClass || '-'}</span>
                      </td>
                      <td>
                        {isClass6 ? (
                          <span className="progress-tag alumni">
                            <Award size={12} />
                            <span>Lulus Diniyah</span>
                          </span>
                        ) : nextClassLabel ? (
                          <span className="progress-tag promoted">
                            <ArrowRight size={12} />
                            <span>{nextClassLabel}</span>
                          </span>
                        ) : (
                          <span className="muted-dash">-</span>
                        )}
                      </td>
                      <td>
                        {isExcluded || isClass6 || availableOptions.length === 0 ? (
                          <span className="status-label-note">
                            {isClass6 ? 'Menjadi Alumni Diniyah' : isExcluded ? 'Tinggal Kelas' : '-'}
                          </span>
                        ) : (
                          <div className="select-wrapper-glass">
                            <select
                              className="class-target-select"
                              value={customTargetClasses[record.id] || ''}
                              onChange={(e) => handleCustomClassChange(record.id, e.target.value)}
                            >
                              {availableOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.nama}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`status-chip ${record.status_tahun_ajaran === 'aktif' ? 'active' : 'inactive'}`}>
                          {record.status_tahun_ajaran || 'aktif'}
                        </span>
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
