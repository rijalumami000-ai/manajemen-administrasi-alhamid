import React from 'react';
import { Drawer, Menu } from 'antd';
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
  LogOut,
  Radio,
  Wallet,
  BarChart3,
  Zap,
  ShieldAlert,
  Settings,
  Clock
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MobileMenu.scss';

const MobileMenu = ({ open, onClose, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isStaff, isDiniyah, isBendahara } = useAuth();

  const menuItems = [
    { key: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard', disabled: isStaff() },
    { key: '/radio', icon: <Radio size={18} />, label: 'Radio & Musik' },
    {
      key: 'grp-pesantren',
      label: 'Kepesantrenan',
      type: 'group',
      children: [
        { key: '/santri', icon: <Users size={18} />, label: 'Data Santri' },
        { key: '/buku-induk', icon: <BookOpen size={18} />, label: 'Buku Induk' },
        { key: '/kamar', icon: <Home size={18} />, label: 'Data Kamar' },
        { key: '/absensi-sholat', icon: <Camera size={18} />, label: 'Absensi Sholat' },
        { key: '/rekap-absensi-sholat', icon: <ClipboardList size={18} />, label: 'Rekap Absensi' },
        { key: '/pelanggaran-prestasi', icon: <Award size={18} />, label: 'Pelanggaran & Prestasi' },
      ],
    },
    {
      key: 'grp-diniyah',
      label: 'Akademik Diniyah',
      type: 'group',
      disabled: isStaff(),
      children: [
        { key: '/kelas', icon: <School size={18} />, label: 'Data Kelas', disabled: isStaff() },
        { key: '/guru', icon: <Contact size={18} />, label: 'Data Guru', disabled: isStaff() },
        { key: '/struktur-organisasi', icon: <Users size={18} />, label: 'Struktur Organisasi', disabled: isStaff() },
        { key: '/jadwal-pelajaran', icon: <Clock size={18} />, label: 'Jadwal Harian', disabled: isStaff() },
        { key: '/nilai-pengaturan', icon: <Sliders size={18} />, label: 'Pengaturan & Jadwal', disabled: isStaff() },
        { key: '/nilai', icon: <Edit size={18} />, label: 'Input Penilaian', disabled: isStaff() },
        { key: '/scan-nilai', icon: <Scan size={18} />, label: 'Scan Nilai', disabled: isStaff() },
        { key: '/nilai-rekap', icon: <FileSpreadsheet size={18} />, label: 'Rekap & Rapor', disabled: isStaff() },
        { key: '/laporan-ujian-khusus', icon: <FileText size={18} />, label: 'Laporan Ujian Khusus', disabled: isStaff() },
        { key: '/kartu-ujian-semester', icon: <IdCard size={18} />, label: 'Kartu Ujian Semester', disabled: isStaff() },
        { key: '/lembar-ujian', icon: <FileText size={18} />, label: 'Lembar Ujian', disabled: isStaff() },
        { key: '/alumni', icon: <GraduationCap size={18} />, label: 'Alumni', disabled: isStaff() },
      ],
    },
    {
      key: 'grp-keuangan',
      label: 'Keuangan',
      type: 'group',
      children: [
        { key: '/keuangan', icon: <LayoutDashboard size={18} />, label: 'Dashboard Keuangan' },
        { key: '/keuangan/tagihan', icon: <FileText size={18} />, label: 'Tagihan Santri' },
        { key: '/keuangan/laporan/spp', icon: <BarChart3 size={18} />, label: 'Laporan SPP' },
        { key: '/keuangan/laporan/daftar-ulang', icon: <Users size={18} />, label: 'Laporan Daftar Ulang' },
        { key: '/keuangan/laporan/event', icon: <Zap size={18} />, label: 'Laporan Event' },
        { key: '/keuangan/kas', icon: <BookOpen size={18} />, label: 'Buku Kas Keluar' },
        ...(isAdmin() ? [
          { key: '/keuangan/setup', icon: <Settings size={18} />, label: 'Setup Keuangan' },
          { key: '/keuangan/audit', icon: <ShieldAlert size={18} />, label: 'Log Audit Keuangan' }
        ] : [])
      ]
    },
    ...(isAdmin() ? [{ 
      key: '/users', 
      icon: <ShieldCheck size={18} />, 
      label: 'User Management',
      disabled: false
    }] : []),
    { key: '/profile', icon: <User size={18} />, label: 'Profile', disabled: !isAdmin() },
  ];

  // Helper to filter items based on user role
  const getFilteredItems = (items) => {
    return items.filter(item => {
      if (isAdmin()) return true;
      if (isDiniyah()) return item.key === 'grp-diniyah';
      if (isBendahara()) return item.key === 'grp-keuangan';
      return false;
    });
  };

  const visibleMenuItems = getFilteredItems(menuItems);

  const handleMenuClick = ({ key }) => {
    if (key === 'logout') {
      onLogout();
    } else {
      navigate(key);
    }
    onClose();
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            background: 'linear-gradient(135deg, #2F81F7 0%, #8A2BE2 100%)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            boxShadow: '0 0 10px rgba(47, 129, 247, 0.3)'
          }}>SI</div>
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>Sekolah Info</span>
        </div>
      }
      placement="left"
      onClose={onClose}
      open={open}
      className="mobile-menu-drawer"
      width={290}
    >
      <div className="mobile-menu-content">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={visibleMenuItems}
          onClick={handleMenuClick}
          className="mobile-menu"
        />

        <div className="mobile-menu-footer">
          <button className="logout-btn" onClick={() => { onLogout(); onClose(); }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default MobileMenu;
