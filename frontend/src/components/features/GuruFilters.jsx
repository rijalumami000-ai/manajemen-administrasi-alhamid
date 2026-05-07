import { Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './GuruFilters.scss';

const { Option } = Select;

export function GuruFilters({
  searchValue,
  onSearchChange,
  jabatanValue,
  onJabatanChange,
  mapelValue,
  onMapelChange,
  statusValue,
  onStatusChange,
  jabatanOptions = [],
  mapelOptions = [],
  statusOptions = []
}) {
  return (
    <div className="guru-filters">
      <Space wrap size="middle" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Cari NIP, nama, no HP, atau alamat..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          style={{ minWidth: 300 }}
        />

        <Select
          value={jabatanValue || undefined}
          onChange={onJabatanChange}
          placeholder="Semua Jabatan"
          allowClear
          style={{ minWidth: 150 }}
        >
          {jabatanOptions.map((option, index) => (
            <Option key={index} value={option}>
              {option}
            </Option>
          ))}
        </Select>

        <Select
          value={mapelValue || undefined}
          onChange={onMapelChange}
          placeholder="Semua Mapel"
          allowClear
          style={{ minWidth: 150 }}
        >
          {mapelOptions.map((option, index) => (
            <Option key={index} value={option}>
              {option}
            </Option>
          ))}
        </Select>

        <Select
          value={statusValue || undefined}
          onChange={onStatusChange}
          placeholder="Semua Status"
          allowClear
          style={{ minWidth: 120 }}
        >
          {statusOptions.map((option, index) => (
            <Option key={index} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      </Space>
    </div>
  );
}
