import React, { ChangeEvent, KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import './SearchInput.scss';

export interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value?: string) => void;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari...',
  onSearch,
  className = ''
}: SearchInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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

export default SearchInput;
