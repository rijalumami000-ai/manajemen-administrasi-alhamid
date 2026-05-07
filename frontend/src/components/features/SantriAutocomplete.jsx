import { useState, useEffect } from 'react';
import { AutoComplete } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { pelanggaranService } from '../../services/pelanggaranService';

export function SantriAutocomplete({ value, onChange, error, santriList: externalSantriList }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [santriList, setSantriList] = useState([]);
  const [options, setOptions] = useState([]);

  // Load santri list on mount (only if not provided externally)
  useEffect(() => {
    if (externalSantriList) {
      setSantriList(externalSantriList);
    } else {
      loadSantriList();
    }
  }, [externalSantriList]);

  // Set initial value if provided
  useEffect(() => {
    if (value && santriList.length > 0) {
      const santri = santriList.find(s => s.id === Number(value));
      if (santri) {
        setSearchTerm(`${santri.nis} - ${santri.nama}`);
      }
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, santriList]);

  const loadSantriList = async () => {
    try {
      const data = await pelanggaranService.searchSantri();
      const sorted = [...data].sort((a, b) => {
        const nameA = (a.nama || '').toLowerCase();
        const nameB = (b.nama || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setSantriList(sorted);
    } catch (err) {
      console.error('Gagal memuat data santri:', err);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setOptions([]);
      onChange('');
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = santriList.filter(santri => {
      const nis = (santri.nis || '').toLowerCase();
      const nama = (santri.nama || '').toLowerCase();
      return nis.includes(lowerTerm) || nama.includes(lowerTerm);
    });

    const mappedOptions = filtered.slice(0, 10).map(santri => ({
      value: santri.id.toString(),
      label: (
        <div>
          <UserOutlined /> <strong>{santri.nis}</strong> - {santri.nama}
        </div>
      ),
      searchText: `${santri.nis} - ${santri.nama}`
    }));

    setOptions(mappedOptions);
  };

  const handleSelect = (selectedValue, option) => {
    setSearchTerm(option.searchText);
    onChange(selectedValue);
  };

  return (
    <AutoComplete
      value={searchTerm}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      placeholder="Cari berdasarkan NIS atau nama..."
      style={{ width: '100%' }}
      status={error ? 'error' : ''}
      allowClear
      notFoundContent="Tidak ada santri ditemukan"
    />
  );
}
