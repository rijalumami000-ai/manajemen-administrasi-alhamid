import React from 'react';
import { CustomDrawer } from '../ui/CustomDrawer';
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
  const { isAdmin, isDiniyah, isBendahara } = useAuth();

  const navGroups = [
    {
      title: 'Kepesantrenan',
      roleFilter: () => isAdmin(),
      items: [
        { key: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { key: '/radio', icon: <Radio size={18} />, label: 'Radio & Musik' },
        { key: '/santri', icon: <Users size={18} />, label: 'Data Santri' },
        { key: '/buku-induk', icon: <BookOpen size={18} />, label: 'Buku Induk' },
        { key: '/kamar', icon: <Home size={18} />, label: 'Data Kamar' },
        { key: '/absensi-sholat', icon: <Camera size={18} />, label: 'Absensi Sholat' },
        { key: '/rekap-absensi-sholat', icon: <ClipboardList size={18} />, label: 'Rekap Absensi' },
        { key: '/pelanggaran-prestasi', icon: <Award size={18} />, label: 'Pelanggaran & Prestasi' },
      ]
    },
    {
      title: 'Akademik Diniyah',
      roleFilter: () => isAdmin() || isDiniyah(),
      items: [
        { key: '/kelas', icon: <School size={18} />, label: 'Data Kelas' },
        { key: '/guru', icon: <Contact size={18} />, label: 'Data Guru' },
        { key: '/struktur-organisasi', icon: <Users size={18} />, label: 'Struktur Organisasi' },
        { key: '/jadwal-pelajaran', icon: <Clock size={18} />, label: 'Jadwal Harian' },
        { key: '/nilai-pengaturan', icon: <Sliders size={18} />, label: 'Pengaturan & Jadwal' },
        { key: '/nilai', icon: <Edit size={18} />, label: 'Input Penilaian' },
        { key: '/scan-nilai', icon: <Scan size={18} />, label: 'Scan Nilai' },
        { key: '/nilai-rekap', icon: <FileSpreadsheet size={18} />, label: 'Rekap & Rapor' },
        { key: '/laporan-ujian-khusus', icon: <FileText size={18} />, label: 'Laporan Ujian Khusus' },
        { key: '/kartu-ujian-semester', icon: <IdCard size={18} />, label: 'Kartu Ujian Semester' },
        { key: '/lembar-ujian', icon: <FileText size={18} />, label: 'Lembar Ujian' },
        { key: '/alumni', icon: <GraduationCap size={18} />, label: 'Alumni' },
      ]
    },
    {
      title: 'Keuangan',
      roleFilter: () => isAdmin() || isBendahara(),
      items: [
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
    {
      title: 'Pengaturan',
      roleFilter: () => isAdmin(),
      items: [
        { key: '/users', icon: <ShieldCheck size={18} />, label: 'User Management' },
        { key: '/mymustahiq-settings', icon: <Settings size={18} />, label: 'Setelan MyMustahiq' },
        { key: '/profile', icon: <User size={18} />, label: 'Profile' },
      ]
    }
  ];

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      placement="left"
      width={280}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: 'linear-gradient(135deg, #2196f3 0%, #8b5cf6 100%)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>SI</div>
          <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Sekolah Info</span>
        </div>
      }
    >
      <div className="custom-mobile-menu-body">
        {navGroups.filter(g => g.roleFilter()).map((group, gIdx) => (
          <div key={gIdx} className="nav-group">
            <h5 className="nav-group-title">{group.title}</h5>
            <div className="nav-items-list">
              {group.items.map((item) => {
                const isActive = location.pathname === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`nav-item-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleNav(item.key)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mobile-menu-footer-btn">
          <button type="button" className="btn-custom btn-danger w-full" onClick={() => { onLogout(); onClose(); }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </CustomDrawer>
  );
};

export default MobileMenu;
