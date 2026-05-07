import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  DashboardOutlined, 
  BookOutlined, 
  UserOutlined 
} from '@ant-design/icons';
import './BottomNav.scss';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/nilai',
      icon: <BookOutlined />,
      label: 'Diniyah',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <div 
          key={item.key}
          className={`bottom-nav-item ${location.pathname === item.key ? 'active' : ''}`}
          onClick={() => navigate(item.key)}
        >
          <div className="nav-icon">{item.icon}</div>
          <span className="nav-label">{item.label}</span>
        </div>
      ))}
    </nav>
  );
}
