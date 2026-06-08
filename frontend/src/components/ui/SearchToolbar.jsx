import { Search, RotateCcw } from 'lucide-react';
import './SearchToolbar.scss';

export function SearchToolbar({ 
  searchValue, 
  onSearchChange, 
  filters = [], 
  onReset,
  totalItems = 0
}) {
  return (
    <div className="ui-search-toolbar">
      <div className="ui-search-toolbar__main">
        {/* Search Input */}
        <div className="ui-search-toolbar__search">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Cari santri, NIS, dll..." 
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="ui-search-toolbar__filters">
          {filters.map((filter, i) => (
            <div key={i} className="filter-dropdown">
              <select 
                value={filter.value || ''} 
                onChange={(e) => filter.onChange(e.target.value)}
              >
                <option value="">{filter.placeholder}</option>
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="ui-search-toolbar__actions">
        <button className="btn-reset" onClick={onReset} title="Reset Filter">
          <RotateCcw size={16} />
        </button>
        <div className="total-badge">
          {totalItems} Data
        </div>
      </div>
    </div>
  );
}
