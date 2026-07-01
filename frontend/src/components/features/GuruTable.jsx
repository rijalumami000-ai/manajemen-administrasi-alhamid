import { Edit, Trash2, Award, Camera } from 'lucide-react';
import { EmptyState, Pagination } from '../common';
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

export function GuruTable({ 
  data, 
  total, 
  currentPage, 
  pageSize, 
  onPageChange, 
  onEdit, 
  onDelete, 
  onUploadTtd, 
  onUploadFoto 
}) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="guru-table-container">
      <div className="table-responsive-container">
        <table className="custom-data-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>NIP</th>
              <th style={{ width: '230px' }}>Nama Guru</th>
              <th style={{ width: '160px' }}>Mata Pelajaran</th>
              <th style={{ width: '150px' }}>Jabatan</th>
              <th style={{ width: '130px' }}>No. HP</th>
              <th style={{ minWidth: '200px' }}>Alamat</th>
              <th style={{ width: '100px' }}>Status</th>
              <th style={{ width: '180px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map(record => {
                const initials = getInitials(record.nama);
                const avatarStyle = getAvatarStyle(record.nama || '');
                return (
                  <tr key={record.id}>
                    <td>
                      <span className="guru-nip-text">{record.nip || '-'}</span>
                    </td>
                    <td>
                      <div className="guru-profile-cell">
                        {record.foto_url ? (
                          <img 
                            src={record.foto_url} 
                            alt={record.nama} 
                            className="avatar-circle-sm" 
                            style={{ objectFit: 'cover', border: '1px solid #cbd5e1' }}
                          />
                        ) : (
                          <div className="avatar-circle-sm" style={avatarStyle}>
                            {initials}
                          </div>
                        )}
                        <span className="guru-name">{record.nama || '-'}</span>
                      </div>
                    </td>
                    <td>
                      {record.mata_pelajaran ? (
                        <span className="guru-tag">{record.mata_pelajaran}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {record.jabatan ? (
                        <span className="guru-tag tag-purple">{record.jabatan}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className="guru-phone-text">{record.no_hp || '-'}</span>
                    </td>
                    <td>
                      <span className="guru-address-text" title={record.alamat || ''}>
                        {record.alamat || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${statusColorMap[record.status] || 'default'}`}>
                        {record.status || '-'}
                      </span>
                    </td>
                    <td>
                      <div className="guru-action-cell">
                        <button
                          type="button"
                          className="action-icon-btn edit-btn"
                          onClick={() => onEdit(record)}
                          title="Ubah data guru"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn photo-btn"
                          onClick={() => onUploadFoto(record)}
                          style={{ color: '#8b5cf6' }}
                          title="Upload Foto Profil"
                        >
                          <Camera size={14} />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn ttd-btn"
                          onClick={() => onUploadTtd(record)}
                          title="Upload Tandatangan Digital"
                        >
                          <Award size={14} />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn delete-btn"
                          onClick={() => onDelete(record.id, record.nama)}
                          title="Hapus data guru"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: '40px 0' }}>
                  <EmptyState description="Tidak ada data guru yang sesuai" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 0 && (
        <div className="table-pagination-row">
          <span className="pagination-summary">
            Menampilkan data guru ke-<b>{Math.min((currentPage - 1) * pageSize + 1, total)}</b> hingga <b>{Math.min(currentPage * pageSize, total)}</b> dari total <b>{total}</b> guru
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
