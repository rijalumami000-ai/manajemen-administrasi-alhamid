import { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  Calendar, 
  Save, 
  Plus, 
  Trash2, 
  Info, 
  Check 
} from 'lucide-react';
import { PageHeader, LoadingState, useToast } from '../components/common';
import { nilaiService } from '../services/nilaiService';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../context/AuthContext';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import './PengaturanJadwal.scss';

export function PengaturanJadwal() {
  const toast = useToast();

  // State Master Data
  const [kelas, setKelas] = useState([]);
  const [mataPelajaran, setMataPelajaran] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [tahunAjaran, setTahunAjaran] = useState(null);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [mapelTingkat, setMapelTingkat] = useState([]);

  // Selected filters
  const [selectedTingkat, setSelectedTingkat] = useState(null);
  const [selectedMapel, setSelectedMapel] = useState(null);
  const [selectedKategori, setSelectedKategori] = useState(null);
  const [jadwalMapelIds, setJadwalMapelIds] = useState([]);

  // Active sub-tab state ('setting' or 'jadwal')
  const [activeSubTab, setActiveSubTab] = useState('setting');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  // Kriteria configuration states
  const [kriteriaConfig, setKriteriaConfig] = useState(null);
  const [kriteriaType, setKriteriaType] = useState('Angka');
  const [configAngka, setConfigAngka] = useState({
    'Mumtaz': { min: 95, max: 2000 },
    'Jayyid': { min: 85, max: 94 },
    'Mutawassith': { min: 75, max: 84 },
    'Rodi\'': { min: 0, max: 74 }
  });
  const [configTeks, setConfigTeks] = useState([]);

  const effectiveKriteriaType = useMemo(() => {
    if (kriteriaConfig && kriteriaConfig.tipe_input) {
      return kriteriaConfig.tipe_input;
    }
    const mapel = mataPelajaran.find(m => m.id === selectedMapel);
    if (mapel && mapel.jenis === 'Qiroah') return 'Angka';
    if (mapel && mapel.jenis === 'Taftisy') return 'Teks';

    if (selectedTingkat === 2 || selectedTingkat === 99) return 'Teks';
    if (selectedTingkat !== 0) return 'Angka';
    return kriteriaType;
  }, [kriteriaConfig, selectedTingkat, kriteriaType, mataPelajaran, selectedMapel]);

  // Load Initial Reference Data
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [kelasData, mapelData, katData, taData, systemSettings] = await Promise.all([
        nilaiService.fetchKelas(),
        nilaiService.fetchMataPelajaran(),
        nilaiService.fetchKategori(),
        nilaiService.fetchTahunAjaran(),
        settingsService.fetchSettings().catch(() => ({}))
      ]);
      
      const diniyahKelas = Array.isArray(kelasData) ? kelasData.filter(k => k.jenis === 'Diniyah').map(k => {
        if (k.nama === 'SP' && k.tingkat === 1) {
          return { ...k, tingkat: 99 };
        }
        return k;
      }) : [];
      setKelas(diniyahKelas);
      setMataPelajaran(Array.isArray(mapelData) ? mapelData : []);
      setKategori(Array.isArray(katData) ? katData : []);
      setTahunAjaranList(Array.isArray(taData) ? taData : []);

      const activeTA = Array.isArray(taData) ? taData.find(ta => ta.is_active) : null;
      setTahunAjaran(activeTA);
      
      if (Array.isArray(katData)) {
        const activeSemester = systemSettings.active_semester || 'Ganjil';
        const defaultKat = katData.find(k => k.nama?.toLowerCase().includes(activeSemester.toLowerCase()));
        if (defaultKat) {
          setSelectedKategori(defaultKat.id);
        } else if (katData.length > 0) {
          setSelectedKategori(katData[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data awal referensi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load mapel tingkat (Jadwal Pelajaran Semester)
  const loadMapelTingkatData = async () => {
    if (!tahunAjaran || !selectedKategori) return;
    try {
      const data = await nilaiService.fetchMapelTingkat(tahunAjaran.id, selectedKategori);
      setMapelTingkat(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal memuat mapel tingkat:', err);
    }
  };

  useEffect(() => {
    loadMapelTingkatData();
  }, [tahunAjaran, selectedKategori]);

  // Load Kriteria when filters change
  const loadKriteria = async () => {
    if (selectedTingkat === null || !selectedMapel || !tahunAjaran || !selectedKategori) return;
    try {
      const config = await nilaiService.fetchKriteria(selectedTingkat, selectedMapel, tahunAjaran.id, selectedKategori);
      
      if (config) {
        setKriteriaConfig(config);
        
        if (selectedTingkat === 0) {
          const kat = kategori.find(k => k.id === selectedKategori);
          const isGanjil = kat && kat.nama.toLowerCase().includes('ganjil');
          setKriteriaType(isGanjil ? 'Teks' : 'Angka');
        } else if (config.tipe_input) {
          setKriteriaType(config.tipe_input);
        } else {
          if (selectedTingkat === 2 || selectedTingkat === 99) setKriteriaType('Teks');
          else setKriteriaType('Angka');
        }
        
        if (config.tipe_input === 'Angka') {
          setConfigAngka(config.konfigurasi);
          setConfigTeks([]);
        } else {
          setConfigTeks(Array.isArray(config.konfigurasi) ? config.konfigurasi : []);
          setConfigAngka({
            'Mumtaz': { min: 95, max: 2000 },
            'Jayyid': { min: 85, max: 94 },
            'Mutawassith': { min: 75, max: 84 },
            'Rodi\'': { min: 0, max: 74 }
          });
        }
      } else {
        setKriteriaConfig(null);
        if (selectedTingkat === 0) {
          const kat = kategori.find(k => k.id === selectedKategori);
          const isGanjil = kat && kat.nama.toLowerCase().includes('ganjil');
          setKriteriaType(isGanjil ? 'Teks' : 'Angka');
        } else if (selectedTingkat === 2 || selectedTingkat === 99) {
          setKriteriaType('Teks');
        } else {
          setKriteriaType('Angka');
        }
        
        setConfigAngka({
          'Mumtaz': { min: 95, max: 2000 },
          'Jayyid': { min: 85, max: 94 },
          'Mutawassith': { min: 75, max: 84 },
          'Rodi\'': { min: 0, max: 74 }
        });
        setConfigTeks([]);
      }
    } catch (err) {
      console.error('Gagal memuat kriteria:', err);
    }
  };

  useEffect(() => {
    loadKriteria();
  }, [selectedTingkat, selectedMapel, tahunAjaran, selectedKategori]);

  // Set checkbox selections when tingkat selection changes in Jadwal Tab
  useEffect(() => {
    if (selectedTingkat !== null && mapelTingkat.length > 0) {
      const allowedMapelIds = mapelTingkat
        .filter(mt => mt.tingkat === selectedTingkat)
        .map(mt => mt.mata_pelajaran_id);
      setJadwalMapelIds(allowedMapelIds);
    } else {
      setJadwalMapelIds([]);
    }
  }, [selectedTingkat, mapelTingkat, activeSubTab]);

  // Save Kriteria Action
  const handleSaveKriteria = async () => {
    if (selectedTingkat === null || !selectedMapel) {
      toast.error('Pilih Tingkatan dan Mata Pelajaran terlebih dahulu');
      return;
    }

    try {
      setSaveLoading(true);
      const mapel = mataPelajaran.find(m => m.id === selectedMapel);
      const payload = {
        tingkat: selectedTingkat,
        mata_pelajaran_id: selectedMapel,
        jenis_mapel: mapel?.jenis || 'Muhafadzoh',
        tipe_input: kriteriaType,
        konfigurasi: kriteriaType === 'Angka' ? configAngka : configTeks,
        tahun_ajaran_id: tahunAjaran?.id,
        kategori_evaluasi_id: selectedKategori
      };
      await nilaiService.saveKriteria(payload);
      toast.success(`Pengaturan kriteria ${mapel?.nama || ''} berhasil disimpan!`);
      loadKriteria();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Gagal menyimpan kriteria');
    } finally {
      setSaveLoading(false);
    }
  };

  // Save Jadwal Pelajaran Action
  const handleSaveJadwal = async () => {
    if (selectedTingkat === null) {
      toast.error('Pilih Tingkatan terlebih dahulu');
      return;
    }
    try {
      setSaveLoading(true);
      await nilaiService.saveMapelTingkat(selectedTingkat, jadwalMapelIds, tahunAjaran?.id, selectedKategori);
      toast.success('Jadwal pelajaran semester berhasil disimpan!');
      const newMtData = await nilaiService.fetchMapelTingkat(tahunAjaran?.id, selectedKategori);
      setMapelTingkat(Array.isArray(newMtData) ? newMtData : []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Gagal menyimpan jadwal pelajaran');
    } finally {
      setSaveLoading(false);
    }
  };

  const getTingkatLabel = (t) => {
    if (t === 0) return 'Sifir';
    if (t === 99) return 'SP';
    return `Kelas ${t}`;
  };

  const levels = useMemo(() => {
    const uniqueTingkat = [...new Set(kelas.map(k => k.tingkat))].sort((a, b) => {
      const order = { 0: 0, 1: 1, 99: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 };
      return (order[a] ?? 999) - (order[b] ?? 999);
    });
    return uniqueTingkat;
  }, [kelas]);

  if (loading) {
    return <LoadingState message="Memuat modul pengaturan & jadwal..." />;
  }

  const taOptions = tahunAjaranList.map(ta => ({
    value: String(ta.id),
    label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}`
  }));

  const katOptions = kategori.map(k => ({
    value: String(k.id),
    label: k.nama
  }));

  const filteredMapels = mataPelajaran.filter(m => ['Muhafadzoh', 'Qiroah', 'Taftisy'].includes(m.jenis));
  const mapelOptions = filteredMapels.map(m => ({
    value: String(m.id),
    label: `${m.nama} (${m.jenis})`
  }));

  // Criteria configuration checks
  const showAngka = selectedTingkat !== 2 && selectedTingkat !== 99;
  const showTeks = selectedTingkat === 0 || selectedTingkat === 2 || selectedTingkat === 99;

  const isAngkaDisabled = kriteriaConfig && kriteriaConfig.tipe_input === 'Teks' && configTeks && configTeks.length > 0;
  const isTeksDisabled = kriteriaConfig && kriteriaConfig.tipe_input === 'Angka' && Object.values(configAngka).some(v => typeof v.min === 'number' || typeof v.max === 'number');

  return (
    <div className="setup-page-container">
      <PageHeader
        title="⚙️ Pengaturan & Jadwal Ujian"
        subtitle="Konfigurasi kriteria predikat penilaian santri beserta jadwal ujian per tingkatan kelas"
      />

      {/* Global Filters Panel */}
      <div className="global-filters">
        <div className="filter-item">
          <label>Tahun Ajaran</label>
          <CustomSelect
            value={tahunAjaran?.id ? String(tahunAjaran.id) : ''}
            onChange={(val) => {
              const selected = tahunAjaranList.find(ta => ta.id === Number(val));
              setTahunAjaran(selected || null);
            }}
            options={taOptions}
            placeholder="Pilih Tahun Ajaran"
          />
        </div>

        <div className="filter-item">
          <label>Semester / Evaluasi</label>
          <CustomSelect
            value={selectedKategori ? String(selectedKategori) : ''}
            onChange={(val) => setSelectedKategori(val ? Number(val) : null)}
            options={katOptions}
            placeholder="Pilih Kategori"
          />
        </div>
      </div>

      {/* Custom Premium Tabs Navigation */}
      <div className="tabs-nav-container">
        <button
          type="button"
          className={`tab-link-btn ${activeSubTab === 'setting' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('setting');
            setSelectedTingkat(null);
            setSelectedMapel(null);
          }}
        >
          <Settings size={16} />
          <span>Pengaturan Kriteria</span>
        </button>
        <button
          type="button"
          className={`tab-link-btn ${activeSubTab === 'jadwal' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('jadwal');
            setSelectedTingkat(levels.length > 0 ? levels[0] : null);
          }}
        >
          <Calendar size={16} />
          <span>Jadwal Pelajaran Ujian</span>
        </button>
      </div>

      {/* Custom Tabs Content */}
      <div className="tabs-content-container">
        {activeSubTab === 'setting' ? (
          // PENGATURAN KRITERIA TAB
          <div className="grid-setup-layout">
            {/* Left Card: Filter Cakupan */}
            <div className="setup-card frosted-card">
              <div className="card-header">
                <h3 className="card-title">Cakupan Pengaturan (Khusus Muhafadzoh)</h3>
              </div>
              <div className="card-body">
                <p className="card-instruction">
                  Pengaturan ini akan berlaku untuk seluruh kelas dalam tingkatan yang dipilih pada semester aktif.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group-select">
                    <label>Pilih Tingkatan</label>
                    <CustomSelect
                      value={selectedTingkat !== null ? String(selectedTingkat) : ''}
                      onChange={(val) => setSelectedTingkat(val !== null && val !== '' ? Number(val) : null)}
                      options={levels.map(t => ({ value: String(t), label: getTingkatLabel(t) }))}
                      placeholder="Pilih Tingkatan"
                    />
                  </div>

                  <div className="form-group-select">
                    <label>Mata Pelajaran Kriteria</label>
                    <CustomSelect
                      value={selectedMapel ? String(selectedMapel) : ''}
                      onChange={(val) => setSelectedMapel(val ? Number(val) : null)}
                      options={mapelOptions}
                      placeholder="Pilih Mata Pelajaran"
                    />
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <SmartAlert
                    message="Tingkat 2 dan SP wajib menggunakan format Teks. Selain Tingkat 2, SP, dan Sifir wajib menggunakan format Angka."
                    type="info"
                  />
                </div>
              </div>
            </div>

            {/* Right Card: Konfigurasi Kriteria */}
            <div className="setup-card frosted-card">
              <div className="card-header header-with-btn">
                <h3 className="card-title">Konfigurasi Kriteria Penilaian</h3>
                <button
                  type="button"
                  className="btn-custom btn-primary"
                  onClick={handleSaveKriteria}
                  disabled={saveLoading || selectedTingkat === null || !selectedMapel}
                >
                  {saveLoading ? <span className="loading-spinner"></span> : <><Save size={16} /><span>Simpan Kriteria</span></>}
                </button>
              </div>
              <div className="card-body">
                {selectedMapel && mataPelajaran.find(m => m.id === selectedMapel)?.jenis === 'Muhafadzoh' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Input Format Radio buttons */}
                    <div className="custom-segmented-control" style={{ maxWidth: '350px' }}>
                      {showAngka && (
                        <button
                          type="button"
                          className={`segmented-btn ${kriteriaType === 'Angka' ? 'active' : ''}`}
                          disabled={isAngkaDisabled || selectedTingkat === 0}
                          onClick={() => setKriteriaType('Angka')}
                        >
                          Skala Angka
                        </button>
                      )}
                      {showTeks && (
                        <button
                          type="button"
                          className={`segmented-btn ${kriteriaType === 'Teks' ? 'active' : ''}`}
                          disabled={isTeksDisabled || selectedTingkat === 0}
                          onClick={() => setKriteriaType('Teks')}
                        >
                          Teks / Capaian
                        </button>
                      )}
                    </div>

                    {/* Scale Angka Table */}
                    {kriteriaType === 'Angka' && showAngka && (
                      <div className="table-wrapper-setup">
                        <table className="custom-data-table-setup">
                          <thead>
                            <tr>
                              <th>Predikat</th>
                              <th>Batas Minimum (Min)</th>
                              <th>Batas Maksimum (Max)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {['Mumtaz', 'Jayyid', 'Mutawassith', 'Rodi\''].map(pred => {
                              const values = configAngka[pred] || { min: null, max: null };
                              return (
                                <tr key={pred}>
                                  <td style={{ fontWeight: 'bold' }}>{pred}</td>
                                  <td>
                                    <input
                                      type="number"
                                      className="table-input"
                                      min={0}
                                      max={2000}
                                      value={pred === 'Mumtaz' ? '' : (values.min ?? '')}
                                      disabled={pred === 'Mumtaz'}
                                      placeholder={pred === 'Mumtaz' ? 'Otomatis' : 'Min'}
                                      onChange={(e) => {
                                        const v = e.target.value === '' ? null : Number(e.target.value);
                                        setConfigAngka(prev => ({
                                          ...prev,
                                          [pred]: { ...prev[pred], min: v }
                                        }));
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="table-input"
                                      min={0}
                                      max={2000}
                                      value={values.max ?? ''}
                                      placeholder="Max"
                                      onChange={(e) => {
                                        const v = e.target.value === '' ? null : Number(e.target.value);
                                        setConfigAngka(prev => ({
                                          ...prev,
                                          [pred]: { ...prev[pred], max: v }
                                        }));
                                      }}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Teks / Capaian Table */}
                    {kriteriaType === 'Teks' && showTeks && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="table-wrapper-setup">
                          <table className="custom-data-table-setup">
                            <thead>
                              <tr>
                                <th>Daftar Bab / Capaian</th>
                                <th style={{ width: '200px' }}>Predikat Otomatis</th>
                                <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {configTeks.map((item, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <input
                                      type="text"
                                      className={`table-input ${(selectedTingkat === 2 || selectedTingkat === 99) ? 'arabic-font-input' : ''}`}
                                      value={item.bab || ''}
                                      placeholder="Contoh: Bab 1 / Materi A / Juz 30"
                                      onChange={(e) => {
                                        const newConf = [...configTeks];
                                        newConf[idx].bab = e.target.value;
                                        setConfigTeks(newConf);
                                      }}
                                    />
                                  </td>
                                  <td>
                                    <CustomSelect
                                      value={item.predikat}
                                      onChange={(val) => {
                                        const newConf = [...configTeks];
                                        newConf[idx].predikat = val;
                                        setConfigTeks(newConf);
                                      }}
                                      options={[
                                        { value: 'Mumtaz', label: 'Mumtaz' },
                                        { value: 'Jayyid', label: 'Jayyid' },
                                        { value: 'Mutawassith', label: 'Mutawassith' },
                                        { value: 'Rodi\'', label: 'Rodi\'' }
                                      ]}
                                    />
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                      <button
                                        type="button"
                                        className="action-icon-btn delete-btn"
                                        onClick={() => setConfigTeks(configTeks.filter((_, i) => i !== idx))}
                                        title="Hapus Kriteria"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <button
                          type="button"
                          className="dashed-add-btn"
                          onClick={() => setConfigTeks([...configTeks, { bab: '', predikat: 'Jayyid' }])}
                        >
                          <Plus size={16} />
                          <span>Tambah Capaian Baru</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state-setup">
                    <Info size={40} className="empty-icon" />
                    <span>Pilih Mata Pelajaran berciri khas Muhafadzoh di sebelah kiri untuk mengatur kriteria pencapaian predikat penilaian.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // JADWAL PELAJARAN TAB
          <div className="grid-setup-layout">
            {/* Left Card: Pilih Tingkatan */}
            <div className="setup-card frosted-card">
              <div className="card-header">
                <h3 className="card-title">Pilih Tingkatan Kelas</h3>
              </div>
              <div className="card-body">
                <p className="card-instruction" style={{ marginBottom: '16px' }}>
                  Pilih salah satu tingkatan di bawah untuk melihat dan mengonfigurasi daftar mata pelajaran semester reguler.
                </p>
                
                <div className="levels-vertical-list">
                  {levels.map(t => (
                    <button
                      key={t}
                      type="button"
                      className={`level-item-btn ${selectedTingkat === t ? 'active' : ''}`}
                      onClick={() => setSelectedTingkat(t)}
                    >
                      <span className="bullet-indicator"></span>
                      <span className="label-text">{getTingkatLabel(t)}</span>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '20px' }}>
                  <SmartAlert
                    message="Konfigurasi Ujian Semester: Centang mata pelajaran reguler yang akan diujikan pada tingkatan kelas ini."
                    type="info"
                  />
                </div>
              </div>
            </div>

            {/* Right Card: Checklist Mata Pelajaran */}
            <div className="setup-card frosted-card">
              <div className="card-header header-with-btn">
                <h3 className="card-title">Daftar Mata Pelajaran Semester</h3>
                <button
                  type="button"
                  className="btn-custom btn-primary"
                  onClick={handleSaveJadwal}
                  disabled={saveLoading || selectedTingkat === null}
                >
                  {saveLoading ? <span className="loading-spinner"></span> : <><Save size={16} /><span>Simpan Jadwal</span></>}
                </button>
              </div>
              <div className="card-body">
                {selectedTingkat !== null ? (
                  <div className="checkbox-grid-container">
                    {mataPelajaran.filter(m => m.jenis === 'Reguler').length === 0 ? (
                      <div className="empty-state-setup">
                        <span>Tidak ada mata pelajaran umum/reguler.</span>
                      </div>
                    ) : (
                      <div className="custom-checkbox-grid">
                        {mataPelajaran.filter(m => m.jenis === 'Reguler').map(m => {
                          const isChecked = jadwalMapelIds.includes(m.id);
                          return (
                            <div 
                              key={m.id} 
                              className={`custom-checkbox-item ${isChecked ? 'checked' : ''}`}
                              onClick={() => {
                                if (isChecked) {
                                  setJadwalMapelIds(jadwalMapelIds.filter(id => id !== m.id));
                                } else {
                                  setJadwalMapelIds([...jadwalMapelIds, m.id]);
                                }
                              }}
                            >
                              <div className="checkbox-box">
                                {isChecked && <Check size={13} className="check-icon" />}
                              </div>
                              <span className="checkbox-label">{m.nama}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state-setup">
                    <Info size={40} className="empty-icon" />
                    <span>Pilih tingkatan kelas terlebih dahulu di kolom kiri untuk menampilkan daftar mata pelajaran.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
