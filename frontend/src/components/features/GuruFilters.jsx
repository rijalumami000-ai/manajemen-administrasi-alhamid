import { Select } from 'antd';
import { Search } from 'lucide-react';
import './GuruFilters.scss';

const { Option } = Select;

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
          <div className="select-container">
            <Select
              value={jabatanValue || undefined}
              onChange={onJabatanChange}
              placeholder="Semua Jabatan"
              allowClear
              className="modern-select"
              popupClassName="modern-select-dropdown"
              style={{ width: 160 }}
            >
              {jabatanOptions.map((option, index) => (
                <Option key={index} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </div>

          <div className="select-container">
            <Select
              value={mapelValue || undefined}
              onChange={onMapelChange}
              placeholder="Semua Mapel"
              allowClear
              className="modern-select"
              popupClassName="modern-select-dropdown"
              style={{ width: 160 }}
            >
              {mapelOptions.map((option, index) => (
                <Option key={index} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </div>

          <div className="select-container">
            <Select
              value={statusValue || undefined}
              onChange={onStatusChange}
              placeholder="Semua Status"
              allowClear
              className="modern-select"
              popupClassName="modern-select-dropdown"
              style={{ width: 140 }}
            >
              {statusOptions.map((option, index) => (
                <Option key={index} value={option}>
                  {option}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
