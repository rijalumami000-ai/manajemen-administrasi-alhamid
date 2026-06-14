import { useState } from 'react';
import { Select, Input, Button, Badge } from 'antd';
import { Search, SlidersHorizontal, RotateCcw, HelpCircle, CheckCircle, UserCheck } from 'lucide-react';
import { formatStatusTahunAjaran } from '../../utils/formatters';
import './SantriFilters.scss';

const { Option } = Select;

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

  // Check if any filter is active (to show reset button/badge)
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
      {/* Search Toolbar Main Row */}
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
          {/* Tahun Ajaran Selector */}
          <div className="select-container">
            <span className="select-label">Tahun Ajaran</span>
            <Select
              value={tahunAjaranValue}
              onChange={onTahunAjaranChange}
              className="modern-select year-select"
              popupClassName="modern-select-dropdown"
              style={{ width: 180 }}
            >
              {tahunAjaranOptions.map(option => (
                <Option key={option.id} value={String(option.id)}>
                  {option.kode}{option.is_active ? ' (Berjalan)' : ''}
                </Option>
              ))}
            </Select>
          </div>

          {/* Toggle Advanced Filters */}
          <Button
            type={isAdvancedOpen ? 'primary' : 'default'}
            icon={<SlidersHorizontal size={15} />}
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`advanced-toggle-btn ${isAdvancedOpen ? 'active' : ''}`}
          >
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <Badge count={activeFiltersCount} className="filter-badge" />
            )}
          </Button>

          {/* Reset Action */}
          {isAnyFilterActive && (
            <Button
              type="text"
              danger
              icon={<RotateCcw size={14} />}
              onClick={handleResetAll}
              className="reset-filters-btn"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Collapsible Tray */}
      {isAdvancedOpen && (
        <div className="filters-advanced-tray animate-slide-down">
          <div className="tray-grid">
            {/* Status Filter */}
            <div className="tray-col">
              <label className="filter-label">Status Akademik</label>
              <Select
                value={statusValue || undefined}
                onChange={onStatusChange}
                placeholder="Semua Status"
                allowClear
                className="modern-select"
                popupClassName="modern-select-dropdown"
              >
                <Option value="aktif">{formatStatusTahunAjaran('aktif')}</Option>
                <Option value="pindah">Pindah / Migrasi</Option>
              </Select>
            </div>

            {/* Gender Filter */}
            <div className="tray-col">
              <label className="filter-label">Jenis Kelamin</label>
              <Select
                value={genderValue || undefined}
                onChange={onGenderChange}
                placeholder="Semua Gender"
                allowClear
                className="modern-select"
                popupClassName="modern-select-dropdown"
              >
                <Option value="Laki-laki">Laki-laki</Option>
                <Option value="Perempuan">Perempuan</Option>
              </Select>
            </div>

            {/* Diniyah Filter */}
            <div className="tray-col">
              <label className="filter-label">Kelas Diniyah</label>
              <Select
                value={diniyahValue || undefined}
                onChange={onDiniyahChange}
                placeholder="Semua Kelas Diniyah"
                allowClear
                className="modern-select"
                popupClassName="modern-select-dropdown"
              >
                {diniyahOptions.map((option, index) => (
                  <Option key={index} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Sekolah Filter */}
            <div className="tray-col">
              <label className="filter-label">Kelas Sekolah</label>
              <Select
                value={sekolahValue || undefined}
                onChange={onSekolahChange}
                placeholder="Semua Kelas Sekolah"
                allowClear
                className="modern-select"
                popupClassName="modern-select-dropdown"
              >
                {sekolahOptions.map((option, index) => (
                  <Option key={index} value={option}>
                    {option}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
