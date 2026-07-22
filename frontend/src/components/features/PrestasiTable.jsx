import React from 'react';
import { CustomTag } from '../ui/CustomTag';
import { EmptyState } from '../common/EmptyState';
import { formatDate } from '../../utils/formatters';
import { Edit2, Trash2, Trophy } from 'lucide-react';

export function PrestasiTable({ data = [], onEdit, onDelete }) {
  if (data.length === 0) {
    return <EmptyState description="Belum ada data prestasi" />;
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFormat: '13px' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>NIS</th>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Nama Santri</th>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Jenis Prestasi</th>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Tanggal</th>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Deskripsi</th>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Penghargaan</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', width: '100px' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.map((record) => (
            <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{record.nis || '-'}</td>
              <td style={{ padding: '10px 12px', fontWeight: 600 }}>{record.nama_santri || '-'}</td>
              <td style={{ padding: '10px 12px' }}>
                <CustomTag color="orange">
                  <Trophy size={12} /> {record.jenis || '-'}
                </CustomTag>
              </td>
              <td style={{ padding: '10px 12px' }}>{record.tanggal ? formatDate(record.tanggal) : '-'}</td>
              <td style={{ padding: '10px 12px', color: '#64748b' }}>{record.deskripsi || '-'}</td>
              <td style={{ padding: '10px 12px', color: '#64748b' }}>{record.penghargaan || '-'}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-icon-action"
                    onClick={() => onEdit(record)}
                    title="Edit Prestasi"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2196f3' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-action"
                    onClick={() => onDelete(record.id, record.nama_santri)}
                    title="Hapus Prestasi"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
