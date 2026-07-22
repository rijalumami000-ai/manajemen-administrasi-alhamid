import { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { formatStatusTahunAjaran } from '../../utils/formatters';
import './SantriFilters.scss';

export function SantriFilters({
  searchValue,
  onSearchChange,
  diniyahValue,
  onDiniyahChange,
  sekolahValue,
  onSekolahChange,
  genderValue,
  onGenderChange,
  statusValue,
  onStatusChange,
  tahunAjaranValue,
  onTahunAjaranChange,
  diniyahOptions = [],
  sekolahOptions = [],
  tahunAjaranOptions = []
}) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const isAnyFilterActive = !!(
    searchValue ||
    diniyahValue ||
    sekolahValue ||
    genderValue ||
    statusValue
  );

  const handleResetAll = () => {
    onSearchChange('');
    onDiniyahChange(undefined);
    onSekolahChange(undefined);
    onGenderChange(undefined);
    onStatusChange(undefined);
  };

  const activeFiltersCount = [
    diniyahValue,
    sekolahValue,
    genderValue,
    statusValue
  ].filter(Boolean).length;

  return (
    <div className="santri-filters-panel">
      <div className="filters-main-row">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari berdasarkan Nama, NIS, NIK, Wali Santri..."
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="modern-search-input"
          />
          {searchValue && (
            <button 
              type="button" 
              className="clear-search-btn"
              onClick={() => onSearchChange('')}
            >
              ×
            </button>
          )}
        </div>

        <div className="filters-quick-actions">
          <div className="select-container">
            <span className="select-label">Tahun Ajaran</span>
            <select
              value={tahunAjaranValue || ''}
              onChange={(e) => onTahunAjaranChange(e.target.value)}
              className="custom-native-select year-select"
              style={{ width: 180 }}
            >
              {tahunAjaranOptions.map(option => (
                <option key={option.id} value={String(option.id)}>
                  {option.kode}{option.is_active ? ' (Berjalan)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={`btn-custom ${isAdvancedOpen ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <SlidersHorizontal size={15} />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                borderRadius: '999px',
                padding: '1px 6px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>

          {isAnyFilterActive && (
            <button
              type="button"
              className="btn-custom btn-secondary"
              onClick={handleResetAll}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {isAdvancedOpen && (
        <div className="filters-advanced-tray animate-slide-down">
          <div className="tray-grid">
            <div className="tray-col">
              <label className="filter-label">Status Akademik</label>
              <select
                value={statusValue || ''}
                onChange={(e) => onStatusChange(e.target.value || undefined)}
                className="custom-native-select"
              >
                <option value="">Semua Status</option>
                <option value="aktif">{formatStatusTahunAjaran('aktif')}</option>
                <option value="pindah">Pindah / Migrasi</option>
              </select>
            </div>

            <div className="tray-col">
              <label className="filter-label">Jenis Kelamin</label>
              <select
                value={genderValue || ''}
                onChange={(e) => onGenderChange(e.target.value || undefined)}
                className="custom-native-select"
              >
                <option value="">Semua Gender</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="tray-col">
              <label className="filter-label">Kelas Diniyah</label>
              <select
                value={diniyahValue || ''}
                onChange={(e) => onDiniyahChange(e.target.value || undefined)}
                className="custom-native-select"
              >
                <option value="">Semua Kelas Diniyah</option>
                {diniyahOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="tray-col">
              <label className="filter-label">Kelas Sekolah</label>
              <select
                value={sekolahValue || ''}
                onChange={(e) => onSekolahChange(e.target.value || undefined)}
                className="custom-native-select"
              >
                <option value="">Semua Kelas Sekolah</option>
                {sekolahOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
