import React, { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Space, Alert, Empty, InputNumber, Select, Input, Button, message as antMessage } from 'antd';
import { UnorderedListOutlined, SaveOutlined } from '@ant-design/icons';
import { nilaiService } from '../../services/nilaiService';

const { Option } = Select;
const { TextArea } = Input;

export function RaporSantriForms({
  type, // 'absensi', 'kepribadian', 'catatan'
  tahunAjaran,
  selectedKelasDetail,
  selectedKategori,
  kelasName
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tahunAjaran && selectedKelasDetail && selectedKategori) {
      loadData();
    } else {
      setData([]);
    }
  }, [tahunAjaran, selectedKelasDetail, selectedKategori]);

  const loadData = async () => {
    try {
      setLoading(true);
      const raporData = await nilaiService.fetchRaporData({
        tahun_ajaran_id: tahunAjaran.id,
        kelas_id: selectedKelasDetail,
        kategori_evaluasi_id: selectedKategori
      });
      // Set default values if null
      const initialized = raporData.map(item => ({
        ...item,
        sakit: item.sakit || 0,
        izin: item.izin || 0,
        alpa: item.alpa || 0,
        keaktifan: item.keaktifan || null,
        akhlaq: item.akhlaq || null,
        kerapihan: item.kerapihan || null,
        catatan: item.catatan || ''
      }));
      setData(initialized);
    } catch (err) {
      antMessage.error('Gagal memuat data rapor');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data.length) return;
    try {
      setSaving(true);
      await nilaiService.saveRaporBulk({
        tahun_ajaran_id: tahunAjaran.id,
        kategori_evaluasi_id: selectedKategori,
        data: data
      });
      antMessage.success(`Data ${type} berhasil disimpan`);
      loadData(); // Reload to get fresh DB states
    } catch (err) {
      antMessage.error(`Gagal menyimpan data ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (santriId, field, value) => {
    setData(prev => prev.map(item => 
      item.santri_id === santriId ? { ...item, [field]: value } : item
    ));
  };

  let columns = [
    { title: 'NIS', dataIndex: 'nis', width: '15%' },
    { title: 'Nama Santri', dataIndex: 'nama', width: '35%' },
  ];

  if (type === 'absensi') {
    columns = [
      ...columns,
      {
        title: 'Sakit',
        dataIndex: 'sakit',
        width: '15%',
        render: (val, record) => (
          <InputNumber min={0} value={val} onChange={(v) => handleValueChange(record.santri_id, 'sakit', v)} />
        )
      },
      {
        title: 'Izin',
        dataIndex: 'izin',
        width: '15%',
        render: (val, record) => (
          <InputNumber min={0} value={val} onChange={(v) => handleValueChange(record.santri_id, 'izin', v)} />
        )
      },
      {
        title: 'Alpa',
        dataIndex: 'alpa',
        width: '15%',
        render: (val, record) => (
          <InputNumber min={0} value={val} onChange={(v) => handleValueChange(record.santri_id, 'alpa', v)} />
        )
      }
    ];
  } else if (type === 'kepribadian') {
    const renderSelect = (field) => (val, record) => (
      <Select value={val} style={{ width: '100%' }} onChange={(v) => handleValueChange(record.santri_id, field, v)} allowClear placeholder="Pilih Nilai">
        <Option value="A">A (Sangat Baik)</Option>
        <Option value="B">B (Baik)</Option>
        <Option value="C">C (Cukup)</Option>
        <Option value="D">D (Kurang)</Option>
      </Select>
    );

    columns = [
      ...columns,
      { title: 'Keaktifan', dataIndex: 'keaktifan', width: '15%', render: renderSelect('keaktifan') },
      { title: 'Akhlaq', dataIndex: 'akhlaq', width: '15%', render: renderSelect('akhlaq') },
      { title: 'Kerapihan', dataIndex: 'kerapihan', width: '15%', render: renderSelect('kerapihan') }
    ];
  } else if (type === 'catatan') {
    columns = [
      ...columns,
      {
        title: 'Catatan Wali Kelas',
        dataIndex: 'catatan',
        render: (val, record) => (
          <TextArea 
            rows={2} 
            value={val} 
            onChange={(e) => handleValueChange(record.santri_id, 'catatan', e.target.value)} 
            placeholder="Tuliskan pesan atau catatan..."
          />
        )
      }
    ];
  }

  const titles = {
    absensi: 'Input Absensi',
    kepribadian: 'Input Nilai Kepribadian',
    catatan: 'Input Catatan Wali Kelas'
  };

  return (
    <Card 
      title={
        <Space>
          <UnorderedListOutlined />
          <span>{titles[type]} - {kelasName}</span>
        </Space>
      }
      extra={
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!data.length}>
          Simpan Data
        </Button>
      }
    >
      <Table 
        dataSource={data} 
        columns={columns} 
        rowKey="santri_id" 
        pagination={false} 
        loading={loading}
        size="middle" 
      />
    </Card>
  );
}
