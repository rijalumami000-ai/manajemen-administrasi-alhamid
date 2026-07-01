import { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { nilaiService } from '../../services/nilaiService';
import { useToast } from '../common';
import { CustomSelect } from '../ui/CustomSelect';
import './RaporSantriForms.scss';

export function RaporSantriForms({
  type, // 'absensi', 'kepribadian', 'catatan', 'kenaikan_kelas'
  tahunAjaran,
  selectedKelasDetail,
  selectedKategori,
  kelasName,
  kategoriNama
}) {
  const toast = useToast();
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
      
      const initialized = raporData.map(item => {
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
      console.error(err);
      toast.error('Gagal memuat data rapor');
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
      toast.success(`Data ${titles[type]} berhasil disimpan`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(`Gagal menyimpan data ${titles[type]}`);
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
            [field]: value === '' ? 0 : Number(value)
          }
        };

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
      toast.info('Kelas 6 tidak memiliki tingkatan kelas selanjutnya.');
      return;
    }

    if (nextClass) {
      setData(prev => prev.map(item => ({ ...item, keputusan_kenaikan: `Naik ke Kelas ${nextClass}` })));
      toast.success(`Berhasil mengisi otomatis kenaikan ke Kelas ${nextClass}`);
    }
  };

  const handleAutoFillCatatan = () => {
    setData(prev => prev.map(item => ({ ...item, catatan: 'Tingkatkan lagi belajarnya!' })));
    toast.success(`Berhasil mengisi otomatis catatan motivasi wali kelas`);
  };

  const handleAutoFillKepribadian = () => {
    setData(prev => prev.map(item => ({ ...item, keaktifan: 'B', akhlaq: 'B', kerapihan: 'B' })));
    toast.success(`Berhasil mengisi otomatis kepribadian dengan predikat B`);
  };

  const titles = {
    absensi: 'Input Absensi',
    kepribadian: 'Input Nilai Kepribadian',
    catatan: 'Input Catatan Wali Kelas',
    kenaikan_kelas: 'Input Kenaikan Kelas'
  };

  if (loading) {
    return (
      <div className="rapor-loading-spinner">
        <div className="spinner"></div>
        <span>Memuat data form santri...</span>
      </div>
    );
  }

  const kepribadianOptions = [
    { value: 'A', label: 'A (Sangat Baik)' },
    { value: 'B', label: 'B (Baik)' },
    { value: 'C', label: 'C (Cukup)' },
    { value: 'D', label: 'D (Kurang)' }
  ];

  return (
    <div className="rapor-form-card frosted-card-rapor">
      <div className="rapor-form-header">
        <div className="header-title-box">
          <FileText size={18} className="header-icon" />
          <h3 className="header-title">{titles[type]} - {kelasName || ''}</h3>
        </div>
        <div className="header-actions">
          {type === 'kenaikan_kelas' && (
            <button 
              type="button" 
              className="btn-custom btn-secondary btn-auto" 
              onClick={handleAutoFillKenaikan} 
              disabled={!data.length}
            >
              <Sparkles size={14} />
              <span>Isi Otomatis</span>
            </button>
          )}
          {type === 'catatan' && (
            <button 
              type="button" 
              className="btn-custom btn-secondary btn-auto" 
              onClick={handleAutoFillCatatan} 
              disabled={!data.length}
            >
              <Sparkles size={14} />
              <span>Isi Otomatis</span>
            </button>
          )}
          {type === 'kepribadian' && (
            <button 
              type="button" 
              className="btn-custom btn-secondary btn-auto" 
              onClick={handleAutoFillKepribadian} 
              disabled={!data.length}
            >
              <Sparkles size={14} />
              <span>Isi B Semua</span>
            </button>
          )}
          <button 
            type="button" 
            className="btn-custom btn-primary" 
            onClick={handleSave} 
            loading={saving ? 'true' : undefined} 
            disabled={saving || !data.length}
          >
            <Save size={15} />
            <span>{saving ? 'Menyimpan...' : 'Simpan Data'}</span>
          </button>
        </div>
      </div>

      <div className="rapor-form-body">
        {type === 'absensi' && data.length > 0 && (
          <div className="month-toggles-container">
            <span className="toggle-label">Filter Bulan Kerja:</span>
            <div className="toggle-group-buttons">
              <button 
                type="button" 
                className={`toggle-btn-small ${visibleMonths.length === daftarBulan.length ? 'active' : ''}`}
                onClick={() => setVisibleMonths(daftarBulan)}
              >
                Tampilkan Semua
              </button>
              <button 
                type="button" 
                className={`toggle-btn-small danger ${visibleMonths.length === 0 ? 'active' : ''}`}
                onClick={() => setVisibleMonths([])}
              >
                Sembunyikan Semua
              </button>
              <div className="divider-vertical"></div>
              {daftarBulan.map(bulan => {
                const isVisible = visibleMonths.includes(bulan);
                return (
                  <button
                    key={bulan}
                    type="button"
                    className={`toggle-pill-item ${isVisible ? 'selected' : ''}`}
                    onClick={() => {
                      if (isVisible) {
                        setVisibleMonths(prev => prev.filter(m => m !== bulan));
                      } else {
                        setVisibleMonths(prev => [...prev, bulan]);
                      }
                    }}
                  >
                    {bulan} {isVisible && <Check size={11} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {data.length === 0 ? (
          <div className="rapor-empty-state">
            <AlertCircle size={40} className="empty-icon" />
            <span>Tidak ada data santri ditemukan. Silakan lengkapi filter di atas.</span>
          </div>
        ) : (
          <div className="table-responsive-rapor">
            <table className="rapor-custom-table">
              {type === 'absensi' ? (
                <>
                  <thead>
                    <tr>
                      <th rowSpan={2} style={{ minWidth: '180px' }}>Nama Santri</th>
                      {daftarBulan.filter(b => visibleMonths.includes(b)).map(bulan => (
                        <th colSpan={3} key={bulan} className="bulan-header">{bulan}</th>
                      ))}
                      <th colSpan={3} className="total-header">Total Akumulasi</th>
                    </tr>
                    <tr>
                      {daftarBulan.filter(b => visibleMonths.includes(b)).flatMap(bulan => [
                        <th key={`${bulan}-s`} className="sub-th s-col">S</th>,
                        <th key={`${bulan}-i`} className="sub-th i-col">I</th>,
                        <th key={`${bulan}-a`} className="sub-th a-col">A</th>
                      ])}
                      <th className="sub-th s-col font-bold">S</th>
                      <th className="sub-th i-col font-bold">I</th>
                      <th className="sub-th a-col font-bold">A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((record) => (
                      <tr key={record.santri_id}>
                        <td className="student-name-cell">{record.nama}</td>
                        {daftarBulan.filter(b => visibleMonths.includes(b)).flatMap(bulan => {
                          const valS = record.detail_absensi?.[bulan]?.sakit ?? 0;
                          const valI = record.detail_absensi?.[bulan]?.izin ?? 0;
                          const valA = record.detail_absensi?.[bulan]?.alpa ?? 0;
                          return [
                            <td key={`${record.santri_id}-${bulan}-s`} className="input-cell text-center">
                              <input 
                                type="number" 
                                className="number-cell-input" 
                                min={0} 
                                value={valS} 
                                onChange={(e) => handleDetailValueChange(record.santri_id, bulan, 'sakit', e.target.value)}
                              />
                            </td>,
                            <td key={`${record.santri_id}-${bulan}-i`} className="input-cell text-center">
                              <input 
                                type="number" 
                                className="number-cell-input" 
                                min={0} 
                                value={valI} 
                                onChange={(e) => handleDetailValueChange(record.santri_id, bulan, 'izin', e.target.value)}
                              />
                            </td>,
                            <td key={`${record.santri_id}-${bulan}-a`} className="input-cell text-center">
                              <input 
                                type="number" 
                                className="number-cell-input" 
                                min={0} 
                                value={valA} 
                                onChange={(e) => handleDetailValueChange(record.santri_id, bulan, 'alpa', e.target.value)}
                              />
                            </td>
                          ];
                        })}
                        <td className="total-cell text-center font-bold text-s">{record.sakit}</td>
                        <td className="total-cell text-center font-bold text-i">{record.izin}</td>
                        <td className="total-cell text-center font-bold text-a">{record.alpa}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>NIS</th>
                      <th style={{ minWidth: '200px' }}>Nama Santri</th>
                      {type === 'kepribadian' && (
                        <>
                          <th>Keaktifan</th>
                          <th>Akhlaq</th>
                          <th>Kerapihan</th>
                        </>
                      )}
                      {type === 'catatan' && <th>Catatan Pembimbing Wali Kelas</th>}
                      {type === 'kenaikan_kelas' && <th>Keputusan Kenaikan Kelas</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((record) => (
                      <tr key={record.santri_id}>
                        <td className="student-nis-cell">{record.nis || '-'}</td>
                        <td className="student-name-cell">{record.nama}</td>
                        {type === 'kepribadian' && (
                          <>
                            <td className="select-cell-rapor">
                              <CustomSelect
                                value={record.keaktifan ? String(record.keaktifan) : ''}
                                onChange={(val) => handleValueChange(record.santri_id, 'keaktifan', val || null)}
                                options={kepribadianOptions}
                                placeholder="Pilih Nilai"
                                allowClear
                              />
                            </td>
                            <td className="select-cell-rapor">
                              <CustomSelect
                                value={record.akhlaq ? String(record.akhlaq) : ''}
                                onChange={(val) => handleValueChange(record.santri_id, 'akhlaq', val || null)}
                                options={kepribadianOptions}
                                placeholder="Pilih Nilai"
                                allowClear
                              />
                            </td>
                            <td className="select-cell-rapor">
                              <CustomSelect
                                value={record.kerapihan ? String(record.kerapihan) : ''}
                                onChange={(val) => handleValueChange(record.santri_id, 'kerapihan', val || null)}
                                options={kepribadianOptions}
                                placeholder="Pilih Nilai"
                                allowClear
                              />
                            </td>
                          </>
                        )}
                        {type === 'catatan' && (
                          <td className="textarea-cell-rapor">
                            <textarea
                              rows={2}
                              className="textarea-input-rapor"
                              value={record.catatan || ''}
                              onChange={(e) => handleValueChange(record.santri_id, 'catatan', e.target.value)}
                              placeholder="Tuliskan catatan motivasi pembimbing..."
                            />
                          </td>
                        )}
                        {type === 'kenaikan_kelas' && (
                          <td className="text-cell-rapor">
                            <input
                              type="text"
                              className="text-input-rapor"
                              value={record.keputusan_kenaikan || ''}
                              onChange={(e) => handleValueChange(record.santri_id, 'keputusan_kenaikan', e.target.value)}
                              placeholder="Contoh: Naik ke Kelas 2"
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
export default RaporSantriForms;
