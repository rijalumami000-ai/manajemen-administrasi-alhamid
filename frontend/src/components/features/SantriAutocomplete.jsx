import { useState, useEffect } from 'react';
import { User, Search } from 'lucide-react';
import { pelanggaranService } from '../../services/pelanggaranService';

export function SantriAutocomplete({ value, onChange, error, santriList: externalSantriList }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [santriList, setSantriList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

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

  const filteredSantri = santriList.filter(santri => {
    if (!searchTerm.trim()) return true;
    const lowerTerm = searchTerm.toLowerCase();
    const nis = (santri.nis || '').toLowerCase();
    const nama = (santri.nama || '').toLowerCase();
    return nis.includes(lowerTerm) || nama.includes(lowerTerm);
  }).slice(0, 8);

  const handleSelect = (santri) => {
    setSearchTerm(`${santri.nis} - ${santri.nama}`);
    onChange(santri.id);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange('');
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari berdasarkan NIS atau nama santri..."
          style={{
            width: '100%',
            padding: '10px 12px 10px 36px',
            borderRadius: '8px',
            border: error ? '1px solid #ef4444' : '1px solid var(--lt-border-light, #cbd5e1)',
            background: 'var(--lt-bg-surface, #ffffff)',
            fontSize: '13px',
            color: 'var(--lt-text-primary, #0f172a)'
          }}
        />
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
      </div>

      {isOpen && filteredSantri.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          maxHeight: '220px',
          overflowY: 'auto',
          zIndex: 100
        }}>
          {filteredSantri.map((santri) => (
            <div
              key={santri.id}
              onClick={() => handleSelect(santri)}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <User size={14} style={{ color: '#2196f3' }} />
              <strong>{santri.nis}</strong> - {santri.nama}
            </div>
          ))}
        </div>
      )}

      {error && <span style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
}
