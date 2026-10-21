import React, { useState, useEffect } from 'react';
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
  }, []);

  useEffect(() => {
    if (selectedTahunAjaran) {
      loadData();
    }
  }, [selectedTahunAjaran]);

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

  const deleteKajian = async (id: number) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      await (romadhonService as any).deleteKajianBalagh(id);
      toast.success('Data berhasil dihapus.');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ═══ IMAM TARAWIH HANDLERS ═══
  const openAddTarawih = () => {
    setEditingTarawih(null);
    setTarawihForm({ malam: '', imam: '', bilal: '', tempat: '' });
    setTarawihModalOpen(true);
  };

  const openEditTarawih = (item: ImamTarawihItem) => {
    setEditingTarawih(item);
    setTarawihForm({
      malam: item.malam,
      imam: item.imam,
      bilal: item.bilal || '',
      tempat: item.tempat || ''
    });
    setTarawihModalOpen(true);
  };

  const saveTarawih = async () => {
    if (!tarawihForm.malam || !tarawihForm.imam) {
      toast.error('Malam ke- dan imam wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      if (editingTarawih) {
        await (romadhonService as any).updateImamTarawih(editingTarawih.id, tarawihForm);
        toast.success('Data imam tarawih berhasil diperbarui.');
      } else {
        await (romadhonService as any).createImamTarawih({ ...tarawihForm, tahun_ajaran_id: selectedTahunAjaran });
        toast.success('Data imam tarawih berhasil ditambahkan.');
      }
      setTarawihModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTarawih = async (id: number) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      await (romadhonService as any).deleteImamTarawih(id);
      toast.success('Data berhasil dihapus.');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
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
                          onClick={() => deleteKajian(item.id)}
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
                        onClick={() => deleteTarawih(item.id)}
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
      >
        <FloatingInput label="Kelas *" value={kajianForm.kelas} onChange={e => setKajianForm(p => ({ ...p, kelas: e.target.value }))} placeholder="Contoh: Sifir, 1 & Sp Putra, 2 Putri" />
        <FloatingInput label="Waktu *" value={kajianForm.waktu} onChange={e => setKajianForm(p => ({ ...p, waktu: e.target.value }))} placeholder="Contoh: 14:00 – 14:45" />
        <FloatingInput label="Qori' / Pengampu *" value={kajianForm.qori} onChange={e => setKajianForm(p => ({ ...p, qori: e.target.value }))} placeholder="Contoh: Ustz. Zayyina Bizuhrotinnima" />
        <FloatingInput label="Kitab *" value={kajianForm.kitab} onChange={e => setKajianForm(p => ({ ...p, kitab: e.target.value }))} placeholder="Contoh: Safinatus Sholah" />
        <FloatingInput label="Tempat" value={kajianForm.tempat} onChange={e => setKajianForm(p => ({ ...p, tempat: e.target.value }))} placeholder="Contoh: 22 KELAS 5A" />
      </CustomModal>

      {/* Modal Imam Tarawih */}
      <CustomModal
        isOpen={tarawihModalOpen}
        onClose={() => setTarawihModalOpen(false)}
        title={editingTarawih ? 'Edit Jadwal Imam Tarawih' : 'Tambah Jadwal Imam Tarawih'}
        onOk={saveTarawih}
        okText={saving ? 'Menyimpan...' : 'Simpan'}
        okLoading={saving}
      >
        <FloatingInput label="Malam ke- *" type="number" value={String(tarawihForm.malam)} onChange={e => setTarawihForm(p => ({ ...p, malam: e.target.value }))} placeholder="1-30" />
        <FloatingInput label="Imam *" value={tarawihForm.imam} onChange={e => setTarawihForm(p => ({ ...p, imam: e.target.value }))} placeholder="Contoh: K.H. Musthofa Bisri" />
        <FloatingInput label="Bilal / Muroqqi" value={tarawihForm.bilal} onChange={e => setTarawihForm(p => ({ ...p, bilal: e.target.value }))} placeholder="Contoh: Ust. Rifqi Maulana" />
        <FloatingInput label="Tempat" value={tarawihForm.tempat} onChange={e => setTarawihForm(p => ({ ...p, tempat: e.target.value }))} placeholder="Contoh: Masjid Jami' Al-Hamid" />
      </CustomModal>
    </div>
  );
}

export default Romadhon;
