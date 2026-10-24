import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Plus, Trash2, Edit2, CheckCircle2, AlertCircle,
  RefreshCw, Search, ShieldAlert, Sparkles, Layers, Calendar,
  GraduationCap, AlertTriangle, X, Check
} from 'lucide-react';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomModal } from '../components/ui/CustomModal';
import {
  ActiveTabSetup,
  TahunAjaran,
  JenisIuran,
  TarifDefault,
  TarifBulanan,
  Pengecualian,
  SantriLookup
} from '../types/keuangan';
import './SetupKeuangan.scss';

const NAMA_BULAN: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'Juni',
  7: 'Juli', 8: 'Agustus', 9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
};

function rp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function SetupKeuangan() {
  const [activeTab, setActiveTab] = useState<ActiveTabSetup>('default');
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

  // Modal states
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [formDefault, setFormDefault] = useState({ jenis_iuran_id: '', nominal: '', keterangan: '' });

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [formOverride, setFormOverride] = useState({
    jenis_iuran_id: '',
    bulan: String(new Date().getMonth() + 1),
    tahun_kalender: String(new Date().getFullYear()),
    nominal: '',
    keterangan: '',
  });

  const [showPengecualianModal, setShowPengecualianModal] = useState(false);
  const [searchSantriQuery, setSearchSantriQuery] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<SantriLookup | null>(null);
  const [formPengecualian, setFormPengecualian] = useState({ jenis_iuran_id: '', alasan: '' });

  // Delete Confirm Modal State (Replaces window.confirm)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'override' | 'pengecualian';
    id: number;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'override',
    id: 0,
    title: '',
    message: '',
  });

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

  // Initial load: Tahun Ajaran & Jenis Iuran
  useEffect(() => {
    fetch('/api/tahun-ajaran', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((list: TahunAjaran[]) => {
        setTahunList(list);
        const aktif = list.find(t => t.is_active);
        if (aktif) setTahunId(aktif.id);
      })
      .catch(() => {});

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
      setError('Gagal memuat data pengaturan keuangan.');
    } finally {
      setLoading(false);
    }
  }, [tahunId, activeTab, token]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(t);
    }
  }, [success]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSaveDefault = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/keuangan/tarif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jenis_iuran_id: Number(formDefault.jenis_iuran_id),
          tahun_ajaran_id: tahunId,
          nominal: Number(formDefault.nominal.replace(/\D/g, '')),
          keterangan: formDefault.keterangan,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Gagal menyimpan tarif');
      setSuccess('Tarif default iuran berhasil disimpan.');
      setShowDefaultModal(false);
      setFormDefault({ jenis_iuran_id: '', nominal: '', keterangan: '' });
      loadTabData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/keuangan/tarif-bulanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jenis_iuran_id: Number(formOverride.jenis_iuran_id),
          tahun_ajaran_id: tahunId,
          bulan: Number(formOverride.bulan),
          tahun_kalender: Number(formOverride.tahun_kalender),
          nominal: Number(formOverride.nominal.replace(/\D/g, '')),
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

  const handleSavePengecualian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) return;
    setError('');
    setSuccess('');
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

  const executeDelete = async () => {
    setError('');
    setSuccess('');
    try {
      if (deleteConfirm.type === 'override') {
        const res = await fetch(`/api/keuangan/tarif-bulanan/${deleteConfirm.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? 'Gagal menghapus override tarif');
        }
        setSuccess('Override tarif bulanan berhasil dihapus.');
      } else {
        const res = await fetch(`/api/keuangan/pengecualian/${deleteConfirm.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? 'Gagal mencabut pengecualian');
        }
        setSuccess('Pengecualian iuran berhasil dicabut.');
      }
      setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
      loadTabData();
    } catch (err: any) {
      setError(err.message);
      setDeleteConfirm(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Filter santri list for dropdown lookup
  const filteredSantriSuggestions = searchSantriQuery.length >= 2
    ? santriList.filter(s =>
        s.nama.toLowerCase().includes(searchSantriQuery.toLowerCase()) ||
        s.nis.includes(searchSantriQuery)
      ).slice(0, 5)
    : [];

  const tahunOptions = tahunList.map(t => ({
    value: t.id,
    label: `${t.kode}${t.is_active ? ' (Aktif)' : ''}`,
  }));

  return (
    <div className="setup-keuangan-container">
      {/* 🍏 1. APPLE FLOATING DOCK HEADER (Option A Standard - NO HEADER ICON) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Setup & Konfigurasi Keuangan</h2>
          <p className="page-subtitle">
            Atur tarif default tahunan, diskon override bulanan, dan kebijakan beasiswa/bebas SPP santri
          </p>
        </div>

        <div className="header-action-dock">
          <div style={{ width: 170 }}>
            <CustomSelect
              value={tahunId}
              onChange={val => setTahunId(Number(val))}
              options={tahunOptions}
              placeholder="Pilih Tahun Ajaran"
              size="md"
            />
          </div>

          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={loadTabData}
            disabled={loading}
            title="Segarkan Data"
          >
            <RefreshCw size={14} className={loading ? 'spinning-icon' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </header>

      {/* 📊 2. KPI METRICS CARDS */}
      <div className="setup-kpi-grid">
        <div className="setup-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Tarif Iuran Terdaftar</span>
            <div className="kpi-orb orb-sapphire">
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-val text-sapphire">{tarifs.length} Tarif</div>
          <p className="kpi-sub">Total komponen iuran pada tahun ajaran ini</p>
        </div>

        <div className="setup-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Override Bulanan Aktif</span>
            <div className="kpi-orb orb-rose">
              <Calendar size={18} />
            </div>
          </div>
          <div className="kpi-val text-rose">{overrides.length} Bulan</div>
          <p className="kpi-sub">Penyesuaian diskon temporer (cth. Ramadhan)</p>
        </div>

        <div className="setup-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Penerima Beasiswa / Free SPP</span>
            <div className="kpi-orb orb-emerald">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="kpi-val text-emerald">{pengecualian.length} Santri</div>
          <p className="kpi-sub">Pembebasan biaya tagihan penuh (Rp 0)</p>
        </div>
      </div>

      {/* ⚠️ View-Only Mode Banner */}
      {!isAdmin && (
        <div className="view-only-warning-card">
          <ShieldAlert size={18} className="warn-icon" />
          <div className="warn-text">
            <strong>Mode Baca Saja (View-Only)</strong>
            <span>Hanya Admin Keuangan yang berhak mengubah tarif default, override temporer, atau pengecualian santri.</span>
          </div>
        </div>
      )}

      {/* Alert Banners */}
      {error && (
        <div className="setup-alert-banner alert-error">
          <AlertCircle size={15} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="btn-close-alert"><X size={12} /></button>
        </div>
      )}

      {success && (
        <div className="setup-alert-banner alert-success">
          <CheckCircle2 size={15} />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')} className="btn-close-alert"><X size={12} /></button>
        </div>
      )}

      {/* 🍏 3. APPLE SEGMENTED CONTROL TABS */}
      <div className="segmented-control-wrapper">
        <div className="apple-segmented-dock">
          {([
            ['default', 'Tarif Default (Tahunan)'],
            ['override', 'Override Bulanan (Ramadhan, dll)'],
            ['pengecualian', 'Pengecualian (Free SPP / Beasiswa)']
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`segmented-tab-btn ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 📋 4. TAB CONTENTS */}
      {loading ? (
        <div className="setup-skeleton-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="setup-skeleton-bar" />
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: TARIF DEFAULT */}
          {activeTab === 'default' && (
            <div className="setup-glass-panel">
              <div className="panel-header-bar">
                <div className="header-text-group">
                  <h3 className="panel-title">Daftar Tarif Iuran Tahun Ajaran</h3>
                  <p className="panel-desc">Besaran nominal baku yang diterapkan secara default ke seluruh santri</p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    className="action-pill-btn primary-pill"
                    onClick={() => {
                      setFormDefault({ jenis_iuran_id: '', nominal: '', keterangan: '' });
                      setShowDefaultModal(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Atur / Ubah Tarif</span>
                  </button>
                )}
              </div>

              <div className="table-responsive-wrapper">
                <table className="setup-glass-table">
                  <thead>
                    <tr>
                      <th style={{ width: 45 }}>#</th>
                      <th>Nama Iuran</th>
                      <th>Kode</th>
                      <th>Kategori</th>
                      <th className="cell-right">Nominal Default</th>
                      <th>Keterangan</th>
                      {isAdmin && <th className="cell-center" style={{ width: 70 }}>Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {tarifs.map((t, idx) => (
                      <tr key={t.id}>
                        <td className="cell-muted">{idx + 1}</td>
                        <td className="cell-title font-bold">{t.nama_iuran}</td>
                        <td>
                          <span className="code-badge">{t.kode_iuran}</span>
                        </td>
                        <td>
                          <span className={`kategori-badge kat-${t.kategori}`}>
                            {t.kategori === 'spp_bulanan' ? 'SPP Bulanan' :
                             t.kategori.startsWith('daftar_ulang') ? 'Daftar Ulang' : 'Event'}
                          </span>
                        </td>
                        <td className="cell-right font-numeric font-bold text-slate">
                          {rp(Number(t.nominal))}
                        </td>
                        <td className="cell-muted">{t.keterangan || '—'}</td>
                        {isAdmin && (
                          <td className="cell-center">
                            <button
                              type="button"
                              className="action-circle-btn"
                              onClick={() => {
                                setFormDefault({
                                  jenis_iuran_id: String(t.jenis_iuran_id),
                                  nominal: new Intl.NumberFormat('id-ID').format(Number(t.nominal)),
                                  keterangan: t.keterangan || '',
                                });
                                setShowDefaultModal(true);
                              }}
                              title="Ubah Tarif Ini"
                            >
                              <Edit2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {tarifs.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 7 : 6} className="table-empty-cell">
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
            <div className="setup-glass-panel">
              <div className="panel-header-bar">
                <div className="header-text-group">
                  <h3 className="panel-title">Override Tarif Bulanan (Temporer)</h3>
                  <p className="panel-desc">
                    Penyesuaian massal nominal SPP pada bulan kalender tertentu (misal: pemotongan SPP Makan saat libur Ramadhan)
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    className="action-pill-btn primary-pill"
                    onClick={() => {
                      setFormOverride({
                        jenis_iuran_id: '',
                        bulan: String(new Date().getMonth() + 1),
                        tahun_kalender: String(new Date().getFullYear()),
                        nominal: '',
                        keterangan: '',
                      });
                      setShowOverrideModal(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Tambah Override</span>
                  </button>
                )}
              </div>

              <div className="table-responsive-wrapper">
                <table className="setup-glass-table">
                  <thead>
                    <tr>
                      <th style={{ width: 45 }}>#</th>
                      <th>Nama Iuran SPP</th>
                      <th>Bulan / Tahun Kalender</th>
                      <th className="cell-right">Nominal Override</th>
                      <th>Alasan / Keterangan</th>
                      {isAdmin && <th className="cell-center" style={{ width: 70 }}>Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {overrides.map((o, idx) => (
                      <tr key={o.id}>
                        <td className="cell-muted">{idx + 1}</td>
                        <td className="cell-title font-bold">{o.nama_iuran}</td>
                        <td>
                          <span className="calendar-pill">
                            <Calendar size={12} />
                            {NAMA_BULAN[o.bulan]} {o.tahun_kalender}
                          </span>
                        </td>
                        <td className="cell-right font-numeric font-bold text-rose">
                          {rp(Number(o.nominal))}
                        </td>
                        <td className="cell-muted">{o.keterangan || '—'}</td>
                        {isAdmin && (
                          <td className="cell-center">
                            <button
                              type="button"
                              className="action-circle-btn danger-hover"
                              onClick={() => {
                                setDeleteConfirm({
                                  isOpen: true,
                                  type: 'override',
                                  id: o.id,
                                  title: 'Hapus Override Tarif Bulanan?',
                                  message: `Override tarif untuk ${o.nama_iuran} bulan ${NAMA_BULAN[o.bulan]} ${o.tahun_kalender} akan dihapus dan kembali ke tarif default.`,
                                });
                              }}
                              title="Hapus Override"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {overrides.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 5} className="table-empty-cell">
                          Tidak ada override tarif bulanan yang aktif untuk tahun ajaran ini.
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
            <div className="setup-glass-panel">
              <div className="panel-header-bar">
                <div className="header-text-group">
                  <h3 className="panel-title">Pengecualian Iuran (Free SPP / Beasiswa)</h3>
                  <p className="panel-desc">
                    Daftar santri yang dibebaskan secara penuh (nominal Rp 0) untuk iuran tertentu sepanjang tahun ajaran
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    className="action-pill-btn primary-pill"
                    onClick={() => {
                      setSelectedSantri(null);
                      setSearchSantriQuery('');
                      setFormPengecualian({ jenis_iuran_id: '', alasan: '' });
                      setShowPengecualianModal(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Tambah Pengecualian</span>
                  </button>
                )}
              </div>

              <div className="table-responsive-wrapper">
                <table className="setup-glass-table">
                  <thead>
                    <tr>
                      <th style={{ width: 45 }}>#</th>
                      <th>Santri</th>
                      <th>Bebas Iuran</th>
                      <th>Alasan Pembebasan</th>
                      <th>Petugas Pencatat</th>
                      {isAdmin && <th className="cell-center" style={{ width: 70 }}>Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pengecualian.map((p, idx) => {
                      const initial = p.nama_santri ? p.nama_santri.charAt(0).toUpperCase() : '?';
                      return (
                        <tr key={p.id}>
                          <td className="cell-muted">{idx + 1}</td>
                          <td>
                            <div className="santri-cell-group">
                              <div className="santri-avatar-orb">{initial}</div>
                              <div className="santri-name-column">
                                <span className="santri-name">{p.nama_santri}</span>
                                <span className="santri-nis-pill">NIS: {p.nis}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="bebas-iuran-badge">{p.nama_iuran}</span>
                          </td>
                          <td>
                            <span className="alasan-pill">{p.alasan || 'Beasiswa'}</span>
                          </td>
                          <td className="cell-muted" style={{ fontSize: 12 }}>
                            {p.nama_pencatat || 'Admin'}
                          </td>
                          {isAdmin && (
                            <td className="cell-center">
                              <button
                                type="button"
                                className="action-circle-btn danger-hover"
                                onClick={() => {
                                  setDeleteConfirm({
                                    isOpen: true,
                                    type: 'pengecualian',
                                    id: p.id,
                                    title: 'Cabut Pembebasan Iuran?',
                                    message: `Santri ${p.nama_santri} (${p.nis}) akan ditagih ${p.nama_iuran} secara normal kembali sepanjang tahun ajaran ini.`,
                                  });
                                }}
                                title="Cabut Pengecualian"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {pengecualian.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 5} className="table-empty-cell">
                          Belum ada santri yang dikecualikan dari iuran pada tahun ajaran ini.
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

      {/* 🍏 MODAL 1: ATUR TARIF DEFAULT */}
      {showDefaultModal && (
        <CustomModal
          isOpen={showDefaultModal}
          onClose={() => setShowDefaultModal(false)}
          title="Atur Tarif Default Iuran"
          subtitle="Tentukan nominal tagihan baku untuk tahun ajaran aktif"
          width={520}
        >
          <form onSubmit={handleSaveDefault} className="setup-modal-form">
            <div className="form-field-group">
              <label className="field-label">Pilih Komponen Iuran <span className="req-star">*</span></label>
              <div style={{ width: '100%' }}>
                <CustomSelect
                  value={formDefault.jenis_iuran_id ? Number(formDefault.jenis_iuran_id) : null}
                  onChange={val => setFormDefault(prev => ({ ...prev, jenis_iuran_id: String(val) }))}
                  options={jenisIuran.map(j => ({
                    value: j.id,
                    label: `${j.nama} (${j.kode})`,
                  }))}
                  placeholder="-- Pilih Iuran --"
                  size="md"
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label">Nominal Default <span className="req-star">*</span></label>
              <div className="currency-input-pill">
                <span className="currency-prefix">Rp</span>
                <input
                  type="text"
                  className="currency-field"
                  value={formDefault.nominal}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setFormDefault(prev => ({
                      ...prev,
                      nominal: digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : '',
                    }));
                  }}
                  placeholder="0"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label">Keterangan / Catatan</label>
              <input
                type="text"
                className="standard-glass-input"
                value={formDefault.keterangan}
                onChange={e => setFormDefault(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Contoh: SPP Makan Standar Pondok"
              />
            </div>

            <div className="modal-footer-actions">
              <button
                type="button"
                className="action-pill-btn secondary-pill"
                onClick={() => setShowDefaultModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                className="action-pill-btn primary-pill"
                disabled={!formDefault.jenis_iuran_id || !formDefault.nominal}
              >
                <CheckCircle2 size={14} />
                <span>Simpan Tarif</span>
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* 🍏 MODAL 2: ADD OVERRIDE BULANAN */}
      {showOverrideModal && (
        <CustomModal
          isOpen={showOverrideModal}
          onClose={() => setShowOverrideModal(false)}
          title="Tambah Override Tarif Bulanan"
          subtitle="Turunkan nominal SPP khusus pada bulan kalender tertentu"
          width={540}
        >
          <form onSubmit={handleSaveOverride} className="setup-modal-form">
            <div className="form-field-group">
              <label className="field-label">Pilih SPP Bulanan <span className="req-star">*</span></label>
              <div style={{ width: '100%' }}>
                <CustomSelect
                  value={formOverride.jenis_iuran_id ? Number(formOverride.jenis_iuran_id) : null}
                  onChange={val => setFormOverride(prev => ({ ...prev, jenis_iuran_id: String(val) }))}
                  options={jenisIuran
                    .filter(j => j.kategori === 'spp_bulanan')
                    .map(j => ({ value: j.id, label: j.nama }))}
                  placeholder="-- Pilih SPP --"
                  size="md"
                />
              </div>
            </div>

            <div className="form-two-cols">
              <div className="form-field-group">
                <label className="field-label">Bulan Kalender <span className="req-star">*</span></label>
                <div style={{ width: '100%' }}>
                  <CustomSelect
                    value={Number(formOverride.bulan)}
                    onChange={val => setFormOverride(prev => ({ ...prev, bulan: String(val) }))}
                    options={Object.entries(NAMA_BULAN).map(([n, nama]) => ({
                      value: Number(n),
                      label: nama,
                    }))}
                    placeholder="Pilih Bulan"
                    size="md"
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label">Tahun Kalender <span className="req-star">*</span></label>
                <input
                  type="number"
                  className="standard-glass-input"
                  value={formOverride.tahun_kalender}
                  onChange={e => setFormOverride(prev => ({ ...prev, tahun_kalender: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label">Nominal Baru Override <span className="req-star">*</span></label>
              <div className="currency-input-pill">
                <span className="currency-prefix">Rp</span>
                <input
                  type="text"
                  className="currency-field"
                  value={formOverride.nominal}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setFormOverride(prev => ({
                      ...prev,
                      nominal: digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : '',
                    }));
                  }}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label">Alasan / Keterangan <span className="req-star">*</span></label>
              <input
                type="text"
                className="standard-glass-input"
                value={formOverride.keterangan}
                onChange={e => setFormOverride(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Misal: Libur Ramadhan - Potongan 50%"
                required
              />
            </div>

            <div className="modal-footer-actions">
              <button
                type="button"
                className="action-pill-btn secondary-pill"
                onClick={() => setShowOverrideModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                className="action-pill-btn primary-pill"
                disabled={!formOverride.jenis_iuran_id || !formOverride.nominal || !formOverride.keterangan}
              >
                <CheckCircle2 size={14} />
                <span>Terapkan Override</span>
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* 🍏 MODAL 3: ADD PENGECUALIAN / FREE SPP */}
      {showPengecualianModal && (
        <CustomModal
          isOpen={showPengecualianModal}
          onClose={() => setShowPengecualianModal(false)}
          title="Tambah Pengecualian (Free SPP)"
          subtitle="Bebaskan santri secara penuh dari tagihan iuran tertentu"
          width={540}
        >
          <form onSubmit={handleSavePengecualian} className="setup-modal-form">
            {/* Search & Lookup Santri */}
            <div className="form-field-group" style={{ position: 'relative' }}>
              <label className="field-label">Cari & Pilih Santri <span className="req-star">*</span></label>
              {selectedSantri ? (
                <div className="selected-santri-card">
                  <div className="santri-info">
                    <span className="santri-name">{selectedSantri.nama}</span>
                    <span className="santri-nis">NIS: {selectedSantri.nis}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-remove-santri"
                    onClick={() => setSelectedSantri(null)}
                    title="Ganti santri"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="santri-search-input-wrap">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Ketik minimal 2 huruf nama santri / NIS..."
                      value={searchSantriQuery}
                      onChange={e => setSearchSantriQuery(e.target.value)}
                      className="standard-glass-input with-icon"
                      autoFocus
                    />
                  </div>
                  {filteredSantriSuggestions.length > 0 && (
                    <div className="santri-autocomplete-floating">
                      {filteredSantriSuggestions.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          className="autocomplete-item"
                          onClick={() => {
                            setSelectedSantri(s);
                            setSearchSantriQuery('');
                          }}
                        >
                          <span className="item-name">{s.nama}</span>
                          <span className="item-nis">{s.nis}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-field-group">
              <label className="field-label">Pilih Iuran Pembebasan <span className="req-star">*</span></label>
              <div style={{ width: '100%' }}>
                <CustomSelect
                  value={formPengecualian.jenis_iuran_id ? Number(formPengecualian.jenis_iuran_id) : null}
                  onChange={val => setFormPengecualian(prev => ({ ...prev, jenis_iuran_id: String(val) }))}
                  options={jenisIuran
                    .filter(j => j.kategori === 'spp_bulanan')
                    .map(j => ({ value: j.id, label: j.nama }))}
                  placeholder="-- Pilih SPP --"
                  size="md"
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="field-label">Alasan Pembebasan <span className="req-star">*</span></label>
              <input
                type="text"
                className="standard-glass-input"
                value={formPengecualian.alasan}
                onChange={e => setFormPengecualian(prev => ({ ...prev, alasan: e.target.value }))}
                placeholder="Misal: Beasiswa Prestasi Tahfidz Al-Qur'an"
                required
              />
            </div>

            <div className="modal-footer-actions">
              <button
                type="button"
                className="action-pill-btn secondary-pill"
                onClick={() => setShowPengecualianModal(false)}
              >
                Batal
              </button>
              <button
                type="submit"
                className="action-pill-btn primary-pill"
                disabled={!selectedSantri || !formPengecualian.jenis_iuran_id || !formPengecualian.alasan}
              >
                <CheckCircle2 size={14} />
                <span>Bebaskan Tagihan</span>
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* ⚠️ MODAL 4: CONFIRM DELETE (Replaces window.confirm) */}
      {deleteConfirm.isOpen && (
        <CustomModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
          title={deleteConfirm.title}
          subtitle="Konfirmasi tindakan administratif"
          width={460}
        >
          <div className="confirm-delete-content">
            <div className="confirm-icon-halo">
              <AlertTriangle size={24} className="warn-icon" />
            </div>
            <p className="confirm-text">{deleteConfirm.message}</p>
            <div className="modal-footer-actions">
              <button
                type="button"
                className="action-pill-btn secondary-pill"
                onClick={() => setDeleteConfirm(prev => ({ ...prev, isOpen: false }))}
              >
                Batal
              </button>
              <button
                type="button"
                className="action-pill-btn danger-pill"
                onClick={executeDelete}
              >
                <Trash2 size={14} />
                <span>Konfirmasi Hapus</span>
              </button>
            </div>
          </div>
        </CustomModal>
      )}
    </div>
  );
}
