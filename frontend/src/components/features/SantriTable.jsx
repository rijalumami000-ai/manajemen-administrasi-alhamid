import { Table, Tag, Button, Space, Pagination, Checkbox, Tooltip } from 'antd';
import { EditOutlined, FileTextOutlined } from '@ant-design/icons';
import { EmptyState } from '../common';
import { formatStatusTahunAjaran } from '../../utils/formatters';

const statusColorMap = {
  aktif: 'success',
  draft: 'default',
  tidak_naik: 'warning',
  lulus: 'blue',
  alumni: 'purple',
  pindah: 'orange',
  keluar: 'red'
};

export function SantriTable({
  data,
  total,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  canEdit,
  onUpdateSemesterStatus
}) {
  const columns = [
    {
      title: 'Ganjil',
      dataIndex: 'aktif_ganjil',
      key: 'aktif_ganjil',
      width: 70,
      render: (checked, record) => (
        <Checkbox
          checked={checked}
          onChange={(e) => onUpdateSemesterStatus(record.id, { aktif_ganjil: e.target.checked })}
          disabled={!canEdit}
        />
      )
    },
    {
      title: 'Genap',
      dataIndex: 'aktif_genap',
      key: 'aktif_genap',
      width: 70,
      render: (checked, record) => (
        <Checkbox
          checked={checked}
          onChange={(e) => onUpdateSemesterStatus(record.id, { aktif_genap: e.target.checked })}
          disabled={!canEdit}
        />
      )
    },
    {
      title: 'NIS',
      dataIndex: 'nis',
      key: 'nis',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: 'Nama',
      dataIndex: 'nama',
      key: 'nama',
      width: 200,
      render: (text) => text || '-'
    },
    {
      title: 'JK',
      dataIndex: 'jenis_kelamin',
      key: 'jenis_kelamin',
      width: 50,
      render: (text) => text === 'Laki-laki' ? 'L' : text === 'Perempuan' ? 'P' : '-'
    },
    {
      title: 'Kelas Diniyah',
      dataIndex: 'nama_diniyah',
      key: 'nama_diniyah',
      width: 110,
      render: (text) => text || '-'
    },
    {
      title: 'Kelas Sekolah',
      dataIndex: 'nama_sekolah',
      key: 'nama_sekolah',
      width: 110,
      render: (text) => text || '-'
    },
    {
      title: 'Kamar',
      dataIndex: 'nama_kamar',
      key: 'nama_kamar',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status_tahun_ajaran',
      key: 'status_tahun_ajaran',
      width: 100,
      render: (status) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {formatStatusTahunAjaran(status)}
        </Tag>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      fixed: 'right',
      width: 70,
      render: (_, record) => (
        canEdit ? (
          <Tooltip title="Ubah Kelas/Kamar/Status">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
        ) : (
          <Tag icon={<FileTextOutlined />} color="default">Arsip</Tag>
        )
      )
    }
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        scroll={{ x: 1100, y: 500 }}
        locale={{
          emptyText: (
            <EmptyState
              description="Tidak ada data santri yang sesuai"
            />
          )
        }}
      />
      {total > 0 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={onPageChange}
            showSizeChanger={false}
            showTotal={(total) => `Total ${total} santri`}
          />
        </div>
      )}
    </>
  );
}
