import React from 'react';
import { formatDate } from '../../utils/formatters';
import { Edit2, Trash2, AlertTriangle, Calendar, User } from 'lucide-react';
import { PelanggaranItem } from '../../types/pelanggaranPrestasi';

interface PelanggaranTableProps {
  data: PelanggaranItem[];
  onEdit: (record: PelanggaranItem) => void;
  onDelete: (id: number, namaSantri: string) => void;
}

export const PelanggaranTable: React.FC<PelanggaranTableProps> = ({
  data = [],
  onEdit,
  onDelete
}) => {
  if (data.length === 0) {
    return (
      <div className="tactile-empty-card">
        <div className="empty-bubble-icon">
          <AlertTriangle size={36} />
        </div>
        <h4>Belum Ada Catatan Pelanggaran</h4>
        <p>Tidak ada data pelanggaran santri yang tercatat untuk tahun ajaran ini.</p>
      </div>
    );
  }

  return (
    <div className="tactile-glass-table-container">
      <div className="table-specular-edge" />
      <div className="table-responsive-wrapper custom-scrollbar">
        <table className="tactile-data-table">
          <thead>
            <tr>
              <th style={{ width: '45px', textAlign: 'center' }}>No</th>
              <th>Santri</th>
              <th>Tahun Ajaran</th>
              <th>Jenis Pelanggaran</th>
              <th>Tanggal</th>
              <th>Deskripsi Kejadian</th>
              <th>Tindakan / Sanksi</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((record, idx) => (
              <tr key={record.id} className="tactile-table-row">
                <td className="col-no">{idx + 1}</td>
                <td className="col-person">
                  <div className="person-lens-cell">
                    <div className="avatar-lens-orb avatar-red">
                      {record.foto_url ? (
                        <img src={record.foto_url} alt={record.nama_santri || 'Santri'} />
                      ) : (
                        <span>{(record.nama_santri || 'S').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="person-text-info">
                      <span className="person-name">{record.nama_santri || '-'}</span>
                      {record.nis && (
                        <span className="person-nis-badge">NIS: {record.nis}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="col-ta">
                  <span className="ta-pill-badge">
                    {record.tahun_ajaran_kode || '-'}
                  </span>
                </td>
                <td className="col-tag">
                  <span className="pelanggaran-badge-pill">
                    <AlertTriangle size={12} className="inline-icon" />
                    <span>{record.jenis || '-'}</span>
                  </span>
                </td>
                <td className="col-date">
                  <span className="date-cell">
                    <Calendar size={12} className="inline-icon" />
                    <span>{record.tanggal ? formatDate(record.tanggal) : '-'}</span>
                  </span>
                </td>
                <td className="col-desc" title={record.deskripsi || '-'}>
                  {record.deskripsi || '-'}
                </td>
                <td className="col-sanksi" title={record.sanksi || '-'}>
                  {record.sanksi ? (
                    <span className="sanksi-badge">{record.sanksi}</span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td className="col-actions">
                  <div className="actions-cell-wrap">
                    <button
                      type="button"
                      className="btn-table-act btn-act-edit"
                      onClick={() => onEdit(record)}
                      title="Edit catatan pelanggaran"
                      aria-label="Edit pelanggaran"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-table-act btn-act-delete"
                      onClick={() => onDelete(record.id, record.nama_santri || 'Santri')}
                      title="Hapus catatan pelanggaran"
                      aria-label="Hapus pelanggaran"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tactile-table-footer">
        <span className="footer-summary-text">
          Total <strong>{data.length}</strong> catatan pelanggaran terdata
        </span>
      </div>
    </div>
  );
};

export default PelanggaranTable;
