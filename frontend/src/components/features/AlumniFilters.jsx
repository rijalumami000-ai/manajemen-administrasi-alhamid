import React from 'react';
import { SearchInput } from '../common/SearchInput';
import { CustomSelect } from '../ui/CustomSelect';
import { RotateCcw } from 'lucide-react';
import './AlumniFilters.scss';

export function AlumniFilters({
  searchValue,
  onSearchChange,
  yearValue,
  onYearChange,
  yearOptions = [],
  onReset
}) {
  const selectOptions = [
    { label: 'Semua Tahun Lulus', value: '' },
    ...yearOptions.map(year => ({ label: `Tahun ${year}`, value: String(year) }))
  ];

  return (
    <div className="alumni-filters" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '260px' }}>
        <SearchInput
          placeholder="Cari nama atau NIS alumni..."
          value={searchValue}
          onChange={onSearchChange}
        />
      </div>

      <div style={{ width: '180px' }}>
        <CustomSelect
          value={yearValue ? String(yearValue) : ''}
          onChange={onYearChange}
          options={selectOptions}
          placeholder="Tahun Lulus"
        />
      </div>

      <button
        type="button"
        className="btn-custom btn-secondary"
        onClick={onReset}
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <RotateCcw size={16} /> Reset
      </button>
    </div>
  );
}
