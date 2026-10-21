import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Printer, 
  Zap, 
  Trash2, 
  User, 
  RefreshCw, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Image as ImageIcon, 
  FileText,
  Clock,
  Info
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useToast } from '../components/common';
import { QRCodeSVG } from 'qrcode.react';
import type { 
  TahunAjaranItem, 
  PesertaUjianItem, 
  KartuUjianSettings, 
  PrintDataState, 
  KartuUjianTabKey 
} from '../types/kartuUjian';
import './KartuUjianSemester.scss';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Authorization': `Bearer ${token}`, ...(options.headers as Record<string, string>) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Terjadi kesalahan server.');
  }
  return res.json();
}

// ─── Tab 1: Generate Nomor Peserta ───────────────────────────────────────────
interface TabGenerateNomorProps {
  tahunAjaranList: TahunAjaranItem[];
  activeTahunAjaranId: number | null;
  activeSemester?: string;
}

function TabGenerateNomor({ tahunAjaranList, activeTahunAjaranId, activeSemester }: TabGenerateNomorProps) {
  const toast = useToast();
  const [tahunAjaranId, setTahunAjaranId] = useState<number | null>(null);
  const [semester, setSemester] = useState<string | null>(null);
  const [pesertaList, setPesertaList] = useState<PesertaUjianItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (activeTahunAjaranId && !tahunAjaranId) {
      setTahunAjaranId(activeTahunAjaranId);
    }
  }, [activeTahunAjaranId, tahunAjaranId]);

  useEffect(() => {
    if (activeSemester && !semester) {
      setSemester(activeSemester);
    }
  }, [activeSemester, semester]);

  const fetchPeserta = useCallback(async () => {
    if (!tahunAjaranId || !semester) return;
    setLoading(true);
    try {
      const data = await apiFetch<PesertaUjianItem[]>(`/api/peserta-ujian?tahun_ajaran_id=${tahunAjaranId}&semester=${semester}`);
      setPesertaList(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [tahunAjaranId, semester, toast]);

  useEffect(() => { fetchPeserta(); }, [fetchPeserta]);

  const handleGenerate = async () => {
    if (!tahunAjaranId || !semester) return toast.warning('Pilih tahun ajaran dan semester.');
    
    const confirmGen = window.confirm(`Generate Nomor Peserta?\nNomor peserta lama untuk semester ${semester} akan ditimpa.`);
    if (!confirmGen) return;

    setGenerating(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/peserta-ujian/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tahun_ajaran_id: tahunAjaranId, semester }),
      });
      toast.success(res.message);
      fetchPeserta();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = async () => {
    if (!tahunAjaranId || !semester) return;

    const confirmReset = window.confirm('Reset Nomor Peserta?\nSemua nomor peserta akan dihapus secara permanen.');
    if (!confirmReset) return;

    try {
      await apiFetch(`/api/peserta-ujian?tahun_ajaran_id=${tahunAjaranId}&semester=${semester}`, { method: 'DELETE' });
      toast.success('Nomor peserta berhasil direset.');
      setPesertaList([]);
    } catch (err: any) { 
      toast.error(err.message); 
    }
  };

  return (
    <div className="tab-generate" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="frosted-card">
        <div className="inner-filter-bar">
          <div className="left-filters">
            <div style={{ width: '200px' }}>
              <CustomSelect
                value={tahunAjaranId ? String(tahunAjaranId) : ''}
                onChange={(val) => setTahunAjaranId(val ? Number(val) : null)}
                options={tahunAjaranList.map(ta => ({ value: String(ta.id), label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}` }))}
                placeholder="Tahun Ajaran"
              />
            </div>
            <div style={{ width: '140px' }}>
              <CustomSelect
                value={semester || ''}
                onChange={(val) => setSemester(val || null)}
                options={[
                  { value: 'Ganjil', label: 'Ganjil' },
                  { value: 'Genap', label: 'Genap' }
                ]}
                placeholder="Semester"
              />
            </div>
            
            <button 
              type="button" 
              className="action-pill-btn primary-pill"
              onClick={handleGenerate}
              disabled={generating || !tahunAjaranId || !semester}
            >
              {generating ? <span className="loading-spinner"></span> : <Zap size={14} />}
              <span>Generate Nomor</span>
            </button>
            
            <button 
              type="button" 
              className="action-pill-btn danger-pill"
              onClick={handleReset}
              disabled={!pesertaList.length}
            >
              <Trash2 size={14} />
              <span>Reset</span>
            </button>

            <button 
              type="button" 
              className="action-pill-btn secondary-pill icon-only-pill"
              onClick={fetchPeserta}
              disabled={loading}
              title="Muat Ulang"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginLeft: '4px' }}>
              {pesertaList.length} peserta terdaftar
            </span>
          </div>
        </div>
      </div>

      {(!tahunAjaranId || !semester) ? (
        <div className="frosted-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Info size={40} style={{ opacity: 0.4, margin: '0 auto 12px', color: '#0284c7' }} />
          <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
            Pilih Tahun Ajaran dan Semester di atas untuk melihat data peserta.
          </p>
        </div>
      ) : (
        <div className="frosted-card" style={{ padding: '16px' }}>
          <div className="table-responsive-kartu">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th style={{ width: '150px' }}>No. Peserta</th>
                  <th style={{ width: '130px' }}>NIS</th>
                  <th>Nama Santri</th>
                  <th style={{ width: '110px' }}>Kelas</th>
                  <th style={{ width: '220px' }}>Urutan</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Foto</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="loading-spinner" style={{ margin: '0 auto', width: '24px', height: '24px' }}></div>
                    </td>
                  </tr>
                ) : pesertaList.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      Belum ada data nomor peserta. Silakan klik tombol Generate Nomor di atas.
                    </td>
                  </tr>
                ) : (
                  pesertaList.map((record: any) => (
                    <tr key={record.id}>
                      <td>
                        <span className="peserta-badge">
                          {record.no_peserta}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{record.nis}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '50%', 
                            overflow: 'hidden', 
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(0,0,0,0.06)'
                          }}>
                            {record.foto_url ? (
                              <img src={`${API_BASE}${record.foto_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <User size={14} style={{ color: '#94a3b8' }} />
                            )}
                          </div>
                          <span style={{ fontWeight: 600 }}>{record.nama}</span>
                        </div>
                      </td>
                      <td>
                        {record.nama_kelas ? (
                          <span style={{ 
                            background: 'rgba(168,85,247,0.1)', 
                            color: '#7c3aed',
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '11.5px',
                            fontWeight: 700
                          }}>{record.nama_kelas}</span>
                        ) : '-'}
                      </td>
                      <td>
                        <div className="urutan-pills">
                          <span className="chip">
                            Kelas: {String(record.urutan_kelas || 0).padStart(2, '0')}
                          </span>
                          <span className="sep">•</span>
                          <span className="chip">
                            Di Kelas: {String(record.urutan_di_kelas || 0).padStart(2, '0')}
                          </span>
                          <span className="sep">•</span>
                          <span className="chip">
                            Global: {String(record.urutan_global || 0).padStart(3, '0')}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {record.foto_url ? (
                          <span className="badge-upload-status success">Ada</span>
                        ) : (
                          <span className="badge-upload-status warning">Belum</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Setting Kartu ─────────────────────────────────────────────────────
interface TabSettingCardProps {
  settings: KartuUjianSettings | null;
  onRefresh: () => void;
}

function TabSettingCard({ settings, onRefresh }: TabSettingCardProps) {
  const toast = useToast();
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  
  const [judul1, setJudul1] = useState<string>('');
  const [judul2, setJudul2] = useState<string>('');
  const [judulKartu, setJudulKartu] = useState<string>('');
  const [ketuaPanitia, setKetuaPanitia] = useState<string>('');
  const [lokasi, setLokasi] = useState<string>('');

  const fileRefs: Record<string, React.RefObject<HTMLInputElement | null>> = {
    kartu_ujian_logo_url: useRef<HTMLInputElement | null>(null),
    kartu_ujian_stempel_url: useRef<HTMLInputElement | null>(null),
    kartu_ujian_ttd_url: useRef<HTMLInputElement | null>(null),
  };

  useEffect(() => {
    if (settings) {
      setJudul1(settings.kartu_ujian_judul_1 || '');
      setJudul2(settings.kartu_ujian_judul_2 || '');
      setJudulKartu(settings.kartu_ujian_judul_kartu || '');
      setKetuaPanitia(settings.kartu_ujian_ketua_panitia || '');
      setLokasi(settings.kartu_ujian_lokasi || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        kartu_ujian_judul_1: judul1,
        kartu_ujian_judul_2: judul2,
        kartu_ujian_judul_kartu: judulKartu,
        kartu_ujian_ketua_panitia: ketuaPanitia,
        kartu_ujian_lokasi: lokasi
      };
      
      const token = localStorage.getItem('token');
      for (const [key, value] of Object.entries(payload)) {
        await fetch(`${API_BASE}/api/settings`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });
      }
      toast.success('Pengaturan kartu berhasil disimpan!');
      onRefresh();
    } catch { 
      toast.error('Gagal menyimpan pengaturan.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleUploadAset = async (key: string, file: File) => {
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
      if (!res.ok) throw new Error('Gagal unggah.');
      toast.success('File gambar berhasil diunggah!');
      onRefresh();
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setUploadingKey(null); 
    }
  };

  const asetItems = [
    { key: 'kartu_ujian_logo_url', label: 'Logo Madrasah', desc: 'Logo di pojok kiri atas kartu' },
    { key: 'kartu_ujian_stempel_url', label: 'Stempel Madrasah', desc: 'Cap/stempel (PNG transparan)' },
    { key: 'kartu_ujian_ttd_url', label: 'Tanda Tangan Panitia', desc: 'TTD Ketua Panitia (PNG transparan)' },
  ];

  return (
    <div className="tab-setting">
      <div className="settings-grid-layout">
        
        {/* Left Form */}
        <div className="frosted-card">
          <div className="card-title-box">
            <FileText size={16} className="card-icon" />
            <h3 className="card-title">Teks Kartu Ujian</h3>
          </div>

          <form onSubmit={handleSave} className="settings-form-row">
            <div className="form-group-box">
              <label>Judul Baris 1</label>
              <input 
                type="text" 
                value={judul1} 
                onChange={e => setJudul1(e.target.value)} 
                placeholder="UJIAN SEMESTER GENAP" 
              />
            </div>
            <div className="form-group-box">
              <label>Judul Baris 2</label>
              <input 
                type="text" 
                value={judul2} 
                onChange={e => setJudul2(e.target.value)} 
                placeholder="MADRASAH DINIYAH AL-HAMID" 
              />
            </div>
            <div className="form-group-box">
              <label>Judul Kartu</label>
              <input 
                type="text" 
                value={judulKartu} 
                onChange={e => setJudulKartu(e.target.value)} 
                placeholder="KARTU PESERTA UJIAN TULIS" 
              />
            </div>
            <div className="form-group-box">
              <label>Nama Ketua Panitia</label>
              <input 
                type="text" 
                value={ketuaPanitia} 
                onChange={e => setKetuaPanitia(e.target.value)} 
                placeholder="Ust. Ahmad Syukron Rosyid" 
              />
            </div>
            <div className="form-group-box">
              <label>Lokasi / Kota Cetak</label>
              <input 
                type="text" 
                value={lokasi} 
                onChange={e => setLokasi(e.target.value)} 
                placeholder="Jakarta Timur" 
              />
            </div>

            <button type="submit" className="action-pill-btn primary-pill" style={{ width: '100%', marginTop: '10px' }} disabled={saving}>
              {saving ? <span className="loading-spinner"></span> : <span>Simpan Pengaturan</span>}
            </button>
          </form>
        </div>

        {/* Right Uploads */}
        <div className="frosted-card">
          <div className="card-title-box">
            <ImageIcon size={16} className="card-icon" />
            <h3 className="card-title">Aset Gambar Kartu</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {asetItems.map(({ key, label, desc }) => (
              <div key={key} className="aset-item">
                <div className="aset-preview">
                  {settings?.[key] ? (
                    <img src={`${API_BASE}${settings[key]}`} alt={label} />
                  ) : (
                    <ImageIcon size={20} style={{ color: '#94a3b8' }} />
                  )}
                </div>
                <div className="aset-info">
                  <span className="title">{label}</span>
                  <span className="desc">{desc}</span>
                  {settings?.[key] ? (
                    <span className="badge-upload-status success">Terunggah</span>
                  ) : (
                    <span className="badge-upload-status warning">Belum Ada</span>
                  )}
                </div>
                
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.webp" 
                  ref={fileRefs[key]} 
                  style={{ display: 'none' }}
                  onChange={(e) => { 
                    const f = e.target.files?.[0]; 
                    if (f) handleUploadAset(key, f); 
                    e.target.value = ''; 
                  }} 
                />
                
                <button 
                  type="button" 
                  className="action-pill-btn secondary-pill"
                  disabled={uploadingKey === key}
                  onClick={() => fileRefs[key].current?.click()}
                >
                  {uploadingKey === key ? <span className="loading-spinner"></span> : <Upload size={13} />}
                  <span>Pilih File</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Tab 3: Tata Tertib Ujian (Kartu Belakang) ────────────────────────────────
interface TabKartuBelakangProps {
  settings: KartuUjianSettings | null;
  onRefresh: () => void;
  pesertaList: PesertaUjianItem[];
}

function TabKartuBelakang({ settings, onRefresh, pesertaList }: TabKartuBelakangProps) {
  const toast = useToast();
  const [saving, setSaving] = useState<boolean>(false);

  const [kewajiban, setKewajiban] = useState<string>('');
  const [larangan, setLarangan] = useState<string>('');
  const [sanksi, setSanksi] = useState<string>('');

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
    if (settings) {
      setKewajiban(settings.tata_tertib_kewajiban || defaultKewajiban);
      setLarangan(settings.tata_tertib_larangan || defaultLarangan);
      setSanksi(settings.tata_tertib_sanksi || defaultSanksi);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, string> = {
        tata_tertib_kewajiban: kewajiban,
        tata_tertib_larangan: larangan,
        tata_tertib_sanksi: sanksi,
      };
      
      const token = localStorage.getItem('token');
      for (const [key, value] of Object.entries(payload)) {
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
      
      toast.success('Pengaturan tata tertib berhasil disimpan!');
      onRefresh();
    } catch { 
      toast.error('Gagal menyimpan pengaturan tata tertib.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handlePrint = () => {
    if (!pesertaList.length) return toast.warning('Tidak ada data peserta untuk dicetak. Pilih data di tab "Cetak Kartu" terlebih dahulu.');
    window.print();
  };

  return (
    <div className="tab-kartu-belakang">
      <div className="settings-grid-layout">
        
        {/* Left Form */}
        <div className="frosted-card">
          <div className="card-title-box">
            <FileText size={16} className="card-icon" />
            <h3 className="card-title">Edit Tata Tertib Ujian</h3>
          </div>

          <form onSubmit={handleSave} className="settings-form-row">
            <div className="form-group-box">
              <label>Kewajiban</label>
              <textarea rows={5} value={kewajiban} onChange={e => setKewajiban(e.target.value)} />
            </div>
            <div className="form-group-box">
              <label>Larangan</label>
              <textarea rows={6} value={larangan} onChange={e => setLarangan(e.target.value)} />
            </div>
            <div className="form-group-box">
              <label>Sanksi</label>
              <textarea rows={4} value={sanksi} onChange={e => setSanksi(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button type="submit" className="action-pill-btn primary-pill" disabled={saving}>
                {saving ? <span className="loading-spinner"></span> : <span>Simpan Tata Tertib</span>}
              </button>
              <button 
                type="button" 
                className="action-pill-btn secondary-pill" 
                onClick={handlePrint}
                disabled={!pesertaList.length}
              >
                <Printer size={14} />
                <span>Cetak Sisi Belakang ({pesertaList.length} kartu)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Info */}
        <div className="frosted-card">
          <div className="card-title-box">
            <Clock size={16} className="card-icon" />
            <h3 className="card-title">Petunjuk Penggunaan</h3>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span>Tuliskan poin-poin tata tertib per baris. Teks ini akan dicetak di bagian belakang kartu ujian.</span>
            
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)' }}>
              <strong style={{ color: '#0f172a' }}>Cara Cetak:</strong>
              <ol style={{ paddingLeft: '20px', margin: '6px 0 0 0' }}>
                <li>Pilih filter data di tab <strong>Cetak Kartu</strong> terlebih dahulu.</li>
                <li>Pindah ke tab ini, lalu klik tombol <strong>Cetak Sisi Belakang</strong>.</li>
                <li>Jumlah kartu yang dicetak akan sama persis dengan yang ada di tab Cetak Kartu.</li>
              </ol>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Tab 4: Cetak Kartu ───────────────────────────────────────────────────────
interface TabCetakKartuProps {
  tahunAjaranList: TahunAjaranItem[];
  settings: KartuUjianSettings | null;
  onPesertaChange: (list: PesertaUjianItem[], ta: TahunAjaranItem | null, tgl: string) => void;
  pesertaList: PesertaUjianItem[];
  activeTahunAjaranId: number | null;
  activeSemester?: string;
}

function TabCetakKartu({ 
  tahunAjaranList, 
  settings, 
  onPesertaChange, 
  pesertaList, 
  activeTahunAjaranId, 
  activeSemester 
}: TabCetakKartuProps) {
  const toast = useToast();
  const [tahunAjaranId, setTahunAjaranId] = useState<number | null>(null);
  const [semester, setSemester] = useState<string | null>(null);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [kelasDiniyahId, setKelasDiniyahId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [tanggalCetak, setTanggalCetak] = useState<string>(() => {
    return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  });

  useEffect(() => {
    if (activeTahunAjaranId && !tahunAjaranId) {
      setTahunAjaranId(activeTahunAjaranId);
    }
  }, [activeTahunAjaranId, tahunAjaranId]);

  useEffect(() => {
    if (activeSemester && !semester) {
      setSemester(activeSemester);
    }
  }, [activeSemester, semester]);

  // Load Kelas
  useEffect(() => {
    apiFetch('/api/kelas').then(setKelasList).catch(() => {});
  }, []);

  const fetchPeserta = useCallback(async () => {
    if (!tahunAjaranId || !semester) return;
    setLoading(true);
    try {
      let url = `/api/peserta-ujian?tahun_ajaran_id=${tahunAjaranId}&semester=${semester}`;
      if (kelasDiniyahId) url += `&kelas_id=${kelasDiniyahId}`;
      const data = await apiFetch<PesertaUjianItem[]>(url);
      const currentTA = tahunAjaranList.find(ta => ta.id === tahunAjaranId) || null;
      onPesertaChange(data, currentTA, tanggalCetak);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [tahunAjaranId, semester, kelasDiniyahId, tahunAjaranList, tanggalCetak, onPesertaChange, toast]);

  useEffect(() => { fetchPeserta(); }, [fetchPeserta]);

  const handlePrint = () => {
    if (!pesertaList.length) return toast.warning('Tidak ada kartu untuk dicetak.');
    window.print();
  };

  return (
    <div className="tab-cetak" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="frosted-card">
        <div className="inner-filter-bar">
          <div className="left-filters">
            <div style={{ width: '200px' }}>
              <CustomSelect
                value={tahunAjaranId ? String(tahunAjaranId) : ''}
                onChange={(val) => setTahunAjaranId(val ? Number(val) : null)}
                options={tahunAjaranList.map(ta => ({ value: String(ta.id), label: `${ta.kode} ${ta.is_active ? '(Aktif)' : ''}` }))}
                placeholder="Tahun Ajaran"
              />
            </div>
            <div style={{ width: '130px' }}>
              <CustomSelect
                value={semester || ''}
                onChange={(val) => setSemester(val || null)}
                options={[
                  { value: 'Ganjil', label: 'Ganjil' },
                  { value: 'Genap', label: 'Genap' }
                ]}
                placeholder="Semester"
              />
            </div>
            <div style={{ width: '180px' }}>
              <CustomSelect
                value={kelasDiniyahId ? String(kelasDiniyahId) : ''}
                onChange={(val) => setKelasDiniyahId(val ? Number(val) : null)}
                options={[
                  { value: '', label: 'Semua Kelas' },
                  ...kelasList.map(k => ({ value: String(k.id), label: k.nama_kelas || k.nama }))
                ]}
                placeholder="Pilih Kelas"
              />
            </div>
            <div style={{ width: '180px' }}>
              <input 
                type="text" 
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(203, 213, 225, 0.8)',
                  background: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                value={tanggalCetak} 
                onChange={e => setTanggalCetak(e.target.value)} 
                placeholder="Tanggal Cetak"
              />
            </div>
            
            <button 
              type="button" 
              className="action-pill-btn secondary-pill icon-only-pill" 
              onClick={fetchPeserta} 
              disabled={loading}
              title="Muat Ulang"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button 
              type="button" 
              className="action-pill-btn primary-pill" 
              onClick={handlePrint}
              disabled={!pesertaList.length}
            >
              <Printer size={14} />
              <span>Cetak {pesertaList.length ? `(${pesertaList.length} kartu)` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {!pesertaList.length ? (
        <div className="frosted-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Info size={40} style={{ opacity: 0.4, margin: '0 auto 12px', color: '#0284c7' }} />
          <p style={{ margin: 0, color: '#64748b', fontSize: '13.5px' }}>
            {tahunAjaranId && semester
              ? 'Belum ada data peserta. Generate nomor peserta di tab "Generate Nomor" terlebih dahulu.'
              : 'Pilih tahun ajaran dan semester untuk melihat kartu peserta.'}
          </p>
        </div>
      ) : (
        <div className="preview-info">
          <CheckCircle size={16} />
          <span>{pesertaList.length} kartu siap dicetak · Format 6 kartu per lembar F4</span>
          {pesertaList.some(p => !p.foto_url) && (
            <span style={{ 
              background: 'rgba(245, 158, 11, 0.12)', 
              color: '#d97706', 
              padding: '3px 10px', 
              borderRadius: '9999px',
              marginLeft: 'auto',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {pesertaList.filter(p => !p.foto_url).length} santri belum melengkapi foto
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Satu Kartu Ujian (Bagian Depan) ──────────────────────────────────────────
interface KartuUjianProps {
  p: PesertaUjianItem;
  settings: KartuUjianSettings | null;
  tahunAjaran: TahunAjaranItem | null;
  tanggalCetak: string;
}

function KartuUjian({ p, settings, tahunAjaran, tanggalCetak }: KartuUjianProps) {
  const formatTGL = (tgl?: string) => {
    if (!tgl) return '-';
    try {
      return new Date(tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return tgl;
    }
  };

  const ttl = [p.tempat_lahir, formatTGL(p.tanggal_lahir)].filter(Boolean).join(', ') || '-';

  return (
    <div className="kartu-ujian">
      {/* Header: Logo + Judul Madrasah */}
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

      {/* Bar Judul Kartu */}
      <div className="kartu-judul-kartu">
        {settings?.kartu_ujian_judul_kartu || 'KARTU PESERTA UJIAN TULIS'}
      </div>

      {/* Tabel Data Identitas */}
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

      {/* Bagian Bawah: Foto (kiri) + QR (tengah) + Footer TTD (kanan) */}
      <div className="kartu-bottom">
        <div className="kartu-foto">
          {p.foto_url
            ? <img src={`${API_BASE}${p.foto_url}`} alt={p.nama} />
            : <div className="foto-placeholder"><User size={20} style={{ color: '#bbb' }} /></div>
          }
        </div>

        <div className="kartu-qr">
          <QRCodeSVG 
            value={`${window.location.origin}/verify/${p.no_peserta}`}
            size={80}
            level="H"
            includeMargin={false}
          />
        </div>

        <div className="kartu-footer">
          <div className="kartu-tempat-tanggal">
            {settings?.kartu_ujian_lokasi || 'Jakarta'}, {tanggalCetak}
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
interface KartuUjianBelakangProps {
  settings: KartuUjianSettings | null;
}

function KartuUjianBelakang({ settings }: KartuUjianBelakangProps) {
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

  return (
    <div className="kartu-belakang">
      <div className="kartu-belakang-header">
        <div className="tb-title-1">TATA TERTIB PESERTA</div>
        <div className="tb-title-2">UJIAN TULIS MADRASAH DINIYAH</div>
      </div>
      <div className="kartu-belakang-body">
        <div className="tb-section-title">A. KEWAJIBAN PESERTA :</div>
        <div className="tb-content">{settings?.tata_tertib_kewajiban || defaultKewajiban}</div>

        <div className="tb-section-title" style={{ marginTop: '0.8mm' }}>B. LARANGAN PESERTA :</div>
        <div className="tb-content">{settings?.tata_tertib_larangan || defaultLarangan}</div>

        <div className="tb-section-title" style={{ marginTop: '0.8mm' }}>C. SANKSI :</div>
        <div className="tb-content">{settings?.tata_tertib_sanksi || defaultSanksi}</div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function KartuUjianSemester() {
  const [activeTab, setActiveTab] = useState<KartuUjianTabKey>('generate');
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranItem[]>([]);
  const [activeTahunAjaranId, setActiveTahunAjaranId] = useState<number | null>(null);
  const [settings, setSettings] = useState<KartuUjianSettings | null>(null);

  const [printData, setPrintData] = useState<PrintDataState>({
    pesertaList: [],
    tahunAjaran: null,
    tanggalCetak: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  });

  const fetchMeta = useCallback(async () => {
    try {
      const [taData, settingsData] = await Promise.all([
        apiFetch<TahunAjaranItem[]>('/api/tahun-ajaran'),
        apiFetch<KartuUjianSettings>('/api/settings'),
      ]);
      setTahunAjaranList(taData);
      setSettings(settingsData);
      const activeTA = Array.isArray(taData) ? taData.find(ta => ta.is_active) : null;
      if (activeTA) setActiveTahunAjaranId(activeTA.id);
    } catch (err) { 
      console.error('Failed to load meta:', err); 
    }
  }, []);

  useEffect(() => { fetchMeta(); }, [fetchMeta]);

  const handlePesertaChange = useCallback((pesertaList: PesertaUjianItem[], tahunAjaran: TahunAjaranItem | null, tanggalCetak: string) => {
    setPrintData({ pesertaList, tahunAjaran, tanggalCetak });
  }, []);

  const activeTA = tahunAjaranList.find(ta => ta.id === activeTahunAjaranId) || null;

  return (
    <div className="kartu-ujian-page">
      {/* ─── 1. OPTION A TACTILE PAGE HEADER (NO ICON ORB) ──────────────── */}
      <header className="tactile-page-header no-print">
        <div className="header-text-block">
          <h2 className="page-title">Kartu Ujian Tulis</h2>
          <p className="page-subtitle">Generate nomor peserta, atur tata tertib, dan cetak kartu ujian santri</p>
        </div>
        <div className="header-actions-row">
          {activeTA && (
            <div className="status-indicator-pill">
              <span className="dot" />
              <span>TA {activeTA.kode} • Semester {settings?.active_semester || 'Aktif'}</span>
            </div>
          )}
        </div>
      </header>

      {/* ─── 2. SEGMENTED CONTROL DOCK ──────────────────────────────────── */}
      <div className="segmented-tabs-dock no-print">
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <Zap size={14} />
          <span>Generate Nomor</span>
        </button>
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === 'cetak' ? 'active' : ''}`}
          onClick={() => setActiveTab('cetak')}
        >
          <Printer size={14} />
          <span>Cetak Kartu</span>
        </button>
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === 'kartu_belakang' ? 'active' : ''}`}
          onClick={() => setActiveTab('kartu_belakang')}
        >
          <FileText size={14} />
          <span>Kartu Belakang</span>
        </button>
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === 'setting' ? 'active' : ''}`}
          onClick={() => setActiveTab('setting')}
        >
          <SettingsIcon size={14} />
          <span>Setting Kartu</span>
        </button>
      </div>

      {/* ─── 3. TAB PANELS ──────────────────────────────────────────────── */}
      <div className="no-print">
        {activeTab === 'generate' && (
          <TabGenerateNomor 
            tahunAjaranList={tahunAjaranList} 
            activeTahunAjaranId={activeTahunAjaranId} 
            activeSemester={settings?.active_semester} 
          />
        )}

        {activeTab === 'cetak' && (
          <TabCetakKartu
            tahunAjaranList={tahunAjaranList}
            settings={settings}
            onPesertaChange={handlePesertaChange}
            pesertaList={printData.pesertaList}
            activeTahunAjaranId={activeTahunAjaranId}
            activeSemester={settings?.active_semester}
          />
        )}

        {activeTab === 'kartu_belakang' && (
          <TabKartuBelakang
            settings={settings}
            onRefresh={fetchMeta}
            pesertaList={printData.pesertaList}
          />
        )}

        {activeTab === 'setting' && (
          <TabSettingCard 
            settings={settings} 
            onRefresh={fetchMeta} 
          />
        )}
      </div>

      {/* ─── 4. AREA CETAK — HANYA TAMPIL SAAT PRINT ────────────────────── */}
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

export default KartuUjianSemester;
