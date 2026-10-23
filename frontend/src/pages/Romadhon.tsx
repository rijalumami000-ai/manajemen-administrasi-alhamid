import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Moon,
  Users2,
  BookOpenCheck,
  Clock,
  User,
  MapPin,
  Sparkles,
  Calendar
} from 'lucide-react';
import { romadhonService } from '../services/romadhonService';
import { nilaiService } from '../services/nilaiService';
import { guruService } from '../services/guruService';
import { santriService } from '../services/santriService';
import { CustomModal } from '../components/ui/CustomModal';
import { FloatingInput } from '../components/ui/FloatingInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { LoadingState, useToast } from '../components/common';
import {
  KajianBalaghItem,
  ImamTarawihItem,
  KajianFormState,
  TarawihFormState,
  TahunAjaranRomadhon
} from '../types/romadhon';
import './Romadhon.scss';

export function Romadhon() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'kajian' | 'tarawih'>('kajian');
  const [loading, setLoading] = useState<boolean>(true);
  const [tahunAjaranList, setTahunAjaranList] = useState<TahunAjaranRomadhon[]>([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<number | null>(null);

  // Guru and Santri lists
  const [guruList, setGuruList] = useState<any[]>([]);
  const [santriList, setSantriList] = useState<any[]>([]);

  // Source selections for Tarawih
  const [imamSource, setImamSource] = useState<'guru' | 'santri'>('guru');
  const [bilalSource, setBilalSource] = useState<'guru' | 'santri'>('santri');

  // Confirmation modal state for deletion
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'kajian' | 'tarawih';
    id: number;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Kajian Balagh state
  const [kajianList, setKajianList] = useState<KajianBalaghItem[]>([]);
  const [kajianModalOpen, setKajianModalOpen] = useState<boolean>(false);
  const [editingKajian, setEditingKajian] = useState<KajianBalaghItem | null>(null);
  const [kajianForm, setKajianForm] = useState<KajianFormState>({ kelas: '', waktu: '', qori: '', kitab: '', tempat: '' });

  // Imam Tarawih state
  const [tarawihList, setTarawihList] = useState<ImamTarawihItem[]>([]);
  const [tarawihModalOpen, setTarawihModalOpen] = useState<boolean>(false);
  const [editingTarawih, setEditingTarawih] = useState<ImamTarawihItem | null>(null);
  const [tarawihForm, setTarawihForm] = useState<TarawihFormState>({ malam: '', imam: '', bilal: '', tempat: '' });

  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    loadTahunAjaran();
    loadMasterGuru();
  }, []);

  useEffect(() => {
    if (selectedTahunAjaran) {
      loadData();
      loadSantriByTahun(selectedTahunAjaran);
    }
  }, [selectedTahunAjaran]);

  const loadMasterGuru = async () => {
    try {
      const data = await guruService.fetchGuru();
      setGuruList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal memuat guru:', err);
    }
  };

  const loadSantriByTahun = async (taId: number) => {
    try {
      const data = await santriService.fetchSantri(taId);
      setSantriList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal memuat santri:', err);
    }
  };

  const guruOptions = useMemo(() => {
    return guruList.map((g: any) => ({
      value: g.nama,
      label: g.nama
    }));
  }, [guruList]);

  const santriOptions = useMemo(() => {
    return santriList.map((s: any) => ({
      value: s.nama,
      label: `${s.nama}${s.nis ? ` (NIS: ${s.nis})` : ''}`
    }));
  }, [santriList]);

  const selectedYearObj = tahunAjaranList.find(t => t.id === selectedTahunAjaran);
  const selectedYearKode = selectedYearObj ? selectedYearObj.kode : '';

  const tahunOptions = tahunAjaranList.map(t => ({
    value: String(t.id),
    label: `${t.kode}${t.is_active ? ' (Aktif)' : ''}`
  }));

  const loadTahunAjaran = async () => {
    try {
      const data = await (nilaiService as any).fetchTahunAjaran();
      setTahunAjaranList(data || []);
      const active = data.find((t: any) => t.is_active);
      if (active) setSelectedTahunAjaran(active.id);
      else if (data.length) setSelectedTahunAjaran(data[0].id);
    } catch (err: any) {
      toast.error('Gagal memuat tahun ajaran: ' + err.message);
    }
  };

  const loadData = async () => {
    if (!selectedTahunAjaran) return;
    setLoading(true);
    try {
      const [kajian, tarawih] = await Promise.all([
        (romadhonService as any).fetchKajianBalagh(selectedTahunAjaran),
        (romadhonService as any).fetchImamTarawih(selectedTahunAjaran),
      ]);
      setKajianList(Array.isArray(kajian) ? kajian : []);
      // Urutkan tarawih berdasarkan nomor malam (numerik)
      const sortedTarawih = Array.isArray(tarawih)
        ? [...tarawih].sort((a, b) => Number(a.malam) - Number(b.malam))
        : [];
      setTarawihList(sortedTarawih);
    } catch (err: any) {
      toast.error('Gagal memuat data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ═══ KAJIAN BALAGH HANDLERS ═══
  const openAddKajian = () => {
    setEditingKajian(null);
    setKajianForm({ kelas: '', waktu: '', qori: '', kitab: '', tempat: '' });
    setKajianModalOpen(true);
  };

  const openEditKajian = (item: KajianBalaghItem) => {
    setEditingKajian(item);
    setKajianForm({
      kelas: item.kelas,
      waktu: item.waktu,
      qori: item.qori,
      kitab: item.kitab,
      tempat: item.tempat || ''
    });
    setKajianModalOpen(true);
  };

  const saveKajian = async () => {
    if (!kajianForm.kelas || !kajianForm.waktu || !kajianForm.qori || !kajianForm.kitab) {
      toast.error('Kelas, waktu, qori, dan kitab wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      if (editingKajian) {
        await (romadhonService as any).updateKajianBalagh(editingKajian.id, kajianForm);
        toast.success('Data kajian berhasil diperbarui.');
      } else {
        await (romadhonService as any).createKajianBalagh({ ...kajianForm, tahun_ajaran_id: selectedTahunAjaran });
        toast.success('Data kajian berhasil ditambahkan.');
      }
      setKajianModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      if (deleteTarget.type === 'kajian') {
        await (romadhonService as any).deleteKajianBalagh(deleteTarget.id);
        toast.success('Jadwal kajian berhasil dihapus.');
      } else {
        await (romadhonService as any).deleteImamTarawih(deleteTarget.id);
        toast.success('Jadwal imam tarawih berhasil dihapus.');
      }
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data');
    } finally {
      setIsDeleting(false);
    }
  };

  // Group kajian by kelas
  const groupedKajian = kajianList.reduce<Record<string, KajianBalaghItem[]>>((acc, item) => {
    if (!acc[item.kelas]) acc[item.kelas] = [];
    acc[item.kelas].push(item);
    return acc;
  }, {});

  if (loading && !kajianList.length && !tarawihList.length) {
    return <LoadingState message="Memuat agenda Romadhon..." />;
  }

  return (
    <div className="romadhon-page">
      {/* TACTILE PAGE HEADER */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Jadwal Kegiatan Romadhon</h2>
          <p className="page-subtitle">Kelola jadwal kajian kilatan balagh dan petugas imam tarawih & bilal</p>
        </div>

        <div className="header-actions">
          <CustomSelect
            options={tahunOptions}
            value={selectedTahunAjaran ? String(selectedTahunAjaran) : ''}
            onChange={(val) => setSelectedTahunAjaran(Number(val))}
            placeholder="Pilih Tahun Ajaran"
            style={{ minWidth: 220 }}
          />
        </div>
      </header>

      {/* SEGMENTED TABS DOCK */}
      <div className="segmented-tabs-dock">
        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === 'kajian' ? 'active' : ''}`}
          onClick={() => setActiveTab('kajian')}
        >
          <BookOpenCheck size={16} />
          <span>Kajian Balagh Romadhon</span>
          <span className="tab-pill-badge">{kajianList.length}</span>
        </button>

        <button
          type="button"
          className={`segmented-tab-btn ${activeTab === 'tarawih' ? 'active' : ''}`}
          onClick={() => setActiveTab('tarawih')}
        >
          <Calendar size={16} />
          <span>Kalender 30 Malam Tarawih</span>
          <span className="tab-pill-badge purple">{tarawihList.length}</span>
        </button>
      </div>

      {/* TAB 1: KAJIAN BALAGH (BENTO SESSION CARDS) */}
      {activeTab === 'kajian' && (
        <div className="romadhon-tab-content">
          <div className="romadhon-toolbar">
            <span className="toolbar-info">
              Tahun Ajaran: <strong>{selectedYearKode || '-'}</strong> • Terdata <strong>{kajianList.length}</strong> sesi kajian
            </span>
            <button type="button" className="action-pill-btn primary-pill" onClick={openAddKajian}>
              <Plus size={16} />
              <span>Tambah Jadwal Kajian</span>
            </button>
          </div>

          {Object.keys(groupedKajian).length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon-orb">
                <Moon size={32} />
              </div>
              <p>Belum ada jadwal kajian balagh untuk tahun ajaran {selectedYearKode || '-'}.</p>
            </div>
          )}

          {Object.entries(groupedKajian).map(([kelas, items]) => (
            <div key={kelas} className="kelas-section">
              <div className="kelas-section-header">
                <div className="kelas-title-wrap">
                  <span className="kelas-title">Kelas {kelas}</span>
                  <span className="kelas-count-pill">{items.length} Sesi Kajian</span>
                </div>
              </div>

              <div className="bento-session-grid">
                {items.map(item => (
                  <div key={item.id} className="session-card">
                    <div className="session-card-top">
                      <span className="time-chip">
                        <Clock size={13} />
                        {item.waktu}
                      </span>
                      <div className="action-btns">
                        <button
                          type="button"
                          className="btn-icon btn-edit"
                          onClick={() => openEditKajian(item)}
                          title="Edit Jadwal"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-delete"
                          onClick={() => setDeleteTarget({
                            type: 'kajian',
                            id: item.id,
                            title: `Kajian Kelas ${item.kelas} (${item.kitab})`
                          })}
                          title="Hapus Jadwal"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="session-kitab-group">
                      <span className="kitab-sub">Kitab Pengajian</span>
                      <h4 className="kitab-title">{item.kitab}</h4>
                    </div>

                    <div className="session-meta-group">
                      <div className="meta-item qori">
                        <User size={14} />
                        <span>{item.qori}</span>
                      </div>
                      <div className="meta-item location">
                        <MapPin size={14} />
                        <span>{item.tempat || 'Lokasi belum ditentukan'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: IMAM TARAWIH & BILAL (RAMADAN 30-NIGHT CALENDAR GRID) */}
      {activeTab === 'tarawih' && (
        <div className="romadhon-tab-content">
          <div className="romadhon-toolbar">
            <span className="toolbar-info">
              Tahun Ajaran: <strong>{selectedYearKode || '-'}</strong> • Terdata <strong>{tarawihList.length}</strong> malam
            </span>
            <button type="button" className="action-pill-btn primary-pill" onClick={openAddTarawih}>
              <Plus size={16} />
              <span>Tambah Jadwal Imam</span>
            </button>
          </div>

          {tarawihList.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon-orb">
                <Moon size={32} />
              </div>
              <p>Belum ada jadwal imam tarawih untuk tahun ajaran {selectedYearKode || '-'}.</p>
            </div>
          )}

          {tarawihList.length > 0 && (
            <div className="tarawih-calendar-grid">
              {tarawihList.map(item => (
                <div key={item.id} className="malam-card">
                  <div className="malam-card-header">
                    <span className="malam-badge">
                      <Sparkles size={13} />
                      Malam {item.malam}
                    </span>
                    <div className="action-btns">
                      <button
                        type="button"
                        className="btn-icon btn-edit"
                        onClick={() => openEditTarawih(item)}
                        title="Edit Petugas"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-delete"
                        onClick={() => setDeleteTarget({
                          type: 'tarawih',
                          id: item.id,
                          title: `Malam ke-${item.malam} (Imam: ${item.imam})`
                        })}
                        title="Hapus Petugas"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="petugas-group">
                    <div className="petugas-item imam">
                      <User size={15} />
                      <div className="petugas-info">
                        <span className="role-label">Imam Sholat</span>
                        <span className="name-value">{item.imam}</span>
                      </div>
                    </div>

                    <div className="petugas-item bilal">
                      <Users2 size={15} />
                      <div className="petugas-info">
                        <span className="role-label">Bilal / Muroqqi</span>
                        <span className="name-value">{item.bilal || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="malam-location">
                    <MapPin size={13} />
                    <span>{item.tempat || 'Masjid Jami\' Al-Hamid'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Kajian Balagh */}
      <CustomModal
        isOpen={kajianModalOpen}
        onClose={() => setKajianModalOpen(false)}
        title={editingKajian ? 'Edit Jadwal Kajian Balagh' : 'Tambah Jadwal Kajian Balagh'}
        onOk={saveKajian}
        okText={saving ? 'Menyimpan...' : 'Simpan'}
        okLoading={saving}
        width={500}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FloatingInput label="Kelas *" value={kajianForm.kelas} onChange={e => setKajianForm(p => ({ ...p, kelas: e.target.value }))} placeholder="Contoh: Sifir, 1 & Sp Putra, 2 Putri" />
          <FloatingInput label="Waktu *" value={kajianForm.waktu} onChange={e => setKajianForm(p => ({ ...p, waktu: e.target.value }))} placeholder="Contoh: 14:00 – 14:45" />

          {/* Qori' / Pengampu: Pilih dari Guru */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
              Qori' / Pengampu (Pilih dari Guru) *
            </label>
            <CustomSelect
              options={guruOptions}
              value={guruOptions.some(o => o.value === kajianForm.qori) ? kajianForm.qori : ''}
              onChange={(val) => setKajianForm(p => ({ ...p, qori: val || '' }))}
              placeholder="Pilih Guru Pengampu..."
            />
            <FloatingInput
              label="Nama Qori' / Pengampu *"
              value={kajianForm.qori}
              onChange={e => setKajianForm(p => ({ ...p, qori: e.target.value }))}
              placeholder="Atau sesuaikan nama pengampu..."
            />
          </div>

          <FloatingInput label="Kitab *" value={kajianForm.kitab} onChange={e => setKajianForm(p => ({ ...p, kitab: e.target.value }))} placeholder="Contoh: Safinatus Sholah" />
          <FloatingInput label="Tempat" value={kajianForm.tempat} onChange={e => setKajianForm(p => ({ ...p, tempat: e.target.value }))} placeholder="Contoh: 22 KELAS 5A" />
        </div>
      </CustomModal>

      {/* Modal Imam Tarawih */}
      <CustomModal
        isOpen={tarawihModalOpen}
        onClose={() => setTarawihModalOpen(false)}
        title={editingTarawih ? 'Edit Jadwal Imam Tarawih' : 'Tambah Jadwal Imam Tarawih'}
        onOk={saveTarawih}
        okText={saving ? 'Menyimpan...' : 'Simpan'}
        okLoading={saving}
        width={520}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FloatingInput label="Malam ke- *" type="number" value={String(tarawihForm.malam)} onChange={e => setTarawihForm(p => ({ ...p, malam: e.target.value }))} placeholder="1-30" />

          {/* Imam Selection: Guru vs Santri */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                Imam Sholat *
              </label>
              <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.06)', borderRadius: '8px', padding: '2px' }}>
                <button
                  type="button"
                  onClick={() => setImamSource('guru')}
                  style={{
                    border: 'none',
                    background: imamSource === 'guru' ? '#2563eb' : 'transparent',
                    color: imamSource === 'guru' ? '#fff' : '#64748b',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Dari Guru
                </button>
                <button
                  type="button"
                  onClick={() => setImamSource('santri')}
                  style={{
                    border: 'none',
                    background: imamSource === 'santri' ? '#2563eb' : 'transparent',
                    color: imamSource === 'santri' ? '#fff' : '#64748b',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Dari Santri
                </button>
              </div>
            </div>

            <CustomSelect
              options={imamSource === 'guru' ? guruOptions : santriOptions}
              value={(imamSource === 'guru' ? guruOptions : santriOptions).some(o => o.value === tarawihForm.imam) ? tarawihForm.imam : ''}
              onChange={(val) => setTarawihForm(p => ({ ...p, imam: val || '' }))}
              placeholder={imamSource === 'guru' ? 'Pilih Guru sebagai Imam...' : 'Pilih Santri sebagai Imam...'}
            />
            <FloatingInput
              label="Nama Imam *"
              value={tarawihForm.imam}
              onChange={e => setTarawihForm(p => ({ ...p, imam: e.target.value }))}
              placeholder="Atau sesuaikan nama imam..."
            />
          </div>

          {/* Bilal Selection: Guru vs Santri */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                Bilal / Muroqqi
              </label>
              <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.06)', borderRadius: '8px', padding: '2px' }}>
                <button
                  type="button"
                  onClick={() => setBilalSource('guru')}
                  style={{
                    border: 'none',
                    background: bilalSource === 'guru' ? '#2563eb' : 'transparent',
                    color: bilalSource === 'guru' ? '#fff' : '#64748b',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Dari Guru
                </button>
                <button
                  type="button"
                  onClick={() => setBilalSource('santri')}
                  style={{
                    border: 'none',
                    background: bilalSource === 'santri' ? '#2563eb' : 'transparent',
                    color: bilalSource === 'santri' ? '#fff' : '#64748b',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Dari Santri
                </button>
              </div>
            </div>

            <CustomSelect
              options={bilalSource === 'guru' ? guruOptions : santriOptions}
              value={(bilalSource === 'guru' ? guruOptions : santriOptions).some(o => o.value === tarawihForm.bilal) ? tarawihForm.bilal : ''}
              onChange={(val) => setTarawihForm(p => ({ ...p, bilal: val || '' }))}
              placeholder={bilalSource === 'guru' ? 'Pilih Guru sebagai Bilal...' : 'Pilih Santri sebagai Bilal...'}
            />
            <FloatingInput
              label="Nama Bilal / Muroqqi"
              value={tarawihForm.bilal}
              onChange={e => setTarawihForm(p => ({ ...p, bilal: e.target.value }))}
              placeholder="Atau sesuaikan nama bilal..."
            />
          </div>

          <FloatingInput label="Tempat" value={tarawihForm.tempat} onChange={e => setTarawihForm(p => ({ ...p, tempat: e.target.value }))} placeholder="Contoh: Masjid Jami' Al-Hamid" />
        </div>
      </CustomModal>

      {/* Confirmation Modal Hapus Romadhon */}
      <CustomModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget?.type === 'kajian' ? 'Hapus Jadwal Kajian?' : 'Hapus Petugas Tarawih?'}
        subtitle={`Jadwal ${deleteTarget?.title || ''} akan dihapus permanen`}
        width={440}
      >
        <div style={{ padding: '8px 0', fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>
          Apakah Anda yakin ingin menghapus jadwal <strong>{deleteTarget?.title}</strong>? Tindakan ini tidak dapat dibatalkan.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            type="button"
            className="action-pill-btn secondary-pill"
            onClick={() => setDeleteTarget(null)}
            disabled={isDeleting}
          >
            Batal
          </button>
          <button
            type="button"
            className="action-pill-btn danger-pill"
            onClick={confirmDelete}
            disabled={isDeleting}
          >
            <Trash2 size={14} />
            <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
          </button>
        </div>
      </CustomModal>
    </div>
  );
}

export default Romadhon;
