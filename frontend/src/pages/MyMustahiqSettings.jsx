import { useState, useEffect, useRef } from 'react';
import {
  Key, Trash2, Search, RefreshCw, Bell, CalendarClock,
  CheckCircle2, AlertCircle, X, Eye, EyeOff, Smartphone,
  MessageSquare, ChevronDown
} from 'lucide-react';
import { myMustahiqService } from '../services/myMustahiqService';
import { PageHeader, LoadingState, ErrorState } from '../components/common';
import './MyMustahiqSettings.scss';

// ── Custom Toast ──────────────────────────────────────────────────────────────
function Toast({ toasts, onDismiss }) {
  return (
    <div className="mms-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`mms-toast mms-toast--${t.type}`}>
          {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)}><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ── Credentials Modal ─────────────────────────────────────────────────────────
function CredentialsModal({ guru, onClose, onSave, onRemove, submitting }) {
  const [username, setUsername] = useState(guru?.mymustahiq_username || guru?.nip || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [confirmRemove, setConfirmRemove] = useState(false);

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = 'Username wajib diisi.';
    else if (!/^[a-zA-Z0-9_.-]+$/.test(username.trim()))
      e.username = 'Hanya huruf, angka, titik, strip, underscore.';
    const isNew = !guru?.mymustahiq_username;
    if (isNew && !password) e.password = 'Password wajib diisi untuk akses pertama.';
    if (password && password.length < 6) e.password = 'Password minimal 6 karakter.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    onSave({ username: username.trim(), password: password || undefined });
  };

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  if (!guru) return null;

  return (
    <div className="mms-overlay" onClick={handleOverlay}>
      <div className="mms-modal">
        <div className="mms-modal__header">
          <div className="mms-modal__title">
            <Key size={18} />
            <span>Setel Kredensial MyMustahiq</span>
          </div>
          <button className="mms-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="mms-modal__body">
          <div className="mms-modal__guru-info">
            <div className="mms-guru-avatar">
              {(guru.nama || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="mms-guru-name">{guru.nama}</div>
              {guru.nip && <div className="mms-guru-nip">NIP: {guru.nip}</div>}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mms-cred-form">
            {/* Username */}
            <div className={`mms-field ${errors.username ? 'has-error' : ''}`}>
              <label>Username Login</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErrors((p) => ({ ...p, username: '' })); }}
                placeholder="cth: ustadz_rijal"
                maxLength={50}
                disabled={submitting}
              />
              {errors.username && <span className="mms-field-error">{errors.username}</span>}
            </div>

            {/* Password */}
            <div className={`mms-field ${errors.password ? 'has-error' : ''}`}>
              <label>
                Password Baru
                {guru.mymustahiq_username && <span className="mms-optional"> (kosongkan jika tidak diubah)</span>}
              </label>
              <div className="mms-input-pw">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                  placeholder={guru.mymustahiq_username ? 'Kosongkan jika tidak diubah' : 'Masukkan password baru'}
                  disabled={submitting}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <span className="mms-field-error">{errors.password}</span>}
            </div>

            <div className="mms-cred-footer">
              {guru.mymustahiq_username ? (
                confirmRemove ? (
                  <div className="mms-confirm-remove">
                    <span>Yakin hapus akses?</span>
                    <button type="button" className="mms-btn mms-btn--ghost" onClick={() => setConfirmRemove(false)}>Batal</button>
                    <button type="button" className="mms-btn mms-btn--danger" onClick={onRemove} disabled={submitting}>
                      {submitting ? <span className="spinner-xs" /> : <Trash2 size={14} />}
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button type="button" className="mms-btn mms-btn--danger-ghost" onClick={() => setConfirmRemove(true)} disabled={submitting}>
                    <Trash2 size={14} />
                    Hapus Akses
                  </button>
                )
              ) : <div />}

              <div className="mms-cred-footer__right">
                <button type="button" className="mms-btn mms-btn--ghost" onClick={onClose} disabled={submitting}>Batal</button>
                <button type="submit" className="mms-btn mms-btn--primary" disabled={submitting}>
                  {submitting ? <><span className="spinner-xs" /> Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Push Notification Form ────────────────────────────────────────────────────
function PushNotifCard({ gurus, onSend, pushing }) {
  const [form, setForm] = useState({
    title: '', body: '', category: 'Pengumuman', target: 'all'
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Judul wajib diisi.';
    if (!form.body.trim()) e.body = 'Isi pesan wajib diisi.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    onSend(form);
  };

  const f = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: '' }));
  };

  return (
    <div className="mms-card mms-push-card">
      <div className="mms-card__header">
        <Bell size={20} className="mms-card__icon mms-icon-blue" />
        <div>
          <h3>Kirim Push Notifikasi Manual</h3>
          <p>Kirim notifikasi instan ke handphone ustadz terdaftar.</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="mms-push-form">
        <div className={`mms-field ${errors.title ? 'has-error' : ''}`}>
          <label>Judul Notifikasi</label>
          <input type="text" value={form.title} onChange={(e) => f('title', e.target.value)} placeholder="Masukkan judul..." maxLength={100} disabled={pushing} />
          {errors.title && <span className="mms-field-error">{errors.title}</span>}
        </div>
        <div className={`mms-field ${errors.body ? 'has-error' : ''}`}>
          <label>Isi Pesan</label>
          <textarea value={form.body} onChange={(e) => f('body', e.target.value)} placeholder="Masukkan pesan detail..." rows={4} maxLength={500} disabled={pushing} />
          {errors.body && <span className="mms-field-error">{errors.body}</span>}
        </div>
        <div className="mms-push-row">
          <div className="mms-field">
            <label>Kategori</label>
            <select value={form.category} onChange={(e) => f('category', e.target.value)} disabled={pushing}>
              <option value="Akademik">Akademik</option>
              <option value="Pengumuman">Pengumuman</option>
              <option value="Sistem">Sistem</option>
            </select>
          </div>
          <div className="mms-field">
            <label>Target Penerima</label>
            <select value={form.target} onChange={(e) => f('target', e.target.value)} disabled={pushing}>
              <option value="all">Semua Ustadz (Aktif)</option>
              <option value="mustahiq">Hanya Mustahiq (Wali Kelas)</option>
              <option value="munawib">Hanya Munawib (Guru Mapel)</option>
              {gurus.map((g) => (
                <option key={g.id} value={g.id}>{g.nama}{g.nip ? ` (${g.nip})` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="mms-btn mms-btn--primary mms-btn--block" disabled={pushing}>
          {pushing ? <><span className="spinner-xs" /> Mengirim...</> : <><Bell size={16} /> Kirim Notifikasi Realtime</>}
        </button>
      </form>
    </div>
  );
}

// ── Guru Table ────────────────────────────────────────────────────────────────
function GuruTable({ gurus, onSetAccess }) {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = gurus.filter((g) => {
    const q = searchText.toLowerCase();
    const matchSearch =
      (g.nama && g.nama.toLowerCase().includes(q)) ||
      (g.nip && g.nip.toLowerCase().includes(q)) ||
      (g.mymustahiq_username && g.mymustahiq_username.toLowerCase().includes(q));
    const isActive = !!g.mymustahiq_username;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);
    return matchSearch && matchStatus;
  });

  return (
    <div className="mms-guru-table-wrapper">
      {/* Filters */}
      <div className="mms-table-filters">
        <div className="mms-search">
          <Search size={15} />
          <input
            type="text"
            placeholder="Cari nama, NIP, atau username..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button onClick={() => setSearchText('')}><X size={13} /></button>
          )}
        </div>
        <div className="mms-filter-status">
          <label>Akses Mobile:</label>
          <div className="mms-seg-filter">
            {['all', 'active', 'inactive'].map((s) => (
              <button
                key={s}
                className={statusFilter === s ? 'active' : ''}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'Semua' : s === 'active' ? 'Aktif' : 'Nonaktif'}
              </button>
            ))}
          </div>
        </div>
        <span className="mms-count">{filtered.length} guru</span>
      </div>

      {/* Table */}
      <div className="mms-table-scroll">
        <table className="mms-table">
          <thead>
            <tr>
              <th>Nama Guru / Ustadz</th>
              <th>NIP</th>
              <th>No. HP</th>
              <th>Status Guru</th>
              <th>Username MyMustahiq</th>
              <th>Akses Mobile</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="mms-empty-row">Tidak ada data guru</td>
              </tr>
            ) : (
              filtered.map((guru) => {
                const hasAccess = !!guru.mymustahiq_username;
                const isAktif = guru.status && guru.status.toLowerCase() === 'aktif';
                return (
                  <tr key={guru.id}>
                    <td className="mms-guru-cell">
                      <div className="mms-guru-mini-avatar">
                        {(guru.nama || '?')[0].toUpperCase()}
                      </div>
                      <span className="mms-guru-name-text">{guru.nama}</span>
                    </td>
                    <td className="mms-cell-muted">{guru.nip || '-'}</td>
                    <td className="mms-cell-muted">{guru.no_hp || '-'}</td>
                    <td>
                      <span className={`mms-status-pill ${isAktif ? 'pill-green' : 'pill-red'}`}>
                        {guru.status || 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      {guru.mymustahiq_username ? (
                        <span className="mms-username-tag">{guru.mymustahiq_username}</span>
                      ) : (
                        <span className="mms-cell-italic">Belum Diatur</span>
                      )}
                    </td>
                    <td>
                      <span className={`mms-access-badge ${hasAccess ? 'badge-active' : 'badge-inactive'}`}>
                        <span className="badge-dot" />
                        {hasAccess ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="mms-btn mms-btn--key"
                        onClick={() => onSetAccess(guru)}
                      >
                        <Key size={14} />
                        Setel Akses
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Suggestions Table ─────────────────────────────────────────────────────────
function SuggestionsTable({ suggestions, onDelete, onRefresh }) {
  const formatDate = (text) => {
    if (!text) return '-';
    return new Date(text).toLocaleString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) + ' WIB';
  };

  return (
    <div className="mms-card mms-sug-card">
      <div className="mms-card__header">
        <MessageSquare size={20} className="mms-card__icon mms-icon-purple" />
        <div>
          <h3>Saran & Masukan Pengguna</h3>
          <p>{suggestions.length} saran diterima dari aplikasi MyMustahiq</p>
        </div>
        <button className="mms-btn mms-btn--ghost mms-btn--icon" onClick={onRefresh} title="Muat ulang">
          <RefreshCw size={15} />
        </button>
      </div>
      {suggestions.length === 0 ? (
        <div className="mms-sug-empty">
          <MessageSquare size={40} />
          <p>Belum ada saran atau masukan yang diterima.</p>
        </div>
      ) : (
        <div className="mms-sug-list">
          {suggestions.map((s) => (
            <div key={s.id} className="mms-sug-item">
              <div className="mms-sug-meta">
                <div className="mms-sug-sender">
                  <div className="mms-mini-avatar">{(s.guru_nama || '?')[0].toUpperCase()}</div>
                  <div>
                    <strong>{s.guru_nama}</strong>
                    {s.guru_nip && <div className="mms-cell-muted">NIP: {s.guru_nip}</div>}
                  </div>
                </div>
                <div className="mms-sug-right">
                  {s.kelas_nama ? (
                    <span className="mms-status-pill pill-cyan">Kelas {s.kelas_nama}</span>
                  ) : (
                    <span className="mms-status-pill pill-orange">Bukan Wali Kelas</span>
                  )}
                  <span className="mms-sug-date">{formatDate(s.created_at)}</span>
                </div>
              </div>
              <div className="mms-sug-body">{s.isi_saran}</div>
              <button className="mms-btn mms-btn--danger-ghost mms-btn--sm" onClick={() => onDelete(s.id)}>
                <Trash2 size={13} />
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const TABS = [
  { key: 'accounts', label: 'Manajemen Akun Guru', icon: Smartphone },
  { key: 'push', label: 'Kirim Notifikasi', icon: Bell },
  { key: 'schedule', label: 'Jadwal Harian', icon: CalendarClock },
  { key: 'suggestions', label: 'Saran & Masukan', icon: MessageSquare },
];

export function MyMustahiqSettings() {
  const [activeTab, setActiveTab] = useState('accounts');
  const [gurus, setGurus] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);

  // Modal
  const [selectedGuru, setSelectedGuru] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Push notification
  const [pushing, setPushing] = useState(false);
  const [scheduleTriggering, setScheduleTriggering] = useState(false);

  const toastCounter = useRef(0);

  const addToast = (message, type = 'success') => {
    const id = ++toastCounter.current;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const dismissToast = (id) => setToasts((p) => p.filter((t) => t.id !== id));

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [guruData, sugData] = await Promise.all([
        myMustahiqService.fetchGurus(),
        myMustahiqService.fetchSuggestions().catch((e) => {
          console.error('Failed to load suggestions:', e);
          return { suggestions: [] };
        })
      ]);
      setGurus(guruData.gurus || []);
      setSuggestions(sugData.suggestions || []);
    } catch (err) {
      console.error('Failed to load MyMustahiq settings:', err);
      setError('Gagal memuat data. Pastikan Anda masuk sebagai Administrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async ({ username, password }) => {
    if (!selectedGuru) return;
    setSubmitting(true);
    try {
      const response = await myMustahiqService.updateCredentials(selectedGuru.id, username, password || null);
      addToast(response.message || 'Kredensial berhasil diperbarui!');
      setGurus((prev) =>
        prev.map((g) => g.id === selectedGuru.id ? { ...g, mymustahiq_username: username } : g)
      );
      setSelectedGuru(null);
    } catch (err) {
      addToast(err.message || 'Gagal memperbarui kredensial.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveAccess = async () => {
    if (!selectedGuru) return;
    setSubmitting(true);
    try {
      const response = await myMustahiqService.updateCredentials(selectedGuru.id, null, null);
      addToast(response.message || 'Akses MyMustahiq berhasil dinonaktifkan.');
      setGurus((prev) =>
        prev.map((g) => g.id === selectedGuru.id ? { ...g, mymustahiq_username: null } : g)
      );
      setSelectedGuru(null);
    } catch (err) {
      addToast(err.message || 'Gagal menonaktifkan akses.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSuggestion = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus saran/masukan ini secara permanen?')) return;
    try {
      const res = await myMustahiqService.deleteSuggestion(id);
      addToast(res.message || 'Saran berhasil dihapus!');
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      addToast(err.message || 'Gagal menghapus saran.', 'error');
    }
  };

  const handleSendPush = async (values) => {
    setPushing(true);
    try {
      const { title, body, category, target } = values;
      const res = await myMustahiqService.sendPushNotification(title, body, category, target);
      addToast(res.message || 'Notifikasi berhasil dikirim!');
    } catch (err) {
      addToast(err.message || 'Gagal mengirimkan notifikasi.', 'error');
    } finally {
      setPushing(false);
    }
  };

  const handleTriggerDailySchedule = async () => {
    setScheduleTriggering(true);
    try {
      const res = await myMustahiqService.triggerDailySchedulePush();
      addToast(res.message || 'Notifikasi jadwal harian berhasil dikirim!');
    } catch (err) {
      addToast(err.message || 'Gagal memicu pengiriman notifikasi jadwal.', 'error');
    } finally {
      setScheduleTriggering(false);
    }
  };

  if (loading) return <LoadingState message="Memuat data kredensial guru..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="mms-page">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <PageHeader
        title="Setelan & Utilitas MyMustahiq"
        subtitle="Kelola akun login ustadz dan kirim notifikasi manual ke aplikasi mobile"
      />

      {/* Tabs */}
      <div className="mms-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={`mms-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mms-tab-content">
        {activeTab === 'accounts' && (
          <GuruTable gurus={gurus} onSetAccess={setSelectedGuru} />
        )}

        {activeTab === 'push' && (
          <div className="mms-push-wrapper">
            <PushNotifCard gurus={gurus} onSend={handleSendPush} pushing={pushing} />
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="mms-schedule-wrapper">
            <div className="mms-card mms-sched-card">
              <div className="mms-card__header">
                <CalendarClock size={20} className="mms-card__icon mms-icon-green" />
                <div>
                  <h3>Kirim Notifikasi Jadwal Pelajaran Harian</h3>
                  <p>
                    Gunakan tombol ini untuk memicu pengiriman notifikasi jadwal pelajaran malam ini
                    secara instan ke handphone ustadz terkait.
                    <br />
                    <strong>Catatan:</strong> Notifikasi otomatis terkirim setiap jam 16:00 WIB.
                  </p>
                </div>
              </div>
              <div className="mms-sched-body">
                <div className="mms-sched-info">
                  <CalendarClock size={40} className="mms-sched-icon" />
                  <div>
                    <h4>Jadwal Malam Ini</h4>
                    <p>Sistem akan mengambil data jadwal mengajar hari ini dan mengirimkan push notification ke seluruh ustadz yang memiliki jadwal mengajar malam ini.</p>
                  </div>
                </div>
                <button
                  className="mms-btn mms-btn--success mms-btn--block"
                  onClick={handleTriggerDailySchedule}
                  disabled={scheduleTriggering}
                >
                  {scheduleTriggering ? (
                    <><span className="spinner-xs" /> Mengirim...</>
                  ) : (
                    <><CalendarClock size={16} /> Kirim Jadwal Malam Ini ke Seluruh Ustadz</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <SuggestionsTable
            suggestions={suggestions}
            onDelete={handleDeleteSuggestion}
            onRefresh={loadData}
          />
        )}
      </div>

      {/* Credentials Modal */}
      {selectedGuru && (
        <CredentialsModal
          guru={selectedGuru}
          onClose={() => setSelectedGuru(null)}
          onSave={handleSaveCredentials}
          onRemove={handleRemoveAccess}
          submitting={submitting}
        />
      )}
    </div>
  );
}
