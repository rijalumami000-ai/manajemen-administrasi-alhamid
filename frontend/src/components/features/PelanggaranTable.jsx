import { Table, Button, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import { EmptyState } from '../common';
import { formatDate } from '../../utils/formatters';

export function PelanggaranTable({ data, onEdit, onDelete }) {
  const columns = [
    {
      title: 'NIS',
      dataIndex: 'nis',
      key: 'nis',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: 'Nama Santri',
      dataIndex: 'nama_santri',
      key: 'nama_santri',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: 'Jenis Pelanggaran',
      dataIndex: 'jenis',
      key: 'jenis',
      width: 180,
      render: (text) => (
        <Tag color="red" icon={<WarningOutlined />}>
          {text || '-'}
        </Tag>
      )
    },
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal',
      width: 120,
      render: (text) => text ? formatDate(text) : '-'
    },
    {
      title: 'Deskripsi',
      dataIndex: 'deskripsi',
      key: 'deskripsi',
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: 'Sanksi',
      dataIndex: 'sanksi',
      key: 'sanksi',
      width: 150,
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: 'Aksi',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
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
            onClick={() => onDelete(record.id, record.nama_santri)}
          >
            Hapus
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} pelanggaran`
      }}
      scroll={{ x: 1200 }}
      locale={{
        emptyText: <EmptyState description="Belum ada data pelanggaran" />
      }}
    />
  );
}
