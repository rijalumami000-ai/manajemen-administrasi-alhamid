import React, { useState, useEffect } from 'react';
import { X, Users, BedDouble, Layers, Building, Search, UserCheck } from 'lucide-react';
import { kamarService } from '../../services/kamarService';
import './KamarAnggotaModal.scss';

export function KamarAnggotaModal({ isOpen, onClose, kamarId, initialKamar }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ kamar: initialKamar || null, anggota: [] });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && kamarId) {
      loadAnggota();
    } else {
      setData({ kamar: initialKamar || null, anggota: [] });
      setSearch('');
      setError('');
    }
  }, [isOpen, kamarId]);

  const loadAnggota = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await kamarService.fetchKamarAnggota(kamarId);
      setData(res);
    } catch (err) {
      console.error('Gagal memuat anggota kamar:', err);
      setError(err.message || 'Gagal memuat anggota kamar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const kamar = data.kamar || initialKamar || {};
  const anggotaList = data.anggota || [];

  const filteredAnggota = anggotaList.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.nama && s.nama.toLowerCase().includes(q)) ||
      (s.nis && s.nis.toLowerCase().includes(q)) ||
      (s.kelas_diniyah && s.kelas_diniyah.toLowerCase().includes(q))
    );
  });

  const kapasitas = kamar.kapasitas || 0;
  const terisi = anggotaList.length || kamar.terisi || 0;
  const sisa = Math.max(0, kapasitas - terisi);
  const persen = kapasitas > 0 ? Math.min(100, Math.round((terisi / kapasitas) * 100)) : 0;
  const isPutra = kamar.jenis === 'Putra';

  return (
    <div className="kamar-anggota-overlay" onClick={onClose}>
      <div className="kamar-anggota-modal" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={`kamar-anggota-header ${isPutra ? 'theme-putra' : 'theme-putri'}`}>
          <div className="header-top">
            <div className="room-title-block">
              <span className="room-tag">{isPutra ? 'Komplek Putra' : 'Komplek Putri'}</span>
              <h2>
                <BedDouble size={22} className="title-icon" />
                {kamar.nama || 'Detail Kamar'}
              </h2>
            </div>
            <button type="button" className="close-btn" onClick={onClose} aria-label="Tutup">
              <X size={20} />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="room-meta-grid">
            <div className="meta-card">
              <div className="meta-icon"><Layers size={16} /></div>
              <div className="meta-text">
                <span className="meta-label">Lantai</span>
                <span className="meta-value">Lantai {kamar.lantai || '-'}</span>
              </div>
            </div>
            <div className="meta-card">
              <div className="meta-icon"><Building size={16} /></div>
              <div className="meta-text">
                <span className="meta-label">Gedung</span>
                <span className="meta-value">{kamar.gedung || '-'}</span>
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
                <span className="meta-value" style={{ color: sisa === 0 ? '#ef4444' : '#10b981' }}>
                  {sisa} Kursi
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

        {/* Search Bar */}
        <div className="kamar-anggota-search">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari santri berdasarkan nama, NIS, atau kelas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="clear-search" onClick={() => setSearch('')}>
                <X size={14} />
              </button>
            )}
          </div>
          <span className="anggota-count-badge">
            {filteredAnggota.length} dari {anggotaList.length} Santri
          </span>
        </div>

        {/* Modal Body / Member List */}
        <div className="kamar-anggota-body">
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Memuat daftar anggota kamar...</span>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button type="button" onClick={loadAnggota} className="retry-btn">Coba Lagi</button>
            </div>
          ) : filteredAnggota.length === 0 ? (
            <div className="empty-state">
              <Users size={40} className="empty-icon" />
              <h4>{search ? 'Tidak ada santri yang cocok' : 'Belum Ada Anggota di Kamar Ini'}</h4>
              <p>
                {search
                  ? `Tidak ditemukan santri dengan kata kunci "${search}".`
                  : `Kamar ${kamar.nama || ''} saat ini belum memiliki santri yang terdaftar.`}
              </p>
            </div>
          ) : (
            <div className="anggota-grid">
              {filteredAnggota.map((santri, idx) => (
                <div key={santri.id || idx} className="santri-item-card">
                  <div className="santri-avatar">
                    {santri.foto_url ? (
                      <img src={santri.foto_url} alt={santri.nama} />
                    ) : (
                      <span>{(santri.nama || 'S').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="santri-info">
                    <h4 className="santri-name" title={santri.nama}>{santri.nama}</h4>
                    <div className="santri-tags">
                      {santri.nis && <span className="tag nis">NIS: {santri.nis}</span>}
                      {santri.kelas_diniyah && (
                        <span className="tag madin">Madin: {santri.kelas_diniyah}</span>
                      )}
                      {santri.kelas_sekolah && (
                        <span className="tag sekolah">Sekolah: {santri.kelas_sekolah}</span>
                      )}
                    </div>
                    {santri.alamat && (
                      <span className="santri-alamat" title={santri.alamat}>
                        📍 {santri.alamat}
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
          <button type="button" className="btn-close" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
