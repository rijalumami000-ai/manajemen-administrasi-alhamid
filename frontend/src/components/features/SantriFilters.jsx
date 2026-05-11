import { Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { formatStatusTahunAjaran } from '../../utils/formatters';
import './SantriFilters.scss';

const { Option } = Select;

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
}) {
  return (
    <div className="santri-filters">
      <Space wrap size="small" style={{ width: '100%' }}>
        <Select
          value={statusValue || undefined}
          onChange={onStatusChange}
          style={{ minWidth: 120 }}
          placeholder="Status"
          allowClear
        >
          <Option value="aktif">{formatStatusTahunAjaran('aktif')}</Option>
          <Option value="draft">{formatStatusTahunAjaran('draft')}</Option>
          <Option value="tidak_naik">{formatStatusTahunAjaran('tidak_naik')}</Option>
          <Option value="lulus">{formatStatusTahunAjaran('lulus')}</Option>
          <Option value="alumni">{formatStatusTahunAjaran('alumni')}</Option>
          <Option value="pindah">{formatStatusTahunAjaran('pindah')}</Option>
          <Option value="keluar">{formatStatusTahunAjaran('keluar')}</Option>
        </Select>

        <Select
          value={tahunAjaranValue}
          onChange={onTahunAjaranChange}
          style={{ minWidth: 150 }}
          placeholder="Tahun Ajaran"
        >
          {tahunAjaranOptions.map(option => (
            <Option key={option.id} value={option.id}>
              {option.kode}{option.is_active ? ' - Aktif' : ''}
            </Option>
          ))}
        </Select>

        <Input
          prefix={<SearchOutlined />}
          placeholder="Cari NIS, NIK, nama..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          style={{ minWidth: 220 }}
        />

        <Select
          value={diniyahValue || undefined}
          onChange={onDiniyahChange}
          style={{ minWidth: 140 }}
          placeholder="Kelas Diniyah"
          allowClear
        >
          {diniyahOptions.map((option, index) => (
            <Option key={index} value={option}>
              {option}
            </Option>
          ))}
        </Select>

        <Select
          value={sekolahValue || undefined}
          onChange={onSekolahChange}
          style={{ minWidth: 140 }}
          placeholder="Kelas Sekolah"
          allowClear
        >
          {sekolahOptions.map((option, index) => (
            <Option key={index} value={option}>
              {option}
            </Option>
          ))}
        </Select>

        <Select
          value={genderValue || undefined}
          onChange={onGenderChange}
          style={{ minWidth: 120 }}
          placeholder="Jenis Kelamin"
          allowClear
        >
          <Option value="Laki-laki">Laki-laki</Option>
          <Option value="Perempuan">Perempuan</Option>
        </Select>
      </Space>
    </div>
  );
}
