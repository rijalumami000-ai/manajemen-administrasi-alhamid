import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import MobileMenu from './MobileMenu';
import { BottomNav } from './BottomNav';
import { FloatingRadioBubble } from './FloatingRadioBubble';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../context/AuthContext';
import './Layout.scss';

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile } = useResponsive();
  const { logout } = useAuth();

  const handleMenuClick = () => {
    if (isMobile) {
      setMobileMenuOpen(true);
    } else {
      setCollapsed(prev => !prev);
    }
  };

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''} ${isMobile ? 'is-mobile' : ''}`}>
      {!isMobile && (
        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      )}
      
      <div className="app-main">
        <Header 
          onToggleSidebar={handleMenuClick} 
          collapsed={isMobile ? false : collapsed} 
          isMobile={isMobile}
        />
        
        <main className="app-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>

        {isMobile && <BottomNav />}
      </div>

      <MobileMenu 
        open={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        onLogout={logout}
      />

      <FloatingRadioBubble />
    </div>
  );
}

