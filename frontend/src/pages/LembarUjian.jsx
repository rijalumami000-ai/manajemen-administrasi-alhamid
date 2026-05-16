import { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, Row, Col, Form, Input, Button, Space, 
  Divider, Tooltip, message, Select, Tabs, Empty, Modal, Popconfirm, Upload
} from 'antd';
import {
  PrinterOutlined, PlusOutlined, DeleteOutlined, 
  FileTextOutlined, SaveOutlined, ReloadOutlined,
  SettingOutlined, EditOutlined, EyeOutlined, UploadOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import { useResponsive } from '../hooks/useResponsive';
import './LembarUjian.scss';

const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Authorization': `Bearer ${token}`, ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Terjadi kesalahan server.');
  }
  return res.json();
}

export function LembarUjian() {
  const [formKop] = Form.useForm();
  const [formSoal] = Form.useForm();
  const { isMobile } = useResponsive();
  
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [mapelTingkat, setMapelTingkat] = useState({});
  const [loading, setLoading] = useState(false);
  
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [selectedTingkat, setSelectedTingkat] = useState(0); // Default ke Sifir (0)
  const [activeTabKey, setActiveTabKey] = useState('0'); // Key tab aktif
  const [selectedMapelId, setSelectedMapelId] = useState(null);
  const [filteredMapel, setFilteredMapel] = useState([]);
  const [kategoriUjianId, setKategoriUjianId] = useState(null);
  
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isKunciMode, setIsKunciMode] = useState(false);
  const [isHer, setIsHer] = useState(false);

  const [previewData, setPreviewData] = useState(() => {
    const savedKop = localStorage.getItem('kop_settings');
    const defaults = {
      judul: 'PENILAIAN AKHIR SEMESTER GANJIL',
      subJudul: 'MADRASAH DINIYYAH AL-HAMID',
      alamat: 'Cintamulya Candipuro Lampung Selatan',
      tahunAjaran: 'Tahun Ajaran 2025/2026 M',
      pelajaran: 'MABADI FIQH (UZ 1)',
      kelas: 'Sifir',
      hariTanggal: 'Senin, 12 Desember 2026',
      instruksi: 'KERJAKAN URAIAN SOAL-SOAL DI BAWAH INI !',
      soal: [],
      jumlahGaris: 15,
      logo: localStorage.getItem('kop_logo') || null // Base64 logo
    };
    
    if (savedKop) {
      try {
        return { ...defaults, ...JSON.parse(savedKop) };
      } catch (e) {
        console.error('Failed to parse saved kop settings:', e);
        return defaults;
      }
    }
    return defaults;
  });

  const staticTingkatan = [
    { key: '0', label: 'Sifir', tingkat: 0 },
    { key: '1', label: 'Kelas 1', tingkat: 1 },
    { key: '99', label: 'SP', tingkat: 99 }, 
    { key: '2', label: 'Kelas 2', tingkat: 2 },
    { key: '3', label: 'Kelas 3', tingkat: 3 },
    { key: '4', label: 'Kelas 4', tingkat: 4 },
    { key: '5', label: 'Kelas 5', tingkat: 5 },
    { key: '6', label: 'Kelas 6', tingkat: 6 }
  ];

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [kopRes, logoRes] = await Promise.all([
          apiFetch('/api/lembar-ujian-settings/kop_settings'),
          apiFetch('/api/lembar-ujian-settings/kop_logo')
        ]);

        if (kopRes && kopRes.value) {
          const kopData = JSON.parse(kopRes.value);
          setPreviewData(prev => ({ ...prev, ...kopData }));
          formKop.setFieldsValue(kopData);
        }

        if (logoRes && logoRes.value) {
          setPreviewData(prev => ({ ...prev, logo: logoRes.value }));
        }
      } catch (error) {
        console.error('Failed to load settings from DB:', error);
        
        // Fallback ke localStorage jika gagal
        const savedKop = localStorage.getItem('kop_settings');
        if (savedKop) {
          const kopData = JSON.parse(savedKop);
          setPreviewData(prev => ({ ...prev, ...kopData }));
          formKop.setFieldsValue(kopData);
        }
        
        const savedLogo = localStorage.getItem('kop_logo');
        if (savedLogo) {
          setPreviewData(prev => ({ ...prev, logo: savedLogo }));
        }
      }
    };

    loadSettings();
  }, [formKop]);

  const fetchMeta = useCallback(async () => {
    setLoading(true);
    try {
      const [taData, mapelData, katData] = await Promise.all([
        apiFetch('/api/tahun-ajaran'),
        apiFetch('/api/mata-pelajaran'),
        apiFetch('/api/nilai/kategori')
      ]);
      
      setTahunAjaranList(taData);
      setMapelList(mapelData);
      
      const katUjian = katData.find(k => 
        k.nama.toLowerCase().includes('ujian') || 
        k.nama.toLowerCase().includes('semester') ||
        k.nama.toLowerCase().includes('pas')
      );
      if (katUjian) {
        setKategoriUjianId(katUjian.id);
      }
      
      const activeTA = taData.find(ta => ta.is_active);
      if (activeTA) {
        setSelectedTahunAjaran(activeTA.id);
        formKop.setFieldsValue({ tahunAjaranId: activeTA.id });
        setPreviewData(prev => ({ ...prev, tahunAjaran: `Tahun Ajaran ${activeTA.kode} M` }));
      }
    } catch (err) {
      message.error('Gagal memuat data referensi: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [formKop]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // Fetch mapel tingkat
  useEffect(() => {
    const fetchMapelTingkat = async () => {
      if (!selectedTahunAjaran) return;
      try {
        let url = `/api/nilai/mapel-tingkat?tahun_ajaran_id=${selectedTahunAjaran}`;
        if (kategoriUjianId) {
          url += `&kategori_evaluasi_id=${kategoriUjianId}`;
        }
        
        const data = await apiFetch(url);
        
        const mapping = {};
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (!mapping[item.tingkat]) {
              mapping[item.tingkat] = [];
            }
            if (item.mata_pelajaran_id) {
              mapping[item.tingkat].push(item.mata_pelajaran_id);
            }
          });
        }
        setMapelTingkat(mapping);
      } catch (err) {
        console.error('Failed to load mapel tingkat:', err);
        setMapelTingkat({});
      }
    };

    fetchMapelTingkat();
  }, [selectedTahunAjaran, selectedSemester, kategoriUjianId]);

  // Filter mapel ketika tingkatan dipilih
  useEffect(() => {
    if (selectedTingkat !== null && mapelList.length > 0) {
      const mapelIdsForTingkat = mapelTingkat[selectedTingkat] || [];
      
      let filtered = mapelList.filter(m => 
        mapelIdsForTingkat.includes(m.id) && m.jenis === 'Reguler'
      );
      
      if (filtered.length === 0 && Object.keys(mapelTingkat).length === 0) {
        filtered = mapelList.filter(m => m.jenis === 'Reguler');
      }
      
      setFilteredMapel(filtered);
    } else {
      setFilteredMapel(mapelList.filter(m => m.jenis === 'Reguler'));
    }
  }, [selectedTingkat, mapelTingkat, mapelList]);

  // Load saved soal dari Database atau LocalStorage
  useEffect(() => {
    const loadSoal = async () => {
      if (selectedTahunAjaran && activeTabKey && selectedMapelId) {
        try {
          const mapel = mapelList.find(m => m.id === selectedMapelId);
          const pelajaranName = mapel ? mapel.nama : '';
          const tingkat = activeTabKey === '99' ? 99 : parseInt(activeTabKey);
          
          const url = `/api/lembar-ujian?tahun_ajaran_id=${selectedTahunAjaran}&semester=${selectedSemester}&tingkat=${tingkat}&is_her=${isHer}`;
          const data = await apiFetch(url);
          
          const paper = data.find(p => p.pelajaran === pelajaranName);
          
          if (paper && Array.isArray(paper.soal)) {
            const normalizedSoal = paper.soal.map(s => {
              if (typeof s === 'string') return { teks: s, jawaban: '' };
              if (s && typeof s === 'object') return { teks: s.teks || '', jawaban: s.jawaban || '' };
              return { teks: '', jawaban: '' };
            });
            formSoal.setFieldsValue({ soalList: normalizedSoal });
            setPreviewData(prev => ({ 
              ...prev, 
              soal: normalizedSoal,
              judul: paper.judul || prev.judul,
              subJudul: paper.sub_judul || prev.subJudul,
              alamat: paper.alamat || prev.alamat,
              hariTanggal: paper.hari_tanggal || prev.hariTanggal,
              instruksi: paper.instruksi || prev.instruksi
            }));
            message.info('Data lembar ujian dimuat dari arsip database.');
            return;
          }
        } catch (error) {
          console.error('Failed to load from DB:', error);
        }
        
        // Fallback ke localStorage jika tidak ada di DB
        const key = `soal_${selectedTahunAjaran}_${activeTabKey}_${selectedMapelId}_${isHer ? 'her' : 'utama'}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const normalizedSoal = parsed.map(s => {
                if (typeof s === 'string') return { teks: s, jawaban: '' };
                if (s && typeof s === 'object') return { teks: s.teks || '', jawaban: s.jawaban || '' };
                return { teks: '', jawaban: '' };
              });
              formSoal.setFieldsValue({ soalList: normalizedSoal });
              setPreviewData(prev => ({ ...prev, soal: normalizedSoal }));
            }
          } catch (e) {
            console.error('Failed to parse local soal:', e);
          }
        } else {
          formSoal.setFieldsValue({ soalList: [] });
          setPreviewData(prev => ({ ...prev, soal: [] }));
        }
      }
    };

    loadSoal();
  }, [selectedTahunAjaran, activeTabKey, selectedMapelId, selectedSemester, isHer, mapelList, formSoal]);

  const handleKopChange = () => {
    const values = formKop.getFieldsValue();
    
    let taText = previewData.tahunAjaran;
    if (values.tahunAjaranId) {
      const ta = tahunAjaranList.find(item => item.id === values.tahunAjaranId);
      if (ta) {
        taText = `Tahun Ajaran ${ta.kode} M`;
        setSelectedTahunAjaran(values.tahunAjaranId);
      }
    }

    if (values.semester) {
      setSelectedSemester(values.semester);
      if (formKop.getFieldValue('judul') === 'PENILAIAN AKHIR SEMESTER GANJIL' || formKop.getFieldValue('judul') === 'PENILAIAN AKHIR SEMESTER GENAP') {
        const newJudul = `PENILAIAN AKHIR SEMESTER ${values.semester.toUpperCase()}`;
        formKop.setFieldsValue({ judul: newJudul });
        values.judul = newJudul;
      }
    }

    setPreviewData(prev => ({
      ...prev,
      judul: values.judul,
      subJudul: values.subJudul,
      alamat: values.alamat,
      tahunAjaran: taText,
      hariTanggal: values.hariTanggal,
      instruksi: values.instruksi
    }));
  };

  const handleSoalChange = (changedValues, allValues) => {
    // Jika tidak ada allValues (dipanggil tanpa parameter), ambil dari form
    const values = allValues || formSoal.getFieldsValue();
    
    let namaMapel = previewData.pelajaran;
    if (values.mapelId) {
      const m = mapelList.find(item => item.id === values.mapelId);
      if (m) {
        namaMapel = m.nama;
        setSelectedMapelId(values.mapelId);
      }
    }

    const currentTab = staticTingkatan.find(t => t.key === activeTabKey);

    setPreviewData(prev => ({
      ...prev,
      kelas: values.namaKelas || (currentTab ? currentTab.label : ''),
      pelajaran: namaMapel,
      jumlahGaris: values.jumlahGaris !== undefined ? values.jumlahGaris : prev.jumlahGaris,
      soal: (values.soalList || []).map(item => ({
        teks: item?.teks || '',
        jawaban: item?.jawaban || ''
      }))
    }));
  };

  const handleTabChange = (key) => {
    setActiveTabKey(key);
    const currentTab = staticTingkatan.find(t => t.key === key);
    if (currentTab) {
      setSelectedTingkat(currentTab.tingkat);
    }
    setSelectedMapelId(null);
    formSoal.setFieldsValue({ mapelId: undefined, namaKelas: currentTab ? currentTab.label : '' });
    
    setTimeout(() => {
      handleSoalChange();
    }, 0);
  };

  const handleSaveSoal = () => {
    if (!selectedTahunAjaran || !activeTabKey || !selectedMapelId) {
      message.warning('Pilih Tahun Ajaran, Tingkatan, dan Pelajaran terlebih dahulu.');
      return;
    }
    
    const values = formSoal.getFieldsValue();
    const soalList = values.soalList ? values.soalList.map(item => ({ teks: item.teks, jawaban: item.jawaban })) : [];
    
    const key = `soal_${selectedTahunAjaran}_${activeTabKey}_${selectedMapelId}_${isHer ? 'her' : 'utama'}`;
    localStorage.setItem(key, JSON.stringify(soalList));
    
    message.success('Soal berhasil disimpan ke browser!');
  };

  const handleSaveKop = async () => {
    const values = formKop.getFieldsValue();
    const settings = {
      judul: values.judul,
      subJudul: values.subJudul,
      alamat: values.alamat,
      hariTanggal: values.hariTanggal,
      instruksi: values.instruksi
    };
    
    // Simpan ke localStorage sebagai fallback
    localStorage.setItem('kop_settings', JSON.stringify(settings));
    
    try {
      await apiFetch('/api/lembar-ujian-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'kop_settings', value: JSON.stringify(settings) })
      });
      message.success('Pengaturan Kop berhasil disimpan ke database!');
    } catch (error) {
      console.error('Failed to save kop to DB:', error);
      message.warning('Tersimpan di browser, tapi gagal simpan ke database.');
    }
  };

  const handleSaveToDb = async () => {
    if (!selectedTahunAjaran || !activeTabKey || !selectedMapelId) {
      message.warning('Pilih Tahun Ajaran, Tingkatan, dan Pelajaran terlebih dahulu.');
      return;
    }
    
    const values = formSoal.getFieldsValue();
    const soalList = values.soalList ? values.soalList.map(item => ({ teks: item.teks, jawaban: item.jawaban })) : [];
    
    if (soalList.length === 0) {
      message.warning('Belum ada soal yang diinput.');
      return;
    }

    try {
      const mapel = mapelList.find(m => m.id === selectedMapelId);
      const pelajaranName = mapel ? mapel.nama : 'Pelajaran';

      const payload = {
        tahun_ajaran_id: selectedTahunAjaran,
        semester: selectedSemester,
        tingkat: activeTabKey === '99' ? 99 : parseInt(activeTabKey),
        pelajaran: pelajaranName,
        judul: previewData.judul,
        sub_judul: previewData.subJudul,
        alamat: previewData.alamat,
        hari_tanggal: previewData.hariTanggal,
        instruksi: previewData.instruksi,
        soal: soalList,
        is_her: isHer
      };

      await apiFetch('/api/lembar-ujian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      message.success('Lembar ujian berhasil diarsipkan ke database!');
    } catch (error) {
      console.error(error);
      message.error('Gagal menyimpan ke database: ' + error.message);
    }
  };

  const handlePrint = () => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Di mobile, window.open sering gagal. Kita gunakan window.print() langsung pada halaman aktif.
      // CSS @media print di LembarUjian.scss akan menyembunyikan elemen lain dan hanya menampilkan modal.
      window.print();
      return;
    }

    const printContent = document.querySelector('.kertas-ujian').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Lembar Ujian</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri&display=swap">
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              font-family: 'Times New Roman', Times, serif;
            }
            .kertas-ujian {
              width: 210mm;
              padding: 2mm 15mm;
              box-sizing: border-box;
              font-size: 12pt;
              color: #000;
              margin: 0 auto;
            }
            .kop-surat { display: flex; align-items: center; justify-content: center; gap: 30px; margin-bottom: 8px; }
            .logo-ponpes { width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; }
            .logo-ponpes img { max-height: 100px; max-width: 100px; }
            .kop-text { text-align: center; }
            .kop-judul, .kop-subjudul, .kop-alamat, .kop-tahun { margin: 0 !important; line-height: 1.2 !important; }
            .kop-judul { font-size: 14pt; font-weight: bold; text-transform: uppercase; }
            .kop-subjudul { font-size: 18pt; font-weight: bold; text-transform: uppercase; }
            .kop-alamat { font-size: 14pt; }
            .kop-tahun { font-size: 12pt; font-weight: bold; }
            .border-double { border-top: 3px solid #000; border-bottom: 1px solid #000; height: 2px; margin-bottom: 8px; }
            .box-info { padding: 4px 0; margin-bottom: 8px; border-bottom: 1px solid #000; }
            .table-info { width: 100%; font-size: 10pt; }
            .table-info td { vertical-align: top; padding: 1px 0; }
            .instruksi-ujian { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 8px; text-transform: uppercase; }
            .daftar-soal { font-size: 12pt; margin-bottom: 8px; }
            .daftar-soal ol { padding-left: 20px; }
            .daftar-soal ol li { margin-bottom: 4px; line-height: 1.3; }
            .daftar-soal ol li.rtl { direction: rtl; text-align: right; font-family: 'Uthman Taha Naskh', 'Amiri', 'Traditional Arabic', serif; font-size: 16pt; }
            .area-jawaban .jawaban-title { text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 6px; }
            .area-jawaban .garis-item { border-bottom: 1px dotted #000; height: 24px; width: 100%; }
            @media print {
              @page { size: 215mm 330mm; margin: 0 !important; }
              body { margin: 0; }
              .kertas-ujian { width: 100% !important; padding: 2mm 15mm !important; }
            }
          </style>
        </head>
        <body>
          <div class="kertas-ujian">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              const answerArea = document.querySelector('.garis-titik-titik');
              const page = document.querySelector('.kertas-ujian');
              
              // Target height in pixels. F4 is 330mm.
              // 330mm * 3.7795 approx 1247px. 
              // We target around 1180px to leave a small margin at the bottom and avoid page 2.
              const targetHeight = 1180; 
              
              // Clear existing lines to prevent doubling
              if(answerArea) {
                  answerArea.innerHTML = '';
                  
                  // Add lines until target height is reached
                  let safetyCounter = 0;
                  while (page.offsetHeight < targetHeight && safetyCounter < 50) {
                    const line = document.createElement('div');
                    line.className = 'garis-item';
                    answerArea.appendChild(line);
                    safetyCounter++;
                  }
                  
                  // Remove the last line to be safe
                  if (answerArea.lastChild) {
                    answerArea.removeChild(answerArea.lastChild);
                  }
              }
              
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shouldBeRtl = (text) => {
    if (!text || typeof text !== 'string') return false;
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasLatin = /[a-zA-Z]/.test(text);
    return hasArabic && !hasLatin;
  };

  const mainTabs = [
    ...(isMobile ? [] : [{
      key: 'kop',
      label: <span><SettingOutlined /> Pengaturan Kop</span>,
      children: (
        <Form
          form={formKop}
          layout="vertical"
          initialValues={{
            judul: previewData.judul,
            subJudul: previewData.subJudul,
            alamat: previewData.alamat,
            semester: selectedSemester,
            hariTanggal: previewData.hariTanggal,
            instruksi: previewData.instruksi
          }}
          onValuesChange={handleKopChange}
        >
          {/* Filter Tahun Ajaran dan Semester dipindahkan ke luar tab agar global */}

          <Form.Item label="Judul Utama" name="judul" rules={[{ required: true }]}>
            <Input placeholder="PENILAIAN AKHIR SEMESTER GANJIL" />
          </Form.Item>
          <Form.Item label="Nama Madrasah" name="subJudul">
            <Input placeholder="MADRASAH DINIYYAH AL-HAMID" />
          </Form.Item>
          <Form.Item label="Alamat" name="alamat">
            <Input placeholder="Alamat lengkap" />
          </Form.Item>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <Form.Item label="Hari / Tanggal" name="hariTanggal">
            <Input placeholder="Senin, 12 Desember 2026" />
          </Form.Item>
          <Form.Item label="Instruksi" name="instruksi">
            <Input placeholder="KERJAKAN URAIAN SOAL-SOAL DI BAWAH INI !" />
          </Form.Item>

          <Form.Item label="Logo Madrasah (Upload)">
            <Upload
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                  setPreviewData(prev => ({ ...prev, logo: e.target.result }));
                  localStorage.setItem('kop_logo', e.target.result);
                  
                  try {
                    await apiFetch('/api/lembar-ujian-settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: 'kop_logo', value: e.target.result })
                    });
                    message.success('Logo berhasil disimpan ke database!');
                  } catch (error) {
                    console.error('Failed to save logo to DB:', error);
                    message.warning('Logo tersimpan di browser, tapi gagal simpan ke database.');
                  }
                };
                reader.readAsDataURL(file);
                return false; // Mencegah upload otomatis
              }}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>Pilih Logo</Button>
            </Upload>
            {previewData.logo && (
              <div style={{ marginTop: '10px' }}>
                <img src={previewData.logo} alt="Logo Preview" style={{ maxHeight: '50px' }} />
                <Button type="link" danger onClick={async () => {
                  setPreviewData(prev => ({ ...prev, logo: null }));
                  localStorage.removeItem('kop_logo');
                  
                  try {
                    await apiFetch('/api/lembar-ujian-settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: 'kop_logo', value: null })
                    });
                    message.success('Logo berhasil dihapus dari database!');
                  } catch (error) {
                    console.error('Failed to delete logo from DB:', error);
                  }
                }}>Hapus</Button>
              </div>
            )}
          </Form.Item>

          <Form.Item style={{ marginTop: '16px', textAlign: 'right' }}>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveKop} style={{ background: '#0052FF' }}>
              Simpan Kop
            </Button>
          </Form.Item>
        </Form>
      )
    }]),
    ...staticTingkatan.map(t => ({
      key: t.key,
      label: <span><EditOutlined /> {t.label}</span>,
      children: (
        <Form
          form={formSoal}
          layout="vertical"
          initialValues={{
            jumlahGaris: previewData.jumlahGaris,
            namaKelas: t.label
          }}
          onValuesChange={handleSoalChange}
        >
          <Row gutter={12}>
            <Col span={24}>
              <Form.Item label="Pilih Pelajaran" name="mapelId" rules={[{ required: true }]}>
                <Select placeholder="Pilih Pelajaran" onChange={handleSoalChange}>
                  {filteredMapel.map(m => (
                    <Option key={m.id} value={m.id}>{m.nama} {m.nama_arab && <span style={{ direction: 'rtl', float: 'right', color: '#aaa' }}>{m.nama_arab}</span>}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Nama Kelas di Lembar" name="namaKelas" tooltip="Teks ini yang akan tertulis di lembar ujian">
            <Input placeholder={`Misal: ${t.label} A atau ${t.label}`} />
          </Form.Item>

          <Divider orientation="left" style={{ margin: '12px 0', fontSize: '13px' }}>Daftar Soal</Divider>
          
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<CloudUploadOutlined />} onClick={handleSaveToDb} style={{ background: '#0052FF' }}>
              Simpan
            </Button>
          </div>

          <Form.List name="soalList">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="soal-item-form">
                    <Form.Item
                      {...restField}
                      name={[name, 'teks']}
                      label={`Soal #${index + 1}`}
                      rules={[{ required: true, message: 'Soal tidak boleh kosong' }]}
                      style={{ marginBottom: '8px' }}
                    >
                      <Input.TextArea 
                        rows={2} 
                        placeholder="Ketik soal di sini..." 
                      />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'jawaban']}
                      label={`Kunci Jawaban #${index + 1}`}
                      style={{ marginBottom: '8px' }}
                    >
                      <Input.TextArea 
                        rows={2} 
                        placeholder="Ketik kunci jawaban di sini (opsional)..." 
                      />
                    </Form.Item>
                    
                    <div className="soal-actions-container">
                      <Tooltip title="Simpan draft ke database">
                        <Button 
                          type="text" 
                          icon={<SaveOutlined style={{ color: '#1890ff' }} />} 
                          onClick={handleSaveToDb}
                          className="btn-save-soal"
                        />
                      </Tooltip>

                      <Popconfirm
                        title="Apakah Anda yakin ingin menghapus soal ini?"
                        onConfirm={() => {
                          remove(name);
                          setTimeout(() => {
                            handleSoalChange();
                          }, 0);
                        }}
                        okText="Ya"
                        cancelText="Tidak"
                      >
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          className="btn-delete-soal"
                        />
                      </Popconfirm>
                    </div>
                  </div>
                ))}
                <Form.Item style={{ marginTop: '12px' }}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Tambah Soal
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Jumlah Garis Jawaban disembunyikan karena sekarang otomatis memenuhi halaman */}
        </Form>
      )
    }))
  ];

  return (
    <div className="lembar-ujian-page">
      <div className="page-header no-print">
        <div className="page-icon"><FileTextOutlined /></div>
        <div>
          <Title level={3} style={{ margin: 0 }}>Pembuat Lembar Ujian</Title>
          <Text type="secondary">Ketik soal ujian dan cetak dengan tata letak profesional</Text>
        </div>
        <div className="page-actions">
          <Button type="primary" icon={<EyeOutlined />} onClick={() => setIsPreviewVisible(true)} style={{ background: '#0052FF' }}>
            Preview Lembar
          </Button>
        </div>
      </div>

      <Row gutter={24} className="main-content">
        <Col span={24} className="editor-container no-print">
          <Card size="small" className="editor-card">
            <div className="global-filters" style={{ marginBottom: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>Tahun Ajaran:</div>
                  <Select 
                    style={{ width: '100%' }} 
                    placeholder="Pilih Tahun Ajaran" 
                    value={selectedTahunAjaran}
                    onChange={(val) => {
                      setSelectedTahunAjaran(val);
                      const ta = tahunAjaranList.find(item => item.id === val);
                      if (ta) {
                        setPreviewData(prev => ({ ...prev, tahunAjaran: `Tahun Ajaran ${ta.kode} M` }));
                      }
                    }}
                  >
                    {tahunAjaranList.map(ta => (
                      <Option key={ta.id} value={ta.id}>{ta.kode} M {ta.is_active && '(Aktif)'}</Option>
                    ))}
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>Semester:</div>
                  <Select 
                    style={{ width: '100%' }} 
                    placeholder="Pilih Semester" 
                    value={selectedSemester}
                    onChange={(val) => {
                      setSelectedSemester(val);
                      const currentJudul = formKop.getFieldValue('judul');
                      if (currentJudul === 'PENILAIAN AKHIR SEMESTER GANJIL' || currentJudul === 'PENILAIAN AKHIR SEMESTER GENAP' || currentJudul === 'SOAL HER') {
                        const newJudul = isHer ? 'SOAL HER' : `PENILAIAN AKHIR SEMESTER ${val.toUpperCase()}`;
                        formKop.setFieldsValue({ judul: newJudul });
                        setPreviewData(prev => ({ ...prev, judul: newJudul }));
                      }
                    }}
                  >
                    <Option value="Ganjil">Ganjil</Option>
                    <Option value="Genap">Genap</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#495057' }}>Tipe Ujian:</div>
                  <Select 
                    style={{ width: '100%' }} 
                    value={isHer ? 'Her' : 'Utama'}
                    onChange={(val) => {
                      const her = val === 'Her';
                      setIsHer(her);
                      
                      const currentJudul = formKop.getFieldValue('judul');
                      if (her) {
                        formKop.setFieldsValue({ judul: 'SOAL HER' });
                        setPreviewData(prev => ({ ...prev, judul: 'SOAL HER' }));
                      } else {
                        const newJudul = `PENILAIAN AKHIR SEMESTER ${selectedSemester.toUpperCase()}`;
                        formKop.setFieldsValue({ judul: newJudul });
                        setPreviewData(prev => ({ ...prev, judul: newJudul }));
                      }
                    }}
                  >
                    <Option value="Utama">Utama</Option>
                    <Option value="Her">Her (Remedial)</Option>
                  </Select>
                </Col>
              </Row>
            </div>
            <Tabs defaultActiveKey="kop" items={mainTabs} onChange={handleTabChange} />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Preview Lembar Ujian"
        visible={isPreviewVisible}
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setIsPreviewVisible(false)}>
            Tutup
          </Button>,
          <Button key="kunci" type="default" className="desktop-btn-kunci" onClick={() => setIsKunciMode(!isKunciMode)}>
            {isKunciMode ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}
          </Button>,
          <Button key="print" type="primary" className="desktop-btn-print" icon={<PrinterOutlined />} onClick={handlePrint}>
            Cetak
          </Button>
        ]}
        bodyStyle={{ background: '#525659', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div className="mobile-actions" style={{ marginBottom: '16px', width: '100%', display: 'none', justifyContent: 'center' }}>
          <Button type="primary" style={{ background: '#ff4d4f', borderColor: '#ff4d4f' }} onClick={() => setIsKunciMode(!isKunciMode)}>
            {isKunciMode ? 'Sembunyikan Kunci' : 'Tampilkan Kunci Jawaban'}
          </Button>
        </div>
        <div className="preview-wrapper" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div className="kertas-ujian" style={{ margin: '0 auto' }}>
            <div className="kop-surat">
              <div className="logo-ponpes">
                {previewData.logo ? (
                  <img src={previewData.logo} alt="Logo" />
                ) : (
                  <div className="logo-placeholder">LOGO</div>
                )}
              </div>
              <div className="kop-text">
                <div className="kop-judul">{previewData.judul}</div>
                <div className="kop-subjudul">{previewData.subJudul}</div>
                <div className="kop-alamat">{previewData.alamat}</div>
                <div className="kop-tahun">{previewData.tahunAjaran}</div>
              </div>
            </div>

            <div className="border-double"></div>

            <div className="box-info">
              <table className="table-info">
                <tbody>
                  <tr>
                    <td width="15%">NAMA</td>
                    <td width="2%">:</td>
                    <td width="33%">............................................................</td>
                    <td width="15%">PELAJARAN</td>
                    <td width="2%">:</td>
                    <td width="33%">{previewData.pelajaran}</td>
                  </tr>
                  <tr>
                    <td>KELAS</td>
                    <td>:</td>
                    <td>{previewData.kelas}</td>
                    <td>HARI/TANGGAL</td>
                    <td>:</td>
                    <td>{previewData.hariTanggal || '...................................'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="instruksi-ujian">
              {previewData.instruksi}
            </div>

            <div className="daftar-soal">
              <ol>
                {(previewData.soal || []).map((s, index) => {
                  const isObj = s && typeof s === 'object';
                  const teks = isObj ? (s.teks || '') : (s || '');
                  const jawaban = isObj ? (s.jawaban || '') : '';
                  return (
                    <li key={index} className={shouldBeRtl(teks) ? 'rtl' : 'ltr'}>
                      <div>{teks}</div>
                      {isKunciMode && jawaban && (
                        <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginTop: '4px' }}>
                          Kunci: {jawaban}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            {!isKunciMode && (
              <div className="area-jawaban">
                <div className="jawaban-title">JAWABAN</div>
                <div className="garis-titik-titik">
                  {Array.from({ length: Math.max(0, parseInt(previewData.jumlahGaris || 0) || 15) }).map((_, i) => (
                    <div key={i} className="garis-item"></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
