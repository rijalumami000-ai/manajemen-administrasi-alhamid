import React, { useEffect } from 'react';
import { Dropdown, Modal } from 'antd';
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

  useEffect(() => {
    if (isMobile && isDarkMode) {
      toggleTheme();
    }
  }, [isMobile, isDarkMode, toggleTheme]);

  const handleLogout = () => {
    Modal.confirm({
      title: 'Konfirmasi Logout',
      content: 'Apakah Anda yakin ingin logout?',
      okText: 'Logout',
      cancelText: 'Batal',
      okType: 'danger',
      onOk: async () => {
        await logout();
      }
    });
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
        {!isMobile && (
          <button
            className="trigger-btn"
            onClick={onToggleSidebar}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        )}
      </div>

      <div className="header-right">
        <div className="action-icons">
          {!isMobile && (
            <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
              {isDarkMode ? <SunOutlined /> : <MoonOutlined />}
            </button>
          )}
          {!isMobile && (
            <button className="icon-btn">
              <BellOutlined />
              <span className="badge">3</span>
            </button>
          )}
        </div>

        {!isMobile && (
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <div className="user-dropdown">
              <div className="avatar">
                <UserOutlined />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.username || 'Admin'}</span>
                <span className="user-role">{user?.role || 'Administrator'}</span>
              </div>
            </div>
          </Dropdown>
        )}
      </div>
    </header>
  );
}
