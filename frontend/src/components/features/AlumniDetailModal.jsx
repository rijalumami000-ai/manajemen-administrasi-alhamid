import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { CustomTabs } from '../ui/CustomTabs';
import { CustomTag } from '../ui/CustomTag';
import { LoadingState } from '../common/LoadingState';
import { formatDate } from '../../utils/formatters';
import { formatGender } from '../../utils/studentUtils';
import { alumniService } from '../../services/alumniService';
import { User, BookOpen, Home, Trophy, AlertTriangle, GraduationCap } from 'lucide-react';
import './AlumniDetailModal.scss';

export function AlumniDetailModal({ isOpen, onClose, alumniId }) {
  const [activeTab, setActiveTab] = useState('info');
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && alumniId) {
      loadDetail();
    }
  }, [isOpen, alumniId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await alumniService.fetchAlumniDetail(alumniId);
      setDetailData(data);
      setActiveTab('info');
    } catch (error) {
      console.error('Gagal memuat detail alumni:', error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const santri = detailData?.santri || {};
  const history = detailData?.history || [];
  const prestasi = detailData?.prestasi || [];
  const pelanggaran = detailData?.pelanggaran || [];

  const tabItems = [
    {
      key: 'info',
      label: 'Informasi Profil',
      icon: <User size={16} />,
      children: (
        <div className="alumni-detail-info-wrap">
          {/* Avatar and Main Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '2px solid #10b981' }}>
              {santri.foto_url ? (
                <img
                  src={santri.foto_url}
                  alt={santri.nama || 'Santri'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <User size={32} color="#64748b" />
              )}
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{santri.nama || '-'}</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>NIS: <strong>{santri.nis || '-'}</strong></span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>•</span>
                <CustomTag color="blue">{santri.tipe === 'pindah' ? 'Siswa Pindah' : 'Alumni'}</CustomTag>
                {santri.tahun_lulus && <CustomTag color="green">Lulus {santri.tahun_lulus}</CustomTag>}
              </div>
            </div>
          </div>

          <div className="detail-section-grid">
            <div className="info-group">
              <h5>Data Identitas Santri</h5>
              <div className="info-item"><span>Nama Lengkap:</span> <strong>{santri.nama || '-'}</strong></div>
              <div className="info-item"><span>NIS / NISN:</span> <strong>{santri.nis || '-'}{santri.nisn ? ` / ${santri.nisn}` : ''}</strong></div>
              <div className="info-item"><span>NIK:</span> <strong>{santri.nik || '-'}</strong></div>
              <div className="info-item"><span>Jenis Kelamin:</span> <strong>{formatGender(santri.jenis_kelamin)}</strong></div>
              <div className="info-item"><span>TTL:</span> <strong>{santri.tempat_lahir ? `${santri.tempat_lahir}, ` : ''}{santri.tanggal_lahir ? formatDate(santri.tanggal_lahir) : '-'}</strong></div>
              <div className="info-item"><span>Alamat Asal:</span> <strong>{santri.alamat || '-'}</strong></div>
            </div>

            <div className="info-group">
              <h5>Kelulusan & Kontak</h5>
              <div className="info-item"><span>Tahun Lulus:</span> <strong><CustomTag color="blue">{santri.tahun_lulus || '-'}</CustomTag></strong></div>
              <div className="info-item"><span>Kelas Terakhir:</span> <strong>{santri.kelas_terakhir || '-'}</strong></div>
              <div className="info-item"><span>Kamar Asrama:</span> <strong>{santri.kamar || '-'}</strong></div>
              <div className="info-item"><span>Pekerjaan:</span> <strong>{santri.pekerjaan || '-'}</strong></div>
              <div className="info-item"><span>Instansi / Kampus:</span> <strong>{santri.instansi || '-'}</strong></div>
              <div className="info-item"><span>No. HP Santri:</span> <strong>{santri.no_hp || '-'}</strong></div>
              <div className="info-item"><span>Alamat Sekarang:</span> <strong>{santri.alamat_sekarang || '-'}</strong></div>
            </div>

            <div className="info-group" style={{ gridColumn: 'span 2' }}>
              <h5>Data Orang Tua / Wali</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="info-item"><span>Nama Ayah:</span> <strong>{santri.nama_ayah || '-'}</strong></div>
                <div className="info-item"><span>Nama Ibu:</span> <strong>{santri.nama_ibu || '-'}</strong></div>
                <div className="info-item"><span>No. HP Ayah:</span> <strong>{santri.no_hp_ayah || '-'}</strong></div>
                <div className="info-item"><span>No. HP Ibu:</span> <strong>{santri.no_hp_ibu || '-'}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'history',
      label: 'Riwayat Akademik',
      icon: <BookOpen size={16} />,
      badge: history.length,
      children: (
        <div className="history-timeline">
          {history.length === 0 ? (
            <p className="empty-text">Belum ada catatan riwayat akademik di Buku Induk.</p>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Tahun Ajaran {item.tahun_ajaran || '-'}</span>
                    <CustomTag color={item.status === 'lulus' || item.status === 'alumni' ? 'green' : (item.status === 'pindah' ? 'orange' : 'blue')}>
                      {item.status ? item.status.toUpperCase() : 'AKTIF'}
                    </CustomTag>
                  </div>
                  <div className="timeline-desc" style={{ marginTop: '4px' }}>
                    <strong>Diniyah:</strong> {item.kelas_diniyah || '-'} | <strong>Sekolah:</strong> {item.kelas_sekolah || '-'} | <strong>Kamar:</strong> {item.kamar ? `${item.kamar} (${item.gedung || ''})` : '-'}
                  </div>
                  {item.catatan && (
                    <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                      Catatan: {item.catatan}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )
    },
    {
      key: 'prestasi',
      label: 'Prestasi',
      icon: <Trophy size={16} />,
      badge: prestasi.length,
      children: (
        <div className="prestasi-list">
          {prestasi.length === 0 ? (
            <p className="empty-text">Tidak ada catatan prestasi.</p>
          ) : (
            prestasi.map((p, idx) => (
              <div key={idx} className="card-item-row">
                <Trophy size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <div>
                  <strong>{p.jenis || p.prestasi}</strong> {p.tanggal && `(${formatDate(p.tanggal)})`}
                  {p.penghargaan && <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>Penghargaan: {p.penghargaan}</div>}
                  <p>{p.deskripsi || p.keterangan || '-'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )
    },
    {
      key: 'pelanggaran',
      label: 'Pelanggaran & Disiplin',
      icon: <AlertTriangle size={16} />,
      badge: pelanggaran.length,
      children: (
        <div className="pelanggaran-list">
          {pelanggaran.length === 0 ? (
            <p className="empty-text">Tidak ada catatan pelanggaran.</p>
          ) : (
            pelanggaran.map((p, idx) => (
              <div key={idx} className="card-item-row warning">
                <AlertTriangle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                <div>
                  <strong>{p.jenis || p.pelanggaran}</strong> {p.tanggal && `(${formatDate(p.tanggal)})`}
                  {p.sanksi && <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>Sanksi: {p.sanksi}</div>}
                  <p>{p.deskripsi || p.keterangan || '-'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )
    }
  ];

  return (
    <CustomModal
      open={isOpen}
      onClose={onClose}
      title={santri.nama ? `Detail Alumni - ${santri.nama}` : 'Detail Alumni'}
      subtitle={`NIS: ${santri.nis || '-'} | Tahun Lulus: ${santri.tahun_lulus || '-'}`}
      icon={<GraduationCap />}
      width={780}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <button type="button" className="btn-custom btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      }
    >
      {loading ? (
        <LoadingState message="Memuat detail alumni..." />
      ) : (
        <CustomTabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
      )}
    </CustomModal>
  );
}
