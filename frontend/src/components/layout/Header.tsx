import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { HeaderProps } from '../../types/header';
import {
  Menu,
  User,
  LogOut,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import './Header.scss';

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isMobile }) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isMobile && isDarkMode) {
      toggleTheme();
    }
  }, [isMobile, isDarkMode, toggleTheme]);

  // Click outside to close user dropdown cleanly
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    await logout();
  };

  const handleProfile = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleSettings = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'madrasah_diniyah':
        return 'Madrasah Diniyah';
      case 'bendahara':
        return 'Bendahara';
      case 'guru':
        return 'Dewan Guru';
      default:
        return role || 'Pengguna';
    }
  };

  const getUserInitials = () => {
    if (user?.nama) {
      const parts = user.nama.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return 'AD';
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          {!isMobile && (
            <button
              type="button"
              className="trigger-btn"
              onClick={onToggleSidebar}
              title="Toggle Menu Sidebar"
              aria-label="Toggle Menu Sidebar"
            >
              <Menu size={19} />
            </button>
          )}
        </div>

        <div className="header-right">
          {/* Tactile Dark / Light Mode Switch Pill */}
          {!isMobile && (
            <button 
              type="button"
              className={`theme-switch-pill ${isDarkMode ? 'dark' : 'light'}`} 
              onClick={toggleTheme} 
              title={isDarkMode ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)"}
              aria-label="Toggle Theme"
            >
              <div className="switch-thumb">
                {isDarkMode ? (
                  <Sun size={15} className="theme-icon sun-icon" />
                ) : (
                  <Moon size={15} className="theme-icon moon-icon" />
                )}
              </div>
              <span className="theme-label">
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </button>
          )}

          {/* User Profile Pill & VisionOS Dropdown */}
          {!isMobile && (
            <div className="custom-user-dropdown-container" ref={dropdownRef}>
              <button
                type="button"
                className={`user-profile-pill ${isDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-expanded={isDropdownOpen}
                aria-label="Menu Pengguna"
              >
                <div className="avatar-orb">
                  {getUserInitials()}
                  <span className="status-online-dot"></span>
                </div>
                <div className="user-text-meta">
                  <span className="user-name" title={user?.nama || user?.username || 'Admin'}>
                    {user?.nama || user?.username || 'Admin'}
                  </span>
                  <span className="user-role-chip">
                    {user?.role === 'admin' ? 'Admin' : user?.role === 'madrasah_diniyah' ? 'Madin' : user?.role === 'bendahara' ? 'Finance' : (user?.role || 'Staff')}
                  </span>
                </div>
                <ChevronDown size={14} className={`dropdown-chevron ${isDropdownOpen ? 'rotated' : ''}`} />
              </button>

              {/* Apple VisionOS Liquid Glass Popover Menu */}
              {isDropdownOpen && (
                <div className="custom-dropdown-menu">
                  {/* User Profile Card inside Popover */}
                  <div className="dropdown-user-header">
                    <div className="header-avatar-orb">
                      {getUserInitials()}
                    </div>
                    <div className="header-meta">
                      <div className="header-full-name">{user?.nama || user?.username || 'Administrator'}</div>
                      <div className="header-username">@{user?.username || 'admin'}</div>
                      <div className="header-role-badge">
                        <ShieldCheck size={12} />
                        <span>{getRoleLabel(user?.role)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  {/* Menu Items */}
                  <div className="dropdown-items-list">
                    <button type="button" className="dropdown-item" onClick={handleProfile}>
                      <User size={15} className="item-icon" />
                      <div className="item-text-wrap">
                        <span className="item-title">Profil Saya</span>
                        <span className="item-desc">Lihat dan edit informasi akun</span>
                      </div>
                    </button>

                    <button type="button" className="dropdown-item" onClick={handleSettings}>
                      <Settings size={15} className="item-icon" />
                      <div className="item-text-wrap">
                        <span className="item-title">Pengaturan Akun</span>
                        <span className="item-desc">Preferensi & keamanan</span>
                      </div>
                    </button>

                    <div className="dropdown-divider" />

                    <button 
                      type="button" 
                      className="dropdown-item danger" 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                    >
                      <LogOut size={15} className="item-icon" />
                      <div className="item-text-wrap">
                        <span className="item-title">Keluar dari Sistem</span>
                        <span className="item-desc">Akhiri sesi login saat ini</span>
                      </div>
                    </button>
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
        content="Apakah Anda yakin ingin keluar dari sistem manajemen pesantren?"
        confirmText="Ya, Logout"
        type="danger"
      />
    </>
  );
};

export default Header;
