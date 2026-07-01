import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Select, Input, Typography, 
  message, Button, Alert, Segmented, Row, Col, Space, Popconfirm, Empty
} from 'antd';
import { 
  EditOutlined, SaveOutlined, CloseOutlined, 
  BookOutlined, PlusOutlined, DeleteOutlined,
  ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import { PageHeader, LoadingState } from '../components/common';
import { nilaiService } from '../services/nilaiService';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

export function SilabusPembelajaran() {
  const { isAdmin } = useAuth();

  // Reference lists
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [kelasList, setKelasList] = useState([]);

  // Selected filters
  const [selectedTahunId, setSelectedTahunId] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('Ganjil');
  const [selectedKelasId, setSelectedKelasId] = useState(null);

  // Data states
  const [silabusList, setSilabusList] = useState([]);
  const [editList, setEditList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Initialize filters
  useEffect(() => {
    const initFilters = async () => {
      try {
        setLoading(true);
        // Fetch Tahun Ajaran
        const years = await nilaiService.fetchTahunAjaran();
        setTahunAjaranList(years);
        const activeYear = years.find(y => y.is_active);
        if (activeYear) {
          setSelectedTahunId(activeYear.id);
        } else if (years.length > 0) {
          setSelectedTahunId(years[0].id);
        }

        // Fetch Diniyah Classes
        const classes = await nilaiService.fetchKelas();
        const diniyahClasses = classes.filter(k => k.jenis === 'Diniyah');
        
        // Sort classes
        const getTingkatOrder = (k) => {
          const name = (k.nama || '').toLowerCase();
          if (name.includes('sifir')) return 0;
          if (name.startsWith('1') || name.includes('kelas 1')) return 1;
          if (name === 'sp' || name.startsWith('sp') || name.includes('sp ')) return 1.5;
          if (name.startsWith('2') || name.includes('kelas 2')) return 2;
          if (name.startsWith('3') || name.includes('kelas 3')) return 3;
          if (name.startsWith('4') || name.includes('kelas 4')) return 4;
          if (name.startsWith('5') || name.includes('kelas 5')) return 5;
          if (name.startsWith('6') || name.includes('kelas 6')) return 6;
          if (k.tingkat === 99) return 1.5;
          return k.tingkat ?? 999;
        };
        const sortedClasses = diniyahClasses.sort((a, b) => {
          const orderA = getTingkatOrder(a);
          const orderB = getTingkatOrder(b);
          if (orderA !== orderB) return orderA - orderB;
          return a.nama.localeCompare(b.nama, 'id', { numeric: true, sensitivity: 'base' });
        });

        setKelasList(sortedClasses);
        if (sortedClasses.length > 0) {
          setSelectedKelasId(sortedClasses[0].id);
        }
      } catch (err) {
        console.error(err);
        message.error('Gagal memuat filter referensi.');
      } finally {
        setLoading(false);
      }
    };
    initFilters();
  }, []);

  // Fetch Silabus data
  const fetchSilabus = async () => {
    if (!selectedTahunId || !selectedKelasId || !selectedSemester) return;
    try {
      setDataLoading(true);
      setIsEditing(false);
      const data = await nilaiService.fetchSilabus(selectedTahunId, selectedSemester, selectedKelasId);
      const list = Array.isArray(data) ? data : [];
      setSilabusList(list);
      setEditList(JSON.parse(JSON.stringify(list)));
    } catch (err) {
      console.error(err);
      message.error('Gagal memuat silabus pembelajaran.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchSilabus();
  }, [selectedTahunId, selectedSemester, selectedKelasId]);

  // Actions
  const handleSave = async () => {
    try {
      setSaveLoading(true);
      await nilaiService.saveSilabus({
        tahun_ajaran_id: selectedTahunId,
        semester: selectedSemester,
        kelas_id: selectedKelasId,
        data: editList
      });
      message.success('Silabus pembelajaran berhasil disimpan!');
      setSilabusList(JSON.parse(JSON.stringify(editList)));
      setIsEditing(false);
    } catch (err) {
      message.error(err.message || 'Gagal menyimpan silabus.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...editList];
    updated[index] = { ...updated[index], [field]: value };
    setEditList(updated);
  };

  const handleAddRow = () => {
    const defaultMonth = selectedSemester === 'Ganjil' ? 'Juli' : 'Januari';
    setEditList([...editList, {
      bulan: defaultMonth,
      pelajaran: '',
      pengajar: 'Mustahiq',
      ketentuan: '',
      target_materi: '',
      target_pencapaian: '',
      target_muhafadzoh: ''
    }]);
  };

  const handleRemoveRow = (index) => {
    setEditList(editList.filter((_, i) => i !== index));
  };

  const moveRow = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editList.length) return;
    const updated = [...editList];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setEditList(updated);
  };

  const getMonthOptions = () => {
    if (selectedSemester === 'Ganjil') {
      return ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
        <Select.Option key={m} value={m}>{m}</Select.Option>
      ));
    } else {
      return ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'].map(m => (
        <Select.Option key={m} value={m}>{m}</Select.Option>
      ));
    }
  };

  if (loading) {
    return <LoadingState message="Memuat filter referensi..." />;
  }

  // Row span helper for Bulan column to merge cells nicely like a real doc syllabus table!
  const getBulanRender = (value, row, index, listToUse) => {
    const obj = {
      children: <Text strong style={{ color: '#1e293b' }}>{value}</Text>,
      props: {},
    };
    
    // Find how many consecutive rows share this month
    let firstOccurrenceIndex = index;
    while (firstOccurrenceIndex > 0 && listToUse[firstOccurrenceIndex - 1].bulan === value) {
      firstOccurrenceIndex--;
    }
    
    if (index === firstOccurrenceIndex) {
      let spanCount = 1;
      while (index + spanCount < listToUse.length && listToUse[index + spanCount].bulan === value) {
        spanCount++;
      }
      obj.props.rowSpan = spanCount;
    } else {
      obj.props.rowSpan = 0;
    }
    return obj;
  };

  // Same helper for Target Muhafadzoh column (often spans multiple months)
  const getMuhafadzohRender = (value, row, index, listToUse) => {
    const obj = {
      children: <span style={{ whiteSpace: 'pre-wrap', color: '#475569' }}>{value || '-'}</span>,
      props: {},
    };

    let firstOccurrenceIndex = index;
    while (firstOccurrenceIndex > 0 && listToUse[firstOccurrenceIndex - 1].target_muhafadzoh === value && value !== '') {
      firstOccurrenceIndex--;
    }

    if (value && value.trim() !== '') {
      if (index === firstOccurrenceIndex) {
        let spanCount = 1;
        while (index + spanCount < listToUse.length && listToUse[index + spanCount].target_muhafadzoh === value) {
          spanCount++;
        }
        obj.props.rowSpan = spanCount;
      } else {
        obj.props.rowSpan = 0;
      }
    }
    return obj;
  };

  return (
    <div style={{ padding: '24px' }}>
      <PageHeader
        title="Silabus Pembelajaran"
        subtitle="Kelola target materi, pencapaian, ketentuan, serta muhafadzoh Madrasah Diniyyah"
      />

      {/* Filters Card */}
      <Card style={{ marginBottom: 20, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <div style={{ marginBottom: 4 }}><Text strong>Tahun Ajaran</Text></div>
            <Select
              style={{ width: '100%' }}
              value={selectedTahunId}
              onChange={setSelectedTahunId}
              placeholder="Pilih Tahun Ajaran"
            >
              {tahunAjaranList.map(ta => (
                <Select.Option key={ta.id} value={ta.id}>
                  {ta.kode} {ta.is_active && '(Aktif)'}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={8} md={6}>
            <div style={{ marginBottom: 4 }}><Text strong>Semester</Text></div>
            <Segmented
              block
              value={selectedSemester}
              onChange={setSelectedSemester}
              options={['Ganjil', 'Genap']}
            />
          </Col>

          <Col xs={24} sm={8} md={8}>
            <div style={{ marginBottom: 4 }}><Text strong>Kelas Diniyyah</Text></div>
            <Select
              style={{ width: '100%' }}
              value={selectedKelasId}
              onChange={setSelectedKelasId}
              placeholder="Pilih Kelas"
            >
              {kelasList.map(k => (
                <Select.Option key={k.id} value={k.id}>
                  {k.nama} ({k.mustahiq_nama || 'Wali belum diset'})
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Main Table Card */}
      <Card
        title={
          <Space>
            <BookOpenOutlined style={{ color: '#10b981' }} />
            <span>Silabus Pembelajaran Kelas Diniyah</span>
          </Space>
        }
        extra={
          isAdmin && (
            isEditing ? (
              <Space>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setEditList(JSON.parse(JSON.stringify(silabusList)));
                    setIsEditing(false);
                  }}
                  disabled={saveLoading}
                >
                  Batal
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saveLoading}
                  style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                >
                  Simpan Silabus
                </Button>
              </Space>
            ) : (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              >
                Ubah Silabus
              </Button>
            )
          )
        }
        loading={dataLoading}
        style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
      >
        <Alert
          message="Silabus Pembelajaran Madrasah Diniyyah Al-Hamid"
          description="Syllabus ini mengatur pembagian materi ajar bulanan beserta target pencapaian & muhafadzoh di masing-masing kelas Diniyah."
          type="info"
          showIcon
          style={{ marginBottom: 16, borderRadius: '8px' }}
        />

        {isEditing ? (
          <div>
            <Table
              dataSource={editList.map((row, i) => ({ ...row, key: i }))}
              pagination={false}
              size="middle"
              bordered
              columns={[
                {
                  title: 'Bulan',
                  dataIndex: 'bulan',
                  width: 120,
                  render: (text, record, idx) => (
                    <Select
                      style={{ width: '100%' }}
                      value={text}
                      onChange={val => handleRowChange(idx, 'bulan', val)}
                    >
                      {getMonthOptions()}
                    </Select>
                  )
                },
                {
                  title: 'Pelajaran',
                  dataIndex: 'pelajaran',
                  width: 150,
                  render: (text, record, idx) => (
                    <Input 
                      placeholder="Nama Pelajaran" 
                      value={text} 
                      onChange={e => handleRowChange(idx, 'pelajaran', e.target.value)} 
                    />
                  )
                },
                {
                  title: 'Pengajar',
                  dataIndex: 'pengajar',
                  width: 110,
                  render: (text, record, idx) => (
                    <Select
                      style={{ width: '100%' }}
                      value={text}
                      onChange={val => handleRowChange(idx, 'pengajar', val)}
                    >
                      <Select.Option value="Mustahiq">Mustahiq</Select.Option>
                      <Select.Option value="Munawib">Munawib</Select.Option>
                    </Select>
                  )
                },
                {
                  title: 'Ketentuan',
                  dataIndex: 'ketentuan',
                  render: (text, record, idx) => (
                    <TextArea 
                      placeholder="Ketentuan / Instruksi" 
                      rows={2}
                      value={text} 
                      onChange={e => handleRowChange(idx, 'ketentuan', e.target.value)} 
                    />
                  )
                },
                {
                  title: 'Target Materi',
                  dataIndex: 'target_materi',
                  render: (text, record, idx) => (
                    <TextArea 
                      placeholder="Bab / Halaman" 
                      rows={2}
                      value={text} 
                      onChange={e => handleRowChange(idx, 'target_materi', e.target.value)} 
                    />
                  )
                },
                {
                  title: 'Target Pencapaian',
                  dataIndex: 'target_pencapaian',
                  render: (text, record, idx) => (
                    <TextArea 
                      placeholder="Kriteria Kelulusan" 
                      rows={2}
                      value={text} 
                      onChange={e => handleRowChange(idx, 'target_pencapaian', e.target.value)} 
                    />
                  )
                },
                {
                  title: 'Target Muhafadzoh',
                  dataIndex: 'target_muhafadzoh',
                  render: (text, record, idx) => (
                    <TextArea 
                      placeholder="Target Hafalan" 
                      rows={2}
                      value={text} 
                      onChange={e => handleRowChange(idx, 'target_muhafadzoh', e.target.value)} 
                    />
                  )
                },
                {
                  title: 'Aksi',
                  key: 'aksi',
                  width: 100,
                  align: 'center',
                  render: (_, record, idx) => (
                    <Space size="middle">
                      <Button
                        type="text"
                        icon={<ArrowUpOutlined />}
                        disabled={idx === 0}
                        onClick={() => moveRow(idx, 'up')}
                      />
                      <Button
                        type="text"
                        icon={<ArrowDownOutlined />}
                        disabled={idx === editList.length - 1}
                        onClick={() => moveRow(idx, 'down')}
                      />
                      <Popconfirm
                        title="Hapus baris ini?"
                        onConfirm={() => handleRemoveRow(idx)}
                        okText="Ya"
                        cancelText="Batal"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
            />
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddRow}
              block
              style={{ marginTop: 12 }}
            >
              Tambah Baris Silabus
            </Button>
          </div>
        ) : silabusList.length > 0 ? (
          <Table
            dataSource={silabusList.map((row, i) => ({ ...row, key: i }))}
            pagination={false}
            size="middle"
            bordered
            rowKey="key"
            columns={[
              {
                title: 'Bulan',
                dataIndex: 'bulan',
                width: 100,
                align: 'center',
                render: (val, row, idx) => getBulanRender(val, row, idx, silabusList)
              },
              {
                title: 'Pelajaran',
                dataIndex: 'pelajaran',
                width: 140,
                render: (text) => <Text strong style={{ color: '#0f172a' }}>{text || '-'}</Text>
              },
              {
                title: 'Pengajar',
                dataIndex: 'pengajar',
                width: 100,
                align: 'center',
                render: (text) => (
                  <span style={{ 
                    padding: '3px 8px', 
                    borderRadius: '6px', 
                    fontSize: '11px',
                    fontWeight: 'bold',
                    backgroundColor: text === 'Mustahiq' ? '#eff6ff' : '#ecfdf5',
                    color: text === 'Mustahiq' ? '#1e40af' : '#047857'
                  }}>
                    {text}
                  </span>
                )
              },
              {
                title: 'Ketentuan',
                dataIndex: 'ketentuan',
                render: (text) => (
                  <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: '#334155' }}>
                    {(text || '').split('\n').filter(Boolean).map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                    {!text && '-'}
                  </ul>
                )
              },
              {
                title: 'Target Materi',
                dataIndex: 'target_materi',
                render: (text) => <span style={{ whiteSpace: 'pre-wrap', fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{text || '-'}</span>
              },
              {
                title: 'Target Pencapaian',
                dataIndex: 'target_pencapaian',
                render: (text) => <span style={{ whiteSpace: 'pre-wrap', fontSize: '12px', color: '#475569' }}>{text || '-'}</span>
              },
              {
                title: 'Target Muhafadzoh',
                dataIndex: 'target_muhafadzoh',
                width: 150,
                render: (val, row, idx) => getMuhafadzohRender(val, row, idx, silabusList)
              }
            ]}
          />
        ) : (
          <Empty
            description="Belum ada data silabus pembelajaran kelas ini. Silakan klik 'Ubah Silabus' untuk mulai mengisi."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsEditing(true)}>
                Buat Silabus Baru
              </Button>
            )}
          </Empty>
        )}
      </Card>
    </div>
  );
}

// Icon for header
function BookOpenOutlined(props) {
  return (
    <span className="anticon" {...props}>
      <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '1em', height: '1em' }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    </span>
  );
}
