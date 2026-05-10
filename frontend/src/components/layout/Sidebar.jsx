import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  BookOutlined,
  HomeOutlined,
  TrophyOutlined,
  SafetyOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
  LeftOutlined,
  RightOutlined,
  BankOutlined,
  EditOutlined
} from '@ant-design/icons';
import './Sidebar.scss';
import { settingsService } from '../../services/settingsService';

export function Sidebar({ collapsed, onCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  const [appName, setAppName] = useState('Sekolah Info');
  const [appLogo, setAppLogo] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await settingsService.fetchSettings();
        if (settings.app_name) setAppName(settings.app_name);
        if (settings.app_logo) setAppLogo(settings.app_logo);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);
  
  // State for open submenus (so they don't auto-close when navigating)
  const [openKeys, setOpenKeys] = useState(['sub-pesantren', 'sub-diniyah']);

  // Update open keys when collapsed state changes
  useEffect(() => {
    if (collapsed) {
      setOpenKeys([]);
    } else {
      // Re-open relevant keys based on current path when expanding
      if (['/santri', '/kelas', '/kamar', '/pelanggaran-prestasi'].includes(location.pathname)) {
        setOpenKeys(['sub-pesantren']);
      } else if (['/guru'].includes(location.pathname)) {
        setOpenKeys(['sub-diniyah']);
      } else {
        setOpenKeys(['sub-pesantren', 'sub-diniyah']);
      }
    }
  }, [collapsed, location.pathname]);

  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    {
      key: 'sub-pesantren',
      icon: <BankOutlined />,
      label: 'Pesantren',
      children: [
        { key: '/santri', icon: <TeamOutlined />, label: 'Data Santri' },
        { key: '/kamar', icon: <HomeOutlined />, label: 'Data Kamar' },
        { key: '/pelanggaran-prestasi', icon: <TrophyOutlined />, label: 'Pelanggaran & Prestasi' },
      ],
    },
    {
      key: 'sub-diniyah',
      icon: <BookOutlined />,
      label: 'Madrasah Diniyah',
      children: [
        { key: '/kelas', icon: <BookOutlined />, label: 'Data Kelas' },
        { key: '/guru', icon: <UserOutlined />, label: 'Data Guru' },
        { key: '/nilai-pengaturan', icon: <SettingOutlined />, label: 'Pengaturan & Jadwal' },
        { key: '/nilai', icon: <EditOutlined />, label: 'Input Penilaian' },
        { key: '/nilai-rekap', icon: <BookOutlined />, label: 'Rekap & Rapot' },
        { key: '/laporan-muhafadzoh', icon: <BookOutlined />, label: 'Laporan Muhafadzoh' },
      ],
    },
    { key: '/alumni', icon: <UsergroupAddOutlined />, label: 'Alumni' },
    ...(isAdmin() ? [{ key: '/users', icon: <SafetyOutlined />, label: 'User Management' }] : []),
    { key: '/profile', icon: <SettingOutlined />, label: 'Profile' },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  // Determine selected keys based on location
  const selectedKeys = [location.pathname];

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-icon">{appLogo ? <img src={appLogo} alt="logo" style={{ width: '100%', height: '100%', borderRadius: '4px' }} /> : 'SI'}</div>
        {!collapsed && <span className="logo-text">{appName}</span>}
      </div>

      <nav className="sidebar-nav">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          openKeys={openKeys}
          onOpenChange={onOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
          className="custom-antd-menu"
          inlineIndent={24}
        />
      </nav>

      <div className="sidebar-footer">
        <button className="collapse-btn" onClick={() => onCollapse(!collapsed)}>
          {collapsed ? <RightOutlined /> : <LeftOutlined />}
        </button>
      </div>
    </aside>
  );
}
