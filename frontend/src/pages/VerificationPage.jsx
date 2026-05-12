import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Row, Col, Badge, Avatar, Empty, Spin, Result } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const API_BASE = import.meta.env.VITE_API_URL || '';

export function VerificationPage() {
  const { no_peserta } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/public/verify/${no_peserta}`);
        const result = await res.json();
        
        if (!res.ok) {
          throw new Error(result.error || 'Gagal memuat data verifikasi.');
        }
        
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (no_peserta) {
      fetchData();
    }
  }, [no_peserta]);

  const formatTGL = (tgl) => {
    if (!tgl) return '-';
    return new Date(tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const ttl = data ? [data.tempat_lahir, formatTGL(data.tanggal_lahir)].filter(Boolean).join(', ') : '-';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f7fa' }}>
        <Spin size="large" tip="Memverifikasi Data..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f7fa', padding: '20px' }}>
        <Result
          status="error"
          title="Verifikasi Gagal"
          subTitle={error || 'Data peserta ujian tidak ditemukan atau barcode tidak valid.'}
          icon={<CloseCircleFilled style={{ color: '#ff4d4f' }} />}
        />
      </div>
    );
  }

  return (
    <div className="force-light-mode" style={{ minHeight: '100vh', background: '#f5f7fa', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {/* CSS Khusus untuk memaksa mode terang tanpa merusak elemen lain */}
      <style>{`
        .force-light-mode {
          color-scheme: light !important;
        }
        .force-light-mode .ant-card {
          background-color: #ffffff !important;
          color: #262626 !important;
        }
        .force-light-mode .ant-typography {
          color: #262626 !important;
        }
        .force-light-mode .ant-typography-secondary {
          color: #8c8c8c !important;
        }
        .data-row-custom {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          padding: 12px 0 !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .data-row-custom:last-child {
          border-bottom: none !important;
        }
        .data-row-custom span:first-child {
          color: #8c8c8c !important;
          font-size: 14px !important;
        }
        .data-row-custom span:last-child {
          color: #262626 !important;
          font-weight: 600 !important;
          text-align: right !important;
          font-size: 14px !important;
          max-width: 70% !important;
        }
      `}</style>

      <Card 
        style={{ width: '100%', maxWidth: '500px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
        bodyStyle={{ padding: '24px' }}
      >
        {/* Header Verifikasi */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <CheckCircleFilled style={{ fontSize: '48px', color: '#52c41a', marginBottom: '12px' }} />
          <Title level={3} style={{ margin: 0 }}>Kartu Terverifikasi</Title>
          <Text type="secondary">Data peserta ujian ini resmi terdaftar di sistem.</Text>
        </div>

        {/* Banner Status */}
        <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '8px', padding: '12px', textAlign: 'center', marginBottom: '24px' }}>
          <Text style={{ color: '#389e0d', fontWeight: '600' }}>
            PESERTA UJIAN SEMESTER
          </Text>
        </div>

        {/* Konten Data Atas */}
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            {data.foto_url ? (
              <img 
                src={`${API_BASE}${data.foto_url}`} 
                alt="Foto Santri" 
                style={{ width: '100px', height: '125px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }}
              />
            ) : (
              <Avatar size={100} icon={<UserOutlined />} shape="square" style={{ borderRadius: '6px', backgroundColor: '#f0f0f0' }} />
            )}
          </Col>
          <Col xs={24} sm={16}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>NAMA LENGKAP</Text>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{data.nama || '-'}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>NO. PESERTA</Text>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#003399', fontFamily: 'monospace' }}>{data.no_peserta || '-'}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>NIS</Text>
                <div style={{ fontSize: '14px' }}>{data.nis || '-'}</div>
              </div>
            </div>
          </Col>
        </Row>

        <hr style={{ border: 0, borderTop: '1px solid #f0f0f0', margin: '20px 0' }} />

        {/* Data Detail Bawah */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="data-row-custom">
            <span>Kelas</span>
            <span>{data.nama_kelas || '-'}</span>
          </div>
          <div className="data-row-custom">
            <span>Jenis Kelamin</span>
            <span>
              {data.jenis_kelamin === 'L' ? 'Laki-laki' : data.jenis_kelamin === 'P' ? 'Perempuan' : (data.jenis_kelamin || '-')}
            </span>
          </div>
          <div className="data-row-custom">
            <span>TTL</span>
            <span>{ttl}</span>
          </div>
          <div className="data-row-custom" style={{ alignItems: 'flex-start' }}>
            <span>Alamat</span>
            <span>{data.alamat || '-'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
