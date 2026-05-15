import React from 'react';
import { Typography, Space } from 'antd';
import { EditOutlined, FileTextOutlined, ArrowRightOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;

export function UjianMenu() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  return (
    <div style={{
      padding: isMobile ? 16 : 24,
      background: '#f0f2f5',
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: isMobile ? 40 : 60
    }}>
      <div style={{ maxWidth: 500, width: '100%' }}>
        <Title level={3} style={{ color: '#1a365d', marginBottom: 8, textAlign: 'center', fontWeight: 'bold' }}>
          Menu Ujian
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
          Pilih kategori untuk mulai kelola ujian
        </Text>

        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Kartu 1: Input Soal */}
          <div
            onClick={() => navigate('/lembar-ujian')}
            style={{
              background: '#fff',
              padding: '16px 20px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              borderLeft: '4px solid #1890ff',
              transition: 'all 0.3s'
            }}
            className="menu-card-hover"
          >
            <div style={{
              width: 48,
              height: 48,
              background: '#e6f7ff',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: '#1890ff',
              marginRight: 16
            }}>
              <FileTextOutlined />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 16, color: '#262626' }}>Input Soal</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Buat dan kelola lembar soal ujian santri.</div>
            </div>
            <div style={{ color: '#bfbfbf', fontSize: 16 }}>
              <ArrowRightOutlined />
            </div>
          </div>

          {/* Kartu 2: Input Nilai (Diparkir) */}
          <div
            style={{
              background: '#f5f5f5',
              padding: '16px 20px',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'not-allowed',
              borderLeft: '4px solid #bfbfbf',
              transition: 'all 0.3s',
              opacity: 0.6
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              background: '#f0f0f0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: '#bfbfbf',
              marginRight: 16
            }}>
              <EditOutlined />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: 16, color: '#8c8c8c' }}>Input Nilai <span style={{ color: '#fa8c16', fontSize: '12px' }}>(Parkir)</span></div>
              <div style={{ fontSize: 12, color: '#bfbfbf' }}>Input nilai ujian semester (Dalam Perbaikan).</div>
            </div>
            <div style={{ color: '#d9d9d9', fontSize: 16 }}>
              <LockOutlined />
            </div>
          </div>
        </Space>
      </div>
      
      {/* CSS untuk hover effect */}
      <style>{`
        .menu-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </div>
  );
}

export default UjianMenu;
