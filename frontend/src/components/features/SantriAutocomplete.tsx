import React, { useState, useEffect, useRef } from 'react';
import { User, Search } from 'lucide-react';
import { pelanggaranService } from '../../services/pelanggaranService';
import './SantriAutocomplete.scss';

export interface SantriAutocompleteProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  error?: string;
  santriList?: any[];
  placeholder?: string;
  disabled?: boolean;
}

export function SantriAutocomplete({ 
  value, 
  onChange, 
  error, 
  santriList: externalSantriList,
  placeholder = 'Ketik nama atau NIS santri...',
  disabled = false
}: SantriAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [santriList, setSantriList] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalSantriList) {
      setSantriList(externalSantriList);
    } else {
      loadSantriList();
    }
  }, [externalSantriList]);

  useEffect(() => {
    if (value && santriList.length > 0) {
      const santri = santriList.find(s => Number(s.id) === Number(value));
      if (santri) {
        setSearchTerm(`${santri.nis} - ${santri.nama}`);
      }
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, santriList]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSantriList = async (): Promise<void> => {
    try {
      const data = await pelanggaranService.searchSantri();
      const sorted = [...(data || [])].sort((a, b) => {
        const nameA = (a.nama || '').toLowerCase();
        const nameB = (b.nama || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setSantriList(sorted);
    } catch (err) {
      console.error('Gagal memuat data santri:', err);
    }
  };

  const filteredSantri = santriList.filter(santri => {
    if (!searchTerm.trim()) return true;
    const lowerTerm = searchTerm.toLowerCase();
    const nis = (santri.nis || '').toLowerCase();
    const nama = (santri.nama || '').toLowerCase();
    return nis.includes(lowerTerm) || nama.includes(lowerTerm);
  }).slice(0, 8);

  const handleSelect = (santri: any) => {
    setSearchTerm(`${santri.nis} - ${santri.nama}`);
    onChange(santri.id);
    setIsOpen(false);
  };

  return (
    <div className="ui-santri-autocomplete" ref={containerRef}>
      <div className={`ui-santri-autocomplete__trigger ${isFocused ? 'is-focused' : ''} ${error ? 'has-error' : ''}`}>
        <div className="ui-santri-autocomplete__icon">
          <Search size={16} />
        </div>
        <input
          type="text"
          className="ui-santri-autocomplete__input"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange('');
          }}
          onFocus={() => {
            setIsOpen(true);
            setIsFocused(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>

      {isOpen && filteredSantri.length > 0 && (
        <div className="ui-santri-autocomplete__dropdown">
          {filteredSantri.map((santri) => (
            <div
              key={santri.id}
              className="ui-santri-autocomplete__item"
              onClick={() => handleSelect(santri)}
            >
              <User size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
              <span>
                <strong className="item-nis">{santri.nis}</strong> - {santri.nama}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && <div className="ui-santri-autocomplete__error">{error}</div>}
    </div>
  );
}

export default SantriAutocomplete;
