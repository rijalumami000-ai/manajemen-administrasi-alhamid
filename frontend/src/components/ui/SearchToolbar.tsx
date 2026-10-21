import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';
import './SearchToolbar.scss';

export interface SearchToolbarFilter {
  placeholder: string;
  value: string | number | null | undefined;
  onChange: (value: any) => void;
  options: SelectOption[];
}

export interface SearchToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: SearchToolbarFilter[];
  onReset?: () => void;
  totalItems?: number;
}

export function SearchToolbar({
  searchValue,
  onSearchChange,
  filters = [],
  onReset,
  totalItems = 0
}: SearchToolbarProps) {
  return (
    <div className="ui-search-toolbar-liquid">
      <div className="ui-search-toolbar__main">
        {/* Search Input */}
        <div className="ui-search-toolbar__search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Cari santri, NIS, dll..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-liquid-input"
          />
        </div>

        {/* Liquid Glass Filters */}
        <div className="ui-search-toolbar__filters">
          {filters.map((filter, i) => (
            <div key={i} className="filter-dropdown-glass">
              <CustomSelect
                size="sm"
                placeholder={filter.placeholder}
                value={filter.value}
                onChange={filter.onChange}
                options={filter.options}
                allowClear
                minWidth={165}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="ui-search-toolbar__actions">
        {onReset && (
          <button
            type="button"
            className="btn-reset-glass"
            onClick={onReset}
            title="Reset Filter"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        )}
        <div className="total-badge-glass">{totalItems} Data</div>
      </div>
    </div>
  );
}
