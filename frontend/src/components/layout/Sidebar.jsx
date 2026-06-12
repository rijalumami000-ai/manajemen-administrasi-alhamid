import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { settingsService } from '../../services/settingsService';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Home,
  Camera,
  ClipboardList,
  Award,
  School,
  Contact,
  Sliders,
  Edit,
  Scan,
  FileSpreadsheet,
  FileText,
  IdCard,
  GraduationCap,
  ShieldCheck,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Star,
  Clock,
  LogOut,
  ChevronLeft,
  Radio
} from 'lucide-react';
import './Sidebar.scss';

// Icon Map for dynamic lookup of lucide icons
const IconMap = {
  LayoutDashboard,
  Users,
  BookOpen,
  Home,
  Camera,
  ClipboardList,
  Award,
  School,
  Contact,
  Sliders,
  Edit,
  Scan,
  FileSpreadsheet,
  FileText,
  IdCard,
  GraduationCap,
  ShieldCheck,
  User,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Star,
  Clock,
  LogOut,
  ChevronLeft,
  Radio
};

const renderIcon = (name, props = {}) => {
  const IconComponent = IconMap[name];
  if (!IconComponent) return null;
  return <IconComponent size={18} {...props} />;
};

export function Sidebar({ collapsed, onCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isStaff, logout } = useAuth();
  
  const [appName, setAppName] = useState('Sekolah Info');
  const [appLogo, setAppLogo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastLogin, setLastLogin] = useState('');
  
  // Custom states for Favorites and Recents
  const [favorites, setFavorites] = useState([]);
  const [recents, setRecents] = useState([]);
  
  // Custom state for expanded accordion groups
  const [expandedGroups, setExpandedGroups] = useState({
    'sub-pesantren': true,
    'sub-diniyah': false,
    'system': false
  });

  // Collapsed hover states for tooltips and floating submenus
  const [hoveredGroupId, setHoveredGroupId] = useState(null);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  // Load app settings
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

  // Generate dynamic-like session last login time
  useEffect(() => {
    let time = sessionStorage.getItem('last_login_time');
    if (!time) {
      const now = new Date();
      time = now.toLocaleDateString('id-ID', { weekday: 'long' }) + ' ' + 
             now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      sessionStorage.setItem('last_login_time', time);
    }
    setLastLogin(time);
  }, []);

  // Load Favorites from localStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem('sidebar_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Load Recents from localStorage
  useEffect(() => {
    const savedRecents = localStorage.getItem('sidebar_recents');
    if (savedRecents) {
      try {
        setRecents(JSON.parse(savedRecents));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Set initial expanded keys based on collapsed state and role
  useEffect(() => {
    if (!collapsed) {
      setExpandedGroups({
        'sub-pesantren': true,
        'sub-diniyah': !isStaff(),
        'system': false
      });
    }
  }, [collapsed, isStaff]);

  // Menu structure definition matching roles
  const groups = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'LayoutDashboard',
      collapsible: false,
      items: [
        { key: '/', icon: 'LayoutDashboard', label: 'Dashboard', disabled: isStaff() },
        { key: '/radio', icon: 'Radio', label: 'Radio & Musik' }
      ]
    },
    {
      id: 'sub-pesantren',
      label: 'Kepesantrenan',
      icon: 'School',
      collapsible: true,
      items: [
        { key: '/santri', icon: 'Users', label: 'Data Santri' },
        { key: '/buku-induk', icon: 'BookOpen', label: 'Buku Induk' },
        { key: '/kamar', icon: 'Home', label: 'Data Kamar' },
        { key: '/absensi-sholat', icon: 'Camera', label: 'Absensi Sholat' },
        { key: '/rekap-absensi-sholat', icon: 'ClipboardList', label: 'Rekap Absensi' },
        { key: '/pelanggaran-prestasi', icon: 'Award', label: 'Pelanggaran & Prestasi' },
      ]
    },
    {
      id: 'sub-diniyah',
      label: 'Akademik Diniyah',
      icon: 'BookOpen',
      collapsible: true,
      disabled: isStaff(),
      items: [
        { key: '/kelas', icon: 'School', label: 'Data Kelas', disabled: isStaff() },
        { key: '/guru', icon: 'Contact', label: 'Data Guru', disabled: isStaff() },
        { key: '/nilai-pengaturan', icon: 'Sliders', label: 'Pengaturan & Jadwal', disabled: isStaff() },
        { key: '/nilai', icon: 'Edit', label: 'Input Penilaian', disabled: isStaff() },
        { key: '/scan-nilai', icon: 'Scan', label: 'Scan Nilai', disabled: isStaff() },
        { key: '/nilai-rekap', icon: 'FileSpreadsheet', label: 'Rekap & Rapor', disabled: isStaff() },
        { key: '/laporan-ujian-khusus', icon: 'FileText', label: 'Laporan Ujian Khusus', disabled: isStaff() },
        { key: '/kartu-ujian-semester', icon: 'IdCard', label: 'Kartu Ujian Semester', disabled: isStaff() },
        { key: '/lembar-ujian', icon: 'FileText', label: 'Lembar Ujian', disabled: isStaff() },
      ]
    },
    {
      id: 'alumni-group',
      label: 'Alumni',
      icon: 'GraduationCap',
      collapsible: false,
      items: [
        { key: '/alumni', icon: 'GraduationCap', label: 'Alumni', disabled: isStaff() }
      ]
    },
    {
      id: 'system',
      label: 'Sistem',
      icon: 'Settings',
      collapsible: true,
      items: [
        ...(isAdmin() || isStaff() ? [{ 
          key: '/users', 
          icon: 'ShieldCheck', 
          label: 'User Management',
          disabled: isStaff()
        }] : []),
        { key: '/profile', icon: 'User', label: 'Profile', disabled: isStaff() }
      ]
    }
  ];

  // Helper to find a menu item details by key
  const getMenuItemByKey = (key) => {
    for (const group of groups) {
      const item = group.items.find(i => i.key === key);
      if (item) return item;
    }
    return null;
  };

  // Add pages to recent list when visited
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === '/' || currentPath === '/login' || currentPath === '/welcome') return;
    
    const matchedItem = getMenuItemByKey(currentPath);
    if (matchedItem && !matchedItem.disabled) {
      setRecents(prev => {
        const filtered = prev.filter(k => k !== currentPath);
        const updated = [currentPath, ...filtered].slice(0, 4);
        localStorage.setItem('sidebar_recents', JSON.stringify(updated));
        return updated;
      });
    }
  }, [location.pathname]);

  // Toggle favorite pin
  const toggleFavorite = (itemKey, e) => {
    e.stopPropagation();
    let updated;
    if (favorites.includes(itemKey)) {
      updated = favorites.filter(k => k !== itemKey);
    } else {
      updated = [...favorites, itemKey];
    }
    setFavorites(updated);
    localStorage.setItem('sidebar_favorites', JSON.stringify(updated));
  };

  // Toggle group expansion
  const toggleGroup = (groupId) => {
    if (collapsed) return;
    const group = groups.find(g => g.id === groupId);
    if (group && group.disabled) return;
    
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Handle click on menu item
  const handleItemClick = (key, disabled) => {
    if (disabled) return;
    navigate(key);
  };

  // Handle user logout
  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin logout?')) {
      await logout();
    }
  };

  // Filter groups based on search query
  const getFilteredGroups = () => {
    if (!searchQuery.trim()) return groups;
    
    const query = searchQuery.toLowerCase();
    return groups.map(group => {
      if (group.disabled) return null;
      
      const matchedItems = group.items.filter(item => 
        item.label.toLowerCase().includes(query)
      );
      
      if (matchedItems.length > 0 || group.label.toLowerCase().includes(query)) {
        return {
          ...group,
          items: matchedItems.length > 0 ? matchedItems : group.items,
          isSearchMatch: true
        };
      }
      return null;
    }).filter(Boolean);
  };

  const activeFilteredGroups = getFilteredGroups();
  const isSearching = searchQuery.trim().length > 0;

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Branding Header Area */}
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon-wrapper">
            {appLogo ? (
              <img src={appLogo} alt="logo" className="brand-logo" />
            ) : (
              <div className="default-logo">SI</div>
            )}
            <span className="online-indicator"></span>
          </div>
          {!collapsed && (
            <div className="brand-info">
              <span className="logo-text">{appName}</span>
              <span className="system-subtitle">Pesantren Management</span>
            </div>
          )}
        </div>
      </div>

      {/* Internal Menu Search */}
      <div className="sidebar-search-container">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={collapsed ? "" : "Search modules..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={collapsed}
            className="search-input"
          />
          {!collapsed && searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <nav className="sidebar-nav">
        {/* FAVORITES (⭐ Pin) - Only when expanded & no search query & has favs */}
        {!collapsed && !isSearching && favorites.length > 0 && (
          <div className="nav-group-section favorites-section">
            <span className="group-header">
              <Star size={12} fill="#FFB300" stroke="#FFB300" style={{ marginRight: '6px' }} />
              Favorit
            </span>
            <ul className="group-list">
              {favorites.map(key => {
                const item = getMenuItemByKey(key);
                if (!item) return null;
                const isActive = location.pathname === item.key;
                return (
                  <li
                    key={`fav-${item.key}`}
                    className={`nav-item ${isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                    onClick={() => handleItemClick(item.key, item.disabled)}
                  >
                    <span className="nav-item-icon">{renderIcon(item.icon)}</span>
                    <span className="nav-item-label">{item.label}</span>
                    <button 
                      className="fav-pin-btn pinned" 
                      onClick={(e) => toggleFavorite(item.key, e)}
                    >
                      <Star size={14} fill="#FFB300" stroke="#FFB300" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* RECENTS (🕘 Last Visited) - Only when expanded & no search query & has recents */}
        {!collapsed && !isSearching && recents.length > 0 && (
          <div className="nav-group-section recents-section">
            <span className="group-header">
              <Clock size={12} style={{ marginRight: '6px' }} />
              Terakhir Diakses
            </span>
            <ul className="group-list">
              {recents.map(key => {
                const item = getMenuItemByKey(key);
                if (!item) return null;
                const isActive = location.pathname === item.key;
                return (
                  <li
                    key={`recent-${item.key}`}
                    className={`nav-item ${isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                    onClick={() => handleItemClick(item.key, item.disabled)}
                  >
                    <span className="nav-item-icon">{renderIcon(item.icon)}</span>
                    <span className="nav-item-label">{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* MAIN GROUPS */}
        {activeFilteredGroups.map(group => {
          const isExpanded = expandedGroups[group.id] || isSearching;
          const isGroupDisabled = group.disabled;
          
          if (collapsed) {
            // Collapsed Mode Rendering (Group Icons with Hover Popups)
            return (
              <div 
                key={group.id} 
                className={`collapsed-group-trigger ${isGroupDisabled ? 'disabled' : ''}`}
                onMouseEnter={() => !isGroupDisabled && setHoveredGroupId(group.id)}
                onMouseLeave={() => setHoveredGroupId(null)}
              >
                <div className="collapsed-group-icon">
                  {renderIcon(group.icon)}
                </div>

                {hoveredGroupId === group.id && (
                  <div className="floating-submenu-popover">
                    <div className="popover-title">{group.label}</div>
                    <ul className="popover-list">
                      {group.items.map(item => {
                        const isActive = location.pathname === item.key;
                        return (
                          <li
                            key={item.key}
                            className={`popover-item ${isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                            onClick={() => handleItemClick(item.key, item.disabled)}
                          >
                            {renderIcon(item.icon)}
                            <span>{item.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          }

          // Expanded Mode Rendering (Accordion Section)
          return (
            <div 
              key={group.id} 
              className={`nav-group-section ${group.id}-section ${isExpanded ? 'expanded' : ''} ${isGroupDisabled ? 'disabled' : ''}`}
            >
              {group.collapsible ? (
                <div 
                  className="group-header-interactive" 
                  onClick={() => toggleGroup(group.id)}
                >
                  <span className="group-title-wrapper">
                    {renderIcon(group.icon, { className: 'group-section-icon', size: 14 })}
                    {group.label}
                  </span>
                  {!isSearching && (
                    <span className="accordion-chevron">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  )}
                </div>
              ) : (
                <span className="group-header">{group.label}</span>
              )}

              {/* Child Links Container with height transition */}
              <div className="group-content-wrapper">
                <ul className="group-list">
                  {group.items.map(item => {
                    const isActive = location.pathname === item.key;
                    const isFav = favorites.includes(item.key);
                    return (
                      <li
                        key={item.key}
                        className={`nav-item ${isActive ? 'active' : ''} ${item.disabled ? 'disabled' : ''}`}
                        onClick={() => handleItemClick(item.key, item.disabled)}
                      >
                        <span className="nav-item-icon">{renderIcon(item.icon)}</span>
                        <span className="nav-item-label">{item.label}</span>
                        {!item.disabled && (
                          <button 
                            className={`fav-pin-btn ${isFav ? 'pinned' : ''}`} 
                            onClick={(e) => toggleFavorite(item.key, e)}
                          >
                            <Star size={14} fill={isFav ? '#FFB300' : 'none'} stroke={isFav ? '#FFB300' : 'currentColor'} />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Smart Profile Footer */}
      <div className="sidebar-footer">
        {collapsed ? (
          <div 
            className="collapsed-profile-btn"
            onMouseEnter={() => setHoveredTooltip('profile-footer')}
            onMouseLeave={() => setHoveredTooltip(null)}
            onClick={() => handleItemClick('/profile', isStaff())}
          >
            <div className="profile-avatar">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            {hoveredTooltip === 'profile-footer' && (
              <div className="floating-tooltip">
                <div className="tooltip-name">{user?.nama || user?.username || 'Admin'}</div>
                <div className="tooltip-role">{user?.role || 'Administrator'}</div>
                <div className="tooltip-action" onClick={handleLogout}>Click to Logout</div>
              </div>
            )}
          </div>
        ) : (
          <div className="user-profile-card">
            <div className="user-avatar-wrapper">
              <div className="profile-avatar">
                {user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <span className="user-online-badge"></span>
            </div>
            <div className="user-details">
              <span className="user-name" title={user?.nama || user?.username || 'Admin'}>
                {user?.nama || user?.username || 'Admin'}
              </span>
              <span className="user-role-badge">
                {user?.role || 'Administrator'}
              </span>
              {lastLogin && (
                <span className="last-login-text">
                  Login: {lastLogin}
                </span>
              )}
            </div>
            <div className="footer-actions">
              <button 
                className="footer-icon-btn settings-btn" 
                title="Profile & Settings"
                onClick={() => handleItemClick('/profile', isStaff())}
                disabled={isStaff()}
              >
                <Settings size={16} />
              </button>
              <button 
                className="footer-icon-btn logout-btn" 
                title="Logout System"
                onClick={handleLogout}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Sidebar Collapse Toggle Button */}
        <button 
          className="collapse-toggle-btn" 
          onClick={() => onCollapse(!collapsed)}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
