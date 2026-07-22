import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  Menu,
  User,
  LogOut,
  Settings,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import './Header.scss';

export function Header({ onToggleSidebar, collapsed, isMobile }) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (isMobile && isDarkMode) {
      toggleTheme();
    }
  }, [isMobile, isDarkMode, toggleTheme]);

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  const handleProfile = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          {!isMobile && (
            <button
              className="trigger-btn"
              onClick={onToggleSidebar}
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        <div className="header-right">
          <div className="action-icons">
            {!isMobile && (
              <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            )}
            {!isMobile && (
              <button className="icon-btn">
                <Bell size={20} />
                <span className="badge">3</span>
              </button>
            )}
          </div>

          {!isMobile && (
            <div className="custom-user-dropdown-container">
              <div className="user-dropdown" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="avatar">
                  <User size={18} />
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.username || 'Admin'}</span>
                  <span className="user-role">{user?.role || 'Administrator'}</span>
                </div>
              </div>

              {isDropdownOpen && (
                <div className="custom-dropdown-menu" onClick={() => setIsDropdownOpen(false)}>
                  <div className="dropdown-item" onClick={handleProfile}>
                    <User size={16} /> Profil Saya
                  </div>
                  <div className="dropdown-item" onClick={handleProfile}>
                    <Settings size={16} /> Pengaturan
                  </div>
                  <div className="dropdown-divider" />
                  <div className="dropdown-item danger" onClick={() => setShowLogoutConfirm(true)}>
                    <LogOut size={16} /> Logout
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
        title="Konfirmasi Logout"
        content="Apakah Anda yakin ingin keluar dari sistem?"
        confirmText="Ya, Logout"
        type="danger"
      />
    </>
  );
}
