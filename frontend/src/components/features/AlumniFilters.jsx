import { Input, Select, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import './AlumniFilters.scss';

const { Option } = Select;

export function AlumniFilters({
  searchValue,
  onSearchChange,
  yearValue,
  onYearChange,
  yearOptions,
  onReset
}) {
  return (
    <div className="alumni-filters">
      <Space wrap size="middle" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Cari nama atau NIS alumni..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          allowClear
          style={{ minWidth: 300 }}
        />

        <Select
          value={yearValue || undefined}
          onChange={onYearChange}
          placeholder="Semua Tahun"
          allowClear
          style={{ minWidth: 150 }}
        >
          {yearOptions.map(year => (
            <Option key={year} value={year}>{year}</Option>
          ))}
        </Select>

        <Button
          icon={<ReloadOutlined />}
          onClick={onReset}
        >
          Reset
        </Button>
      </Space>
    </div>
  );
}
