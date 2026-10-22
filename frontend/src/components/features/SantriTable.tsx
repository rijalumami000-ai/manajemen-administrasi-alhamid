import React, { useState } from 'react';
import { CustomTag } from '../ui/CustomTag';
import { EmptyState } from '../common/EmptyState';
import { formatStatusTahunAjaran } from '../../utils/formatters';
import { calculateProfileCompleteness, isMaleGender, isFemaleGender, formatGender } from '../../utils/studentUtils';
import { Edit2, AlertCircle, CheckCircle, Lock, Unlock } from 'lucide-react';
import type { SantriListItem } from '../../types/santri';
import './SantriTable.scss';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '';

const statusColorMap: Record<string, string> = {
  aktif: 'green',
  draft: 'default',
  tidak_naik: 'orange',
  lulus: 'blue',
  alumni: 'purple',
  pindah: 'orange',
  keluar: 'red'
};

const getAvatarStyle = (name: string): React.CSSProperties => {
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

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export interface SantriTableProps {
  data?: SantriListItem[];
  onEdit: (record: SantriListItem) => void;
  canEdit: boolean;
  onUpdateSemesterStatus: (id: number, status: { aktif_ganjil?: boolean; aktif_genap?: boolean }) => void;
}

export function SantriTable({
  data = [],
  onEdit,
  canEdit,
  onUpdateSemesterStatus
}: SantriTableProps) {
  const [isSemesterUnlocked, setIsSemesterUnlocked] = useState<boolean>(false);
  const [hoveredAvatar, setHoveredAvatar] = useState<SantriListItem | null>(null);

  if (data.length === 0) {
    return (
      <EmptyState description="Tidak ada data santri yang sesuai dengan filter pencarian" />
    );
  }

  return (
    <div className="student-table-container">
      {/* Semester Safety Toolbar */}
      <div className={`semester-lock-toolbar ${isSemesterUnlocked ? 'unlocked' : 'locked'}`}>
        <div className="lock-status-info">
          {isSemesterUnlocked ? (
            <span className="status-badge unlocked">
              <Unlock size={14} /> Mode Pengubahan Semester Aktif — Ceklis sekarang dapat diubah
            </span>
          ) : (
            <span className="status-badge locked">
              <Lock size={14} /> Opsi Semester Terkunci — Mengamankan dari klik tidak sengaja
            </span>
          )}
        </div>
        {canEdit && (
          <button 
            type="button"
            className={`btn-semester-lock-toggle ${isSemesterUnlocked ? 'btn-lock' : 'btn-unlock'}`}
            onClick={() => setIsSemesterUnlocked(!isSemesterUnlocked)}
            title={isSemesterUnlocked ? 'Kunci kembali agar aman dari klik tidak sengaja' : 'Buka kunci untuk mengubah status semester'}
          >
            {isSemesterUnlocked ? (
              <>
                <Lock size={13} /> Kunci Kembali
              </>
            ) : (
              <>
                <Unlock size={13} /> Buka Kunci Edit
              </>
            )}
          </button>
        )}
      </div>

      <div className="table-responsive-wrapper">
        <table className="custom-santri-table">
          <thead>
            <tr>
              <th style={{ width: '58px', textAlign: 'center', padding: '10px 4px' }} className={isSemesterUnlocked ? 'th-unlocked' : 'th-locked'} title="Semester Ganjil">
                <span className="th-sem-title">Ganjil</span>
                {!isSemesterUnlocked && <span className="th-lock-icon" title="Terkunci"><Lock size={10} /></span>}
              </th>
              <th style={{ width: '58px', textAlign: 'center', padding: '10px 4px' }} className={isSemesterUnlocked ? 'th-unlocked' : 'th-locked'} title="Semester Genap">
                <span className="th-sem-title">Genap</span>
                {!isSemesterUnlocked && <span className="th-lock-icon" title="Terkunci"><Lock size={10} /></span>}
              </th>
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
              const completenessScore = calculateProfileCompleteness(record);
              const isWarning = completenessScore < 100;
              const isMale = isMaleGender(record.jenis_kelamin);
              const isFemale = isFemaleGender(record.jenis_kelamin);

              return (
                <tr key={record.id}>
                  <td style={{ textAlign: 'center', padding: '8px 2px', width: '58px' }} className={`semester-checkbox-cell ${isSemesterUnlocked ? 'unlocked' : 'locked'}`}>
                    <input
                      type="checkbox"
                      checked={!!record.aktif_ganjil}
                      onChange={(e) => onUpdateSemesterStatus(record.id, { aktif_ganjil: e.target.checked })}
                      disabled={!canEdit || !isSemesterUnlocked}
                      className={`custom-checkbox ${!isSemesterUnlocked ? 'checkbox-locked' : ''}`}
                      title={!isSemesterUnlocked ? 'Terkunci. Klik "Buka Kunci Edit" di atas untuk mengubah' : 'Ubah status Semester Ganjil'}
                    />
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px 2px', width: '58px' }} className={`semester-checkbox-cell ${isSemesterUnlocked ? 'unlocked' : 'locked'}`}>
                    <input
                      type="checkbox"
                      checked={!!record.aktif_genap}
                      onChange={(e) => onUpdateSemesterStatus(record.id, { aktif_genap: e.target.checked })}
                      disabled={!canEdit || !isSemesterUnlocked}
                      className={`custom-checkbox ${!isSemesterUnlocked ? 'checkbox-locked' : ''}`}
                      title={!isSemesterUnlocked ? 'Terkunci. Klik "Buka Kunci Edit" di atas untuk mengubah' : 'Ubah status Semester Genap'}
                    />
                  </td>
                  <td><span className="student-nis-txt">{record.nis || '-'}</span></td>
                  <td>
                    <div className="student-interactive-wrapper">
                      <div 
                        className="santri-avatar-preview-wrap"
                        onMouseEnter={() => setHoveredAvatar(record)}
                        onMouseLeave={() => setHoveredAvatar(null)}
                      >
                        <div className={`avatar-circle-sm ${record.foto_url ? 'has-photo' : ''}`} style={!record.foto_url ? avatarStyle : {}}>
                          {record.foto_url ? (
                            <img
                              src={`${API_BASE}${record.foto_url}`}
                              alt={record.nama}
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.style.display = 'none';
                                const next = target.nextElementSibling as HTMLElement | null;
                                if (next) {
                                  next.style.display = 'flex';
                                }
                                if (target.parentElement) {
                                  target.parentElement.style.backgroundColor = avatarStyle.backgroundColor as string;
                                  target.parentElement.style.color = avatarStyle.color as string;
                                }
                              }}
                              className="santri-avatar-img"
                            />
                          ) : null}
                          <span className="avatar-initials" style={{ display: record.foto_url ? 'none' : 'flex' }}>
                            {initials}
                          </span>
                        </div>

                        {/* Hover Pop-up Lingkar Gelas */}
                        {hoveredAvatar?.id === record.id && (
                          <div className="avatar-lingkar-gelas-popup">
                            {record.foto_url ? (
                              <img
                                src={`${API_BASE}${record.foto_url}`}
                                alt={record.nama}
                                className="avatar-lingkar-img"
                              />
                            ) : (
                              <div className="avatar-lingkar-fallback" style={avatarStyle}>
                                <span>{initials}</span>
                              </div>
                            )}
                            <span className="avatar-lingkar-name">{record.nama}</span>
                          </div>
                        )}
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
                    <span 
                      className={`gender-badge ${isMale ? 'male' : isFemale ? 'female' : 'empty'}`}
                      title={formatGender(record.jenis_kelamin)}
                    >
                      {isMale ? 'L' : isFemale ? 'P' : '-'}
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
                    <CustomTag color={statusColorMap[record.status_tahun_ajaran || ''] || 'default'}>
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

export default SantriTable;
