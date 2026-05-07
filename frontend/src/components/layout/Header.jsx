import { Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import './Header.scss';

export function Header({ onToggleSidebar, collapsed, isMobile }) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      await logout();
    }
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: handleProfile,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: handleProfile,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="trigger-btn"
          onClick={onToggleSidebar}
        >
          {isMobile ? <MenuOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
        </button>
        {!isMobile && (
          <div className="header-search">
            <input type="text" placeholder="Search..." className="search-input" />
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="action-icons">
          <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {isDarkMode ? <SunOutlined /> : <MoonOutlined />}
          </button>
          {!isMobile && (
            <button className="icon-btn">
              <BellOutlined />
              <span className="badge">3</span>
            </button>
          )}
        </div>

        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <div className="user-dropdown">
            <div className="avatar">
              <UserOutlined />
            </div>
            {!isMobile && (
              <div className="user-info">
                <span className="user-name">{user?.username || 'Admin'}</span>
                <span className="user-role">{user?.role || 'Administrator'}</span>
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
