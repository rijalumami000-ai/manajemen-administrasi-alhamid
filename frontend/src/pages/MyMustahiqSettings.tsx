import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Trash2,
  Search,
  RefreshCw,
  Bell,
  CalendarClock,
  Smartphone,
  MessageSquare,
  ChevronDown,
  User,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  Send,
  Sparkles
} from 'lucide-react';
import { myMustahiqService } from '../services/myMustahiqService';
import { CustomModal } from '../components/ui/CustomModal';
import { FloatingInput } from '../components/ui/FloatingInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { SmartAlert } from '../components/ui/SmartAlert';
import { LoadingState, ErrorState, useToast } from '../components/common';
import {
  GuruMustahiqItem,
  SuggestionItem,
  CredentialsFormData,
  PushNotificationFormData,
  SuggestionDeleteConfirmState,
  MyMustahiqStats
} from '../types/myMustahiq';
import './MyMustahiqSettings.scss';

type ActiveTabType = 'accounts' | 'push' | 'schedule' | 'suggestions';

const TABS: { key: ActiveTabType; label: string; icon: React.ElementType }[] = [
  { key: 'accounts', label: 'Manajemen Akun Guru', icon: Smartphone },
  { key: 'push', label: 'Kirim Notifikasi', icon: Bell },
  { key: 'schedule', label: 'Jadwal Harian', icon: CalendarClock },
  { key: 'suggestions', label: 'Saran & Masukan', icon: MessageSquare }
];

export function MyMustahiqSettings() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTabType>('accounts');
  const [gurus, setGurus] = useState<GuruMustahiqItem[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter in Accounts Tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Credentials Modal State
  const [selectedGuru, setSelectedGuru] = useState<GuruMustahiqItem | null>(null);
  const [credUsername, setCredUsername] = useState<string>('');
  const [credPassword, setCredPassword] = useState<string>('');
  const [showCredPw, setShowCredPw] = useState<boolean>(false);
  const [credSubmitting, setCredSubmitting] = useState<boolean>(false);
  const [credError, setCredError] = useState<string | null>(null);

  // Push Notification Form State
  const [pushForm, setPushForm] = useState<PushNotificationFormData>({
    title: '',
    body: '',
    category: 'pengumuman',
    target: 'all'
  });
  const [pushing, setPushing] = useState<boolean>(false);
  const [scheduleTriggering, setScheduleTriggering] = useState<boolean>(false);

  // VisionOS Suggestion Delete Dialog
  const [deleteConfirm, setDeleteConfirm] = useState<SuggestionDeleteConfirmState>({
    isOpen: false,
    suggestionId: null,
    namaGuru: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [guruData, sugData] = await Promise.all([
        myMustahiqService.fetchGurus(),
        myMustahiqService.fetchSuggestions().catch((e: unknown) => {
          console.error('Failed to load suggestions:', e);
          return { suggestions: [] };
        })
      ]);
      setGurus(Array.isArray(guruData.gurus) ? guruData.gurus : []);
      setSuggestions(Array.isArray(sugData.suggestions) ? sugData.suggestions : []);
    } catch (err: unknown) {
      console.error('Failed to load MyMustahiq settings:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat data kredensial guru';
      setError(msg);
      toast.show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const stats: MyMustahiqStats = useMemo(() => {
    const totalGurus = gurus.length;
    const hasAccess = gurus.filter(g => !!g.mymustahiq_username).length;
    const noAccess = totalGurus - hasAccess;
    const totalSuggestions = suggestions.length;
    return { totalGurus, hasAccess, noAccess, totalSuggestions };
  }, [gurus, suggestions]);

  // Filtered Gurus
  const filteredGurus = useMemo(() => {
    return gurus.filter(guru => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        guru.nama.toLowerCase().includes(q) ||
        (guru.nip && guru.nip.toLowerCase().includes(q)) ||
        (guru.mymustahiq_username && guru.mymustahiq_username.toLowerCase().includes(q));

      const hasAccess = !!guru.mymustahiq_username;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && hasAccess) ||
        (statusFilter === 'inactive' && !hasAccess);

      return matchSearch && matchStatus;
    });
  }, [gurus, searchQuery, statusFilter]);

  // Open Credentials Modal
  const handleOpenCredentials = (guru: GuruMustahiqItem) => {
    setSelectedGuru(guru);
    setCredUsername(guru.mymustahiq_username || guru.nip || '');
    setCredPassword('');
    setShowCredPw(false);
    setCredError(null);
  };

  // Save Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuru) return;

    if (!credUsername.trim()) {
      setCredError('Username wajib diisi!');
      return;
    }

    if (!selectedGuru.mymustahiq_username && !credPassword) {
      setCredError('Password wajib diisi untuk pembuatan akun pertama!');
      return;
    }

    if (credPassword && credPassword.length < 6) {
      setCredError('Password minimal 6 karakter!');
      return;
    }

    setCredSubmitting(true);
    setCredError(null);

    try {
      const res = await myMustahiqService.updateCredentials(
        selectedGuru.id,
        credUsername.trim(),
        credPassword || undefined
      );
      toast.show(res.message || 'Kredensial Alhamid One berhasil diperbarui!', 'success');
      setGurus(prev =>
        prev.map(g => (g.id === selectedGuru.id ? { ...g, mymustahiq_username: credUsername.trim() } : g))
      );
      setSelectedGuru(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui kredensial';
      setCredError(msg);
      toast.show(msg, 'error');
    } finally {
      setCredSubmitting(false);
    }
  };

  // Remove Access
  const handleRemoveAccess = async () => {
    if (!selectedGuru) return;
    setCredSubmitting(true);
    setCredError(null);

    try {
      const res = await myMustahiqService.updateCredentials(selectedGuru.id, null, null);
      toast.show(res.message || 'Akses mobile Alhamid One berhasil dinonaktifkan!', 'success');
      setGurus(prev =>
        prev.map(g => (g.id === selectedGuru.id ? { ...g, mymustahiq_username: null } : g))
      );
      setSelectedGuru(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menonaktifkan akses';
      setCredError(msg);
      toast.show(msg, 'error');
    } finally {
      setCredSubmitting(false);
    }
  };

  // Push Notification Submit
  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushForm.title.trim() || !pushForm.body.trim()) {
      toast.show('Judul dan pesan notifikasi wajib diisi!', 'error');
      return;
    }

    setPushing(true);
    try {
      const res = await myMustahiqService.sendPushNotification(
        pushForm.title.trim(),
        pushForm.body.trim(),
        pushForm.category,
        pushForm.target
      );
      toast.show(res.message || 'Notifikasi realtime berhasil dikirim ke perangkat ustadz!', 'success');
      setPushForm({
        title: '',
        body: '',
        category: 'pengumuman',
        target: 'all'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirimkan notifikasi';
      toast.show(msg, 'error');
    } finally {
      setPushing(false);
    }
  };

  // Trigger Daily Schedule Push
  const handleTriggerDailySchedule = async () => {
    setScheduleTriggering(true);
    try {
      const res = await myMustahiqService.triggerDailySchedulePush();
      toast.show(res.message || 'Notifikasi jadwal harian berhasil dipicu dan dikirim!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memicu pengiriman notifikasi jadwal';
      toast.show(msg, 'error');
    } finally {
      setScheduleTriggering(false);
    }
  };

  // Suggestion Delete Confirm
  const handleConfirmDeleteSuggestion = async () => {
    if (!deleteConfirm.suggestionId) return;

    try {
      const res = await myMustahiqService.deleteSuggestion(deleteConfirm.suggestionId);
      toast.show(res.message || 'Saran/masukan berhasil dihapus!', 'success');
      setSuggestions(prev => prev.filter(s => s.id !== deleteConfirm.suggestionId));
      setDeleteConfirm({ isOpen: false, suggestionId: null, namaGuru: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus saran';
      toast.show(msg, 'error');
    }
  };

  if (loading && gurus.length === 0) {
    return <LoadingState message="Memuat setelan Alhamid One..." />;
  }

  if (error && gurus.length === 0) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="mms-page-container">
      {/* 🍏 Sacred Dock Header (Option A) */}
      <div className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Setelan Alhamid One</h2>
          <p className="page-subtitle">
            Kelola otentikasi ustadz, push notification realtime, dan jadwal aplikasi mobile
          </p>
        </div>

        <div className="header-action-dock">
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={loadData}
            title="Segarkan Data"
          >
            <RefreshCw size={15} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* 📊 4 KPI Stat Orbs */}
      <div className="mms-kpi-grid">
        <div className="kpi-glass-card kpi-sapphire">
          <div className="kpi-icon-orb orb-sapphire">
            <User size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.totalGurus}</span>
            <span className="kpi-label">Total Asatidz</span>
            <span className="kpi-subtext">Terdaftar di sistem</span>
          </div>
        </div>

        <div className="kpi-glass-card kpi-emerald">
          <div className="kpi-icon-orb orb-emerald">
            <Smartphone size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.hasAccess}</span>
            <span className="kpi-label">Akses Mobile Aktif</span>
            <span className="kpi-subtext">{Math.round((stats.hasAccess / (stats.totalGurus || 1)) * 100)}% terhubung</span>
          </div>
        </div>

        <div className="kpi-glass-card kpi-amber">
          <div className="kpi-icon-orb orb-amber">
            <Key size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.noAccess}</span>
            <span className="kpi-label">Belum Memiliki Akun</span>
            <span className="kpi-subtext">Menunggu pengaturan</span>
          </div>
        </div>

        <div className="kpi-glass-card kpi-purple">
          <div className="kpi-icon-orb orb-purple">
            <MessageSquare size={20} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{stats.totalSuggestions}</span>
            <span className="kpi-label">Saran Masukan</span>
            <span className="kpi-subtext">Dari asatidz & santri</span>
          </div>
        </div>
      </div>

      {/* 🏷️ Segmented Control Pills */}
      <div className="mms-tabs-dock">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`mms-tab-pill ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={16} />
            <span>{label}</span>
            {key === 'suggestions' && stats.totalSuggestions > 0 && (
              <span className="tab-counter-badge">{stats.totalSuggestions}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: ACCOUNTS ────────────────────────────────────── */}
      {activeTab === 'accounts' && (
        <div className="tab-pane-container">
          <div className="accounts-filter-dock">
            <div className="search-pill-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Cari berdasarkan nama, NIP, atau username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="filter-pill-cluster">
              <span className="filter-label">Status Akses:</span>
              <div className="segmented-sub-filter">
                <button
                  type="button"
                  className={`sub-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  Semua ({gurus.length})
                </button>
                <button
                  type="button"
                  className={`sub-btn ${statusFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('active')}
                >
                  Aktif ({stats.hasAccess})
                </button>
                <button
                  type="button"
                  className={`sub-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('inactive')}
                >
                  Belum Ada ({stats.noAccess})
                </button>
              </div>
            </div>
          </div>

          <div className="liquid-table-container">
            <div className="table-responsive">
              <table className="mms-table">
                <thead>
                  <tr>
                    <th>Nama Guru / Ustadz</th>
                    <th>NIP</th>
                    <th>No. HP</th>
                    <th>Status Guru</th>
                    <th>Username Alhamid One</th>
                    <th>Akses Mobile</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGurus.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty-cell">
                        <User size={32} />
                        <p>Tidak ada guru yang sesuai dengan kriteria filter</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGurus.map(guru => {
                      const hasAccess = !!guru.mymustahiq_username;
                      const initial = (guru.nama || '?')[0].toUpperCase();
                      return (
                        <tr key={guru.id}>
                          <td>
                            <div className="guru-avatar-group">
                              <div className="guru-lens-orb">
                                <span>{initial}</span>
                              </div>
                              <span className="guru-nama">{guru.nama}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-mono">{guru.nip || '-'}</span>
                          </td>
                          <td>
                            <span className="text-muted">{guru.no_hp || '-'}</span>
                          </td>
                          <td>
                            <span className="status-guru-pill">
                              {guru.status || 'Aktif'}
                            </span>
                          </td>
                          <td>
                            {hasAccess ? (
                              <span className="username-active-pill">
                                @{guru.mymustahiq_username}
                              </span>
                            ) : (
                              <span className="username-unset-pill">
                                Belum Disetel
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`status-frosted-pill ${hasAccess ? 'pill-active' : 'pill-inactive'}`}>
                              <span className="status-indicator-dot" />
                              <span>{hasAccess ? 'Aktif' : 'Nonaktif'}</span>
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              className={`action-pill-btn mini-pill ${hasAccess ? 'secondary-pill' : 'primary-pill'}`}
                              onClick={() => handleOpenCredentials(guru)}
                            >
                              <Key size={13} />
                              <span>{hasAccess ? 'Edit Akses' : 'Beri Akses'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer-bar">
              <span>Menampilkan <strong>{filteredGurus.length}</strong> dari {gurus.length} asatidz</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PUSH NOTIFICATION ─────────────────────────── */}
      {activeTab === 'push' && (
        <div className="tab-pane-container">
          <div className="push-notification-card">
            <div className="card-header">
              <div className="card-icon-wrap">
                <Bell size={20} />
              </div>
              <div>
                <h3>Kirim Push Notification Realtime</h3>
                <p>Kirimkan pengumuman atau instruksi mendesak langsung ke aplikasi mobile Alhamid One dewan asatidz</p>
              </div>
            </div>

            <form onSubmit={handleSendPush} className="push-form">
              <FloatingInput
                label="Judul Notifikasi"
                name="title"
                value={pushForm.title}
                onChange={e => setPushForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Cth: Undangan Rapat Evaluasi Bulanan"
                required
                disabled={pushing}
              />

              <div className="form-row-2">
                <CustomSelect
                  label="Kategori Notifikasi"
                  value={pushForm.category}
                  onChange={val => setPushForm(p => ({ ...p, category: val }))}
                  options={[
                    { value: 'pengumuman', label: '📢 Pengumuman Umum' },
                    { value: 'jadwal', label: '📅 Perubahan Jadwal' },
                    { value: 'penting', label: '⚠️ Instruksi Penting' },
                    { value: 'info', label: 'ℹ️ Informasi Pesantren' }
                  ]}
                  required
                />

                <CustomSelect
                  label="Target Penerima"
                  value={pushForm.target}
                  onChange={val => setPushForm(p => ({ ...p, target: val }))}
                  options={[
                    { value: 'all', label: 'Semua Ustadz (Aktif)' },
                    { value: 'mustahiq', label: 'Hanya Mustahiq (Wali Kelas)' },
                    { value: 'munawib', label: 'Hanya Munawib (Guru Mapel)' },
                    ...gurus.map(g => ({
                      value: String(g.id),
                      label: `${g.nama}${g.nip ? ` (${g.nip})` : ''}`
                    }))
                  ]}
                  required
                />
              </div>

              <div className="textarea-group">
                <label className="input-label">Isi Pesan Notifikasi</label>
                <textarea
                  className="glass-textarea"
                  rows={4}
                  placeholder="Tuliskan isi pesan notifikasi secara jelas dan padat..."
                  value={pushForm.body}
                  onChange={e => setPushForm(p => ({ ...p, body: e.target.value }))}
                  required
                  disabled={pushing}
                />
              </div>

              <div className="form-submit-row">
                <button
                  type="submit"
                  className="action-pill-btn primary-pill large-pill"
                  disabled={pushing}
                >
                  <Send size={16} />
                  <span>{pushing ? 'Mengirimkan Notifikasi...' : 'Kirim Notifikasi Realtime'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 3: SCHEDULE TRIGGER ───────────────────────────── */}
      {activeTab === 'schedule' && (
        <div className="tab-pane-container">
          <div className="schedule-card">
            <div className="card-header">
              <div className="card-icon-wrap orb-emerald">
                <CalendarClock size={22} />
              </div>
              <div>
                <h3>Pengiriman Notifikasi Jadwal Harian</h3>
                <p>Picu cron scheduler notifikasi jadwal mengajar untuk hari esok secara manual</p>
              </div>
            </div>

            <div className="schedule-info-box">
              <Sparkles size={18} className="sparkle-icon" />
              <div>
                <h4>Jadwal Otomatis Sistem (Cron Job)</h4>
                <p>
                  Sistem telah dikonfigurasi untuk secara otomatis mengirimkan notifikasi jadwal mengajar setiap hari pada pukul <strong>16:00 WIB</strong> ke smartphone seluruh asatidz yang memiliki jadwal pada keesokan harinya.
                </p>
              </div>
            </div>

            <div className="schedule-action-box">
              <p>
                Jika jadwal baru saja diubah atau Anda ingin memicu pengiriman segera di luar jam reguler, klik tombol di bawah:
              </p>
              <button
                type="button"
                className="action-pill-btn primary-pill large-pill"
                onClick={handleTriggerDailySchedule}
                disabled={scheduleTriggering}
              >
                <Bell size={16} />
                <span>{scheduleTriggering ? 'Sedang Memicu Pengiriman...' : 'Kirim Notifikasi Jadwal Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: SUGGESTIONS ─────────────────────────────────── */}
      {activeTab === 'suggestions' && (
        <div className="tab-pane-container">
          {suggestions.length === 0 ? (
            <div className="suggestions-empty-card">
              <MessageSquare size={44} />
              <h3>Belum Ada Masukan atau Saran</h3>
              <p>Saran dan pesan masukan dari aplikasi mobile Alhamid One akan muncul secara terstruktur di sini.</p>
            </div>
          ) : (
            <div className="suggestions-grid">
              {suggestions.map(sug => (
                <div key={sug.id} className="suggestion-glass-card">
                  <div className="card-top-bar">
                    <div className="sender-meta">
                      <div className="sender-avatar">
                        {(sug.nama_guru || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="sender-name">{sug.nama_guru || 'Asatidz / Santri'}</span>
                        <span className="send-time">{new Date(sug.created_at).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-delete-suggestion"
                      onClick={() => setDeleteConfirm({
                        isOpen: true,
                        suggestionId: sug.id,
                        namaGuru: sug.nama_guru || 'Asatidz'
                      })}
                      title="Hapus Saran"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="suggestion-body">
                    <p>{sug.pesan}</p>
                  </div>

                  {sug.kategori && (
                    <div className="suggestion-badge-row">
                      <span className="kategori-pill">{sug.kategori}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🔑 Set Credentials Modal */}
      {selectedGuru && (
        <CustomModal
          open={!!selectedGuru}
          onClose={() => setSelectedGuru(null)}
          title="Setel Kredensial Alhamid One"
          subtitle={`Atur akun login mobile untuk ${selectedGuru.nama}`}
          icon={<Key size={20} />}
          width={480}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              {selectedGuru.mymustahiq_username ? (
                <button
                  type="button"
                  className="action-pill-btn danger-pill"
                  onClick={handleRemoveAccess}
                  disabled={credSubmitting}
                >
                  Cabut Akses
                </button>
              ) : <div />}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="action-pill-btn secondary-pill"
                  onClick={() => setSelectedGuru(null)}
                  disabled={credSubmitting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="action-pill-btn primary-pill"
                  onClick={handleSaveCredentials}
                  disabled={credSubmitting}
                >
                  {credSubmitting ? 'Menyimpan...' : 'Simpan Kredensial'}
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {credError && <SmartAlert message={credError} type="error" />}

            <div className="guru-info-banner">
              <div className="avatar-circle">
                {(selectedGuru.nama || '?')[0].toUpperCase()}
              </div>
              <div className="info-meta">
                <span className="guru-title">{selectedGuru.nama}</span>
                <span className="guru-nip">NIP: {selectedGuru.nip || '-'}</span>
              </div>
            </div>

            <FloatingInput
              label="Username Login Mobile"
              name="credUsername"
              value={credUsername}
              onChange={e => setCredUsername(e.target.value)}
              placeholder="Cth: ustadz_rijal"
              required
              disabled={credSubmitting}
            />

            <div style={{ position: 'relative' }}>
              <FloatingInput
                label={selectedGuru.mymustahiq_username ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Pertama (Min. 6 karakter)'}
                name="credPassword"
                type={showCredPw ? 'text' : 'password'}
                value={credPassword}
                onChange={e => setCredPassword(e.target.value)}
                required={!selectedGuru.mymustahiq_username}
                disabled={credSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowCredPw(p => !p)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showCredPw ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showCredPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* ⚠️ VisionOS Destructive Dialog for Suggestion */}
      <CustomModal
        open={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, suggestionId: null, namaGuru: null })}
        title="Hapus Saran & Masukan"
        width={420}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
            <button
              type="button"
              className="action-pill-btn secondary-pill"
              onClick={() => setDeleteConfirm({ isOpen: false, suggestionId: null, namaGuru: null })}
            >
              Batal
            </button>
            <button
              type="button"
              className="action-pill-btn danger-pill"
              onClick={handleConfirmDeleteSuggestion}
            >
              Ya, Hapus
            </button>
          </div>
        }
      >
        <div className="visionos-confirm-dialog">
          <div className="dialog-icon-halo halo-rose">
            <AlertTriangle size={28} />
          </div>
          <div className="dialog-text-content">
            <h4>Hapus Masukan Ini?</h4>
            <p>
              Apakah Anda yakin ingin menghapus masukan dari <strong>{deleteConfirm.namaGuru}</strong> secara permanen?
            </p>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

export default MyMustahiqSettings;
