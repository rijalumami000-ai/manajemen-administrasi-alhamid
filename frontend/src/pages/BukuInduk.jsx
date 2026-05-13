import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Button, Input, Select, Tag, Avatar, Space, Tooltip,
  Modal, Form, Upload, message, Spin, Badge, Typography, Card,
  Row, Col, Statistic, Empty, Divider, DatePicker, Checkbox, Alert
} from 'antd';
import {
  UserOutlined, SearchOutlined, UploadOutlined, DeleteOutlined,
  EditOutlined, BookOutlined, CameraOutlined, ReloadOutlined,
  TeamOutlined, CalendarOutlined, PlusOutlined, IdcardOutlined,
  HomeOutlined, PhoneOutlined, FileExcelOutlined, FilePdfOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { ImportSantriModal } from '../components/features/ImportSantriModal';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import dayjs from 'dayjs';
import './BukuInduk.scss';

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

export function BukuInduk() {
  const { isAdmin } = useAuth();
  const [santriList, setSantriList] = useState([]);
  const [tahunMasukList, setTahunMasukList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [kamarList, setKamarList] = useState([]);
  const [activeTahunAjaran, setActiveTahunAjaran] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterTahun, setFilterTahun] = useState(null);
  const [searchText, setSearchText] = useState('');

  // Modal states
  const [crudModal, setCrudModal] = useState({ open: false, santri: null });
  const [fotoModal, setFotoModal] = useState({ open: false, santri: null });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [form] = Form.useForm();
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTahun) params.set('tahun_masuk', filterTahun);
      if (searchText) params.set('search', searchText);

      const [data, tahunData, kelasData, kamarData, taAktif] = await Promise.all([
        apiFetch(`/api/buku-induk?${params}`),
        apiFetch('/api/buku-induk/tahun-masuk'),
        apiFetch('/api/kelas'),
        apiFetch('/api/kamar'),
        apiFetch('/api/tahun-ajaran/active').catch(() => null),
      ]);
      setSantriList(data);
      setTahunMasukList(tahunData);
      setKelasList(kelasData);
      setKamarList(kamarData);
      if (taAktif) setActiveTahunAjaran(taAktif);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterTahun, searchText]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // === CRUD Handlers ===
  const handleAddClick = () => {
    setCrudModal({ open: true, santri: null });
    setModalError('');
    form.resetFields();
    form.setFieldsValue({ masukkan_ke_ta_aktif: true });
  };

  const handleEditClick = (santri) => {
    setCrudModal({ open: true, santri });
    setModalError('');
    const tanggalLahir = santri.tanggal_lahir ? dayjs(santri.tanggal_lahir) : null;
    form.setFieldsValue({
      ...santri,
      tanggal_lahir: tanggalLahir,
      kelas_diniyah_id: santri.kelas_diniyah_id || undefined,
      kelas_sekolah_id: santri.kelas_sekolah_id || undefined,
      kamar_id: santri.kamar_id || undefined,
    });
  };

  const handleCrudSubmit = async () => {
    setIsSubmitting(true);
    setModalError('');
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        tanggal_lahir: values.tanggal_lahir ? values.tanggal_lahir.format('YYYY-MM-DD') : null,
        kelas_diniyah_id: values.kelas_diniyah_id || null,
        kelas_sekolah_id: values.kelas_sekolah_id || null,
        kamar_id: values.kamar_id || null,
      };

      if (crudModal.santri) {
        // Edit
        await apiFetch(`/api/buku-induk/${crudModal.santri.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
        message.success('Data santri berhasil diperbarui.');
      } else {
        // Tambah baru
        await apiFetch('/api/buku-induk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
        message.success('Santri baru berhasil ditambahkan ke Buku Induk.');
      }

      setCrudModal({ open: false, santri: null });
      fetchData();
    } catch (err) {
      if (err.message) setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (santri) => {
    Modal.confirm({
      title: `Hapus Santri: ${santri.nama}?`,
      content: 'Semua data terkait santri ini (termasuk data per tahun ajaran, peserta ujian) akan dihapus permanen. Data nilai harus dihapus terlebih dahulu jika ada.',
      okType: 'danger',
      okText: 'Hapus Permanen',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await apiFetch(`/api/buku-induk/${santri.id}`, { method: 'DELETE' });
          message.success('Data santri berhasil dihapus.');
          fetchData();
        } catch (err) {
          message.error(err.message);
        }
      },
    });
  };

  // === Foto Handlers ===
  const handleUploadFoto = async (santriId, file) => {
    const formData = new FormData();
    formData.append('foto', file);
    setUploadingFoto(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/buku-induk/${santriId}/foto`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal upload foto.');
      }
      message.success('Foto berhasil diunggah!');
      setFotoModal({ open: false, santri: null });
      fetchData();
    } catch (err) {
      message.error(err.message);
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleDeleteFoto = async (santriId) => {
    Modal.confirm({
      title: 'Hapus Foto?',
      content: 'Foto santri akan dihapus permanen.',
      okType: 'danger',
      okText: 'Hapus',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await apiFetch(`/api/buku-induk/${santriId}/foto`, { method: 'DELETE' });
          message.success('Foto berhasil dihapus.');
          fetchData();
        } catch (err) {
          message.error(err.message);
        }
      },
    });
  };

  // === Export Handlers ===
  const handleExportExcel = () => {
    const dataToExport = santriList.map(s => ({
      'NIS': s.nis,
      'NIK': s.nik,
      'Nama': s.nama,
      'Jenis Kelamin': s.jenis_kelamin,
      'Tempat Lahir': s.tempat_lahir,
      'Tanggal Lahir': s.tanggal_lahir,
      'Alamat': s.alamat,
      'Tahun Masuk': s.tahun_masuk,
      'Kelas Diniyah': s.kelas_diniyah,
      'Nama Ayah': s.nama_ayah,
      'Pekerjaan Ayah': s.pekerjaan_ayah,
      'No HP Ayah': s.no_hp_ayah,
      'Nama Ibu': s.nama_ibu,
      'Pekerjaan Ibu': s.pekerjaan_ibu,
      'No HP Ibu': s.no_hp_ibu,
    }));
    exportToExcel(dataToExport, `Buku_Induk_Santri.xlsx`);
  };

  const handleExportPDF = () => {
    const columns = [
      { title: 'NIS', dataIndex: 'nis' },
      { title: 'Nama', dataIndex: 'nama' },
      { title: 'L/P', dataIndex: 'jenis_kelamin' },
      { title: 'TTL', dataIndex: 'tempat_lahir' },
      { title: 'Tahun Masuk', dataIndex: 'tahun_masuk' },
      { title: 'Nama Ayah', dataIndex: 'nama_ayah' },
      { title: 'Nama Ibu', dataIndex: 'nama_ibu' },
    ];
    exportToPDF(santriList, columns, 'Buku Induk Santri - Madrasah Al-Hamid', 'Buku_Induk_Santri.pdf');
  };

  // Statistik
  const totalSantri = santriList.length;
  const totalLaki = santriList.filter(s => s.jenis_kelamin === 'Laki-laki').length;
  const totalPerempuan = santriList.filter(s => s.jenis_kelamin === 'Perempuan').length;
  const sudahFoto = santriList.filter(s => s.foto_url).length;
  const sudahTahunMasuk = santriList.filter(s => s.tahun_masuk).length;
  const belumTahunMasuk = totalSantri - sudahTahunMasuk;

  const kelasDiniyah = kelasList.filter(k => k.jenis === 'Diniyah');
  const kelasSekolah = kelasList.filter(k => k.jenis === 'Sekolah');

  const columns = [
    {
      title: 'Foto',
      dataIndex: 'foto_url',
      key: 'foto',
      width: 70,
      render: (foto, record) => (
        <div className="foto-cell">
          <Avatar
            size={48}
            src={foto ? `${API_BASE}${foto}` : undefined}
            icon={!foto && <UserOutlined />}
            className={`santri-avatar ${foto ? 'has-foto' : 'no-foto'}`}
          />
          {isAdmin() && (
            <div className="foto-overlay" onClick={() => setFotoModal({ open: true, santri: record })}>
              <CameraOutlined />
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'NIS',
      dataIndex: 'nis',
      key: 'nis',
      width: 150,
      render: (nis) => <Text code>{nis}</Text>,
    },
    {
      title: 'JK',
      dataIndex: 'jenis_kelamin',
      key: 'jenis_kelamin',
      width: 50,
      render: (text) => text === 'Laki-laki' ? 'L' : text === 'Perempuan' ? 'P' : '-'
    },
    {
      title: 'Nama Santri',
      dataIndex: 'nama',
      key: 'nama',
      render: (nama, record) => (
        <div>
          <Text strong>{nama}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.kelas_diniyah || '-'}
          </Text>
        </div>
      ),
    },
    {
      title: 'TTL',
      key: 'ttl',
      width: 180,
      render: (_, record) => (
        <Text style={{ fontSize: 12 }}>
          {record.tempat_lahir || '-'},{' '}
          {record.tanggal_lahir
            ? new Date(record.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
            : '-'}
        </Text>
      ),
    },
    {
      title: 'Orang Tua',
      key: 'orangtua',
      width: 150,
      render: (_, record) => (
        <div style={{ fontSize: 12 }}>
          <div>{record.nama_ayah || <Text type="secondary">-</Text>}</div>
          <div style={{ color: '#8c8c8c' }}>{record.nama_ibu || ''}</div>
        </div>
      ),
    },
    {
      title: 'Tahun Masuk',
      dataIndex: 'tahun_masuk',
      key: 'tahun_masuk',
      width: 110,
      render: (tahun) => (
        tahun ? <Tag color="blue" style={{ fontWeight: 700 }}>{tahun}</Tag>
          : <Tag color="warning">Belum</Tag>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      width: 120,
      render: (_, record) => isAdmin() ? (
        <Space size={4}>
          <Tooltip title="Edit Data">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditClick(record)} />
          </Tooltip>
          <Tooltip title="Upload Foto">
            <Button type="text" size="small" icon={<CameraOutlined />} onClick={() => setFotoModal({ open: true, santri: record })} />
          </Tooltip>
          <Tooltip title="Hapus">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteClick(record)} />
          </Tooltip>
        </Space>
      ) : null,
    },
  ];

  return (
    <div className="buku-induk-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-icon"><BookOutlined /></div>
          <div>
            <Title level={3} style={{ margin: 0 }}>Buku Induk Santri</Title>
            <Text type="secondary">Data master, foto, import & ekspor data santri</Text>
          </div>
        </div>
        <Space wrap>
          <Button icon={<FileExcelOutlined />} onClick={handleExportExcel} disabled={!santriList.length}>Ekspor Excel</Button>
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF} disabled={!santriList.length}>Ekspor PDF</Button>
          {isAdmin() && (
            <>
              <Button icon={<UploadOutlined />} onClick={() => setIsImportModalOpen(true)}>Impor Excel</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>Tambah Santri</Button>
            </>
          )}
        </Space>
      </div>

      {/* Statistik Utama */}
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={8}>
          <Card size="small" className="stat-card stat-total">
            <Statistic title="Total Santri" value={totalSantri} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" className="stat-card stat-laki">
            <Statistic title="Laki-laki" value={totalLaki} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" className="stat-card stat-perempuan">
            <Statistic title="Perempuan" value={totalPerempuan} valueStyle={{ color: '#eb2f96' }} />
          </Card>
        </Col>
      </Row>

      {/* Statistik Tambahan (Agak Kecil) */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={8} sm={8}>
          <Card size="small" className="stat-card-small">
            <Statistic title="Sudah Foto" value={sudahFoto} valueStyle={{ fontSize: 16, color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8} sm={8}>
          <Card size="small" className="stat-card-small">
            <Statistic title="Ada Tahun Masuk" value={sudahTahunMasuk} valueStyle={{ fontSize: 16, color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={8} sm={8}>
          <Card size="small" className="stat-card-small">
            <Statistic title="Belum Ada Tahun" value={belumTahunMasuk} valueStyle={{ fontSize: 16, color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* Filter */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input placeholder="Cari nama atau NIS..." prefix={<SearchOutlined />} value={searchText}
            onChange={e => setSearchText(e.target.value)} allowClear style={{ width: 260 }} />
          <Select placeholder="Filter Tahun Masuk" value={filterTahun} onChange={setFilterTahun}
            allowClear style={{ width: 180 }}>
            {tahunMasukList.map(t => (<Option key={t} value={t}>{t}</Option>))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
          <Tag color="default">{totalSantri} santri</Tag>
        </Space>
      </Card>

      {/* Tabel */}
      <Card size="small">
        <Table dataSource={santriList} columns={columns} rowKey="id" loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Total ${t} santri` }}
          size="middle" scroll={{ x: 1000 }}
          locale={{ emptyText: <Empty description="Tidak ada data santri" /> }} />
      </Card>

      {/* Modal CRUD Santri */}
      <Modal
        open={crudModal.open}
        title={crudModal.santri ? `Edit Santri: ${crudModal.santri.nama}` : 'Tambah Santri Baru'}
        onCancel={() => { setCrudModal({ open: false, santri: null }); form.resetFields(); setModalError(''); }}
        onOk={handleCrudSubmit}
        confirmLoading={isSubmitting}
        width={800}
        okText={crudModal.santri ? 'Perbarui' : 'Simpan'}
        cancelText="Batal"
        destroyOnClose
      >
        {modalError && <Alert message={modalError} type="error" showIcon closable style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical" disabled={isSubmitting}>
          <div className="form-section">
            <div className="form-section-title">Data Identitas</div>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="nis" label="NIS / Nomor Induk" rules={[{ required: true, message: 'NIS wajib diisi' }]}>
                  <Input prefix={<IdcardOutlined />} placeholder="NIS" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="nik" label="NIK">
                  <Input prefix={<IdcardOutlined />} placeholder="NIK" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="tahun_masuk" label="Tahun Masuk">
                  <Select placeholder="Tahun masuk" showSearch allowClear>
                    {Array.from({ length: 30 }, (_, i) => 2000 + i).map(y => (
                      <Option key={y} value={y}>{y}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="nama" label="Nama Lengkap" rules={[{ required: true, message: 'Nama wajib diisi' }]}>
                  <Input prefix={<UserOutlined />} placeholder="Nama lengkap" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="jenis_kelamin" label="Jenis Kelamin">
                  <Select placeholder="Pilih">
                    <Option value="Laki-laki">Laki-laki</Option>
                    <Option value="Perempuan">Perempuan</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="tempat_lahir" label="Tempat Lahir">
                  <Input prefix={<HomeOutlined />} placeholder="Tempat lahir" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="tanggal_lahir" label="Tanggal Lahir">
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Tanggal lahir" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="alamat" label="Alamat">
              <Input.TextArea rows={2} placeholder="Alamat lengkap" />
            </Form.Item>
          </div>

          <div className="form-section">
            <div className="form-section-title">Data Orang Tua</div>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="nama_ayah" label="Nama Ayah">
                  <Input placeholder="Nama ayah" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="pekerjaan_ayah" label="Pekerjaan Ayah">
                  <Input placeholder="Pekerjaan ayah" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="no_hp_ayah" label="No. HP Ayah">
                  <Input prefix={<PhoneOutlined />} placeholder="No. HP ayah" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item name="nama_ibu" label="Nama Ibu">
                  <Input placeholder="Nama ibu" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="pekerjaan_ibu" label="Pekerjaan Ibu">
                  <Input placeholder="Pekerjaan ibu" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item name="no_hp_ibu" label="No. HP Ibu">
                  <Input prefix={<PhoneOutlined />} placeholder="No. HP ibu" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Opsi masukkan ke TA aktif — hanya saat Tambah Baru */}
          {!crudModal.santri && (
            <div className="form-section">
              <div className="form-section-title">Penempatan Awal</div>
              <Form.Item name="masukkan_ke_ta_aktif" valuePropName="checked">
                <Checkbox>Langsung masukkan ke Tahun Ajaran Aktif</Checkbox>
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item name="kelas_diniyah_id" label="Kelas Diniyah">
                    <Select placeholder="Pilih" allowClear>
                      {kelasDiniyah.map(k => <Option key={k.id} value={k.id}>{k.nama}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="kelas_sekolah_id" label="Kelas Sekolah">
                    <Select placeholder="Pilih" allowClear>
                      {kelasSekolah.map(k => <Option key={k.id} value={k.id}>{k.nama}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="kamar_id" label="Kamar Asrama">
                    <Select placeholder="Pilih" allowClear>
                      {kamarList.map(k => <Option key={k.id} value={k.id}>{k.nama} ({k.jenis})</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 Jika dicentang, santri akan langsung muncul di menu Data Santri pada Tahun Ajaran yang sedang berjalan.
              </Text>
            </div>
          )}
        </Form>
      </Modal>

      {/* Modal Upload Foto */}
      <Modal
        title={<Space><CameraOutlined /> Upload Foto — {fotoModal.santri?.nama}</Space>}
        open={fotoModal.open}
        onCancel={() => setFotoModal({ open: false, santri: null })}
        footer={null}
      >
        {fotoModal.santri && (
          <div className="foto-modal-content">
            <div className="foto-preview-area">
              <Avatar
                size={120}
                src={fotoModal.santri.foto_url ? `${API_BASE}${fotoModal.santri.foto_url}` : undefined}
                icon={!fotoModal.santri.foto_url && <UserOutlined />}
                style={{ marginBottom: 16 }}
              />
              <Text type="secondary">{fotoModal.santri.foto_url ? 'Foto saat ini' : 'Belum ada foto'}</Text>
            </div>
            <Divider />
            <input type="file" accept=".jpg,.jpeg,.png,.webp" ref={fileInputRef} style={{ display: 'none' }}
              onChange={(e) => { const file = e.target.files[0]; if (file) handleUploadFoto(fotoModal.santri.id, file); }} />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" icon={<UploadOutlined />} block size="large" loading={uploadingFoto}
                onClick={() => fileInputRef.current?.click()}>
                {uploadingFoto ? 'Mengunggah...' : 'Pilih & Upload Foto'}
              </Button>
              {fotoModal.santri.foto_url && (
                <Button danger block onClick={() => { setFotoModal({ open: false, santri: null }); handleDeleteFoto(fotoModal.santri.id); }}>
                  Hapus Foto
                </Button>
              )}
              <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', display: 'block' }}>
                Format: JPG, PNG, WEBP · Maks 2MB
              </Text>
            </Space>
          </div>
        )}
      </Modal>

      {/* Modal Import Excel — tetap pakai endpoint /api/santri/import yang sudah powerful */}
      <ImportSantriModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchData}
        tahunAjaranId={activeTahunAjaran?.id}
        tahunAjaranKode={activeTahunAjaran?.kode || 'Aktif'}
      />
    </div>
  );
}
