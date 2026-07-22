import React from 'react';
import { CustomTag } from '../ui/CustomTag';
import { EmptyState } from '../common/EmptyState';
import { formatStatusTahunAjaran } from '../../utils/formatters';
import { Edit2, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import './SantriTable.scss';

const statusColorMap = {
  aktif: 'green',
  draft: 'default',
  tidak_naik: 'orange',
  lulus: 'blue',
  alumni: 'purple',
  pindah: 'orange',
  keluar: 'red'
};

const getAvatarStyle = (name) => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#14B8A6', '#F43F5E'
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
  data = [],
  onEdit,
  canEdit,
  onUpdateSemesterStatus
}) {
  if (data.length === 0) {
    return (
      <EmptyState description="Tidak ada data santri yang sesuai dengan filter pencarian" />
    );
  }

  return (
    <div className="student-table-container">
      <div className="table-responsive-wrapper">
        <table className="custom-santri-table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>Sem. 1 (Ganjil)</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Sem. 2 (Genap)</th>
              <th style={{ width: '110px' }}>NIS</th>
              <th>Nama Santri</th>
              <th style={{ width: '60px', textAlign: 'center' }}>JK</th>
              <th>Kelas Diniyah</th>
              <th>Kelas Sekolah</th>
              <th>Kamar</th>
              <th style={{ width: '100px' }}>Status</th>
              <th style={{ width: '70px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((record) => {
              const initials = getInitials(record.nama);
              const avatarStyle = getAvatarStyle(record.nama || '');
              const completenessScore = calculateCompleteness(record);
              const isWarning = completenessScore < 100;
              const isMale = record.jenis_kelamin === 'Laki-laki';

              return (
                <tr key={record.id}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!record.aktif_ganjil}
                      onChange={(e) => onUpdateSemesterStatus(record.id, { aktif_ganjil: e.target.checked })}
                      disabled={!canEdit}
                      className="custom-checkbox"
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={!!record.aktif_genap}
                      onChange={(e) => onUpdateSemesterStatus(record.id, { aktif_genap: e.target.checked })}
                      disabled={!canEdit}
                      className="custom-checkbox"
                    />
                  </td>
                  <td><span className="student-nis-txt">{record.nis || '-'}</span></td>
                  <td>
                    <div className="student-interactive-wrapper">
                      <div className="avatar-circle-sm" style={avatarStyle}>
                        {initials}
                      </div>
                      <div className="student-name-info">
                        <span className="student-name">{record.nama || '-'}</span>
                        {isWarning ? (
                          <span className="needs-attention-badge">
                            <AlertCircle size={12} /> {completenessScore}% Lengkap
                          </span>
                        ) : (
                          <span className="data-complete-badge">
                            <CheckCircle size={12} /> Lengkap
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`gender-badge ${isMale ? 'male' : 'female'}`}>
                      {isMale ? 'L' : record.jenis_kelamin === 'Perempuan' ? 'P' : '-'}
                    </span>
                  </td>
                  <td>
                    {record.nama_diniyah ? <CustomTag color="blue">{record.nama_diniyah}</CustomTag> : '-'}
                  </td>
                  <td>
                    {record.nama_sekolah ? <CustomTag color="purple">{record.nama_sekolah}</CustomTag> : '-'}
                  </td>
                  <td>
                    {record.nama_kamar ? <CustomTag color="orange">{record.nama_kamar}</CustomTag> : '-'}
                  </td>
                  <td>
                    <CustomTag color={statusColorMap[record.status_tahun_ajaran] || 'default'}>
                      {formatStatusTahunAjaran(record.status_tahun_ajaran)}
                    </CustomTag>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {canEdit ? (
                      <button
                        type="button"
                        className="btn-icon-action"
                        title="Ubah Penempatan (Kelas/Kamar/Status)"
                        onClick={() => onEdit(record)}
                      >
                        <Edit2 size={16} />
                      </button>
                    ) : (
                      <span className="arsip-icon-tag" title="Data diarsip, tidak dapat diubah">
                        <Lock size={14} />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
