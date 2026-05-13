import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOutlined, 
  FileTextOutlined,
  HomeOutlined
} from '@ant-design/icons';
import './BottomNav.scss';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      key: '/welcome',
      icon: <HomeOutlined />,
      label: 'Welcome',
    },
    {
      key: '/nilai',
      icon: <BookOutlined />,
      label: 'Input',
    },
    {
      key: '/laporan-ujian-khusus',
      icon: <FileTextOutlined />,
      label: 'Laporan',
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
