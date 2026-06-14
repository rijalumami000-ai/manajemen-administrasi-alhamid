import { Table, Tag, Button, Checkbox, Tooltip, Popover, Progress } from 'antd';
import { EditOutlined, EyeOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { EmptyState } from '../common';
import { formatStatusTahunAjaran } from '../../utils/formatters';
import './SantriTable.scss';

const statusColorMap = {
  aktif: 'success',
  draft: 'default',
  tidak_naik: 'warning',
  lulus: 'blue',
  alumni: 'purple',
  pindah: 'orange',
  keluar: 'red'
};

// Unique color helper for avatars based on student name
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

const calculateCompleteness = (record) => {
  let score = 0;
  if (record.nama) score += 20;
  if (record.nis) score += 20;
  if (record.nama_diniyah) score += 15;
  if (record.nama_sekolah) score += 15;
  if (record.nama_kamar) score += 15;
  if (record.nama_ayah || record.nama_ibu) score += 15;
  return score;
};

export function SantriTable({
  data,
  onEdit,
  canEdit,
  onUpdateSemesterStatus
}) {
  const columns = [
    {
      title: 'Aktif Ganjil',
      dataIndex: 'aktif_ganjil',
      key: 'aktif_ganjil',
      width: 90,
      align: 'center',
      render: (checked, record) => (
        <Checkbox
          checked={checked}
          onChange={(e) => onUpdateSemesterStatus(record.id, { aktif_ganjil: e.target.checked })}
          disabled={!canEdit}
          className="modern-checkbox"
        />
      )
    },
    {
      title: 'Aktif Genap',
      dataIndex: 'aktif_genap',
      key: 'aktif_genap',
      width: 90,
      align: 'center',
      render: (checked, record) => (
        <Checkbox
          checked={checked}
          onChange={(e) => onUpdateSemesterStatus(record.id, { aktif_genap: e.target.checked })}
          disabled={!canEdit}
          className="modern-checkbox"
        />
      )
    },
    {
      title: 'NIS',
      dataIndex: 'nis',
      key: 'nis',
      width: 110,
      render: (text) => <span className="student-nis-txt">{text || '-'}</span>
    },
    {
      title: 'Nama Santri',
      dataIndex: 'nama',
      key: 'nama',
      width: 250,
      render: (_, record) => {
        const initials = getInitials(record.nama);
        const avatarStyle = getAvatarStyle(record.nama || '');
        const completenessScore = calculateCompleteness(record);
        const isWarning = completenessScore < 100;

        const popoverContent = (
          <div className="student-quick-preview-card">
            <div className="preview-header">
              <div className="avatar-circle-preview" style={avatarStyle}>{initials}</div>
              <div className="preview-title-wrap">
                <span className="preview-name">{record.nama || '-'}</span>
                <span className="preview-nis">NIS: {record.nis || '-'}</span>
              </div>
            </div>
            
            <div className="preview-divider"></div>

            <div className="preview-body">
              <div className="preview-info-row">
                <span className="info-label">Jenis Kelamin</span>
                <span className="info-val">{record.jenis_kelamin || '-'}</span>
              </div>
              <div className="preview-info-row">
                <span className="info-label">Ayah / Ibu</span>
                <span className="info-val">{record.nama_ayah || '-'} / {record.nama_ibu || '-'}</span>
              </div>
              <div className="preview-info-row">
                <span className="info-label">No. HP Wali</span>
                <span className="info-val">{record.no_hp_ayah || record.no_hp_ibu || '-'}</span>
              </div>
              <div className="preview-info-row">
                <span className="info-label">Alamat</span>
                <span className="info-val">{record.alamat || '-'}</span>
              </div>
              
              <div className="preview-divider"></div>

              <div className="preview-info-row">
                <span className="info-label">Kelas Diniyah</span>
                <span className="info-val">{record.nama_diniyah || '-'}</span>
              </div>
              <div className="preview-info-row">
                <span className="info-label">Kelas Sekolah</span>
                <span className="info-val">{record.nama_sekolah || '-'}</span>
              </div>
              <div className="preview-info-row">
                <span className="info-label">Kamar Asrama</span>
                <span className="info-val">{record.nama_kamar || '-'}</span>
              </div>

              <div className="preview-divider"></div>

              <div className="preview-completeness">
                <div className="completeness-label-row">
                  <span>Kelengkapan Data</span>
                  <span className="percent-val">{completenessScore}%</span>
                </div>
                <Progress 
                  percent={completenessScore} 
                  showInfo={false} 
                  strokeColor={completenessScore === 100 ? '#10b981' : completenessScore >= 70 ? '#f59e0b' : '#ef4444'}
                  size="small"
                />
              </div>
            </div>
          </div>
        );

        return (
          <div className="student-name-cell">
            <Popover 
              content={popoverContent} 
              trigger="hover" 
              placement="right" 
              overlayClassName="student-preview-popover"
              mouseEnterDelay={0.3}
            >
              <div className="student-interactive-wrapper">
                <div className="avatar-circle-sm" style={avatarStyle}>
                  {initials}
                </div>
                <div className="student-name-info">
                  <span className="student-name">{record.nama || '-'}</span>
                  {isWarning && (
                    <span className="needs-attention-badge">
                      <ExclamationCircleOutlined className="warn-icon" /> {completenessScore}% Lengkap
                    </span>
                  )}
                  {!isWarning && (
                    <span className="data-complete-badge">
                      <CheckCircleOutlined className="complete-icon" /> Lengkap
                    </span>
                  )}
                </div>
              </div>
            </Popover>
          </div>
        );
      }
    },
    {
      title: 'JK',
      dataIndex: 'jenis_kelamin',
      key: 'jenis_kelamin',
      width: 70,
      align: 'center',
      render: (text) => {
        const isMale = text === 'Laki-laki';
        return (
          <span className={`gender-badge ${isMale ? 'male' : 'female'}`}>
            {isMale ? 'L' : text === 'Perempuan' ? 'P' : '-'}
          </span>
        );
      }
    },
    {
      title: 'Kelas Diniyah',
      dataIndex: 'nama_diniyah',
      key: 'nama_diniyah',
      width: 140,
      render: (text) => text ? <Tag color="blue" className="academic-badge">{text}</Tag> : '-'
    },
    {
      title: 'Kelas Sekolah',
      dataIndex: 'nama_sekolah',
      key: 'nama_sekolah',
      width: 140,
      render: (text) => text ? <Tag color="cyan" className="academic-badge">{text}</Tag> : '-'
    },
    {
      title: 'Kamar',
      dataIndex: 'nama_kamar',
      key: 'nama_kamar',
      width: 130,
      render: (text) => text ? <Tag color="purple" className="academic-badge">{text}</Tag> : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status_tahun_ajaran',
      key: 'status_tahun_ajaran',
      width: 120,
      render: (status) => (
        <span className={`status-pill ${statusColorMap[status] || 'default'}`}>
          {formatStatusTahunAjaran(status)}
        </span>
      )
    },
    {
      title: 'Aksi',
      key: 'action',
      fixed: 'right',
      width: 80,
      align: 'center',
      render: (_, record) => (
        canEdit ? (
          <Tooltip title="Ubah Penempatan (Kelas/Kamar/Status)">
            <Button
              type="text"
              icon={<EditOutlined className="edit-btn-icon" />}
              onClick={() => onEdit(record)}
              className="action-edit-button"
            />
          </Tooltip>
        ) : (
          <Tooltip title="Data diarsip, tidak dapat diubah">
            <span className="arsip-icon-tag">Arsip</span>
          </Tooltip>
        )
      )
    }
  ];

  return (
    <div className="student-table-container">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        scroll={{ x: 1200, y: 520 }}
        sticky={{ offsetHeader: 0 }}
        className="modern-data-grid"
        locale={{
          emptyText: (
            <EmptyState
              description="Tidak ada data santri yang sesuai dengan filter pencarian"
            />
          )
        }}
      />
    </div>
  );
}
