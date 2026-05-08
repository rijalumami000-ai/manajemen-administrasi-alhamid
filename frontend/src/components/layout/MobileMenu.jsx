import React from 'react';
import { Drawer, Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  HomeOutlined,
  TrophyOutlined,
  SafetyOutlined,
  SettingOutlined,
  BankOutlined,
  EditOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MobileMenu.scss';

const MobileMenu = ({ open, onClose, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    {
      key: 'grp-pesantren',
      label: 'Pesantren',
      type: 'group',
      children: [
        { key: '/santri', icon: <TeamOutlined />, label: 'Data Santri' },
        { key: '/kamar', icon: <HomeOutlined />, label: 'Data Kamar' },
        { key: '/pelanggaran-prestasi', icon: <TrophyOutlined />, label: 'Pelanggaran & Prestasi' },
      ],
    },
    {
      key: 'grp-diniyah',
      label: 'Madrasah Diniyah',
      type: 'group',
      children: [
        { key: '/kelas', icon: <BookOutlined />, label: 'Data Kelas' },
        { key: '/guru', icon: <UserOutlined />, label: 'Data Guru' },
        { key: '/nilai', icon: <EditOutlined />, label: 'Input Penilaian' },
        { key: '/nilai-rekap', icon: <BookOutlined />, label: 'Rekap & Rapot' },
        { key: '/laporan-muhafadzoh', icon: <BookOutlined />, label: 'Laporan Muhafadzoh' },
        { key: '/nilai-pengaturan', icon: <SettingOutlined />, label: 'Pengaturan' },
      ],
    },
    { key: '/alumni', icon: <TeamOutlined />, label: 'Alumni' },
    ...(isAdmin() ? [{ key: '/users', icon: <SafetyOutlined />, label: 'User Management' }] : []),
    { key: '/profile', icon: <SettingOutlined />, label: 'Profile' },
  ];

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      onLogout();
    } else {
      navigate(key);
    }
    onClose();
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: '#0052FF', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold'
          }}>SI</div>
          <span>Sekolah Info</span>
        </div>
      }
      placement="left"
      onClose={onClose}
      open={open}
      className="mobile-menu-drawer"
      width={280}
    >
      <div className="mobile-menu-content">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="mobile-menu"
        />

        <div className="mobile-menu-footer">
          <button className="logout-btn" onClick={() => { onLogout(); onClose(); }}>
            <LogoutOutlined /> Logout
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default MobileMenu;
