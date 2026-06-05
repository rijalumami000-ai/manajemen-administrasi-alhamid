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
  EditOutlined,
  IdcardOutlined,
  CameraOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import './Sidebar.scss';
import { settingsService } from '../../services/settingsService';

export function Sidebar({ collapsed, onCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isStaff } = useAuth();
  
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
  const [openKeys, setOpenKeys] = useState([]);

  // Set initial open keys
  useEffect(() => {
    if (!collapsed) {
      setOpenKeys(isStaff() ? ['sub-pesantren'] : ['sub-pesantren', 'sub-diniyah']);
    }
  }, [collapsed, isStaff]);

  // Update open keys when collapsed state changes or location changes
  useEffect(() => {
    if (collapsed) {
      setOpenKeys([]);
    } else {
      // Re-open relevant keys based on current path when expanding
      if (['/santri', '/kelas', '/kamar', '/pelanggaran-prestasi'].includes(location.pathname)) {
        setOpenKeys(['sub-pesantren']);
      } else if (['/guru'].includes(location.pathname) && !isStaff()) {
        setOpenKeys(['sub-diniyah']);
      } else {
        setOpenKeys(isStaff() ? ['sub-pesantren'] : ['sub-pesantren', 'sub-diniyah']);
      }
    }
  }, [collapsed, location.pathname, isStaff]);

  const onOpenChange = (keys) => {
    // Prevent staff from opening sub-diniyah
    if (isStaff()) {
      setOpenKeys(keys.filter(key => key !== 'sub-diniyah'));
    } else {
      setOpenKeys(keys);
    }
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard', disabled: isStaff() },
    {
      key: 'sub-pesantren',
      icon: <BankOutlined />,
      label: 'Pesantren',
      children: [
        { key: '/santri', icon: <TeamOutlined />, label: 'Data Santri' },
        { key: '/buku-induk', icon: <BookOutlined />, label: 'Buku Induk' },
        { key: '/kamar', icon: <HomeOutlined />, label: 'Data Kamar' },
        { key: '/absensi-sholat', icon: <CameraOutlined />, label: 'Absensi Sholat' },
        { key: '/rekap-absensi-sholat', icon: <BookOutlined />, label: 'Rekap Absensi Sholat' },
        { key: '/pelanggaran-prestasi', icon: <TrophyOutlined />, label: 'Pelanggaran & Prestasi' },
      ],
    },
    {
      key: 'sub-diniyah',
      icon: <BookOutlined />,
      label: 'Madrasah Diniyah',
      disabled: isStaff(),
      children: [
        { key: '/kelas', icon: <BookOutlined />, label: 'Data Kelas', disabled: isStaff() },
        { key: '/guru', icon: <UserOutlined />, label: 'Data Guru', disabled: isStaff() },
        { key: '/nilai-pengaturan', icon: <SettingOutlined />, label: 'Pengaturan & Jadwal', disabled: isStaff() },
        { key: '/nilai', icon: <EditOutlined />, label: 'Input Penilaian', disabled: isStaff() },
        { key: '/scan-nilai', icon: <CameraOutlined />, label: 'Manajemen Scan Nilai', disabled: isStaff() },
        { key: '/nilai-rekap', icon: <BookOutlined />, label: 'Rekap & Rapot', disabled: isStaff() },
        { key: '/laporan-ujian-khusus', icon: <BookOutlined />, label: 'Laporan Ujian Khusus', disabled: isStaff() },
        { key: '/kartu-ujian-semester', icon: <IdcardOutlined />, label: 'Kartu Ujian Semester', disabled: isStaff() },
        { key: '/lembar-ujian', icon: <FileTextOutlined />, label: 'Lembar Ujian', disabled: isStaff() },
      ],
    },
    { key: '/alumni', icon: <UsergroupAddOutlined />, label: 'Alumni', disabled: isStaff() },
    ...(isAdmin() || isStaff() ? [{ 
      key: '/users', 
      icon: <SafetyOutlined />, 
      label: 'User Management',
      disabled: isStaff()
    }] : []),
    { key: '/profile', icon: <SettingOutlined />, label: 'Profile', disabled: isStaff() },
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
