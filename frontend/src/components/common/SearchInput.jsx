import React from 'react';
import { Search } from 'lucide-react';
import './SearchInput.scss';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari...',
  onSearch,
  className = ''
}) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className={`custom-search-input ${className}`}>
      <Search size={18} className="search-icon" />
      <input
        type="text"
        className="search-field"
        value={value || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
    </div>
  );
}
