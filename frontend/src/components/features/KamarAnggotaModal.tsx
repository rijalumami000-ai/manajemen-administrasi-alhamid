import React, { useState, useEffect } from 'react';
import { X, Users, BedDouble, Layers, Building, Search, UserCheck, MapPin } from 'lucide-react';
import { kamarService } from '../../services/kamarService';
import { KamarItem, KamarAnggotaSantri } from '../../types/kamar';
import './KamarAnggotaModal.scss';

interface KamarAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  kamarId?: number | null;
  initialKamar?: KamarItem | null;
}

export const KamarAnggotaModal: React.FC<KamarAnggotaModalProps> = ({
  isOpen,
  onClose,
  kamarId,
  initialKamar
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [kamar, setKamar] = useState<KamarItem | null>(initialKamar || null);
  const [anggotaList, setAnggotaList] = useState<KamarAnggotaSantri[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && kamarId) {
      loadAnggota();
    } else {
      setKamar(initialKamar || null);
      setAnggotaList([]);
      setSearch('');
      setError('');
    }
  }, [isOpen, kamarId]);

  const loadAnggota = async () => {
    if (!kamarId) return;
    try {
      setLoading(true);
      setError('');
      const res = await kamarService.fetchKamarAnggota(kamarId);
      setKamar(res.kamar || initialKamar || null);
      setAnggotaList(res.anggota || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat anggota kamar';
      console.error('Gagal memuat anggota kamar:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentKamar = kamar || initialKamar || ({} as Partial<KamarItem>);

  const filteredAnggota = anggotaList.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.nama && s.nama.toLowerCase().includes(q)) ||
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      (s.kelas_diniyah && s.kelas_diniyah.toLowerCase().includes(q)) ||
      (s.kelas_sekolah && s.kelas_sekolah.toLowerCase().includes(q))
    );
  });

  const kapasitas = Number(currentKamar.kapasitas) || 0;
  const terisi = anggotaList.length || Number(currentKamar.terisi) || 0;
  const sisa = Math.max(0, kapasitas - terisi);
  const persen = kapasitas > 0 ? Math.min(100, Math.round((terisi / kapasitas) * 100)) : 0;
  const isPutra = currentKamar.jenis === 'Putra';

  return (
    <div className="kamar-anggota-overlay" onClick={onClose}>
      <div className="kamar-anggota-modal tactile-glass-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-specular-edge" />

        {/* Modal Header */}
        <div className={`kamar-anggota-header ${isPutra ? 'theme-putra' : 'theme-putri'}`}>
          <div className="header-top">
            <div className="room-title-block">
              <span className="room-tag-pill">{isPutra ? '👦 Komplek Putra' : '👧 Komplek Putri'}</span>
              <h3 className="room-header-title">
                <BedDouble size={22} className="title-icon" />
                <span>{currentKamar.nama || 'Detail Kamar'}</span>
              </h3>
            </div>
            <button
              type="button"
              className="modal-close-round"
              onClick={onClose}
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="room-meta-grid">
            <div className="meta-card">
              <div className="meta-icon"><Building size={16} /></div>
              <div className="meta-text">
                <span className="meta-label">Gedung</span>
                <span className="meta-value">{currentKamar.gedung || '-'}</span>
              </div>
            </div>
            <div className="meta-card">
              <div className="meta-icon"><Layers size={16} /></div>
              <div className="meta-text">
                <span className="meta-label">Lantai</span>
                <span className="meta-value">Lt. {currentKamar.lantai || '-'}</span>
              </div>
            </div>
            <div className="meta-card">
              <div className="meta-icon"><Users size={16} /></div>
              <div className="meta-text">
                <span className="meta-label">Kapasitas</span>
                <span className="meta-value"><strong>{terisi}</strong> / {kapasitas} Santri</span>
              </div>
            </div>
            <div className="meta-card">
              <div className="meta-icon"><UserCheck size={16} /></div>
              <div className="meta-text">
                <span className="meta-label">Sisa Kuota</span>
                <span className={`meta-value ${sisa === 0 ? 'text-danger' : 'text-success'}`}>
                  {sisa} Kursi Kosong
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="occupancy-progress-bar">
            <div className="bar-track">
              <div
                className={`bar-fill ${persen >= 90 ? 'critical' : persen >= 70 ? 'warning' : 'safe'}`}
                style={{ width: `${persen}%` }}
              />
            </div>
            <span className="bar-pct">{persen}% Terisi</span>
          </div>
        </div>

        {/* Search Bar Dock */}
        <div className="kamar-anggota-search-dock">
          <div className="tactile-search-pill">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Cari santri berdasarkan nama, NIS, atau kelas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch('')}
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <span className="anggota-count-badge">
            {filteredAnggota.length} dari {anggotaList.length} Santri Terdaftar
          </span>
        </div>

        {/* Modal Body / Member List */}
        <div className="kamar-anggota-body custom-scrollbar">
          {loading ? (
            <div className="loading-state-block">
              <div className="spinner" />
              <span>Memuat daftar penghuni kamar...</span>
            </div>
          ) : error ? (
            <div className="error-state-block">
              <p>{error}</p>
              <button type="button" onClick={loadAnggota} className="retry-pill-btn">
                Coba Lagi
              </button>
            </div>
          ) : filteredAnggota.length === 0 ? (
            <div className="empty-state-block">
              <div className="empty-lens-orb">
                <Users size={32} />
              </div>
              <h4>{search ? 'Tidak Ada Santri yang Cocok' : 'Belum Ada Santri di Kamar Ini'}</h4>
              <p>
                {search
                  ? `Tidak ditemukan santri dengan kata kunci "${search}".`
                  : `Kamar ${currentKamar.nama || ''} saat ini belum memiliki santri yang ditempatkan.`}
              </p>
              {search && (
                <button
                  type="button"
                  className="reset-filter-btn"
                  onClick={() => setSearch('')}
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="anggota-tactile-grid">
              {filteredAnggota.map((santri) => (
                <div key={santri.id} className="santri-item-card">
                  <div className="santri-lens-avatar">
                    {santri.foto_url ? (
                      <img src={santri.foto_url} alt={santri.nama} />
                    ) : (
                      <span>{(santri.nama || 'S').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="santri-info">
                    <h5 className="santri-name" title={santri.nama}>{santri.nama}</h5>
                    <div className="santri-tags">
                      {santri.nis && <span className="tag-pill nis">NIS: {santri.nis}</span>}
                      {santri.kelas_diniyah && (
                        <span className="tag-pill madin">Madin: {santri.kelas_diniyah}</span>
                      )}
                      {santri.kelas_sekolah && (
                        <span className="tag-pill sekolah">Sekolah: {santri.kelas_sekolah}</span>
                      )}
                    </div>
                    {santri.alamat && (
                      <span className="santri-alamat" title={santri.alamat}>
                        <MapPin size={11} className="inline-pin" />
                        <span>{santri.alamat}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="kamar-anggota-footer">
          <button type="button" className="action-pill-btn neutral-pill" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default KamarAnggotaModal;
