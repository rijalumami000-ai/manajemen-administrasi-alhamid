import { useState, useEffect } from 'react';
import { Card, Button, Select, Table, Tag, DatePicker, Space, message, Typography, Row, Col } from 'antd';
import { FileExcelOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { absensiSholatService } from '../services/absensiSholatService';
import { santriService } from '../services/santriService';
import { PageHeader, LoadingState } from '../components/common';
import { exportToExcel } from '../utils/exportUtils';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Title } = Typography;

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
      
      // Set active tahun ajaran as default if available
      const activeTA = taData.find(ta => ta.status === 'aktif');
      if (activeTA) {
        setSelectedTahunAjaran(activeTA.id);
      }
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
        startDate, 
        endDate, 
        selectedKelas,
        selectedSholat,
        selectedJenisKelamin,
        selectedKamar,
        selectedStatus,
        selectedTahunAjaran
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

  const columns = [
    {
      title: 'Tanggal',
      dataIndex: 'tanggal',
      key: 'tanggal',
      render: (text) => {
        const d = new Date(text);
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      },
    },
    {
      title: 'Waktu',
      dataIndex: 'waktu_scan',
      key: 'waktu_scan',
      render: (text) => new Date(text).toLocaleTimeString('id-ID'),
    },
    {
      title: 'Nama Santri',
      dataIndex: 'santri_nama',
      key: 'santri_nama',
    },
    {
      title: 'NIS',
      dataIndex: 'santri_nis',
      key: 'santri_nis',
    },
    {
      title: 'JK',
      dataIndex: 'jenis_kelamin',
      key: 'jenis_kelamin',
      render: (text) => text === 'Laki-laki' ? 'L' : 'P',
    },
    {
      title: 'Kelas',
      dataIndex: 'kelas_nama',
      key: 'kelas_nama',
      render: (text) => text || '-',
    },
    {
      title: 'Kamar',
      dataIndex: 'kamar_nama',
      key: 'kamar_nama',
      render: (text) => text || '-',
    },
    {
      title: 'Sholat',
      dataIndex: 'sholat',
      key: 'sholat',
      render: (sholat) => <Tag color="blue">{sholat}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Hadir' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>

      <PageHeader
        title="Rekap Absensi Sholat"
        subtitle="Pantau kehadiran sholat berjamaah santri"
        extra={
          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
            disabled={data.length === 0}
          >
            Ekspor Excel
          </Button>
        }
      />

      {/* Kartu Waktu Sholat (Proporsional) */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', marginTop: '16px' }}>
        {sholatOptions.map(s => (
          <Card
            key={s}
            hoverable
            style={{
              flex: 1,
              textAlign: 'center',
              borderColor: selectedSholat === s ? '#1677ff' : '#d9d9d9',
              background: selectedSholat === s ? '#e6f4ff' : '#fff',
              borderWidth: selectedSholat === s ? '2px' : '1px',
              transition: 'all 0.3s'
            }}
            onClick={() => {
              const newValue = selectedSholat === s ? null : s;
              setSelectedSholat(newValue);
            }}
          >
            <Title level={4} style={{ margin: 0, color: selectedSholat === s ? '#1677ff' : '#1677ff' }}>
              {s}
            </Title>
            <Text style={{ fontSize: '12px', color: selectedSholat === s ? '#1677ff' : '#8c8c8c' }}>
              {selectedSholat === s ? 'Terpilih' : 'Klik untuk filter'}
            </Text>
          </Card>
        ))}
      </div>

      {/* Kartu Status Kehadiran (Minimalis) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {statusOptions.map(s => (
          <Card
            key={s}
            hoverable
            style={{
              flex: '1 1 auto',
              minWidth: '100px',
              textAlign: 'center',
              borderColor: selectedStatus === s ? '#52c41a' : '#d9d9d9',
              background: selectedStatus === s ? '#f6ffed' : '#fff',
              transition: 'all 0.3s'
            }}
            onClick={() => {
              const newValue = selectedStatus === s ? null : s;
              setSelectedStatus(newValue);
            }}
          >
            <div style={{ fontWeight: 'bold', color: selectedStatus === s ? '#52c41a' : 'inherit' }}>
              {s}
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Area */}
      <Card style={{ marginBottom: '16px' }}>
        <Space wrap size="middle">
          <div>
            <Text strong style={{ marginRight: '8px' }}>Tahun Ajaran:</Text>
            <Select
              placeholder="Pilih TA"
              style={{ width: '120px' }}
              value={selectedTahunAjaran}
              onChange={setSelectedTahunAjaran}
              allowClear
            >
              {tahunAjaranList.map((ta) => (
                <Option key={ta.id} value={ta.id}>{ta.kode}</Option>
              ))}
            </Select>
          </div>



          <div>
            <Text strong style={{ marginRight: '8px' }}>Bulan:</Text>
            <Select
              value={selectedBulan}
              onChange={setSelectedBulan}
              style={{ width: '120px' }}
            >
              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                <Option key={i + 1} value={i + 1}>{m}</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong style={{ marginRight: '8px' }}>Tahun:</Text>
            <Select
              value={selectedTahun}
              onChange={setSelectedTahun}
              style={{ width: '100px' }}
            >
              {[2025, 2026, 2027].map(y => (
                <Option key={y} value={y}>{y}</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong style={{ marginRight: '8px' }}>JK:</Text>
            <Select
              placeholder="Semua"
              style={{ width: '100px' }}
              allowClear
              onChange={setSelectedJenisKelamin}
            >
              <Option value="Laki-laki">L</Option>
              <Option value="Perempuan">P</Option>
            </Select>
          </div>

          <div>
            <Text strong style={{ marginRight: '8px' }}>Kelas:</Text>
            <Select
              placeholder="Pilih Kelas"
              style={{ width: '150px' }}
              allowClear
              onChange={setSelectedKelas}
            >
              {kelasList.map((k) => (
                <Option key={k.id} value={k.id}>{k.nama}</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong style={{ marginRight: '8px' }}>Kamar:</Text>
            <Select
              placeholder="Pilih Kamar"
              style={{ width: '150px' }}
              allowClear
              onChange={setSelectedKamar}
            >
              {kamarList.map((k) => (
                <Option key={k.id} value={k.id}>{k.nama}</Option>
              ))}
            </Select>
          </div>



          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setDateRange([null, null]);
              setSelectedKelas(null);
              setSelectedKamar(null);
              setSelectedJenisKelamin(null);
              setSelectedSholat(null);
              // Keep active TA
              const activeTA = tahunAjaranList.find(ta => ta.status === 'aktif');
              if (activeTA) setSelectedTahunAjaran(activeTA.id);
              
              setTimeout(() => loadRecap(), 0);
            }}
          >
            Reset
          </Button>
        </Space>
      </Card>

      {/* Table Area */}
      <Card>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} data`
          }}
          size="middle"
        />
      </Card>
    </div>
  );
}
