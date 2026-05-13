import React from 'react';
import { Typography, Card, Button, Space, Divider } from 'antd';
import { BookOutlined, FileTextOutlined, SmileOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import './ManajemenNilai.scss'; // Reuse some layout styles

const { Title, Text, Paragraph } = Typography;

export function Welcome() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  return (
    <div style={{
      padding: isMobile ? 16 : 24,
      background: '#f0f2f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Card style={{
        maxWidth: 500,
        width: '100%',
        borderRadius: 16,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        textAlign: 'center',
        padding: isMobile ? 12 : 24
      }}>
        <div style={{ marginBottom: 16 }}>
          <img 
            src="/logo-pondok.png" 
            alt="Logo Pondok" 
            style={{ width: 80, height: 80, objectFit: 'contain' }}
            onError={(e) => {
              // Jika logo belum ada, tampilkan emoji fallback agar tidak rusak
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = '<span style="font-size: 60px;">😊</span>';
            }}
          />
        </div>

        <Title level={isMobile ? 3 : 2} style={{ color: '#1a365d', marginBottom: 8 }}>
          Selamat datang Ustadz dan Ustadzoh 😊
        </Title>

        <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 24 }}>
          Sistem Informasi Online dan terintegrasi Madrasah Diniyah Ponpes Al-Hamid.
        </Paragraph>

        <Divider style={{ margin: '24px 0' }} />

        <Title level={5} style={{ textAlign: 'left', marginBottom: 16 }}>
          Pilih Menu Untuk Memulai:
        </Title>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Button
            type="primary"
            size="large"
            block
            icon={<BookOutlined />}
            onClick={() => navigate('/nilai')}
            style={{ height: 50, borderRadius: 8, fontSize: 16, background: '#1890ff' }}
          >
            Input Penilaian
          </Button>

          <Button
            size="large"
            block
            icon={<FileTextOutlined />}
            onClick={() => navigate('/laporan-ujian-khusus')}
            style={{ height: 50, borderRadius: 8, fontSize: 16 }}
          >
            Laporan Ujian
          </Button>
        </Space>

        <div style={{ marginTop: 32 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 Tips: Tambahkan halaman ini ke Layar Utama HP Anda untuk akses lebih cepat di kemudian hari.
          </Text>
        </div>
      </Card>
    </div>
  );
}
