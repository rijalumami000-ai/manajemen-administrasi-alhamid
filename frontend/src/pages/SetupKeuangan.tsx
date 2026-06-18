import { useState, useEffect, useCallback } from 'react';
import { Settings, Plus, Trash2, Edit2, CheckCircle, AlertCircle, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import './SetupKeuangan.scss';

type ActiveTab = 'default' | 'override' | 'pengecualian';

interface TahunAjaran {
  id: number;
  kode: string;
  is_active: boolean;
}

interface JenisIuran {
  id: number;
  kode: string;
  nama: string;
  kategori: string;
  deskripsi: string;
}

interface TarifDefault {
  id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  nominal: string;
  keterangan?: string;
  kode_iuran: string;
  nama_iuran: string;
  kategori: string;
}

interface TarifBulanan {
  id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  bulan: number;
  tahun_kalender: number;
  nominal: string;
  keterangan?: string;
  kode_iuran: string;
  nama_iuran: string;
}

interface Pengecualian {
  id: number;
  santri_id: number;
  jenis_iuran_id: number;
  tahun_ajaran_id: number;
  alasan?: string;
  nama_santri: string;
  nis: string;
  nama_iuran: string;
  kode_iuran: string;
  nama_pencatat?: string;
}

interface SantriLookup {
  id: number;
  nama: string;
  nis: string;
}

const NAMA_BULAN: Record<number, string> = {
  1:'Januari',2:'Februari',3:'Maret',4:'April',5:'Mei',6:'Juni',
  7:'Juli',8:'Agustus',9:'September',10:'Oktober',11:'November',12:'Desember'
};

function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n ?? 0);
}

export default function SetupKeuangan() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('default');
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [tahunId, setTahunId] = useState<number | null>(null);
  const [jenisIuran, setJenisIuran] = useState<JenisIuran[]>([]);
  
  // Data lists
  const [tarifs, setTarifs] = useState<TarifDefault[]>([]);
  const [overrides, setOverrides] = useState<TarifBulanan[]>([]);
  const [pengecualian, setPengecualian] = useState<Pengecualian[]>([]);
  const [santriList, setSantriList] = useState<SantriLookup[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal / Form states
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [formDefault, setFormDefault] = useState({ jenis_iuran_id: '', nominal: '', keterangan: '' });

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [formOverride, setFormOverride] = useState({
    jenis_iuran_id: '', bulan: String(new Date().getMonth() + 1),
    tahun_kalender: String(new Date().getFullYear()), nominal: '', keterangan: ''
  });

  const [showPengecualianModal, setShowPengecualianModal] = useState(false);
  const [searchSantriQuery, setSearchSantriQuery] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<SantriLookup | null>(null);
  const [formPengecualian, setFormPengecualian] = useState({ jenis_iuran_id: '', alasan: '' });

  const token = localStorage.getItem('token') ?? '';

  // Get user role
  useEffect(() => {
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      setIsAdmin(payload.role === 'admin');
    } catch {
      setIsAdmin(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    fetch('/api/tahun-ajaran', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((list: TahunAjaran[]) => {
        setTahunList(list);
        const aktif = list.find(t => t.is_active);
        if (aktif) setTahunId(aktif.id);
      });

    fetch('/api/keuangan/jenis-iuran', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setJenisIuran)
      .catch(() => {});
  }, [token]);

  // Load santri for lookup if in exclusions tab
  useEffect(() => {
    if (activeTab === 'pengecualian' && santriList.length === 0) {
      fetch('/api/santri/active', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(setSantriList)
        .catch(() => {});
    }
  }, [activeTab, token, santriList.length]);

  const loadTabData = useCallback(async () => {
    if (!tahunId) return;
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'default') {
        const res = await fetch(`/api/keuangan/tarif?tahun_ajaran_id=${tahunId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTarifs(await res.json());
      } else if (activeTab === 'override') {
        const res = await fetch(`/api/keuangan/tarif-bulanan?tahun_ajaran_id=${tahunId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOverrides(await res.json());
      } else if (activeTab === 'pengecualian') {
        const res = await fetch(`/api/keuangan/pengecualian?tahun_ajaran_id=${tahunId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPengecualian(await res.json());
      }
    } catch {
      setError('Gagal memuat data pengaturan.');
    } finally {
      setLoading(false);
    }
  }, [tahunId, activeTab, token]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Actions
  const handleSaveDefault = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/keuangan/tarif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jenis_iuran_id: Number(formDefault.jenis_iuran_id),
          tahun_ajaran_id: tahunId,
          nominal: Number(formDefault.nominal),
          keterangan: formDefault.keterangan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan tarif');
      setSuccess('Tarif default berhasil disimpan.');
      setShowDefaultModal(false);
      setFormDefault({ jenis_iuran_id: '', nominal: '', keterangan: '' });
      loadTabData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/keuangan/tarif-bulanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jenis_iuran_id: Number(formOverride.jenis_iuran_id),
          tahun_ajaran_id: tahunId,
          bulan: Number(formOverride.bulan),
          tahun_kalender: Number(formOverride.tahun_kalender),
          nominal: Number(formOverride.nominal),
          keterangan: formOverride.keterangan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan override tarif');
      setSuccess('Override tarif bulanan berhasil disimpan.');
      setShowOverrideModal(false);
      setFormOverride(prev => ({ ...prev, jenis_iuran_id: '', nominal: '', keterangan: '' }));
      loadTabData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteOverride = async (id: number) => {
    if (!confirm('Hapus override tarif bulanan ini?')) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/keuangan/tarif-bulanan/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Gagal menghapus');
      }
      setSuccess('Override tarif bulanan berhasil dihapus.');
      loadTabData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSavePengecualian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch('/api/keuangan/pengecualian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          santri_id: selectedSantri.id,
          jenis_iuran_id: Number(formPengecualian.jenis_iuran_id),
          tahun_ajaran_id: tahunId,
          alasan: formPengecualian.alasan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan pengecualian');
      setSuccess(`Berhasil membebaskan ${selectedSantri.nama} dari SPP.`);
      setShowPengecualianModal(false);
      setSelectedSantri(null);
      setSearchSantriQuery('');
      setFormPengecualian({ jenis_iuran_id: '', alasan: '' });
      loadTabData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePengecualian = async (id: number, nama: string) => {
    if (!confirm(`Cabut pengecualian untuk ${nama}?\nSantri ini akan ditagih SPP secara normal kembali.`)) return;
    setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/keuangan/pengecualian/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Gagal mencabut pengecualian');
      }
      setSuccess('Pengecualian berhasil dicabut.');
      loadTabData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter santri list for dropdown lookup
  const filteredSantriSuggestions = searchSantriQuery.length >= 2 
    ? santriList.filter(s => 
        s.nama.toLowerCase().includes(searchSantriQuery.toLowerCase()) || 
        s.nis.includes(searchSantriQuery)
      ).slice(0, 5)
    : [];

  return (
    <div className="k-page setup-keuangan-page">
      <div className="k-page__header">
        <div>
          <h1>
            <Settings size={22} style={{ marginRight: 8, color: '#3B6FE8', verticalAlign: 'middle' }} />
            Setup Keuangan
          </h1>
          <p>Atur tarif iuran tahunan, diskon bulanan, dan pengecualian/free SPP</p>
        </div>
        <div className="k-page__header-actions">
          <select className="k-select" value={tahunId ?? ''} onChange={e => setTahunId(Number(e.target.value))}>
            {tahunList.map(t => <option key={t.id} value={t.id}>{t.kode}{t.is_active ? ' (Aktif)' : ''}</option>)}
          </select>
          <button className="k-btn-secondary" onClick={loadTabData} title="Refresh data">
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="k-tabs" style={{ marginBottom: 20 }}>
        {([
          ['default', 'Tarif Default (Tahunan)'],
          ['override', 'Override Bulanan (Ramadhan, dll)'],
          ['pengecualian', 'Pengecualian (Free SPP)']
        ] as const).map(([id, label]) => (
          <button key={id} className={`k-tab ${activeTab === id ? 'k-tab--active' : ''}`}
            onClick={() => setActiveTab(id)}>{label}</button>
        ))}
      </div>

      {!isAdmin && (
        <div className="k-alert k-alert--warning" style={{ marginBottom: 16 }}>
          <ShieldAlert size={16} /> Anda dalam mode <strong>View-Only</strong>. Hanya Admin Keuangan yang dapat mengubah tarif default, override, atau pengecualian.
        </div>
      )}

      {error && (
        <div className="k-alert k-alert--danger" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="k-alert k-alert--success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {loading ? (
        <div className="laporan-skeleton">
          {[1, 2, 3].map(i => <div key={i} className="k-skeleton" style={{ height: 64, marginBottom: 10 }} />)}
        </div>
      ) : (
        <>
          {/* TAB 1: TARIF DEFAULT */}
          {activeTab === 'default' && (
            <div className="setup-card-container">
              <div className="setup-card-header">
                <h3>Daftar Tarif Iuran Tahun Ajaran</h3>
                {isAdmin && (
                  <button className="k-btn-primary" onClick={() => setShowDefaultModal(true)}>
                    <Plus size={15} /> Atur/Ubah Tarif
                  </button>
                )}
              </div>

              <div className="k-table-wrap" style={{ marginTop: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Nama Iuran</th>
                      <th>Kode</th>
                      <th>Kategori</th>
                      <th className="right">Nominal Default</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarifs.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600 }}>{t.nama_iuran}</td>
                        <td className="muted">{t.kode_iuran}</td>
                        <td className="muted">
                          {t.kategori === 'spp_bulanan' ? 'SPP Bulanan' : 
                           t.kategori.startsWith('daftar_ulang') ? 'Daftar Ulang' : 'Event'}
                        </td>
                        <td className="right" style={{ fontWeight: 700, color: '#1E293B' }}>{rp(Number(t.nominal))}</td>
                        <td className="muted">{t.keterangan || '—'}</td>
                      </tr>
                    ))}
                    {tarifs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="center muted" style={{ padding: 24 }}>
                          Belum ada tarif default yang diatur untuk tahun ajaran ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: OVERRIDE BULANAN */}
          {activeTab === 'override' && (
            <div className="setup-card-container">
              <div className="setup-card-header">
                <h3>Override Tarif Bulanan (Temporer)</h3>
                {isAdmin && (
                  <button className="k-btn-primary" onClick={() => setShowOverrideModal(true)}>
                    <Plus size={15} /> Tambah Override
                  </button>
                )}
              </div>
              <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 16px 0' }}>
                Digunakan untuk menurunkan nominal SPP secara massal pada bulan tertentu (misal: SPP Makan dikurangi saat bulan Ramadhan).
              </p>

              <div className="k-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nama Iuran</th>
                      <th>Bulan / Tahun</th>
                      <th className="right">Nominal Baru</th>
                      <th>Alasan / Keterangan</th>
                      {isAdmin && <th className="center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {overrides.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontWeight: 600 }}>{o.nama_iuran}</td>
                        <td>{NAMA_BULAN[o.bulan]} {o.tahun_kalender}</td>
                        <td className="right" style={{ fontWeight: 700, color: '#E11D48' }}>{rp(Number(o.nominal))}</td>
                        <td className="muted">{o.keterangan || '—'}</td>
                        {isAdmin && (
                          <td className="center">
                            <button
                              className="k-action-btn k-action-btn--void"
                              onClick={() => handleDeleteOverride(o.id)}
                              title="Hapus Override"
                            >
                              <Trash2 size={13} /> Hapus
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {overrides.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 5 : 4} className="center muted" style={{ padding: 24 }}>
                          Tidak ada override tarif aktif.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PENGECUALIAN / FREE SPP */}
          {activeTab === 'pengecualian' && (
            <div className="setup-card-container">
              <div className="setup-card-header">
                <h3>Pengecualian Iuran (Free SPP / Beasiswa)</h3>
                {isAdmin && (
                  <button className="k-btn-primary" onClick={() => setShowPengecualianModal(true)}>
                    <Plus size={15} /> Tambah Pengecualian
                  </button>
                )}
              </div>
              <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 16px 0' }}>
                Daftar santri yang dibebaskan secara penuh (nominal Rp 0) untuk iuran tertentu sepanjang tahun ajaran ini.
              </p>

              <div className="k-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Santri</th>
                      <th>Bebas Iuran</th>
                      <th>Alasan Pembebasan</th>
                      <th>Petugas</th>
                      {isAdmin && <th className="center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pengecualian.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.nama_santri}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.nis}</div>
                        </td>
                        <td style={{ fontWeight: 500, color: '#3B6FE8' }}>{p.nama_iuran}</td>
                        <td className="muted">{p.alasan || '—'}</td>
                        <td className="muted" style={{ fontSize: 12 }}>{p.nama_pencatat || '—'}</td>
                        {isAdmin && (
                          <td className="center">
                            <button
                              className="k-action-btn k-action-btn--void"
                              onClick={() => handleDeletePengecualian(p.id, p.nama_santri)}
                              title="Cabut Pembebasan"
                            >
                              <Trash2 size={13} /> Cabut
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {pengecualian.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 5 : 4} className="center muted" style={{ padding: 24 }}>
                          Belum ada santri yang dikecualikan dari iuran.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: SET DEFAULT TARIF */}
      {showDefaultModal && (
        <div className="k-modal-backdrop" onClick={e => e.target === e.currentTarget && setShowDefaultModal(false)}>
          <div className="k-modal">
            <div className="k-modal__header">
              <div className="k-modal__title">
                <Settings size={18} style={{ color: '#3B6FE8' }} />
                <h3>Atur Tarif Default</h3>
              </div>
              <button className="k-modal__close" onClick={() => setShowDefaultModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveDefault}>
              <div className="k-form-group">
                <label>Pilih Jenis Iuran <span className="required">*</span></label>
                <select
                  className="k-select"
                  value={formDefault.jenis_iuran_id}
                  onChange={e => setFormDefault(prev => ({ ...prev, jenis_iuran_id: e.target.value }))}
                  required
                >
                  <option value="">-- Pilih Iuran --</option>
                  {jenisIuran.map(j => <option key={j.id} value={j.id}>{j.nama} ({j.kode})</option>)}
                </select>
              </div>
              <div className="k-form-group">
                <label>Nominal Default <span className="required">*</span></label>
                <div className="k-input-prefix">
                  <span>Rp</span>
                  <input
                    type="text"
                    className="k-input"
                    value={formDefault.nominal}
                    onChange={e => setFormDefault(prev => ({ ...prev, nominal: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Contoh: 350000"
                    required
                  />
                </div>
              </div>
              <div className="k-form-group">
                <label>Keterangan</label>
                <input
                  type="text"
                  className="k-input"
                  value={formDefault.keterangan}
                  onChange={e => setFormDefault(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Misal: SPP Makan Standard"
                />
              </div>
              <div className="k-modal__actions">
                <button type="button" className="k-btn-ghost" onClick={() => setShowDefaultModal(false)}>Batal</button>
                <button type="submit" className="k-btn-primary">Simpan Tarif</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD OVERRIDE BULANAN */}
      {showOverrideModal && (
        <div className="k-modal-backdrop" onClick={e => e.target === e.currentTarget && setShowOverrideModal(false)}>
          <div className="k-modal">
            <div className="k-modal__header">
              <div className="k-modal__title">
                <Plus size={18} style={{ color: '#3B6FE8' }} />
                <h3>Tambah Override Bulanan</h3>
              </div>
              <button className="k-modal__close" onClick={() => setShowOverrideModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveOverride}>
              <div className="k-form-group">
                <label>Jenis Iuran SPP <span className="required">*</span></label>
                <select
                  className="k-select"
                  value={formOverride.jenis_iuran_id}
                  onChange={e => setFormOverride(prev => ({ ...prev, jenis_iuran_id: e.target.value }))}
                  required
                >
                  <option value="">-- Pilih SPP --</option>
                  {jenisIuran.filter(j => j.kategori === 'spp_bulanan').map(j => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>
              <div className="k-form-row">
                <div className="k-form-group">
                  <label>Bulan <span className="required">*</span></label>
                  <select
                    className="k-select"
                    value={formOverride.bulan}
                    onChange={e => setFormOverride(prev => ({ ...prev, bulan: e.target.value }))}
                    required
                  >
                    {Object.entries(NAMA_BULAN).map(([n, nama]) => (
                      <option key={n} value={n}>{nama}</option>
                    ))}
                  </select>
                </div>
                <div className="k-form-group">
                  <label>Tahun Kalender <span className="required">*</span></label>
                  <input
                    type="number"
                    className="k-input"
                    value={formOverride.tahun_kalender}
                    onChange={e => setFormOverride(prev => ({ ...prev, tahun_kalender: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="k-form-group">
                <label>Nominal Baru <span className="required">*</span></label>
                <div className="k-input-prefix">
                  <span>Rp</span>
                  <input
                    type="text"
                    className="k-input"
                    value={formOverride.nominal}
                    onChange={e => setFormOverride(prev => ({ ...prev, nominal: e.target.value.replace(/\D/g, '') }))}
                    placeholder="Contoh: 150000"
                    required
                  />
                </div>
              </div>
              <div className="k-form-group">
                <label>Alasan / Keterangan <span className="required">*</span></label>
                <input
                  type="text"
                  className="k-input"
                  value={formOverride.keterangan}
                  onChange={e => setFormOverride(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Misal: Libur Ramadhan - Potongan 50%"
                  required
                />
              </div>
              <div className="k-modal__actions">
                <button type="button" className="k-btn-ghost" onClick={() => setShowOverrideModal(false)}>Batal</button>
                <button type="submit" className="k-btn-primary">Terapkan Override</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD PENGECUALIAN / FREE SPP */}
      {showPengecualianModal && (
        <div className="k-modal-backdrop" onClick={e => e.target === e.currentTarget && setShowPengecualianModal(false)}>
          <div className="k-modal">
            <div className="k-modal__header">
              <div className="k-modal__title">
                <Plus size={18} style={{ color: '#3B6FE8' }} />
                <h3>Tambah Pengecualian (Bebas Iuran)</h3>
              </div>
              <button className="k-modal__close" onClick={() => setShowPengecualianModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSavePengecualian}>
              {/* Search Santri */}
              <div className="k-form-group" style={{ position: 'relative' }}>
                <label>Cari & Pilih Santri <span className="required">*</span></label>
                {selectedSantri ? (
                  <div className="selected-santri-badge">
                    <div>
                      <strong>{selectedSantri.nama}</strong>
                      <span className="muted" style={{ marginLeft: 8 }}>({selectedSantri.nis})</span>
                    </div>
                    <button type="button" className="btn-remove" onClick={() => setSelectedSantri(null)}>&times;</button>
                  </div>
                ) : (
                  <>
                    <div className="k-search-box" style={{ width: '100%' }}>
                      <Search size={14} />
                      <input
                        type="text"
                        placeholder="Ketik minimal 2 huruf nama/NIS..."
                        value={searchSantriQuery}
                        onChange={e => setSearchSantriQuery(e.target.value)}
                        className="k-input"
                      />
                    </div>
                    {filteredSantriSuggestions.length > 0 && (
                      <div className="santri-lookup-results">
                        {filteredSantriSuggestions.map(s => (
                          <div
                            key={s.id}
                            className="lookup-item"
                            onClick={() => {
                              setSelectedSantri(s);
                              setSearchSantriQuery('');
                            }}
                          >
                            <span className="name">{s.nama}</span>
                            <span className="nis">{s.nis}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="k-form-group">
                <label>Pilih Iuran Pembebasan <span className="required">*</span></label>
                <select
                  className="k-select"
                  value={formPengecualian.jenis_iuran_id}
                  onChange={e => setFormPengecualian(prev => ({ ...prev, jenis_iuran_id: e.target.value }))}
                  required
                >
                  <option value="">-- Pilih SPP --</option>
                  {jenisIuran.filter(j => j.kategori === 'spp_bulanan').map(j => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>

              <div className="k-form-group">
                <label>Alasan Pembebasan <span className="required">*</span></label>
                <input
                  type="text"
                  className="k-input"
                  value={formPengecualian.alasan}
                  onChange={e => setFormPengecualian(prev => ({ ...prev, alasan: e.target.value }))}
                  placeholder="Misal: Beasiswa Prestasi Tahfidz"
                  required
                />
              </div>

              <div className="k-modal__actions">
                <button type="button" className="k-btn-ghost" onClick={() => setShowPengecualianModal(false)}>Batal</button>
                <button type="submit" className="k-btn-primary" disabled={!selectedSantri}>Bebaskan Tagihan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
