import { CustomSelect } from '../ui/CustomSelect';
import { Search } from 'lucide-react';
import './GuruFilters.scss';

export function GuruFilters({
  searchValue,
  onSearchChange,
  jabatanValue,
  onJabatanChange,
  mapelValue,
  onMapelChange,
  statusValue,
  onStatusChange,
  jabatanOptions = [],
  mapelOptions = [],
  statusOptions = []
}) {
  const formattedJabatanOptions = jabatanOptions.map(opt => ({ value: opt, label: opt }));
  const formattedMapelOptions = mapelOptions.map(opt => ({ value: opt, label: opt }));
  const formattedStatusOptions = statusOptions.map(opt => ({ value: opt, label: opt }));

  return (
    <div className="guru-filters-panel">
      <div className="filters-main-row">
        {/* Search Box */}
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari berdasarkan NIP, Nama, HP, atau Alamat..."
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

        {/* Dropdowns */}
        <div className="filters-quick-actions">
          <div className="select-container" style={{ width: '160px', marginBottom: 0 }}>
            <CustomSelect
              label="Jabatan"
              value={jabatanValue}
              onChange={onJabatanChange}
              placeholder="Semua"
              options={formattedJabatanOptions}
              allowClear
            />
          </div>

          <div className="select-container" style={{ width: '160px', marginBottom: 0 }}>
            <CustomSelect
              label="Mapel"
              value={mapelValue}
              onChange={onMapelChange}
              placeholder="Semua"
              options={formattedMapelOptions}
              allowClear
            />
          </div>

          <div className="select-container" style={{ width: '140px', marginBottom: 0 }}>
            <CustomSelect
              label="Status"
              value={statusValue}
              onChange={onStatusChange}
              placeholder="Semua"
              options={formattedStatusOptions}
              allowClear
            />
          </div>
        </div>
      </div>
    </div>
  );
}
