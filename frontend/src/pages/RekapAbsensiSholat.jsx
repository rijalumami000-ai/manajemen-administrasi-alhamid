import { useState, useEffect, useMemo } from 'react';
import { Select, message, Button } from 'antd';
import { FileDown, RotateCcw, TrendingUp, Users, UserX, Target } from 'lucide-react';
import { absensiSholatService } from '../services/absensiSholatService';
import { santriService } from '../services/santriService';
import { DataGrid } from '../components/ui/DataGrid';
import { PrayerCard } from '../components/ui/PrayerCard';
import { StatusPill } from '../components/ui/StatusPill';
import { exportToExcel } from '../utils/exportUtils';
import './RekapAbsensiSholat.scss';

const { Option } = Select;
const API_BASE = import.meta.env.VITE_API_URL || '';

export function RekapAbsensiSholat() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  
  // Filters
  const now = new Date();
  const [selectedBulan, setSelectedBulan] = useState(now.getMonth() + 1);
  const [selectedTahun, setSelectedTahun] = useState(now.getFullYear());
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [selectedKamar, setSelectedKamar] = useState(null);
  const [selectedJenisKelamin, setSelectedJenisKelamin] = useState(null);
  const [selectedSholat, setSelectedSholat] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);

  const sholatOptions = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'];
  const statusOptions = ['Hadir', 'Sakit', 'Izin', 'Alfa', 'Masbuq', 'Haid', 'Istihadoh'];

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    loadRecap();
  }, [selectedBulan, selectedTahun, selectedKelas, selectedKamar, selectedJenisKelamin, selectedSholat, selectedStatus, selectedTahunAjaran]);

  const loadFilterData = async () => {
    try {
      const [kelasData, kamarData, taData] = await Promise.all([
        santriService.fetchKelas(),
        santriService.fetchKamar(),
        santriService.fetchTahunAjaran()
      ]);
      setKelasList(kelasData);
      setKamarList(kamarData);
      setTahunAjaranList(taData);
      
      const activeTA = taData.find(ta => ta.status === 'aktif');
      if (activeTA) setSelectedTahunAjaran(activeTA.id);
    } catch (error) {
      console.error('Failed to load filter data:', error);
      message.error('Gagal memuat data filter');
    }
  };

  const loadRecap = async () => {
    try {
      setLoading(true);
      const startDate = `${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedTahun, selectedBulan, 0).getDate();
      const endDate = `${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      
      const result = await absensiSholatService.getAttendanceRecap(
        startDate, endDate, selectedKelas, selectedSholat, selectedJenisKelamin, selectedKamar, selectedStatus, selectedTahunAjaran
      );
      setData(result);
    } catch (error) {
      console.error('Failed to load recap:', error);
      message.error('Gagal memuat data rekap absensi');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = data.map(item => {
      const d = new Date(item.tanggal);
      const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      return {
        'Tanggal': formattedDate,
        'Waktu': new Date(item.waktu_scan).toLocaleTimeString('id-ID'),
        'Nama Santri': item.santri_nama,
        'NIS': item.santri_nis,
        'JK': item.jenis_kelamin === 'Laki-laki' ? 'L' : 'P',
        'Kelas': item.kelas_nama || '-',
        'Kamar': item.kamar_nama || '-',
        'Sholat': item.sholat,
        'Status': item.status
      };
    });
    exportToExcel(dataToExport, `Rekap_Absensi_Sholat.xlsx`);
  };

  // Stats calculation
  const stats = useMemo(() => {
    if (!data.length) return { hadir: 0, alfa: 0, total: 0, rate: 0 };
    const hadir = data.filter(d => d.status === 'Hadir').length;
    const alfa = data.filter(d => d.status === 'Alfa').length;
    return {
      hadir, alfa, total: data.length, rate: Math.round((hadir / data.length) * 100)
    };
  }, [data]);

  const columns = [
    { 
      header: 'Waktu & Tanggal', 
      accessor: (row) => {
        const d = new Date(row.tanggal);
        const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        return (
          <div className="table-time-info">
            <span className="time">{new Date(row.waktu_scan).toLocaleTimeString('id-ID')}</span>
            <span className="date">{dateStr}</span>
          </div>
        );
      },
      width: '150px'
    },
    { 
      header: 'Santri', 
      accessor: (row) => (
        <div className="table-profile">
          <div className="table-profile-info">
            <span className="name">{row.santri_nama}</span>
            <span className="meta">{row.kelas_nama || '-'} • {row.kamar_nama || '-'}</span>
          </div>
        </div>
      )
    },
    { 
      header: 'Gender', 
      accessor: (row) => <span className={`gender-badge ${row.jenis_kelamin === 'Laki-laki' ? 'm' : 'f'}`}>{row.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}</span>,
      width: '100px'
    },
    { header: 'Sholat', accessor: 'sholat', width: '120px' },
    { header: 'Status', accessor: (row) => <StatusPill status={row.status} active />, width: '150px' }
  ];

  return (
    <div className="rekap-dashboard">
      <div className="rekap-header">
        <div className="header-top">
          <div className="title-area">
            <h1>Analytics & Rekapitulasi</h1>
            <p>Pantau kehadiran sholat berjamaah secara komprehensif</p>
          </div>
          <div className="action-area">
            <button className="btn-export" onClick={handleExportExcel} disabled={data.length === 0}>
              <FileDown size={18} /> Ekspor Laporan Excel
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="icon-wrap primary"><Target size={24}/></div>
            <div className="stat-info">
              <span className="label">Total Record</span>
              <span className="value">{stats.total}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-wrap success"><TrendingUp size={24}/></div>
            <div className="stat-info">
              <span className="label">Kehadiran (Rate)</span>
              <span className="value">{stats.rate}%</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-wrap info"><Users size={24}/></div>
            <div className="stat-info">
              <span className="label">Total Hadir</span>
              <span className="value">{stats.hadir}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="icon-wrap error"><UserX size={24}/></div>
            <div className="stat-info">
              <span className="label">Total Alfa</span>
              <span className="value">{stats.alfa}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rekap-content">
        <div className="filter-sidebar">
          <h3>Filter Data</h3>
          
          <div className="filter-group">
            <label>Waktu Sholat</label>
            <div className="prayer-filter-grid">
              {sholatOptions.map(s => (
                <PrayerCard 
                  key={s} name={s} 
                  active={selectedSholat === s} 
                  onClick={() => setSelectedSholat(selectedSholat === s ? null : s)} 
                />
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Status Kehadiran</label>
            <div className="status-filter-wrap">
              {statusOptions.map(s => (
                <StatusPill 
                  key={s} status={s} 
                  active={selectedStatus === s} 
                  onClick={() => setSelectedStatus(selectedStatus === s ? null : s)} 
                />
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Bulan & Tahun</label>
            <div className="split-selects">
              <Select value={selectedBulan} onChange={setSelectedBulan} style={{ flex: 1 }}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'].map((m, i) => (
                  <Option key={i + 1} value={i + 1}>{m}</Option>
                ))}
              </Select>
              <Select value={selectedTahun} onChange={setSelectedTahun} style={{ width: 90 }}>
                {[2025, 2026, 2027].map(y => <Option key={y} value={y}>{y}</Option>)}
              </Select>
            </div>
          </div>

          <div className="filter-group">
            <label>Tahun Ajaran</label>
            <Select placeholder="Pilih TA" value={selectedTahunAjaran} onChange={setSelectedTahunAjaran} allowClear style={{ width: '100%' }}>
              {tahunAjaranList.map((ta) => <Option key={ta.id} value={ta.id}>{ta.kode}</Option>)}
            </Select>
          </div>

          <div className="filter-group">
            <label>Kelas</label>
            <Select placeholder="Pilih Kelas" allowClear onChange={setSelectedKelas} value={selectedKelas} style={{ width: '100%' }}>
              {kelasList.map((k) => <Option key={k.id} value={k.id}>{k.nama}</Option>)}
            </Select>
          </div>

          <div className="filter-group">
            <label>Kamar</label>
            <Select placeholder="Pilih Kamar" allowClear onChange={setSelectedKamar} value={selectedKamar} style={{ width: '100%' }}>
              {kamarList.map((k) => <Option key={k.id} value={k.id}>{k.nama}</Option>)}
            </Select>
          </div>

          <div className="filter-group">
            <label>Jenis Kelamin</label>
            <Select placeholder="Semua" allowClear onChange={setSelectedJenisKelamin} value={selectedJenisKelamin} style={{ width: '100%' }}>
              <Option value="Laki-laki">Laki-laki</Option>
              <Option value="Perempuan">Perempuan</Option>
            </Select>
          </div>

          <button 
            className="btn-reset" 
            onClick={() => {
              setSelectedKelas(null); setSelectedKamar(null); setSelectedJenisKelamin(null);
              setSelectedSholat(null); setSelectedStatus(null);
              const activeTA = tahunAjaranList.find(ta => ta.status === 'aktif');
              if (activeTA) setSelectedTahunAjaran(activeTA.id);
            }}
          >
            <RotateCcw size={16} /> Reset Filter
          </button>
        </div>

        <div className="data-area">
          <div className="data-table-wrap">
            <DataGrid 
              data={data} 
              columns={columns} 
              loading={loading}
              emptyText="Tidak ada data untuk filter yang dipilih"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
