import { Table, Tag, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, StopOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';

export function UsersTable({ users, onEdit, onDeactivate, onActivate, onDelete }) {
  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      guru: 'blue',
      staff: 'green'
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrator',
      guru: 'Guru',
      staff: 'Staff'
    };
    return labels[role] || role;
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Nama Lengkap',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Tag>
      ),
      filters: [
        { text: 'Administrator', value: 'admin' },
        { text: 'Guru', value: 'guru' },
        { text: 'Staff', value: 'staff' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Aktif' : 'Nonaktif'}
        </Tag>
      ),
      filters: [
        { text: 'Aktif', value: true },
        { text: 'Nonaktif', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => onEdit(record)}
            size="small"
          >
            Edit
          </Button>
          
          {record.is_active ? (
            <Popconfirm
              title="Nonaktifkan User"
              description="Apakah Anda yakin ingin menonaktifkan user ini?"
              onConfirm={() => onDeactivate(record.id)}
              okText="Ya"
              cancelText="Batal"
            >
              <Button type="default" danger icon={<StopOutlined />} size="small">
                Nonaktifkan
              </Button>
            </Popconfirm>
          ) : (
            <Button 
              type="primary" 
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              icon={<CheckCircleOutlined />} 
              onClick={() => onActivate(record.id)}
              size="small"
            >
              Aktifkan
            </Button>
          )}

          <Popconfirm
            title="Hapus User Permanen"
            description="Tindakan ini tidak dapat dibatalkan! Yakin hapus?"
            onConfirm={() => onDelete(record.id)}
            okText="Hapus"
            okButtonProps={{ danger: true }}
            cancelText="Batal"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={users} 
      rowKey="id" 
      pagination={{ pageSize: 10 }}
      scroll={{ x: 'max-content' }}
    />
  );
}
