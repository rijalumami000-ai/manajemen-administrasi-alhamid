import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import './SearchInput.scss';

const { Search } = Input;

/**
 * SearchInput Component with debounce
 *
 * @param {string} placeholder - Input placeholder
 * @param {function} onSearch - Search callback (debounced)
 * @param {number} debounceMs - Debounce delay in milliseconds
 * @param {boolean} allowClear - Show clear button
 * @param {string} size - Input size: 'large', 'middle', 'small'
 */
export function SearchInput({
  placeholder = 'Cari...',
  onSearch,
  debounceMs = 500,
  allowClear = true,
  size = 'middle',
  ...props
}) {
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, debounceMs, onSearch]);

  const handleChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <Search
      placeholder={placeholder}
      value={searchValue}
      onChange={handleChange}
      onSearch={handleSearch}
      allowClear={allowClear}
      size={size}
      prefix={<SearchOutlined />}
      className="search-input"
      {...props}
    />
  );
}
