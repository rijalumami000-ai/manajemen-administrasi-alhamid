import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  Edit,
  FileText
} from 'lucide-react';
import './BottomNav.scss';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      key: '/welcome',
      icon: <Home size={18} />,
      label: 'Welcome',
    },
    {
      key: '/nilai',
      icon: <BookOpen size={18} />,
      label: 'Input',
    },
    {
      key: '/ujian',
      icon: <Edit size={18} />,
      label: 'Ujian',
    },
    {
      key: '/laporan-ujian-khusus',
      icon: <FileText size={18} />,
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
