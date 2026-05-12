import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tabs, Select, Button, Table, Tag, Space, message, Card,
  Typography, Row, Col, Form, Input, Divider, Tooltip,
  Modal, Badge, Avatar, Empty
} from 'antd';
import {
  IdcardOutlined, SettingOutlined, PrinterOutlined, ThunderboltOutlined,
  DeleteOutlined, UserOutlined, ReloadOutlined, UploadOutlined,
  CheckCircleOutlined, WarningOutlined, FileImageOutlined, FileTextOutlined
} from '@ant-design/icons';
import './KartuUjianSemester.scss';
import { QRCodeSVG } from 'qrcode.react';

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

// ─── Tab 1: Generate Nomor Peserta ───────────────────────────────────────────
function TabGenerateNomor({ tahunAjaranList }) {
  const [tahunAjaranId, setTahunAjaranId] = useState(null);
  const [semester, setSemester] = useState(null);
  const [pesertaList, setPesertaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchPeserta = useCallback(async () => {
    if (!tahunAjaranId || !semester) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/peserta-ujian?tahun_ajaran_id=${tahunAjaranId}&semester=${semester}`);
      setPesertaList(data);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [tahunAjaranId, semester]);

  useEffect(() => { fetchPeserta(); }, [fetchPeserta]);

  const handleGenerate = () => {
    if (!tahunAjaranId || !semester) return message.warning('Pilih tahun ajaran dan semester.');
    Modal.confirm({
      title: 'Generate Nomor Peserta?',
      content: `Nomor peserta lama untuk semester ${semester} akan ditimpa.`,
      okText: 'Ya, Generate', cancelText: 'Batal',
      onOk: async () => {
        setGenerating(true);
        try {
          const res = await apiFetch('/api/peserta-ujian/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tahun_ajaran_id: tahunAjaranId, semester }),
          });
          message.success(res.message);
          fetchPeserta();
        } catch (err) {
          message.error(err.message);
        } finally {
          setGenerating(false);
        }
      },
    });
  };

  const handleReset = () => {
    if (!tahunAjaranId || !semester) return;
    Modal.confirm({
      title: 'Reset Nomor Peserta?', content: 'Semua nomor akan dihapus.',
      okType: 'danger', okText: 'Hapus', cancelText: 'Batal',
      onOk: async () => {
        try {
          await apiFetch(`/api/peserta-ujian?tahun_ajaran_id=${tahunAjaranId}&semester=${semester}`, { method: 'DELETE' });
          message.success('Nomor peserta direset.');
          setPesertaList([]);
        } catch (err) { message.error(err.message); }
      },
    });
  };

  const columns = [
    {
      title: 'No. Peserta', dataIndex: 'no_peserta', key: 'no_peserta', width: 140,
      render: (no) => <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{no}</Tag>,
    },
    { title: 'NIS', dataIndex: 'nis', key: 'nis', width: 120, render: (v) => <Text code>{v}</Text> },
    {
      title: 'Nama Santri', dataIndex: 'nama', key: 'nama',
      render: (nama, rec) => (
        <Space>
          <Avatar size={30} src={rec.foto_url ? `${API_BASE}${rec.foto_url}` : undefined} icon={!rec.foto_url && <UserOutlined />} />
          <Text strong style={{ fontSize: 13 }}>{nama}</Text>
        </Space>
      ),
    },
    {
      title: 'Kelas', dataIndex: 'nama_kelas', key: 'nama_kelas', width: 90,
      render: (k) => k ? <Tag color="purple">{k}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: 'Urutan', key: 'urutan', width: 180,
      render: (_, r) => (
        <Space size={2}>
          <Tooltip title="Kelas"><Tag>{String(r.urutan_kelas || 0).padStart(2,'0')}</Tag></Tooltip>
          <Text type="secondary">-</Text>
          <Tooltip title="Di Kelas"><Tag>{String(r.urutan_di_kelas || 0).padStart(2,'0')}</Tag></Tooltip>
          <Text type="secondary">-</Text>
          <Tooltip title="Global"><Tag>{String(r.urutan_global || 0).padStart(3,'0')}</Tag></Tooltip>
        </Space>
      ),
    },
    {
      title: 'Foto', key: 'foto', width: 80,
      render: (_, r) => r.foto_url ? <Badge status="success" text="Ada" /> : <Badge status="warning" text="Belum" />,
    },
  ];

  return (
    <div className="tab-generate">
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select placeholder="Tahun Ajaran" value={tahunAjaranId} onChange={setTahunAjaranId} style={{ width: 180 }}>
            {tahunAjaranList.map(ta => (
              <Option key={ta.id} value={ta.id}>{ta.kode} {ta.is_active && <Tag color="green" style={{ marginLeft: 4 }}>Aktif</Tag>}</Option>
            ))}
          </Select>
          <Select placeholder="Semester" value={semester} onChange={setSemester} style={{ width: 130 }}>
            <Option value="Ganjil">Ganjil</Option>
            <Option value="Genap">Genap</Option>
          </Select>
          <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleGenerate} loading={generating} disabled={!tahunAjaranId || !semester}>
            Generate Nomor
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleReset} disabled={!pesertaList.length}>Reset</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchPeserta} loading={loading} />
          <Text type="secondary">{pesertaList.length} peserta</Text>
        </Space>
      </Card>
      {(!tahunAjaranId || !semester) ? (
        <Card><Empty description="Pilih Tahun Ajaran dan Semester untuk melihat data peserta." /></Card>
      ) : (
        <Card size="small">
          <Table dataSource={pesertaList} columns={columns} rowKey="id" loading={loading}
            pagination={{ pageSize: 20, showTotal: (t) => `Total ${t} peserta` }} size="small" scroll={{ x: 800 }} />
        </Card>
      )}
    </div>
  );
}

// ─── Tab 2: Setting Kartu ─────────────────────────────────────────────────────
function TabSettingCard({ settings, onRefresh }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const fileRefs = {
    kartu_ujian_logo_url: useRef(null),
    kartu_ujian_stempel_url: useRef(null),
    kartu_ujian_ttd_url: useRef(null),
  };

  useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        kartu_ujian_judul_1: settings.kartu_ujian_judul_1 || '',
        kartu_ujian_judul_2: settings.kartu_ujian_judul_2 || '',
        kartu_ujian_judul_kartu: settings.kartu_ujian_judul_kartu || '',
        kartu_ujian_ketua_panitia: settings.kartu_ujian_ketua_panitia || '',
        kartu_ujian_lokasi: settings.kartu_ujian_lokasi || '',
      });
    }
  }, [settings, form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      for (const [key, value] of Object.entries(values)) {
        await fetch(`${API_BASE}/api/settings`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });
      }
      message.success('Pengaturan berhasil disimpan!');
      onRefresh();
    } catch { message.error('Gagal menyimpan pengaturan.'); }
    finally { setSaving(false); }
  };

  const handleUploadAset = async (key, file) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingKey(key);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/kartu-ujian/upload-aset/${key}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Gagal upload.');
      message.success('File berhasil diunggah!');
      onRefresh();
    } catch (err) { message.error(err.message); }
    finally { setUploadingKey(null); }
  };

  const asetItems = [
    { key: 'kartu_ujian_logo_url', label: 'Logo Madrasah', desc: 'Logo di pojok kiri atas kartu' },
    { key: 'kartu_ujian_stempel_url', label: 'Stempel Madrasah', desc: 'Cap/stempel (PNG transparan)' },
    { key: 'kartu_ujian_ttd_url', label: 'Tanda Tangan Panitia', desc: 'TTD Ketua Panitia (PNG transparan)' },
  ];

  return (
    <div className="tab-setting">
      <Row gutter={20}>
        <Col xs={24} md={14}>
          <Card title="📝 Teks Kartu Ujian" size="small" style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical">
              <Form.Item label="Judul Baris 1" name="kartu_ujian_judul_1"><Input placeholder="UJIAN SEMESTER GENAP" /></Form.Item>
              <Form.Item label="Judul Baris 2" name="kartu_ujian_judul_2"><Input placeholder="MADRASAH DINIYAH AL-HAMID" /></Form.Item>
              <Form.Item label="Judul Kartu" name="kartu_ujian_judul_kartu"><Input placeholder="KARTU PESERTA UJIAN TULIS" /></Form.Item>
              <Form.Item label="Nama Ketua Panitia" name="kartu_ujian_ketua_panitia"><Input placeholder="Ust. Ahmad Syukron Rosyid" /></Form.Item>
              <Form.Item label="Lokasi / Kota Cetak" name="kartu_ujian_lokasi"><Input placeholder="Cintamulya" /></Form.Item>
              <Button type="primary" onClick={handleSave} loading={saving} block>Simpan Pengaturan</Button>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title="🖼️ Aset Gambar Kartu" size="small">
            {asetItems.map(({ key, label, desc }) => (
              <div key={key} className="aset-item">
                <div className="aset-preview">
                  {settings?.[key]
                    ? <img src={`${API_BASE}${settings[key]}`} alt={label} className="aset-img" />
                    : <div className="aset-placeholder"><FileImageOutlined /></div>
                  }
                </div>
                <div className="aset-info">
                  <Text strong style={{ fontSize: 13 }}>{label}</Text><br />
                  <Text type="secondary" style={{ fontSize: 11 }}>{desc}</Text><br />
                  {settings?.[key] ? <Badge status="success" text="Sudah" /> : <Badge status="warning" text="Belum" />}
                </div>
                <input type="file" accept=".jpg,.jpeg,.png,.webp" ref={fileRefs[key]} style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files[0]; if (f) handleUploadAset(key, f); e.target.value = ''; }} />
                <Button size="small" icon={<UploadOutlined />} loading={uploadingKey === key}
                  onClick={() => fileRefs[key].current?.click()} style={{ marginTop: 6 }}>Upload</Button>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// ─── Tab Baru: Edit & Cetak Tata Tertib (Kartu Belakang) ──────────────────────
function TabKartuBelakang({ settings, onRefresh, pesertaList }) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const defaultKewajiban = `1. Berada di tempat ujian 10 menit sebelum ujian dilaksanakan;
2. Menunjukan kartu ujiannya kepada penguji dan pengawas saat ujian berlangsung;
3. Berpakaian sopan dan rapi Syar'an Wa Adatan;
4. Berbaju putih, polos, berkerah, berlengan panjang dan berkopyah hitam bagi putra;
5. Berbaju putih dan berkerudung almamater bagi putri;
6. Membubuhkan tanda tangan di lembar absen dan menulis nama di lembar Jawaban.`;

  const defaultLarangan = `1. Keluar masuk ruang ujian tanpa seizin Penguji dan Pengawas;
2. Membuat gaduh atau ramai (berkomunikasi dengan peserta lain) saat ujian berlangsung;
3. Berambut gondrong, bersemir, memakai gelang, bermodel yang tidak sesuai dengan nilai-nilai pesantren dan berkuku panjang serta cat kuku bagi putri;
4. Membawa sesuatu selain alat tulis (termasuk stypo);
5. Memberi atau menyontek jawaban dengan cara apapun;
6. Mengerjakan soal-soal ujian sebelum dipersilahkan oleh penguji;
7. Bertanya soal-soal ujian kepada penguji saat mengerjakan soal;
8. Meninggalkan ruang ujian sebelum diperkenankan oleh penguji.`;

  const defaultSanksi = `1. Jika melanggar, maka ujiannya dinyatakan gugur dan dikeluarkan dari ruangan;
2. Pengurangan nilai;
3. Diperingatkan oleh pengawas/ penguji;
4. Berdiri di luar ruangan kelas;`;

  useEffect(() => {
    form.setFieldsValue({
      tata_tertib_kewajiban: settings?.tata_tertib_kewajiban || defaultKewajiban,
      tata_tertib_larangan: settings?.tata_tertib_larangan || defaultLarangan,
      tata_tertib_sanksi: settings?.tata_tertib_sanksi || defaultSanksi,
    });
  }, [settings, form]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const token = localStorage.getItem('token');
      
      // Karena backend hanya menerima { key, value }, kita harus loop tiap field
      for (const [key, value] of Object.entries(values)) {
        const res = await fetch(`${API_BASE}/api/settings`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ key, value }),
        });
        if (!res.ok) throw new Error('Gagal menyimpan.');
      }
      
      message.success('Pengaturan tata tertib berhasil disimpan!');
      onRefresh();
    } catch { message.error('Gagal menyimpan pengaturan.'); }
    finally { setSaving(false); }
  };

  const handlePrint = () => {
    if (!pesertaList.length) return message.warning('Tidak ada data peserta untuk dicetak. Pilih data di tab "Cetak Kartu" terlebih dahulu.');
    window.print();
  };

  return (
    <div className="tab-kartu-belakang">
      <Row gutter={20}>
        <Col xs={24} md={16}>
          <Card title="📝 Edit Tata Tertib Ujian" size="small">
            <Form form={form} layout="vertical">
              <Form.Item label="Kewajiban" name="tata_tertib_kewajiban">
                <Input.TextArea rows={5} />
              </Form.Item>
              <Form.Item label="Larangan" name="tata_tertib_larangan">
                <Input.TextArea rows={6} />
              </Form.Item>
              <Form.Item label="Sanksi" name="tata_tertib_sanksi">
                <Input.TextArea rows={4} />
              </Form.Item>
              <Space>
                <Button type="primary" onClick={handleSave} loading={saving}>Simpan Tata Tertib</Button>
                <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} disabled={!pesertaList.length} style={{ background: '#0052FF' }}>
                  Cetak Sisi Belakang ({pesertaList.length} kartu)
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="ℹ️ Petunjuk" size="small">
            <Text type="secondary">
              Tuliskan poin-poin tata tertib per baris. Teks ini akan dicetak di bagian belakang kartu ujian.
              <br /><br />
              <strong>Cara Cetak:</strong><br />
              1. Pilih filter data di tab <strong>Cetak Kartu</strong> terlebih dahulu.<br />
              2. Pindah ke tab ini, lalu klik tombol <strong>Cetak Sisi Belakang</strong>.<br />
              3. Jumlah kartu yang digenerate akan sama persis dengan yang ada di tab Cetak Kartu.
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

// ─── Tab 3: Filter & kontrol cetak (tanpa area kartu) ────────────────────────
function TabCetakKartu({ tahunAjaranList, settings, onPesertaChange, pesertaList }) {
  const [tahunAjaranId, setTahunAjaranId] = useState(null);
  const [semester, setSemester] = useState(null);
  const [kelasList, setKelasList] = useState([]);
  const [kelasDiniyahId, setKelasDiniyahId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tanggalCetak, setTanggalCetak] = useState(
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  );

  useEffect(() => {
    apiFetch('/api/kelas').then(data => setKelasList(data.filter(k => k.jenis === 'Diniyah'))).catch(() => {});
  }, []);

  const fetchPeserta = useCallback(async () => {
    if (!tahunAjaranId || !semester) { onPesertaChange([], null, null); return; }
    setLoading(true);
    try {
      let url = `/api/peserta-ujian?tahun_ajaran_id=${tahunAjaranId}&semester=${semester}`;
      if (kelasDiniyahId) url += `&kelas_diniyah_id=${kelasDiniyahId}`;
      const data = await apiFetch(url);
      const tahunAjaran = tahunAjaranList.find(ta => ta.id === tahunAjaranId);
      onPesertaChange(data, tahunAjaran, tanggalCetak);
    } catch (err) {
      message.error(err.message);
    } finally { setLoading(false); }
  }, [tahunAjaranId, semester, kelasDiniyahId, tanggalCetak]);

  useEffect(() => { fetchPeserta(); }, [fetchPeserta]);

  const handlePrint = () => {
    if (!pesertaList.length) return message.warning('Tidak ada data peserta untuk dicetak.');
    window.print();
  };

  return (
    <div className="tab-cetak">
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          {/* Filter Tahun Ajaran */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>Tahun:</span>
            {tahunAjaranList.map(ta => (
              <div
                key={ta.id}
                onClick={() => setTahunAjaranId(ta.id)}
                style={{
                  padding: '5px 12px',
                  border: `1px solid ${tahunAjaranId === ta.id ? '#0052FF' : '#d9d9d9'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: tahunAjaranId === ta.id ? '#e6f7ff' : '#fff',
                  color: tahunAjaranId === ta.id ? '#0052FF' : '#595959',
                  fontSize: '13px',
                  fontWeight: tahunAjaranId === ta.id ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {ta.kode}
              </div>
            ))}
          </div>

          {/* Filter Semester */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>Smt:</span>
            {['Ganjil', 'Genap'].map(s => (
              <div
                key={s}
                onClick={() => setSemester(s)}
                style={{
                  padding: '5px 12px',
                  border: `1px solid ${semester === s ? '#0052FF' : '#d9d9d9'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: semester === s ? '#e6f7ff' : '#fff',
                  color: semester === s ? '#0052FF' : '#595959',
                  fontSize: '13px',
                  fontWeight: semester === s ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                {s}
              </div>
            ))}
          </div>

          {/* Filter Kelas */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>Kelas:</span>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '300px' }}>
              {kelasList.map(k => (
                <div
                  key={k.id}
                  onClick={() => setKelasDiniyahId(k.id === kelasDiniyahId ? null : k.id)}
                  style={{
                    padding: '4px 10px',
                    border: `1px solid ${kelasDiniyahId === k.id ? '#0052FF' : '#d9d9d9'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: kelasDiniyahId === k.id ? '#e6f7ff' : '#fff',
                    color: kelasDiniyahId === k.id ? '#0052FF' : '#595959',
                    fontSize: '12px',
                    fontWeight: kelasDiniyahId === k.id ? 'bold' : 'normal',
                    transition: 'all 0.2s'
                  }}
                >
                  {k.nama}
                </div>
              ))}
            </div>
          </div>
          <Input value={tanggalCetak} onChange={e => setTanggalCetak(e.target.value)}
            placeholder="Tanggal Cetak" style={{ width: 200 }} prefix="📅" />
          <Button icon={<ReloadOutlined />} onClick={fetchPeserta} loading={loading} />
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}
            disabled={!pesertaList.length} style={{ background: '#0052FF' }}>
            Cetak {pesertaList.length ? `(${pesertaList.length} kartu)` : ''}
          </Button>
        </Space>
      </Card>

      {!pesertaList.length ? (
        <Card>
          <Empty description={tahunAjaranId && semester
            ? 'Belum ada data. Generate nomor peserta di tab "Generate Nomor" terlebih dahulu.'
            : 'Pilih tahun ajaran dan semester untuk melihat kartu peserta.'} />
        </Card>
      ) : (
        <div className="preview-info">
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text>{pesertaList.length} kartu siap dicetak · 6 kartu per halaman A4</Text>
            {pesertaList.some(p => !p.foto_url) && (
              <Tag color="warning"><WarningOutlined /> {pesertaList.filter(p => !p.foto_url).length} santri belum punya foto</Tag>
            )}
          </Space>
        </div>
      )}
    </div>
  );
}

// ─── Satu Kartu Ujian ────────────────────────────────────────────────────────
function KartuUjian({ p, settings, tahunAjaran, tanggalCetak }) {
  const formatTGL = (tgl) => {
    if (!tgl) return '-';
    return new Date(tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const ttl = [p.tempat_lahir, formatTGL(p.tanggal_lahir)].filter(Boolean).join(', ') || '-';

  return (
    <div className="kartu-ujian">
      {/* ── Header: Logo + Judul Madrasah ── */}
      <div className="kartu-header">
        <div className="kartu-logo">
          {settings?.kartu_ujian_logo_url
            ? <img src={`${API_BASE}${settings.kartu_ujian_logo_url}`} alt="logo" />
            : <div className="logo-placeholder">🏫</div>
          }
        </div>
        <div className="kartu-header-text">
          <div className="kartu-judul-1">{settings?.kartu_ujian_judul_1 || 'UJIAN SEMESTER'}</div>
          <div className="kartu-judul-2">{settings?.kartu_ujian_judul_2 || 'MADRASAH DINIYAH'}</div>
          <div className="kartu-tahun">
            TAHUN PELAJARAN {tahunAjaran?.kode?.replace('-', '/') || '-'}
          </div>
        </div>
      </div>

      {/* ── Bar Judul Kartu ── */}
      <div className="kartu-judul-kartu">
        {settings?.kartu_ujian_judul_kartu || 'KARTU PESERTA UJIAN TULIS'}
      </div>

      {/* ── Tabel Data Identitas (full width, tanpa foto di samping) ── */}
      <div className="kartu-body">
        <div className="data-rows">
          <div className="data-row">
            <span className="d-label">No. Induk Santri</span>
            <span className="d-sep">:</span>
            <span className="d-value">{p.nis || '-'}</span>
          </div>
          <div className="data-row">
            <span className="d-label">No. Peserta</span>
            <span className="d-sep">:</span>
            <span className="d-value peserta-num">{p.no_peserta || '-'}</span>
          </div>
          <div className="data-row">
            <span className="d-label">Nama Siswa</span>
            <span className="d-sep">:</span>
            <span className="d-value">{p.nama || '-'}</span>
          </div>
          <div className="data-row">
            <span className="d-label">Jenis Kelamin</span>
            <span className="d-sep">:</span>
            <span className="d-value">
              {p.jenis_kelamin === 'L' ? 'Laki-laki' : p.jenis_kelamin === 'P' ? 'Perempuan' : (p.jenis_kelamin || '-')}
            </span>
          </div>
          <div className="data-row">
            <span className="d-label">Kelas</span>
            <span className="d-sep">:</span>
            <span className="d-value">{p.nama_kelas || '-'}</span>
          </div>
          <div className="data-row">
            <span className="d-label">Tanggal Lahir</span>
            <span className="d-sep">:</span>
            <span className="d-value">{ttl}</span>
          </div>
          <div className="data-row">
            <span className="d-label">Alamat</span>
            <span className="d-sep">:</span>
            <span className="d-value">{p.alamat || '-'}</span>
          </div>
        </div>
      </div>

      {/* ── Bagian Bawah: Foto (kiri) + QR (tengah) + Footer TTD (kanan) ── */}
      <div className="kartu-bottom">
        {/* Foto di bawah kiri */}
        <div className="kartu-foto">
          {p.foto_url
            ? <img src={`${API_BASE}${p.foto_url}`} alt={p.nama} />
            : <div className="foto-placeholder"><UserOutlined /></div>
          }
        </div>

        {/* QR Code Verifikasi (Level 3) */}
        <div className="kartu-qr">
          <QRCodeSVG 
            value={`${window.location.origin}/verify/${p.no_peserta}`}
            size={80}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Footer TTD di bawah kanan */}
        <div className="kartu-footer">
          <div className="kartu-tempat-tanggal">
            {settings?.kartu_ujian_lokasi || 'Cintamulya'}, {tanggalCetak}
          </div>
          <div className="kartu-jabatan">Ketua Panitia</div>
          <div className="kartu-ttd-area">
            {settings?.kartu_ujian_stempel_url && (
              <img
                src={`${API_BASE}${settings.kartu_ujian_stempel_url}`}
                alt="stempel"
                className="stempel-img"
              />
            )}
            {settings?.kartu_ujian_ttd_url && (
              <img
                src={`${API_BASE}${settings.kartu_ujian_ttd_url}`}
                alt="ttd"
                className="ttd-img"
              />
            )}
          </div>
          <div className="kartu-nama-panitia">
            {settings?.kartu_ujian_ketua_panitia || 'Ketua Panitia'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Satu Kartu Ujian (Bagian Belakang / Tata Tertib) ────────────────────────
function KartuUjianBelakang({ settings }) {
  const defaultKewajiban = `1. Berada di tempat ujian 10 menit sebelum ujian dilaksanakan;
2. Menunjukan kartu ujiannya kepada penguji dan pengawas saat ujian berlangsung;
3. Berpakaian sopan dan rapi Syar'an Wa Adatan;
4. Berbaju putih, polos, berkerah, berlengan panjang dan berkopyah hitam bagi putra;
5. Berbaju putih dan berkerudung almamater bagi putri;
6. Membubuhkan tanda tangan di lembar absen dan menulis nama di lembar Jawaban.`;

  const defaultLarangan = `1. Keluar masuk ruang ujian tanpa seizin Penguji dan Pengawas;
2. Membuat gaduh atau ramai (berkomunikasi dengan peserta lain) saat ujian berlangsung;
3. Berambut gondrong, bersemir, memakai gelang, bermodel yang tidak sesuai dengan nilai-nilai pesantren dan berkuku panjang serta cat kuku bagi putri;
4. Membawa sesuatu selain alat tulis (termasuk stypo);
5. Memberi atau menyontek jawaban dengan cara apapun;
6. Mengerjakan soal-soal ujian sebelum dipersilahkan oleh penguji;
7. Bertanya soal-soal ujian kepada penguji saat mengerjakan soal;
8. Meninggalkan ruang ujian sebelum diperkenankan oleh penguji.`;

  const defaultSanksi = `1. Jika melanggar, maka ujiannya dinyatakan gugur dan dikeluarkan dari ruangan;
2. Pengurangan nilai;
3. Diperingatkan oleh pengawas/ penguji;
4. Berdiri di luar ruangan kelas;`;

  const kewajiban = settings?.tata_tertib_kewajiban || defaultKewajiban;
  const larangan = settings?.tata_tertib_larangan || defaultLarangan;
  const sanksi = settings?.tata_tertib_sanksi || defaultSanksi;

  const renderList = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => (
      <div key={i} style={{ fontSize: '9.5px', lineHeight: '1.2', color: '#000' }}>
        {line.trim()}
      </div>
    ));
  };

  return (
    <div className="kartu-ujian kartu-belakang" style={{ padding: '8px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '4px' }}>
        TATA TERTIB UJIAN
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Kewajiban :</div>
          {renderList(kewajiban)}
        </div>

        <div>
          <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Larangan :</div>
          {renderList(larangan)}
        </div>

        <div>
          <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Sanksi :</div>
          {renderList(sanksi)}
        </div>
      </div>
    </div>
  );
}

// ─── Komponen Utama ───────────────────────────────────────────────────────────
export function KartuUjianSemester() {
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('generate');

  // State cetak — dikelola di sini, BUKAN di dalam Tabs
  const [printData, setPrintData] = useState({ pesertaList: [], tahunAjaran: null, tanggalCetak: '' });

  const fetchMeta = useCallback(async () => {
    try {
      const [taData, settingsData] = await Promise.all([
        apiFetch('/api/tahun-ajaran'),
        apiFetch('/api/settings'),
      ]);
      setTahunAjaranList(taData);
      setSettings(settingsData);
    } catch (err) { console.error('Failed to load meta:', err); }
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const handlePesertaChange = useCallback((pesertaList, tahunAjaran, tanggalCetak) => {
    setPrintData({ pesertaList, tahunAjaran, tanggalCetak });
  }, []);

  const tabItems = [
    {
      key: 'generate',
      label: <span><ThunderboltOutlined /> Generate Nomor</span>,
      children: <TabGenerateNomor tahunAjaranList={tahunAjaranList} />,
    },
    {
      key: 'cetak',
      label: <span><PrinterOutlined /> Cetak Kartu</span>,
      children: (
        <TabCetakKartu
          tahunAjaranList={tahunAjaranList}
          settings={settings}
          onPesertaChange={handlePesertaChange}
          pesertaList={printData.pesertaList}
        />
      ),
    },
    {
      key: 'kartu_belakang',
      label: <span><FileTextOutlined /> Kartu Belakang</span>,
      children: (
        <TabKartuBelakang
          settings={settings}
          onRefresh={fetchMeta}
          pesertaList={printData.pesertaList}
        />
      ),
    },
    {
      key: 'setting',
      label: <span><SettingOutlined /> Setting Kartu</span>,
      children: <TabSettingCard settings={settings} onRefresh={fetchMeta} />,
    },
  ];

  return (
    <div className="kartu-ujian-page">
      {/* Header — disembunyikan saat print */}
      <div className="page-header no-print">
        <div className="page-icon"><IdcardOutlined /></div>
        <div>
          <Title level={3} style={{ margin: 0 }}>Kartu Ujian Semester</Title>
          <Text type="secondary">Generate nomor peserta, atur setting, dan cetak kartu ujian</Text>
        </div>
      </div>

      {/* Tabs — disembunyikan saat print */}
      <div className="no-print">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} type="card" />
      </div>

      {/* AREA CETAK — SELALU DIRENDER, HANYA TERLIHAT SAAT PRINT */}
      {printData.pesertaList.length > 0 && (
        <div className="kartu-grid-wrapper">
          <div className="kartu-grid">
            {printData.pesertaList.map((p) => (
              activeTab === 'kartu_belakang' ? (
                <KartuUjianBelakang
                  key={p.id}
                  settings={settings}
                />
              ) : (
                <KartuUjian
                  key={p.id}
                  p={p}
                  settings={settings}
                  tahunAjaran={printData.tahunAjaran}
                  tanggalCetak={printData.tanggalCetak}
                />
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
