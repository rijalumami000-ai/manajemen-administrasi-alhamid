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
  kelasName,
  kategoriNama
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visibleMonths, setVisibleMonths] = useState([]);

  const isGenap = (kategoriNama || '').toLowerCase().includes('genap');
  const daftarBulan = isGenap 
    ? ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni']
    : ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  useEffect(() => {
    if (tahunAjaran && selectedKelasDetail && selectedKategori) {
      loadData();
    } else {
      setData([]);
    }
    // Set default semua bulan ditampilkan
    setVisibleMonths(daftarBulan);
  }, [tahunAjaran, selectedKelasDetail, selectedKategori, kategoriNama]);

  const loadData = async () => {
    try {
      setLoading(true);
      const raporData = await nilaiService.fetchRaporData({
        tahun_ajaran_id: tahunAjaran.id,
        kelas_id: selectedKelasDetail,
        kategori_evaluasi_id: selectedKategori
      });
      // Set default values if null
      const initialized = raporData.map(item => {
        // Pastikan detail_absensi terinisialisasi untuk semua daftarBulan
        const detail = item.detail_absensi || {};
        const initializedDetail = {};
        daftarBulan.forEach(bulan => {
          initializedDetail[bulan] = detail[bulan] || { sakit: 0, izin: 0, alpa: 0 };
        });

        return {
          ...item,
          sakit: item.sakit || 0,
          izin: item.izin || 0,
          alpa: item.alpa || 0,
          detail_absensi: initializedDetail,
          keaktifan: item.keaktifan || null,
          akhlaq: item.akhlaq || null,
          kerapihan: item.kerapihan || null,
          catatan: item.catatan || '',
          keputusan_kenaikan: item.keputusan_kenaikan || ''
        };
      });
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

  const handleDetailValueChange = (santriId, bulan, field, value) => {
    setData(prev => prev.map(item => {
      if (item.santri_id === santriId) {
        const updatedDetail = {
          ...item.detail_absensi,
          [bulan]: {
            ...(item.detail_absensi[bulan] || { sakit: 0, izin: 0, alpa: 0 }),
            [field]: value
          }
        };

        // Hitung ulang akumulasi secara real-time
        let totalSakit = 0;
        let totalIzin = 0;
        let totalAlpa = 0;
        
        daftarBulan.forEach(b => {
          const det = updatedDetail[b] || { sakit: 0, izin: 0, alpa: 0 };
          totalSakit += det.sakit || 0;
          totalIzin += det.izin || 0;
          totalAlpa += det.alpa || 0;
        });

        return {
          ...item,
          detail_absensi: updatedDetail,
          sakit: totalSakit,
          izin: totalIzin,
          alpa: totalAlpa
        };
      }
      return item;
    }));
  };

  const handleAutoFillKenaikan = () => {
    let nextClass = '';
    const current = (kelasName || '').toLowerCase();
    
    if (current.includes('sifir')) nextClass = 'Satu';
    else if (current.includes('sp')) nextClass = 'Dua';
    else if (current.includes('1')) nextClass = 'Dua';
    else if (current.includes('2')) nextClass = 'Tiga';
    else if (current.includes('3')) nextClass = 'Empat';
    else if (current.includes('4')) nextClass = 'Lima';
    else if (current.includes('5')) nextClass = 'Enam';
    else if (current.includes('6')) {
      antMessage.info('Kelas 6 tidak ada kelas selanjutnya.');
      return;
    }

    if (nextClass) {
      setData(prev => prev.map(item => ({ ...item, keputusan_kenaikan: nextClass })));
      antMessage.success(`Berhasil mengisi otomatis: ${nextClass}`);
    }
  };

  const handleAutoFillCatatan = () => {
    setData(prev => prev.map(item => ({ ...item, catatan: 'Tingkatkan lagi belajarnya!!' })));
    antMessage.success(`Berhasil mengisi otomatis catatan`);
  };

  const handleAutoFillKepribadian = () => {
    setData(prev => prev.map(item => ({ ...item, keaktifan: 'B', akhlaq: 'B', kerapihan: 'B' })));
    antMessage.success(`Berhasil mengisi otomatis kepribadian dengan nilai B`);
  };

  let columns = [];

  if (type === 'absensi') {
    columns = [
      { 
        title: 'Nama Santri', 
        dataIndex: 'nama', 
        width: 180, 
        fixed: 'left',
        render: (text) => <div style={{ fontWeight: '500', minWidth: '150px' }}>{text}</div>
      },
      ...daftarBulan.filter(bulan => visibleMonths.includes(bulan)).map(bulan => ({
        title: bulan,
        align: 'center',
        children: [
          {
            title: 'S',
            width: 45,
            align: 'center',
            render: (_, record) => (
              <InputNumber
                min={0}
                size="small"
                value={record.detail_absensi?.[bulan]?.sakit ?? 0}
                style={{ width: '42px', padding: '0px', textAlign: 'center' }}
                onChange={(v) => handleDetailValueChange(record.santri_id, bulan, 'sakit', v)}
              />
            )
          },
          {
            title: 'I',
            width: 45,
            align: 'center',
            render: (_, record) => (
              <InputNumber
                min={0}
                size="small"
                value={record.detail_absensi?.[bulan]?.izin ?? 0}
                style={{ width: '42px', padding: '0px', textAlign: 'center' }}
                onChange={(v) => handleDetailValueChange(record.santri_id, bulan, 'izin', v)}
              />
            )
          },
          {
            title: 'A',
            width: 45,
            align: 'center',
            render: (_, record) => (
              <InputNumber
                min={0}
                size="small"
                value={record.detail_absensi?.[bulan]?.alpa ?? 0}
                style={{ width: '42px', padding: '0px', textAlign: 'center' }}
                onChange={(v) => handleDetailValueChange(record.santri_id, bulan, 'alpa', v)}
              />
            )
          }
        ]
      })),
      {
        title: 'Total',
        align: 'center',
        children: [
          {
            title: 'S',
            dataIndex: 'sakit',
            width: 45,
            align: 'center',
            render: (val) => (
              <InputNumber disabled size="small" value={val} style={{ width: '42px', color: '#000', fontWeight: 'bold', backgroundColor: '#f5f5f5' }} />
            )
          },
          {
            title: 'I',
            dataIndex: 'izin',
            width: 45,
            align: 'center',
            render: (val) => (
              <InputNumber disabled size="small" value={val} style={{ width: '42px', color: '#000', fontWeight: 'bold', backgroundColor: '#f5f5f5' }} />
            )
          },
          {
            title: 'A',
            dataIndex: 'alpa',
            width: 45,
            align: 'center',
            render: (val) => (
              <InputNumber disabled size="small" value={val} style={{ width: '42px', color: '#000', fontWeight: 'bold', backgroundColor: '#f5f5f5' }} />
            )
          }
        ]
      }
    ];
  } else {
    columns = [
      { title: 'NIS', dataIndex: 'nis', width: '15%' },
      { title: 'Nama Santri', dataIndex: 'nama', width: '35%' },
    ];

    if (type === 'kepribadian') {
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
    } else if (type === 'kenaikan_kelas') {
      columns = [
        ...columns,
        {
          title: 'Keputusan Kenaikan Kelas',
          dataIndex: 'keputusan_kenaikan',
          render: (val, record) => (
            <Input 
              value={val} 
              onChange={(e) => handleValueChange(record.santri_id, 'keputusan_kenaikan', e.target.value)} 
              placeholder="Contoh: Naik ke Kelas 2"
            />
          )
        }
      ];
    }
  }

  const titles = {
    absensi: 'Input Absensi',
    kepribadian: 'Input Nilai Kepribadian',
    catatan: 'Input Catatan Wali Kelas',
    kenaikan_kelas: 'Input Keputusan Kenaikan Kelas'
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
        <Space>
          {type === 'kenaikan_kelas' && (
            <Button type="dashed" onClick={handleAutoFillKenaikan} disabled={!data.length}>
              Isi Otomatis
            </Button>
          )}
          {type === 'catatan' && (
            <Button type="dashed" onClick={handleAutoFillCatatan} disabled={!data.length}>
              Isi Otomatis
            </Button>
          )}
          {type === 'kepribadian' && (
            <Button type="dashed" onClick={handleAutoFillKepribadian} disabled={!data.length}>
              Isi Otomatis (Semua B)
            </Button>
          )}
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={!data.length}>
            Simpan Data
          </Button>
        </Space>
      }
    >
      {type === 'absensi' && data.length > 0 && (
        <div style={{ 
          marginBottom: 16, 
          padding: '12px', 
          background: '#f5f5f5', 
          borderRadius: '6px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          flexWrap: 'wrap',
          border: '1px solid #e8e8e8'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Pilih Bulan Kerja:</span>
          <Button 
            size="small" 
            type={visibleMonths.length === daftarBulan.length ? 'primary' : 'default'}
            onClick={() => setVisibleMonths(daftarBulan)}
          >
            Semua
          </Button>
          <Button 
            size="small" 
            type={visibleMonths.length === 0 ? 'primary' : 'default'}
            danger={visibleMonths.length === 0}
            onClick={() => setVisibleMonths([])}
          >
            Sembunyikan Semua
          </Button>
          <div style={{ width: '1px', height: '16px', background: '#ccc', margin: '0 4px' }} />
          <Space size={6} wrap>
            {daftarBulan.map(bulan => {
              const isVisible = visibleMonths.includes(bulan);
              return (
                <Button
                  key={bulan}
                  size="small"
                  type={isVisible ? 'primary' : 'default'}
                  ghost={isVisible}
                  style={{ 
                    fontWeight: isVisible ? 'bold' : 'normal'
                  }}
                  onClick={() => {
                    if (isVisible) {
                      setVisibleMonths(prev => prev.filter(m => m !== bulan));
                    } else {
                      setVisibleMonths(prev => [...prev, bulan]);
                    }
                  }}
                >
                  {bulan} {isVisible ? '✓' : ''}
                </Button>
              );
            })}
          </Space>
        </div>
      )}
      <Table 
        dataSource={data} 
        columns={columns} 
        rowKey="santri_id" 
        pagination={false} 
        loading={loading}
        size="middle" 
        scroll={type === 'absensi' ? { x: 'max-content' } : undefined}
      />
    </Card>
  );
}
