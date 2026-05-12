import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table, Button, Input, Select, Tag, Avatar, Space, Tooltip,
  Modal, Form, Upload, message, Spin, Badge, Typography, Card,
  Row, Col, Statistic, Empty, Divider
} from 'antd';
import {
  UserOutlined, SearchOutlined, UploadOutlined, DeleteOutlined,
  EditOutlined, BookOutlined, CameraOutlined, ReloadOutlined,
  TeamOutlined, CalendarOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
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
  const [loading, setLoading] = useState(false);
  const [filterTahun, setFilterTahun] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [editModal, setEditModal] = useState({ open: false, santri: null });
  const [fotoModal, setFotoModal] = useState({ open: false, santri: null });
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [form] = Form.useForm();
  const fileInputRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTahun) params.set('tahun_masuk', filterTahun);
      if (searchText) params.set('search', searchText);

      const [data, tahunData] = await Promise.all([
        apiFetch(`/api/buku-induk?${params}`),
        apiFetch('/api/buku-induk/tahun-masuk'),
      ]);
      setSantriList(data);
      setTahunMasukList(tahunData);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterTahun, searchText]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditTahunMasuk = (santri) => {
    setEditModal({ open: true, santri });
    form.setFieldsValue({ tahun_masuk: santri.tahun_masuk });
  };

  const handleSaveTahunMasuk = async () => {
    const values = await form.validateFields();
    try {
      await apiFetch(`/api/buku-induk/${editModal.santri.id}/tahun-masuk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tahun_masuk: values.tahun_masuk }),
      });
      message.success('Tahun masuk berhasil diperbarui.');
      setEditModal({ open: false, santri: null });
      fetchData();
    } catch (err) {
      message.error(err.message);
    }
  };

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

  // Statistik
  const totalSantri = santriList.length;
  const sudahFoto = santriList.filter(s => s.foto_url).length;
  const sudahTahunMasuk = santriList.filter(s => s.tahun_masuk).length;
  const belumTahunMasuk = totalSantri - sudahTahunMasuk;

  const columns = [
    {
      title: 'Foto',
      dataIndex: 'foto_url',
      key: 'foto',
      width: 80,
      render: (foto, record) => (
        <div className="foto-cell">
          <Avatar
            size={52}
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
      width: 120,
      render: (nis) => <Text code>{nis}</Text>,
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
            {record.jenis_kelamin} · {record.kelas_diniyah || '-'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Tempat, Tanggal Lahir',
      key: 'ttl',
      width: 200,
      render: (_, record) => (
        <Text style={{ fontSize: 13 }}>
          {record.tempat_lahir || '-'},{' '}
          {record.tanggal_lahir
            ? new Date(record.tanggal_lahir).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
            : '-'}
        </Text>
      ),
    },
    {
      title: 'Orang Tua',
      key: 'orangtua',
      width: 160,
      render: (_, record) => (
        <Text style={{ fontSize: 13 }}>
          {record.nama_ayah || record.nama_ibu || <Text type="secondary">-</Text>}
        </Text>
      ),
    },
    {
      title: (
        <Space>
          <CalendarOutlined />
          Tahun Masuk
        </Space>
      ),
      dataIndex: 'tahun_masuk',
      key: 'tahun_masuk',
      width: 150,
      render: (tahun, record) => (
        <Space>
          {tahun
            ? <Tag color="blue" style={{ fontWeight: 700, fontSize: 14 }}>{tahun}</Tag>
            : <Tag color="warning">Belum diisi</Tag>
          }
          {isAdmin() && (
            <Tooltip title="Edit Tahun Masuk">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditTahunMasuk(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Status Foto',
      key: 'status_foto',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Badge
            status={record.foto_url ? 'success' : 'default'}
            text={record.foto_url ? 'Ada foto' : 'Belum ada'}
          />
          {isAdmin() && record.foto_url && (
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteFoto(record.id)}
              style={{ fontSize: 11, padding: '0 4px', height: 20 }}
            >
              Hapus
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="buku-induk-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-icon">
            <BookOutlined />
          </div>
          <div>
            <Title level={3} style={{ margin: 0 }}>Buku Induk Santri</Title>
            <Text type="secondary">Data permanen & foto santri Madrasah Al-Hamid</Text>
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Statistik */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <Card size="small" className="stat-card stat-total">
            <Statistic title="Total Santri" value={totalSantri} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="stat-card stat-foto">
            <Statistic title="Sudah Foto" value={sudahFoto} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="stat-card stat-tahun">
            <Statistic title="Ada Tahun Masuk" value={sudahTahunMasuk} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="stat-card stat-warning">
            <Statistic title="Belum Ada Tahun" value={belumTahunMasuk} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* Filter */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Cari nama atau NIS..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 260 }}
          />
          <Select
            placeholder="Filter Tahun Masuk"
            value={filterTahun}
            onChange={setFilterTahun}
            allowClear
            style={{ width: 180 }}
          >
            {tahunMasukList.map(t => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
          <Tag color="default">
            {totalSantri} santri ditampilkan
          </Tag>
        </Space>
      </Card>

      {/* Tabel */}
      <Card size="small">
        <Table
          dataSource={santriList}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Total ${t} santri` }}
          size="middle"
          scroll={{ x: 900 }}
          locale={{ emptyText: <Empty description="Tidak ada data santri" /> }}
        />
      </Card>

      {/* Modal Edit Tahun Masuk */}
      <Modal
        title={<Space><CalendarOutlined /> Edit Tahun Masuk — {editModal.santri?.nama}</Space>}
        open={editModal.open}
        onOk={handleSaveTahunMasuk}
        onCancel={() => setEditModal({ open: false, santri: null })}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Tahun Masuk"
            name="tahun_masuk"
            rules={[
              { required: true, message: 'Tahun masuk wajib diisi.' },
              { type: 'number', min: 2000, max: 2100, message: 'Tahun tidak valid.' },
            ]}
          >
            <Select placeholder="Pilih atau ketik tahun masuk" showSearch>
              {Array.from({ length: 30 }, (_, i) => 2000 + i).map(y => (
                <Option key={y} value={y}>{y}</Option>
              ))}
            </Select>
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 Tahun masuk adalah tahun di mana santri pertama kali masuk ke pesantren, bukan tahun ajaran.
          </Text>
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
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleUploadFoto(fotoModal.santri.id, file);
              }}
            />
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                block
                size="large"
                loading={uploadingFoto}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingFoto ? 'Mengunggah...' : 'Pilih & Upload Foto'}
              </Button>
              <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', display: 'block' }}>
                Format: JPG, PNG, WEBP · Maks 2MB · Foto akan dipakai di seluruh fitur cetak
              </Text>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}
