import React, { useState } from 'react';
import { Search, SlidersHorizontal, RotateCcw, X, Filter } from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';
import { formatStatusTahunAjaran } from '../../utils/formatters';
import './SantriFilters.scss';

export interface SantriFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  diniyahValue?: string;
  onDiniyahChange: (value?: string) => void;
  sekolahValue?: string;
  onSekolahChange: (value?: string) => void;
  genderValue?: string;
  onGenderChange: (value?: string) => void;
  statusValue?: string;
  onStatusChange: (value?: string) => void;
  tahunAjaranValue?: string;
  onTahunAjaranChange: (value: string) => void;
  diniyahOptions?: string[];
  sekolahOptions?: string[];
  tahunAjaranOptions?: { id: string | number; kode: string; is_active?: boolean }[];
}

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
}: SantriFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);

  const isAnyFilterActive = Boolean(
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
    <div className="santri-filters-panel-vision">
      <div className="filters-main-row">
        {/* Search input with glass styling */}
        <div className="search-input-wrapper-glass">
          <Search size={16} className="search-icon" />
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
              className="clear-search-btn-glass"
              onClick={() => onSearchChange('')}
              aria-label="Bersihkan pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Quick action controls with Liquid Glass Dropdowns */}
        <div className="filters-quick-actions">
          <div className="select-container-glass">
            <span className="select-lead-label">Tahun Ajaran:</span>
            <div className="custom-select-holder">
              <CustomSelect
                size="sm"
                value={tahunAjaranValue || ''}
                onChange={(val) => onTahunAjaranChange(String(val))}
                options={tahunAjaranOptions.map((option) => ({
                  value: String(option.id),
                  label: `${option.kode}${option.is_active ? ' (Berjalan)' : ''}`
                }))}
                minWidth={195}
              />
            </div>
          </div>

          <button
            type="button"
            className={`action-pill-btn ${isAdvancedOpen ? 'primary-pill' : 'secondary-pill'} filter-toggle-pill`}
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          >
            <SlidersHorizontal size={14} />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="active-filter-badge">{activeFiltersCount}</span>
            )}
          </button>

          {isAnyFilterActive && (
            <button
              type="button"
              className="action-pill-btn secondary-pill reset-pill-btn"
              onClick={handleResetAll}
              title="Reset seluruh filter pencarian"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Tray */}
      {isAdvancedOpen && (
        <div className="filters-advanced-tray-glass">
          <div className="tray-grid-glass">
            <div className="tray-col">
              <label className="filter-label">Status Akademik</label>
              <CustomSelect
                size="sm"
                placeholder="Semua Status"
                value={statusValue || ''}
                onChange={(val) => onStatusChange(val || undefined)}
                allowClear
                options={[
                  { label: 'Semua Status', value: '' },
                  { label: formatStatusTahunAjaran('aktif'), value: 'aktif' },
                  { label: formatStatusTahunAjaran('tidak_naik'), value: 'tidak_naik' },
                  { label: formatStatusTahunAjaran('lulus'), value: 'lulus' },
                  { label: formatStatusTahunAjaran('alumni'), value: 'alumni' },
                  { label: 'Pindah / Migrasi', value: 'pindah' }
                ]}
              />
            </div>

            <div className="tray-col">
              <label className="filter-label">Jenis Kelamin</label>
              <CustomSelect
                size="sm"
                placeholder="Semua Gender"
                value={genderValue || ''}
                onChange={(val) => onGenderChange(val || undefined)}
                allowClear
                options={[
                  { label: 'Semua Gender', value: '' },
                  { label: 'Putra', value: 'L' },
                  { label: 'Putri', value: 'P' }
                ]}
              />
            </div>

            <div className="tray-col">
              <label className="filter-label">Kelas Diniyah</label>
              <CustomSelect
                size="sm"
                placeholder="Semua Kelas Diniyah"
                value={diniyahValue || ''}
                onChange={(val) => onDiniyahChange(val || undefined)}
                allowClear
                options={[
                  { label: 'Semua Kelas Diniyah', value: '' },
                  ...diniyahOptions.map((opt) => ({ label: opt, value: opt }))
                ]}
              />
            </div>

            <div className="tray-col">
              <label className="filter-label">Kelas Sekolah</label>
              <CustomSelect
                size="sm"
                placeholder="Semua Kelas Sekolah"
                value={sekolahValue || ''}
                onChange={(val) => onSekolahChange(val || undefined)}
                allowClear
                options={[
                  { label: 'Semua Kelas Sekolah', value: '' },
                  ...sekolahOptions.map((opt) => ({ label: opt, value: opt }))
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
