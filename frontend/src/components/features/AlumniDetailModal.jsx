import { useState, useEffect } from 'react';
import { CustomModal } from '../ui/CustomModal';
import { CustomTabs } from '../ui/CustomTabs';
import { CustomTag } from '../ui/CustomTag';
import { LoadingState } from '../common/LoadingState';
import { formatDate } from '../../utils/formatters';
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
        <div className="detail-section-grid">
          <div className="info-group">
            <h5>Data Identitas</h5>
            <div className="info-item"><span>Nama Lengkap:</span> <strong>{santri.nama || '-'}</strong></div>
            <div className="info-item"><span>NIS:</span> <strong>{santri.nis || '-'}</strong></div>
            <div className="info-item"><span>NIK:</span> <strong>{santri.nik || '-'}</strong></div>
            <div className="info-item"><span>Jenis Kelamin:</span> <strong>{santri.jenis_kelamin || '-'}</strong></div>
            <div className="info-item"><span>TTL:</span> <strong>{santri.tempat_lahir ? `${santri.tempat_lahir}, ` : ''}{santri.tanggal_lahir ? formatDate(santri.tanggal_lahir) : '-'}</strong></div>
          </div>

          <div className="info-group">
            <h5>Kelulusan & Karir</h5>
            <div className="info-item"><span>Tahun Lulus:</span> <strong><CustomTag color="blue">{santri.tahun_lulus || '-'}</CustomTag></strong></div>
            <div className="info-item"><span>Angkatan:</span> <strong>{santri.angkatan || '-'}</strong></div>
            <div className="info-item"><span>Pekerjaan:</span> <strong>{santri.pekerjaan || '-'}</strong></div>
            <div className="info-item"><span>Instansi:</span> <strong>{santri.instansi || '-'}</strong></div>
            <div className="info-item"><span>No. HP:</span> <strong>{santri.no_hp || '-'}</strong></div>
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
            <p className="empty-text">Belum ada catatan riwayat akademik.</p>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-title">{item.tahun_ajaran || 'Tahun Ajaran'}</div>
                  <div className="timeline-desc">
                    Kelas Diniyah: {item.kelas_diniyah || '-'} | Kelas Sekolah: {item.kelas_sekolah || '-'} | Status: <CustomTag color={item.status === 'lulus' ? 'green' : 'blue'}>{item.status || 'Aktif'}</CustomTag>
                  </div>
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
                  <strong>{p.jenis}</strong> ({formatDate(p.tanggal)})
                  <p>{p.deskripsi}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )
    },
    {
      key: 'pelanggaran',
      label: 'Pelanggaran',
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
                  <strong>{p.jenis}</strong> ({formatDate(p.tanggal)})
                  <p>{p.deskripsi}</p>
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
