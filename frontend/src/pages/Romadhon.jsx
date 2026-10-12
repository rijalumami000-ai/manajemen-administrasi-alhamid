import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Moon, Users2, BookOpenCheck } from 'lucide-react';
import { romadhonService } from '../services/romadhonService';
import { nilaiService } from '../services/nilaiService';
import { CustomModal } from '../components/ui/CustomModal';
import { FloatingInput } from '../components/ui/FloatingInput';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomTabs } from '../components/ui/CustomTabs';
import { PageHeader, LoadingState, ErrorState, useToast } from '../components/common';
import './Romadhon.scss';

export function Romadhon() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('kajian');
  const [loading, setLoading] = useState(true);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState(null);

  // Kajian Balagh state
  const [kajianList, setKajianList] = useState([]);
  const [kajianModalOpen, setKajianModalOpen] = useState(false);
  const [editingKajian, setEditingKajian] = useState(null);
  const [kajianForm, setKajianForm] = useState({ kelas: '', waktu: '', qori: '', kitab: '', tempat: '' });

  // Imam Tarawih state
  const [tarawihList, setTarawihList] = useState([]);
  const [tarawihModalOpen, setTarawihModalOpen] = useState(false);
  const [editingTarawih, setEditingTarawih] = useState(null);
  const [tarawihForm, setTarawihForm] = useState({ malam: '', imam: '', bilal: '', tempat: '' });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTahunAjaran();
  }, []);

  useEffect(() => {
    if (selectedTahunAjaran) {
      loadData();
    }
  }, [selectedTahunAjaran]);

  const loadTahunAjaran = async () => {
    try {
      const data = await nilaiService.fetchTahunAjaran();
      setTahunAjaranList(data);
      const active = data.find(t => t.is_active);
      if (active) setSelectedTahunAjaran(active.id);
      else if (data.length) setSelectedTahunAjaran(data[0].id);
    } catch (err) {
      toast.error('Gagal memuat tahun ajaran: ' + err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [kajian, tarawih] = await Promise.all([
        romadhonService.fetchKajianBalagh(selectedTahunAjaran),
        romadhonService.fetchImamTarawih(selectedTahunAjaran),
      ]);
      setKajianList(kajian);
      setTarawihList(tarawih);
    } catch (err) {
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

  const openEditKajian = (item) => {
    setEditingKajian(item);
    setKajianForm({ kelas: item.kelas, waktu: item.waktu, qori: item.qori, kitab: item.kitab, tempat: item.tempat || '' });
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
        await romadhonService.updateKajianBalagh(editingKajian.id, kajianForm);
        toast.success('Data berhasil diperbarui.');
      } else {
        await romadhonService.createKajianBalagh({ ...kajianForm, tahun_ajaran_id: selectedTahunAjaran });
        toast.success('Data berhasil ditambahkan.');
      }
      setKajianModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteKajian = async (id) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      await romadhonService.deleteKajianBalagh(id);
      toast.success('Data berhasil dihapus.');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ═══ IMAM TARAWIH HANDLERS ═══
  const openAddTarawih = () => {
    setEditingTarawih(null);
    setTarawihForm({ malam: '', imam: '', bilal: '', tempat: '' });
    setTarawihModalOpen(true);
  };

  const openEditTarawih = (item) => {
    setEditingTarawih(item);
    setTarawihForm({ malam: item.malam, imam: item.imam, bilal: item.bilal || '', tempat: item.tempat || '' });
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
        await romadhonService.updateImamTarawih(editingTarawih.id, tarawihForm);
        toast.success('Data berhasil diperbarui.');
      } else {
        await romadhonService.createImamTarawih({ ...tarawihForm, tahun_ajaran_id: selectedTahunAjaran });
        toast.success('Data berhasil ditambahkan.');
      }
      setTarawihModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTarawih = async (id) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      await romadhonService.deleteImamTarawih(id);
      toast.success('Data berhasil dihapus.');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Group kajian by kelas
  const groupedKajian = kajianList.reduce((acc, item) => {
    if (!acc[item.kelas]) acc[item.kelas] = [];
    acc[item.kelas].push(item);
    return acc;
  }, {});

  const tahunOptions = tahunAjaranList.map(t => ({ value: t.id, label: t.nama }));

  const tabItems = [
    {
      key: 'kajian',
      label: 'Jadwal Kajian Balagh Romadhon',
      icon: <BookOpenCheck size={16} style={{ color: '#10b981' }} />,
      badge: kajianList.length,
      children: (
        <div className="romadhon-tab-content">
          <div className="romadhon-toolbar">
            <button className="btn-custom btn-primary" onClick={openAddKajian}>
              <Plus size={16} /> Tambah Jadwal Kajian
            </button>
          </div>

          {Object.keys(groupedKajian).length === 0 && !loading && (
            <div className="empty-state">
              <Moon size={48} />
              <p>Belum ada data jadwal kajian balagh untuk tahun ajaran ini.</p>
            </div>
          )}

          {Object.entries(groupedKajian).map(([kelas, items]) => (
            <div key={kelas} className="kelas-group">
              <div className="kelas-header">
                <span className="kelas-badge">{kelas}</span>
                <span className="kelas-count">{items.length} sesi</span>
              </div>
              <div className="table-responsive">
                <table className="romadhon-table">
                  <thead>
                    <tr>
                      <th>Waktu</th>
                      <th>Qori' (Pengampu)</th>
                      <th>Kitab</th>
                      <th>Tempat</th>
                      <th style={{ width: 80 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td className="td-waktu">{item.waktu}</td>
                        <td>{item.qori}</td>
                        <td className="td-kitab">{item.kitab}</td>
                        <td>{item.tempat || '-'}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-icon btn-edit" onClick={() => openEditKajian(item)} title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button className="btn-icon btn-delete" onClick={() => deleteKajian(item.id)} title="Hapus">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'tarawih',
      label: 'Jadwal Imam Tarawih & Bilal',
      icon: <Users2 size={16} style={{ color: '#8b5cf6' }} />,
      badge: tarawihList.length,
      children: (
        <div className="romadhon-tab-content">
          <div className="romadhon-toolbar">
            <button className="btn-custom btn-primary" onClick={openAddTarawih}>
              <Plus size={16} /> Tambah Jadwal Imam
            </button>
          </div>

          {tarawihList.length === 0 && !loading && (
            <div className="empty-state">
              <Moon size={48} />
              <p>Belum ada data jadwal imam tarawih untuk tahun ajaran ini.</p>
            </div>
          )}

          {tarawihList.length > 0 && (
            <div className="table-responsive">
              <table className="romadhon-table tarawih-table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Malam</th>
                    <th>Imam</th>
                    <th>Bilal / Muroqqi</th>
                    <th>Tempat</th>
                    <th style={{ width: 80 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tarawihList.map(item => (
                    <tr key={item.id}>
                      <td><span className="malam-badge">{item.malam}</span></td>
                      <td className="td-imam">{item.imam}</td>
                      <td>{item.bilal || '-'}</td>
                      <td>{item.tempat || '-'}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn-icon btn-edit" onClick={() => openEditTarawih(item)} title="Edit">
                            <Edit3 size={14} />
                          </button>
                          <button className="btn-icon btn-delete" onClick={() => deleteTarawih(item.id)} title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    }
  ];

  if (loading && !kajianList.length && !tarawihList.length) {
    return <LoadingState message="Memuat data Romadhon..." />;
  }

  return (
    <div className="romadhon-page">
      <PageHeader
        title="🌙 Jadwal Romadhon"
        subtitle="Kelola jadwal kajian kilatan balagh dan petugas imam tarawih & bilal"
        extra={
          <CustomSelect
            options={tahunOptions}
            value={selectedTahunAjaran}
            onChange={(val) => setSelectedTahunAjaran(val)}
            placeholder="Pilih Tahun Ajaran"
            style={{ minWidth: 220 }}
          />
        }
      />

      <div className="romadhon-content" style={{ marginTop: 16 }}>
        <CustomTabs items={tabItems} activeKey={activeTab} onChange={setActiveTab} />
      </div>

      {/* Modal Kajian Balagh */}
      <CustomModal
        isOpen={kajianModalOpen}
        onClose={() => setKajianModalOpen(false)}
        title={editingKajian ? 'Edit Jadwal Kajian' : 'Tambah Jadwal Kajian'}
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
        <FloatingInput label="Malam ke- *" type="number" value={tarawihForm.malam} onChange={e => setTarawihForm(p => ({ ...p, malam: e.target.value }))} placeholder="1-30" />
        <FloatingInput label="Imam *" value={tarawihForm.imam} onChange={e => setTarawihForm(p => ({ ...p, imam: e.target.value }))} placeholder="Contoh: K.H. Musthofa Bisri" />
        <FloatingInput label="Bilal / Muroqqi" value={tarawihForm.bilal} onChange={e => setTarawihForm(p => ({ ...p, bilal: e.target.value }))} placeholder="Contoh: Ust. Rifqi Maulana" />
        <FloatingInput label="Tempat" value={tarawihForm.tempat} onChange={e => setTarawihForm(p => ({ ...p, tempat: e.target.value }))} placeholder="Contoh: Masjid Jami' Al-Hamid" />
      </CustomModal>
    </div>
  );
}
