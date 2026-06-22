import { useState, useEffect } from 'react';
import { Card, Table, Select, Input, Tag, Space, Typography, message, Badge, Button, Modal, Form, Tabs } from 'antd';
import { SearchOutlined, KeyOutlined, DeleteOutlined } from '@ant-design/icons';
import { myMustahiqService } from '../services/myMustahiqService';
import { PageHeader, LoadingState, ErrorState } from '../components/common';

const { Option } = Select;
const { Title, Paragraph } = Typography;

export function MyMustahiqSettings() {
  const [gurus, setGurus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Push notifications states
  const [pushForm] = Form.useForm();
  const [pushing, setPushing] = useState(false);

  const handleSendPush = async (values) => {
    setPushing(true);
    try {
      const { title, body, category, target } = values;
      const res = await myMustahiqService.sendPushNotification(title, body, category, target);
      message.success(res.message || 'Notifikasi berhasil dikirim!');
      pushForm.resetFields();
    } catch (err) {
      console.error('Failed to send push:', err);
      message.error(err.message || 'Gagal mengirimkan notifikasi.');
    } finally {
      setPushing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await myMustahiqService.fetchGurus();
      setGurus(data.gurus || []);
    } catch (err) {
      console.error('Failed to load gurus:', err);
      setError('Gagal memuat data guru. Pastikan Anda masuk sebagai Administrator.');
    } finally {
      setLoading(false);
    }
  };

  const openCredentialsModal = (guru) => {
    setSelectedGuru(guru);
    form.setFieldsValue({
      username: guru.mymustahiq_username || guru.nip || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const closeCredentialsModal = () => {
    setIsModalOpen(false);
    setSelectedGuru(null);
    form.resetFields();
  };

  const handleSaveCredentials = async (values) => {
    if (!selectedGuru) return;
    setSubmitting(true);
    try {
      const { username, password } = values;
      const response = await myMustahiqService.updateCredentials(selectedGuru.id, username, password);
      
      message.success(response.message || 'Kredensial login berhasil diperbarui!');
      
      // Update local state
      setGurus(prevGurus =>
        prevGurus.map(g => {
          if (g.id === selectedGuru.id) {
            return {
              ...g,
              mymustahiq_username: username
            };
          }
          return g;
        })
      );
      
      closeCredentialsModal();
    } catch (err) {
      console.error('Failed to update credentials:', err);
      message.error(err.message || 'Gagal memperbarui kredensial.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAccess = async () => {
    if (!selectedGuru) return;
    
    Modal.confirm({
      title: 'Nonaktifkan Akses MyMustahiq?',
      content: `Apakah Anda yakin ingin menghapus kredensial login dan menonaktifkan akses MyMustahiq untuk ustadz ${selectedGuru.nama}?`,
      okText: 'Ya, Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        setSubmitting(true);
        try {
          const response = await myMustahiqService.updateCredentials(selectedGuru.id, null, null);
          message.success(response.message || 'Akses MyMustahiq berhasil dinonaktifkan.');
          
          // Update local state
          setGurus(prevGurus =>
            prevGurus.map(g => {
              if (g.id === selectedGuru.id) {
                return {
                  ...g,
                  mymustahiq_username: null
                };
              }
              return g;
            })
          );
          
          closeCredentialsModal();
        } catch (err) {
          console.error('Failed to deactivate credentials:', err);
          message.error(err.message || 'Gagal menonaktifkan akses.');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  if (loading) {
    return <LoadingState message="Memuat data kredensial guru..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  // Filter gurus based on search query and status filter
  const filteredGurus = gurus.filter(guru => {
    const matchesSearch = 
      (guru.nama && guru.nama.toLowerCase().includes(searchText.toLowerCase())) ||
      (guru.nip && guru.nip.toLowerCase().includes(searchText.toLowerCase())) ||
      (guru.mymustahiq_username && guru.mymustahiq_username.toLowerCase().includes(searchText.toLowerCase()));
    
    const isAccessActive = !!guru.mymustahiq_username;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && isAccessActive) ||
      (statusFilter === 'inactive' && !isAccessActive);

    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Nama Guru / Ustadz',
      dataIndex: 'nama',
      key: 'nama',
      render: (text) => (
        <span style={{ fontWeight: 600 }}>{text}</span>
      )
    },
    {
      title: 'NIP',
      dataIndex: 'nip',
      key: 'nip',
      render: (text) => text || <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>-</span>
    },
    {
      title: 'No. HP',
      dataIndex: 'no_hp',
      key: 'no_hp',
    },
    {
      title: 'Status Guru',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const isAktif = status && status.toLowerCase() === 'aktif';
        return (
          <Tag color={isAktif ? 'green' : 'red'}>
            {status || 'Nonaktif'}
          </Tag>
        );
      }
    },
    {
      title: 'Username MyMustahiq',
      dataIndex: 'mymustahiq_username',
      key: 'mymustahiq_username',
      render: (username) => username ? (
        <Tag color="blue" style={{ fontSize: '13px', padding: '3px 8px' }}>{username}</Tag>
      ) : (
        <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>Belum Diatur</span>
      )
    },
    {
      title: 'Akses Mobile',
      key: 'akses_status',
      render: (_, record) => {
        const isRegistered = !!record.mymustahiq_username;
        return (
          <Badge 
            status={isRegistered ? 'success' : 'default'} 
            text={isRegistered ? 'Aktif' : 'Nonaktif'} 
          />
        );
      }
    },
    {
      title: 'Aksi',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Button 
          type="primary"
          ghost
          icon={<KeyOutlined />}
          onClick={() => openCredentialsModal(record)}
        >
          Setel Akses
        </Button>
      )
    }
  ];

  return (
    <div className="mymustahiq-settings-page" style={{ padding: '24px' }}>
      <PageHeader
        title="Setelan & Utilitas MyMustahiq"
        subtitle="Kelola akun login ustadz dan kirim notifikasi manual ke aplikasi mobile"
      />

      <Tabs
        defaultActiveKey="accounts"
        type="card"
        style={{ marginTop: '16px' }}
        items={[
          {
            key: 'accounts',
            label: 'Manajemen Akun Guru',
            children: (
              <div style={{ marginTop: '16px' }}>
                <Card style={{ marginBottom: '24px', borderRadius: '8px' }}>
                  <Space direction="horizontal" size="middle" style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    {/* Search bar */}
                    <Input
                      placeholder="Cari nama, NIP, atau username..."
                      prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      style={{ width: '300px' }}
                      allowClear
                    />

                    {/* Status Filter */}
                    <Space>
                      <span style={{ color: '#8c8c8c' }}>Status Akses Mobile:</span>
                      <Select 
                        value={statusFilter} 
                        onChange={setStatusFilter} 
                        style={{ width: '180px' }}
                      >
                        <Option value="all">Semua Guru</Option>
                        <Option value="active">Akses Aktif</Option>
                        <Option value="inactive">Akses Nonaktif</Option>
                      </Select>
                    </Space>
                  </Space>
                </Card>

                <Card style={{ borderRadius: '8px' }}>
                  <Table
                    columns={columns}
                    dataSource={filteredGurus}
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    bordered
                  />
                </Card>
              </div>
            )
          },
          {
            key: 'push',
            label: 'Kirim Notifikasi Manual',
            children: (
              <div style={{ marginTop: '16px' }}>
                <Card style={{ borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
                  <Title level={4} style={{ marginBottom: '16px' }}>Kirim Push Notifikasi Manual</Title>
                  <Paragraph type="secondary">
                    Gunakan form ini untuk memicu pengiriman notifikasi instan ke aplikasi handphone ustadz yang terdaftar.
                  </Paragraph>
                  <Form
                    layout="vertical"
                    onFinish={handleSendPush}
                    form={pushForm}
                    initialValues={{ category: 'Pengumuman', target: 'all' }}
                  >
                    <Form.Item
                      label="Judul Notifikasi"
                      name="title"
                      rules={[{ required: true, message: 'Judul notifikasi wajib diisi.' }]}
                    >
                      <Input placeholder="Masukkan judul..." maxLength={100} />
                    </Form.Item>

                    <Form.Item
                      label="Isi Pesan"
                      name="body"
                      rules={[{ required: true, message: 'Isi pesan wajib diisi.' }]}
                    >
                      <Input.TextArea rows={4} placeholder="Masukkan pesan detail..." maxLength={500} />
                    </Form.Item>

                    <Form.Item
                      label="Kategori"
                      name="category"
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Option value="Akademik">Akademik</Option>
                        <Option value="Pengumuman">Pengumuman</Option>
                        <Option value="Sistem">Sistem</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label="Target Penerima"
                      name="target"
                      rules={[{ required: true }]}
                    >
                      <Select showSearch optionFilterProp="children">
                        <Option value="all">Semua Ustadz (Aktif)</Option>
                        <Option value="mustahiq">Hanya Mustahiq (Wali Kelas)</Option>
                        <Option value="munawib">Hanya Munawib (Guru Mapel)</Option>
                        {gurus.map(g => (
                          <Option key={g.id} value={g.id}>{g.nama} {g.nip ? `(${g.nip})` : ''}</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
                      <Button type="primary" htmlType="submit" loading={pushing} block>
                        Kirim Notifikasi Realtime
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </div>
            )
          }
        ]}
      />

      {/* Modal Setel Kredensial */}
      <Modal
        title={
          <span>
            <KeyOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            Setel Kredensial MyMustahiq
          </span>
        }
        open={isModalOpen}
        onCancel={closeCredentialsModal}
        footer={null}
        destroyOnClose
      >
        {selectedGuru && (
          <div style={{ marginTop: '16px' }}>
            <Paragraph>
              Mengatur username dan password login aplikasi mobile <strong>MyMustahiq</strong> untuk ustadz: <br />
              <strong style={{ fontSize: '16px', color: '#262626' }}>{selectedGuru.nama}</strong> 
              {selectedGuru.nip && ` (${selectedGuru.nip})`}
            </Paragraph>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveCredentials}
              requiredMark={false}
            >
              <Form.Item
                label="Username Login"
                name="username"
                rules={[
                  { required: true, message: 'Username login wajib diisi.' },
                  { pattern: /^[a-zA-Z0-9_.-]+$/, message: 'Username hanya boleh berupa huruf, angka, titik, strip, atau underscore.' }
                ]}
              >
                <Input placeholder="Contoh: ustadz_rijal" maxLength={50} />
              </Form.Item>

              <Form.Item
                label="Password Baru"
                name="password"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      // Password is required only if they don't have username yet
                      const isNewAccess = !selectedGuru.mymustahiq_username;
                      if (isNewAccess && !value) {
                        return Promise.reject(new Error('Password wajib diisi untuk aktivasi akses pertama kali.'));
                      }
                      if (value && value.length < 6) {
                        return Promise.reject(new Error('Password minimal 6 karakter.'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Input.Password 
                  placeholder={
                    selectedGuru.mymustahiq_username 
                      ? "Kosongkan jika tidak ingin mengubah password" 
                      : "Masukkan password login baru"
                  } 
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  {/* Left action: Hapus akses (if already has access) */}
                  {selectedGuru.mymustahiq_username ? (
                    <Button 
                      type="primary" 
                      danger 
                      ghost
                      icon={<DeleteOutlined />} 
                      onClick={handleRemoveAccess}
                      disabled={submitting}
                    >
                      Hapus Akses
                    </Button>
                  ) : (
                    <div />
                  )}

                  {/* Right actions */}
                  <Space>
                    <Button onClick={closeCredentialsModal} disabled={submitting}>
                      Batal
                    </Button>
                    <Button type="primary" htmlType="submit" loading={submitting}>
                      Simpan
                    </Button>
                  </Space>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
}
