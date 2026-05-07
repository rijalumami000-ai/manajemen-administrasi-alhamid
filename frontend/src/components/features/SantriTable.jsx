import { Table, Tag, Button, Space, Pagination } from 'antd';
import { EditOutlined, DeleteOutlined, FileTextOutlined } from '@ant-design/icons';
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
  onDelete,
  canEdit
}) {
  const columns = [
    {
      title: 'NIS',
      dataIndex: 'nis',
      key: 'nis',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: 'NIK',
      dataIndex: 'nik',
      key: 'nik',
      width: 150,
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
      title: 'Jenis Kelamin',
      dataIndex: 'jenis_kelamin',
      key: 'jenis_kelamin',
      width: 130,
      render: (text) => text || '-'
    },
    {
      title: 'Kelas Diniyah',
      dataIndex: 'nama_diniyah',
      key: 'nama_diniyah',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Kelas Sekolah',
      dataIndex: 'nama_sekolah',
      key: 'nama_sekolah',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status_tahun_ajaran',
      key: 'status_tahun_ajaran',
      width: 120,
      render: (status) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {formatStatusTahunAjaran(status)}
        </Tag>
      )
    },
    {
      title: 'Tempat Lahir',
      dataIndex: 'tempat_lahir',
      key: 'tempat_lahir',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Nama Ayah',
      dataIndex: 'nama_ayah',
      key: 'nama_ayah',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: 'Aksi',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        canEdit ? (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            >
              Edit
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record.id)}
            >
              Hapus
            </Button>
          </Space>
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
        scroll={{ x: 1400 }}
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
