import { useState, useEffect } from 'react';
import { Modal, Tabs, Descriptions, Empty, Spin, Timeline, Tag } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  HomeOutlined,
  TrophyOutlined,
  WarningOutlined,
  CalendarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { formatDate } from '../../utils/formatters';
import { alumniService } from '../../services/alumniService';
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
      alert('Gagal memuat detail alumni');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!detailData) {
    return (
      <Modal
        open={isOpen}
        onCancel={onClose}
        title="Detail Alumni"
        width={900}
        footer={null}
      >
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          {loading ? <Spin size="large" tip="Memuat data..." /> : <Empty description="Tidak ada data" />}
        </div>
      </Modal>
    );
  }

  const { alumni, identitas, riwayat } = detailData;
  const source = identitas || alumni;

  // Parse kelas terakhir
  const kelasParts = (alumni.kelas_terakhir || '').split('/').map(item => item.trim());
  const kelasDiniyah = source.kelas_diniyah || source.nama_diniyah || kelasParts[0] || '-';
  const kelasSekolah = source.kelas_sekolah || source.nama_sekolah || kelasParts[1] || '-';
  const kamar = source.kamar || source.nama_kamar || '-';

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <UserOutlined /> Identitas
        </span>
      ),
      children: (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="NIS" span={1}>{alumni.nis}</Descriptions.Item>
          <Descriptions.Item label="NIK" span={1}>{alumni.nik || '-'}</Descriptions.Item>
          <Descriptions.Item label="Nama" span={2}>{alumni.nama}</Descriptions.Item>
          <Descriptions.Item label="Tempat Lahir" span={1}>{alumni.tempat_lahir || '-'}</Descriptions.Item>
          <Descriptions.Item label="Tanggal Lahir" span={1}>
            {alumni.tanggal_lahir ? formatDate(alumni.tanggal_lahir) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Tahun Masuk" span={1}>{alumni.tahun_masuk || '-'}</Descriptions.Item>
          <Descriptions.Item label="Tahun Lulus" span={1}>
            <Tag color="blue" icon={<CalendarOutlined />}>{alumni.tahun_lulus}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Kelas Diniyah" span={1}>{kelasDiniyah}</Descriptions.Item>
          <Descriptions.Item label="Kelas Sekolah" span={1}>{kelasSekolah}</Descriptions.Item>
          <Descriptions.Item label="Kamar" span={2}>{kamar}</Descriptions.Item>
          <Descriptions.Item label="Alamat Asal" span={2}>{alumni.alamat || '-'}</Descriptions.Item>
          <Descriptions.Item label="No. HP" span={1}>{alumni.no_hp || '-'}</Descriptions.Item>
          <Descriptions.Item label="Email" span={1}>{alumni.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="Pekerjaan" span={1}>{alumni.pekerjaan || '-'}</Descriptions.Item>
          <Descriptions.Item label="Instansi" span={1}>{alumni.instansi || '-'}</Descriptions.Item>
          <Descriptions.Item label="Status Pernikahan" span={2}>
            {alumni.status_pernikahan ? (
              <Tag color={alumni.status_pernikahan === 'Sudah Menikah' ? 'green' : 'default'}>
                {alumni.status_pernikahan}
              </Tag>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Alamat Sekarang" span={2}>{alumni.alamat_sekarang || '-'}</Descriptions.Item>
          <Descriptions.Item label="Nama Ayah" span={1}>{source.nama_ayah || '-'}</Descriptions.Item>
          <Descriptions.Item label="No HP Ayah" span={1}>{source.no_hp_ayah || '-'}</Descriptions.Item>
          <Descriptions.Item label="Nama Ibu" span={1}>{source.nama_ibu || '-'}</Descriptions.Item>
          <Descriptions.Item label="No HP Ibu" span={1}>{source.no_hp_ibu || '-'}</Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'kelas',
      label: (
        <span>
          <BookOutlined /> Riwayat Kelas
        </span>
      ),
      children: (
        !riwayat.kelas || riwayat.kelas.length === 0 ? (
          <Empty description="Tidak ada riwayat kelas" />
        ) : (
          <Timeline
            items={riwayat.kelas.map((k, index) => ({
              key: index,
              dot: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
              color: 'blue',
              children: (
                <div>
                  <h4 style={{ margin: 0, marginBottom: 4 }}>
                    {k.kelas_diniyah || '-'} / {k.kelas_sekolah || '-'}
                  </h4>
                  <div style={{ color: '#666', fontSize: '13px', marginBottom: 4 }}>
                    <CalendarOutlined /> {formatDate(k.tanggal_mulai)} - {k.tanggal_selesai ? formatDate(k.tanggal_selesai) : 'Sekarang'}
                  </div>
                  {k.keterangan && <div style={{ fontSize: '13px' }}>{k.keterangan}</div>}
                </div>
              )
            }))}
          />
        )
      )
    },
    {
      key: 'kamar',
      label: (
        <span>
          <HomeOutlined /> Riwayat Asrama
        </span>
      ),
      children: (
        !riwayat.kamar || riwayat.kamar.length === 0 ? (
          <Empty description="Tidak ada riwayat kamar" />
        ) : (
          <Timeline
            items={riwayat.kamar.map((k, index) => ({
              key: index,
              dot: <HomeOutlined style={{ fontSize: '16px' }} />,
              color: 'green',
              children: (
                <div>
                  <h4 style={{ margin: 0, marginBottom: 4 }}>
                    {k.kamar} {k.gedung ? `- ${k.gedung}` : ''} {k.lantai ? `Lt. ${k.lantai}` : ''}
                  </h4>
                  <div style={{ color: '#666', fontSize: '13px', marginBottom: 4 }}>
                    <CalendarOutlined /> {formatDate(k.tanggal_mulai)} - {k.tanggal_selesai ? formatDate(k.tanggal_selesai) : 'Sekarang'}
                  </div>
                  {k.keterangan && <div style={{ fontSize: '13px' }}>{k.keterangan}</div>}
                </div>
              )
            }))}
          />
        )
      )
    },
    {
      key: 'prestasi',
      label: (
        <span>
          <TrophyOutlined /> Prestasi
        </span>
      ),
      children: (
        !riwayat.prestasi || riwayat.prestasi.length === 0 ? (
          <Empty description="Tidak ada prestasi" />
        ) : (
          <Timeline
            items={riwayat.prestasi.map((p, index) => ({
              key: index,
              dot: <TrophyOutlined style={{ fontSize: '16px' }} />,
              color: 'gold',
              children: (
                <div>
                  <h4 style={{ margin: 0, marginBottom: 4 }}>{p.jenis}</h4>
                  <div style={{ color: '#666', fontSize: '13px', marginBottom: 4 }}>
                    <CalendarOutlined /> {formatDate(p.tanggal)}
                  </div>
                  {p.deskripsi && <div style={{ fontSize: '13px', marginBottom: 4 }}>{p.deskripsi}</div>}
                  {p.penghargaan && (
                    <div style={{ fontSize: '13px' }}>
                      <strong>Penghargaan:</strong> {p.penghargaan}
                    </div>
                  )}
                </div>
              )
            }))}
          />
        )
      )
    },
    {
      key: 'pelanggaran',
      label: (
        <span>
          <WarningOutlined /> Pelanggaran
        </span>
      ),
      children: (
        !riwayat.pelanggaran || riwayat.pelanggaran.length === 0 ? (
          <Empty description="Tidak ada pelanggaran" />
        ) : (
          <Timeline
            items={riwayat.pelanggaran.map((p, index) => ({
              key: index,
              dot: <WarningOutlined style={{ fontSize: '16px' }} />,
              color: 'red',
              children: (
                <div>
                  <h4 style={{ margin: 0, marginBottom: 4 }}>{p.jenis}</h4>
                  <div style={{ color: '#666', fontSize: '13px', marginBottom: 4 }}>
                    <CalendarOutlined /> {formatDate(p.tanggal)}
                  </div>
                  {p.deskripsi && <div style={{ fontSize: '13px', marginBottom: 4 }}>{p.deskripsi}</div>}
                  {p.sanksi && (
                    <div style={{ fontSize: '13px' }}>
                      <strong>Sanksi:</strong> {p.sanksi}
                    </div>
                  )}
                </div>
              )
            }))}
          />
        )
      )
    }
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title="Detail Alumni"
      width={900}
      footer={null}
      className="alumni-detail-modal"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Modal>
  );
}
