import { Table, Tag, Tooltip, Pagination } from 'antd';
import { Edit, Trash2, Award } from 'lucide-react';
import { EmptyState } from '../common';
import './GuruTable.scss';

const statusColorMap = {
  'Aktif': 'success',
  'Cuti': 'warning',
  'Pensiun': 'default'
};

// Unique color helper for avatars based on name
const getAvatarStyle = (name) => {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green/Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#0EA5E9', // Sky
    '#14B8A6', // Teal
    '#F43F5E'  // Rose
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = colors[Math.abs(hash) % colors.length];
  return {
    backgroundColor: color,
    color: '#ffffff',
    fontWeight: '600',
  };
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export function GuruTable({ data, total, currentPage, pageSize, onPageChange, onEdit, onDelete, onUploadTtd }) {
  const columns = [
    {
      title: 'NIP',
      dataIndex: 'nip',
      key: 'nip',
      width: 140,
      render: (text) => <span className="guru-nip-text">{text || '-'}</span>
    },
    {
      title: 'Nama Guru',
      dataIndex: 'nama',
      key: 'nama',
      width: 250,
      render: (text) => {
        const initials = getInitials(text);
        const avatarStyle = getAvatarStyle(text || '');
        return (
          <div className="guru-profile-cell">
            <div className="avatar-circle-sm" style={avatarStyle}>
              {initials}
            </div>
            <span className="guru-name">{text || '-'}</span>
          </div>
        );
      }
    },
    {
      title: 'Mata Pelajaran',
      dataIndex: 'mata_pelajaran',
      key: 'mata_pelajaran',
      width: 180,
      render: (text) => text ? <Tag className="guru-tag">{text}</Tag> : '-'
    },
    {
      title: 'Jabatan',
      dataIndex: 'jabatan',
      key: 'jabatan',
      width: 160,
      render: (text) => text ? <Tag className="guru-tag ant-tag-purple">{text}</Tag> : '-'
    },
    {
      title: 'No. HP',
      dataIndex: 'no_hp',
      key: 'no_hp',
      width: 140,
      render: (text) => <span className="guru-phone-text">{text || '-'}</span>
    },
    {
      title: 'Alamat',
      dataIndex: 'alamat',
      key: 'alamat',
      width: 220,
      ellipsis: true,
      render: (text) => <span className="guru-address-text" title={text || ''}>{text || '-'}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status) => (
        <span className={`status-pill ${statusColorMap[status] || 'default'}`}>
          {status || '-'}
        </span>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      fixed: 'right',
      width: 160,
      align: 'center',
      render: (_, record) => (
        <div className="guru-action-cell">
          <Tooltip title="Ubah data guru">
            <button
              type="button"
              className="action-icon-btn edit-btn"
              onClick={() => onEdit(record)}
            >
              <Edit size={14} />
            </button>
          </Tooltip>
          <Tooltip title="Upload Tandatangan Digital">
            <button
              type="button"
              className="action-icon-btn ttd-btn"
              onClick={() => onUploadTtd(record)}
            >
              <Award size={14} />
            </button>
          </Tooltip>
          <Tooltip title="Hapus data guru">
            <button
              type="button"
              className="action-icon-btn delete-btn"
              onClick={() => onDelete(record.id)}
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="guru-table-container">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        scroll={{ x: 1200 }}
        className="modern-data-grid"
        locale={{
          emptyText: (
            <EmptyState
              description="Tidak ada data guru yang sesuai"
            />
          )
        }}
      />
      {total > 0 && (
        <div className="table-pagination-row">
          <span className="pagination-summary">
            Menampilkan data guru ke-<b>{Math.min((currentPage - 1) * pageSize + 1, total)}</b> hingga <b>{Math.min(currentPage * pageSize, total)}</b> dari total <b>{total}</b> guru
          </span>
          <Pagination
            current={currentPage}
            total={total}
            pageSize={pageSize}
            onChange={onPageChange}
            showSizeChanger={false}
            className="modern-pagination"
          />
        </div>
      )}
    </div>
  );
}
