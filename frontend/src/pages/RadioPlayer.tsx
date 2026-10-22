import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  Heart,
  Loader,
  Music,
  Wifi,
  WifiOff,
  X,
  RefreshCw,
  Radio as RadioIcon
} from 'lucide-react';
import { RadioStation, QuickFilterPreset } from '../types/radio';
import './RadioPlayer.scss';

// Radio Browser API — multiple servers for redundancy
const API_SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
];

// Fetch with retry across multiple servers
const fetchWithRetry = async (path: string): Promise<RadioStation[]> => {
  for (const server of API_SERVERS) {
    try {
      const res = await fetch(`${server}${path}`, {
        headers: { 'User-Agent': 'SekolahInfoRadio/1.0' }
      });
      if (res.ok) return await res.json();
    } catch {
      console.warn(`Server ${server} failed, trying next...`);
    }
  }
  throw new Error('Semua server radio tidak merespons');
};

// Quick filter presets
const QUICK_FILTERS: QuickFilterPreset[] = [
  { id: 'indonesia', label: '🇮🇩 Indonesia', query: { country: 'Indonesia' } },
  { id: 'pop-indo', label: 'Pop Indo', query: { tag: 'pop', country: 'Indonesia' } },
  { id: 'dangdut', label: 'Dangdut', query: { tag: 'dangdut' } },
  { id: 'islamic', label: 'Murottal', query: { tag: 'islamic' } },
  { id: 'lofi', label: 'Lofi Study', query: { tag: 'lofi' } },
  { id: 'jazz', label: 'Jazz', query: { tag: 'jazz' } },
  { id: 'rock', label: 'Rock', query: { tag: 'rock' } },
  { id: 'classical', label: 'Klasik', query: { tag: 'classical' } },
  { id: 'news', label: 'Berita', query: { tag: 'news', country: 'Indonesia' } },
  { id: 'kpop', label: 'K-Pop', query: { tag: 'kpop' } },
  { id: 'ambient', label: 'Ambient', query: { tag: 'ambient' } },
  { id: 'hiphop', label: 'Hip Hop', query: { tag: 'hiphop' } },
];

const FILTER_ICONS: Record<string, string> = {
  'indonesia': '🇮🇩',
  'pop-indo': '🎵',
  'dangdut': '💃',
  'islamic': '🕌',
  'lofi': '📚',
  'jazz': '🎷',
  'rock': '🎸',
  'classical': '🎻',
  'news': '📰',
  'kpop': '🇰🇷',
  'ambient': '🌙',
  'hiphop': '🎤',
};

export const RadioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('indonesia');
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<RadioStation[]>([]);
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem('radio_favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const saveFavorites = (favs: RadioStation[]) => {
    setFavorites(favs);
    localStorage.setItem('radio_favorites', JSON.stringify(favs));
  };

  const isFavorite = (station: RadioStation) => {
    return favorites.some(f => f.stationuuid === station.stationuuid);
  };

  const toggleFavorite = (station: RadioStation) => {
    if (isFavorite(station)) {
      const updated = favorites.filter(f => f.stationuuid !== station.stationuuid);
      saveFavorites(updated);
    } else {
      const updated = [...favorites, station];
      saveFavorites(updated);
    }
  };

  // Build API path from query params
  const buildSearchPath = (params: Record<string, string>) => {
    const qs = new URLSearchParams({
      limit: '80',
      order: 'clickcount',
      reverse: 'true',
      hidebroken: 'true',
      ...params
    });
    return `/json/stations/search?${qs.toString()}`;
  };

  // Fetch stations
  const fetchStations = useCallback(async (query = '', filterId: string | null = null) => {
    setLoading(true);
    setError(null);
    try {
      let path: string;
      if (query.trim()) {
        path = buildSearchPath({ name: query });
      } else if (filterId) {
        const preset = QUICK_FILTERS.find(f => f.id === filterId);
        path = preset ? buildSearchPath(preset.query) : buildSearchPath({ country: 'Indonesia' });
      } else {
        path = buildSearchPath({ country: 'Indonesia' });
      }

      const data = await fetchWithRetry(path);

      // Deduplicate by name
      const seen = new Set<string>();
      const filtered = data.filter(s => {
        if (!s.url_resolved && !s.url) return false;
        const key = s.name?.trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setStations(filtered);
      if (filtered.length === 0) {
        setError('Tidak ada stasiun ditemukan untuk kategori ini.');
      }
    } catch (err) {
      console.error('Radio fetch error:', err);
      setError('Gagal memuat stasiun radio. Periksa koneksi internet Anda.');
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStations('', 'indonesia');
  }, [fetchStations]);

  // Audio Context & Visualizer Setup
  const setupVisualizer = useCallback(() => {
    if (!audioRef.current || !canvasRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtxClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (!sourceNodeRef.current && audioRef.current) {
        sourceNodeRef.current = ctx.createMediaElementSource(audioRef.current);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        sourceNodeRef.current.connect(analyser);
        analyser.connect(ctx.destination);
        analyserRef.current = analyser;
      }

      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx || !analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw);
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

          // Apple Indigo-Blue Gradient
          const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
          gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.8)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 1)');

          canvasCtx.fillStyle = gradient;
          canvasCtx.beginPath();
          canvasCtx.roundRect(x, canvas.height - barHeight, barWidth - 2, barHeight, [3, 3, 0, 0]);
          canvasCtx.fill();

          x += barWidth;
        }
      };

      draw();
    } catch {
      // CORS restrictions might block visualizer for some streams — fail silently
    }
  }, []);

  // Play a specific station
  const playStation = async (station: RadioStation) => {
    if (!audioRef.current) return;
    setError(null);
    setCurrentStation(station);
    setIsBuffering(true);

    const streamUrl = station.url_resolved || station.url;
    audioRef.current.src = streamUrl;
    audioRef.current.volume = isMuted ? 0 : volume;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setIsBuffering(false);
      setupVisualizer();
    } catch (err) {
      console.warn('Playback error, trying raw URL:', err);
      if (station.url && station.url !== streamUrl) {
        try {
          audioRef.current.src = station.url;
          await audioRef.current.play();
          setIsPlaying(true);
          setIsBuffering(false);
          setupVisualizer();
          return;
        } catch { /* continue to error */ }
      }
      setIsBuffering(false);
      setIsPlaying(false);
      setError(`Tidak dapat memutar "${station.name}". Stasiun mungkin sedang offline.`);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current || !currentStation) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setupVisualizer();
      }).catch(() => {
        setError('Gagal melanjutkan siaran.');
      });
    }
  };

  // Next station
  const skipNext = () => {
    const list = showFavorites ? favorites : stations;
    if (list.length === 0) return;
    const currentIndex = list.findIndex(s => s.stationuuid === currentStation?.stationuuid);
    const nextIndex = (currentIndex + 1) % list.length;
    playStation(list[nextIndex]);
  };

  // Volume handler
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowFavorites(false);
    setActiveFilter('');
    fetchStations(searchQuery);
  };

  // Filter click
  const handleFilterClick = (filterId: string) => {
    setShowFavorites(false);
    setActiveFilter(filterId);
    setSearchQuery('');
    fetchStations('', filterId);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleAudioWaiting = () => setIsBuffering(true);
  const handleAudioPlaying = () => {
    setIsBuffering(false);
    setIsPlaying(true);
  };
  const handleAudioError = () => {
    setIsBuffering(false);
    setIsPlaying(false);
    setError('Stream terputus atau tidak tersedia. Coba stasiun lain.');
  };

  const displayStations = showFavorites ? favorites : stations;

  return (
    <div className="radio-player-page">
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        preload="none"
        onWaiting={handleAudioWaiting}
        onPlaying={handleAudioPlaying}
        onError={handleAudioError}
      />

      {/* 1. STANDAR BAKU HEADER HALAMAN (Aturan Sakral 4.1: STRICTLY NO ICON ON TITLE) */}
      <header className="tactile-page-header">
        <div className="header-text-block">
          <h2 className="page-title">Radio & Musik</h2>
          <p className="page-subtitle">
            Streaming siaran radio dan murottal Al-Quran dari seluruh dunia — jernih, gratis & tanpa iklan
          </p>
        </div>

        <div className="header-actions-row">
          {currentStation ? (
            <div className="radio-live-pill">
              <span className={`live-pulse-dot ${isPlaying ? 'pulse-live' : 'pulse-paused'}`} />
              <span className="live-pill-text">
                {isPlaying ? `Memutar: ${currentStation.name}` : `Siap: ${currentStation.name}`}
              </span>
            </div>
          ) : (
            <div className="radio-live-pill idle">
              <Wifi size={13} />
              <span className="live-pill-text">Siap Memutar</span>
            </div>
          )}
        </div>
      </header>

      {/* 2. APPLE VisionOS FLOATING LIQUID GLASS NOW PLAYING DOCK */}
      <div className={`now-playing-dock ${currentStation ? 'has-station' : ''}`}>
        <canvas ref={canvasRef} className="audio-visualizer-canvas" width={600} height={70} />

        <div className="player-controls-row">
          {/* Station Metadata & Vinyl Disc */}
          <div className="now-playing-info-wrap">
            {currentStation ? (
              <>
                <div className={`vinyl-disc ${isPlaying ? 'spinning' : ''}`}>
                  {currentStation.favicon ? (
                    <img 
                      src={currentStation.favicon} 
                      alt="" 
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
                    />
                  ) : (
                    <Music size={18} />
                  )}
                </div>
                <div className="station-meta-block">
                  <span className="station-meta-name" title={currentStation.name}>
                    {currentStation.name}
                  </span>
                  <span className="station-meta-sub">
                    {currentStation.country || 'Global'}
                    {currentStation.bitrate && currentStation.bitrate > 0 ? ` • ${currentStation.bitrate}kbps` : ''}
                    {currentStation.codec ? ` • ${currentStation.codec}` : ''}
                  </span>
                </div>
              </>
            ) : (
              <div className="station-meta-block">
                <span className="station-meta-name empty">Pilih stasiun di bawah untuk mulai mendengarkan</span>
                <span className="station-meta-sub">Ratusan stasiun lokal dan murottal islami tersedia</span>
              </div>
            )}
          </div>

          {/* Transport Buttons */}
          <div className="transport-controls-wrap">
            <button
              type="button"
              className={`play-tactile-btn ${isPlaying ? 'playing' : ''}`}
              onClick={togglePlay}
              disabled={!currentStation || isBuffering}
              title={isPlaying ? "Jeda Siaran" : "Putar Siaran"}
            >
              {isBuffering ? (
                <Loader size={20} className="spin-loader" />
              ) : isPlaying ? (
                <Pause size={20} />
              ) : (
                <Play size={20} className="play-icon-offset" />
              )}
            </button>

            <button
              type="button"
              className="skip-tactile-btn"
              onClick={skipNext}
              disabled={!currentStation || displayStations.length === 0}
              title="Stasiun Berikutnya"
            >
              <SkipForward size={17} />
            </button>
          </div>

          {/* Volume Control Pill */}
          <div className="volume-dock-pill">
            <button type="button" className="vol-icon-btn" onClick={toggleMute} title={isMuted ? "Bunyikan" : "Bisukan"}>
              {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="volume-tactile-slider"
            />
          </div>

          {/* Favorite Button */}
          {currentStation && (
            <button
              type="button"
              className={`fav-dock-btn ${isFavorite(currentStation) ? 'favorited' : ''}`}
              onClick={() => toggleFavorite(currentStation)}
              title={isFavorite(currentStation) ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
            >
              <Heart size={18} fill={isFavorite(currentStation) ? '#ec4899' : 'none'} />
            </button>
          )}

          {/* Connection Status Badge */}
          <div className="connection-pill-badge">
            {isPlaying ? (
              <>
                <Wifi size={12} className="live-icon" />
                <span>Live</span>
              </>
            ) : currentStation ? (
              <>
                <WifiOff size={12} />
                <span>Paused</span>
              </>
            ) : (
              <span>Standby</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. SEARCH PILL & QUICK CATEGORY CAPSULES */}
      <div className="radio-filter-toolbar">
        <form className="radio-search-form" onSubmit={handleSearch}>
          <div className="search-pill-wrapper">
            <Search size={16} className="search-icon-decor" />
            <input
              type="text"
              placeholder="Cari stasiun radio, genre, atau kota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="radio-search-field"
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => { setSearchQuery(''); handleFilterClick('indonesia'); }}
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="action-pill-btn primary-pill search-submit-pill" disabled={!searchQuery.trim()}>
            Cari
          </button>
        </form>

        <div className="filter-capsules-scroll">
          <button
            type="button"
            className={`filter-capsule ${showFavorites ? 'active' : ''}`}
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Heart size={13} fill={showFavorites ? '#ec4899' : 'none'} />
            <span>Favorit ({favorites.length})</span>
          </button>

          {QUICK_FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              className={`filter-capsule ${activeFilter === f.id && !showFavorites ? 'active' : ''}`}
              onClick={() => handleFilterClick(f.id)}
            >
              <span className="capsule-emoji">{FILTER_ICONS[f.id]}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toast Error Alert */}
      {error && (
        <div className="radio-error-banner">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} title="Tutup">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 4. STATIONS GRID (OPTION A LIQUID GLASS CARDS) */}
      <div className="stations-section">
        {loading ? (
          <div className="stations-loading-state">
            <Loader size={32} className="spin-loader" />
            <span className="loading-text">Menghubungkan ke jaringan radio...</span>
          </div>
        ) : displayStations.length === 0 ? (
          <div className="stations-empty-state">
            <RadioIcon size={44} className="empty-icon" />
            <span className="empty-title">
              {showFavorites ? 'Belum ada stasiun yang difavoritkan' : 'Tidak ada stasiun radio yang ditemukan'}
            </span>
            <span className="empty-subtitle">
              {showFavorites ? 'Klik ikon hati pada stasiun radio untuk menyimpannya di sini.' : 'Coba gunakan kata kunci pencarian yang lain atau pilih kategori di atas.'}
            </span>
            {!showFavorites && (
              <button
                type="button"
                className="action-pill-btn retry-btn"
                onClick={() => fetchStations('', activeFilter || 'indonesia')}
              >
                <RefreshCw size={14} />
                <span>Muat Ulang Stasiun</span>
              </button>
            )}
          </div>
        ) : (
          <div className="stations-cards-grid">
            {displayStations.map((station) => {
              const isActive = currentStation?.stationuuid === station.stationuuid;
              const isFav = isFavorite(station);

              return (
                <div
                  key={station.stationuuid}
                  className={`station-glass-card ${isActive ? 'active-playing' : ''}`}
                  onClick={() => playStation(station)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="station-icon-box">
                    {station.favicon ? (
                      <img
                        src={station.favicon}
                        alt=""
                        className="station-logo-img"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <Music size={18} className="fallback-music-icon" />
                    )}
                  </div>

                  <div className="station-details">
                    <span className="station-name-text" title={station.name}>
                      {station.name}
                    </span>
                    <span className="station-location-sub">
                      {station.country || 'Global'}
                      {station.tags ? ` • ${station.tags.split(',').slice(0, 2).join(', ')}` : ''}
                    </span>
                    <span className="station-tech-meta">
                      {station.bitrate && station.bitrate > 0 ? `${station.bitrate} kbps` : 'Audio Stream'}
                      {station.codec ? ` • ${station.codec}` : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`station-fav-btn ${isFav ? 'is-fav' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(station);
                    }}
                    title={isFav ? "Hapus dari favorit" : "Tambah ke favorit"}
                  >
                    <Heart size={14} fill={isFav ? '#ec4899' : 'none'} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RadioPlayer;
