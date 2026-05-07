import { Table, Tag, Button, Space, Pagination } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { EmptyState } from '../common';

const statusColorMap = {
  'Aktif': 'success',
  'Cuti': 'warning',
  'Pensiun': 'default'
};

export function GuruTable({ data, total, currentPage, pageSize, onPageChange, onEdit, onDelete }) {
  const columns = [
    {
      title: 'NIP',
      dataIndex: 'nip',
      key: 'nip',
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
      title: 'Mata Pelajaran',
      dataIndex: 'mata_pelajaran',
      key: 'mata_pelajaran',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: 'Jabatan',
      dataIndex: 'jabatan',
      key: 'jabatan',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'No. HP',
      dataIndex: 'no_hp',
      key: 'no_hp',
      width: 150,
      render: (text) => text || '-'
    },
    {
      title: 'Alamat',
      dataIndex: 'alamat',
      key: 'alamat',
      width: 200,
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {status || '-'}
        </Tag>
      )
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
            onClick={() => onDelete(record.id)}
          >
            Hapus
          </Button>
        </Space>
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
        scroll={{ x: 1200 }}
        locale={{
          emptyText: (
            <EmptyState
              description="Tidak ada data guru yang sesuai"
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
            showTotal={(total) => `Total ${total} guru`}
          />
        </div>
      )}
    </>
  );
}
