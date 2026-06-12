import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio, Search, Play, Pause, Volume2, VolumeX, Star,
  SkipForward, Heart, Loader, Music, Wifi, WifiOff,
  X, RefreshCw
} from 'lucide-react';
import './RadioPlayer.scss';

// Radio Browser API — multiple servers for redundancy
const API_SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
];

// Fetch with retry across multiple servers
const fetchWithRetry = async (path) => {
  for (const server of API_SERVERS) {
    try {
      const res = await fetch(`${server}${path}`, {
        headers: { 'User-Agent': 'SekolahInfoRadio/1.0' }
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn(`Server ${server} failed, trying next...`);
    }
  }
  throw new Error('Semua server radio tidak merespons');
};

// Quick filter presets
const QUICK_FILTERS = [
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

const FILTER_ICONS = {
  'indonesia': '🇮🇩', 'pop-indo': '🎵', 'dangdut': '💃', 'islamic': '🕌',
  'lofi': '📚', 'jazz': '🎷', 'rock': '🎸', 'classical': '🎻',
  'news': '📰', 'kpop': '🇰🇷', 'ambient': '🌙', 'hiphop': '🎤',
};

export function RadioPlayer() {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('indonesia');
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [error, setError] = useState(null);

  // Load favorites
  useEffect(() => {
    try {
      const saved = localStorage.getItem('radio_favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch (e) { /* ignore */ }
  }, []);

  const saveFavorites = (favs) => {
    setFavorites(favs);
    localStorage.setItem('radio_favorites', JSON.stringify(favs));
  };

  // Build API path from query params
  const buildSearchPath = (params) => {
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
  const fetchStations = useCallback(async (query = '', filterId = null) => {
    setLoading(true);
    setError(null);
    try {
      let path;
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
      const seen = new Set();
      const filtered = data.filter(s => {
        if (!s.url_resolved && !s.url) return false;
        const key = s.name?.trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setStations(filtered);
      if (filtered.length === 0) {
        setError('Tidak ada stasiun ditemukan untuk filter ini.');
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

  const handleFilterClick = (filterId) => {
    setActiveFilter(filterId);
    setSearchQuery('');
    setShowFavorites(false);
    fetchStations('', filterId);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveFilter('');
    setShowFavorites(false);
    fetchStations(searchQuery);
  };

  // ── Audio Visualizer ──
  const setupVisualizer = () => {
    if (!audioRef.current || !canvasRef.current) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (!sourceNodeRef.current) {
        sourceNodeRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 128;
        sourceNodeRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioCtxRef.current.destination);
      }
      drawVisualizer();
    } catch (err) {
      console.warn('Visualizer skipped:', err.message);
    }
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const barWidth = (width / bufferLength) * 2;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.85;
        const hue = 220 + (i / bufferLength) * 60;
        const lightness = 50 + (dataArray[i] / 255) * 20;
        ctx.fillStyle = `hsla(${hue}, 80%, ${lightness}%, 0.9)`;
        const y = height - barHeight;
        ctx.fillRect(x, y, barWidth - 1, barHeight);
        x += barWidth + 2;
      }
    };
    draw();
  };

  // ── Playback ──
  const playStation = async (station) => {
    const streamUrl = station.url_resolved || station.url;
    if (!streamUrl) return;

    setCurrentStation(station);
    setIsBuffering(true);
    setError(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = streamUrl;
      audioRef.current.volume = isMuted ? 0 : volume;

      try {
        if (audioCtxRef.current?.state === 'suspended') {
          await audioCtxRef.current.resume();
        }
        await audioRef.current.play();
        setIsPlaying(true);
        setIsBuffering(false);
        setupVisualizer();
      } catch (err) {
        console.error('Playback error:', err);
        setError('Gagal memutar stasiun ini. Silakan coba stasiun lain.');
        setIsPlaying(false);
        setIsBuffering(false);
      }
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
  };

  const resumePlayback = async () => {
    if (audioRef.current && currentStation) {
      try {
        if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume();
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) { console.error('Resume error:', err); }
    }
  };

  const togglePlay = () => { isPlaying ? pausePlayback() : resumePlayback(); };

  const skipNext = () => {
    if (!currentStation || stations.length === 0) return;
    const idx = stations.findIndex(s => s.stationuuid === currentStation.stationuuid);
    const next = stations[(idx + 1) % stations.length];
    if (next) playStation(next);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) audioRef.current.volume = isMuted ? volume : 0;
  };

  const toggleFavorite = (station) => {
    const uuid = station.stationuuid;
    const exists = favorites.some(f => f.stationuuid === uuid);
    const updated = exists
      ? favorites.filter(f => f.stationuuid !== uuid)
      : [...favorites, {
          stationuuid: station.stationuuid, name: station.name,
          url_resolved: station.url_resolved || station.url,
          favicon: station.favicon, country: station.country,
          tags: station.tags, codec: station.codec, bitrate: station.bitrate,
        }];
    saveFavorites(updated);
  };

  const isFavorite = (station) => favorites.some(f => f.stationuuid === station.stationuuid);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
    };
  }, []);

  const handleAudioWaiting = () => setIsBuffering(true);
  const handleAudioPlaying = () => setIsBuffering(false);
  const handleAudioError = () => {
    setIsBuffering(false);
    setIsPlaying(false);
    setError('Stream terputus atau tidak tersedia. Coba stasiun lain.');
  };

  const displayStations = showFavorites ? favorites : stations;

  return (
    <div className="radio-player-page">
      <audio ref={audioRef} crossOrigin="anonymous" preload="none"
        onWaiting={handleAudioWaiting} onPlaying={handleAudioPlaying} onError={handleAudioError}
      />

      {/* Header */}
      <div className="radio-page-header">
        <div className="header-title-area">
          <div className="radio-icon-badge"><Radio size={24} /></div>
          <div>
            <h1>Radio & Musik</h1>
            <p className="header-subtitle">Streaming radio dari seluruh dunia — gratis & tanpa iklan</p>
          </div>
        </div>
      </div>

      {/* Now Playing */}
      <div className={`now-playing-bar ${currentStation ? 'active' : ''}`}>
        <canvas ref={canvasRef} className="audio-visualizer" width={600} height={80} />
        <div className="player-controls-area">
          <div className="now-playing-info">
            {currentStation ? (
              <>
                <div className={`vinyl-disc ${isPlaying ? 'spinning' : ''}`}>
                  {currentStation.favicon ? (
                    <img src={currentStation.favicon} alt="" onError={(e) => e.target.style.display = 'none'} />
                  ) : ( <Music size={20} /> )}
                </div>
                <div className="station-text">
                  <span className="station-name">{currentStation.name}</span>
                  <span className="station-meta">
                    {currentStation.country}
                    {currentStation.bitrate > 0 && ` · ${currentStation.bitrate}kbps`}
                    {currentStation.codec && ` · ${currentStation.codec}`}
                  </span>
                </div>
              </>
            ) : (
              <div className="station-text">
                <span className="station-name empty">Pilih stasiun untuk mulai mendengarkan</span>
              </div>
            )}
          </div>

          <div className="transport-controls">
            <button className={`play-btn ${isPlaying ? 'playing' : ''}`}
              onClick={togglePlay} disabled={!currentStation || isBuffering}>
              {isBuffering ? <Loader size={22} className="spin-loader" />
                : isPlaying ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button className="skip-btn" onClick={skipNext}
              disabled={!currentStation || stations.length === 0} title="Stasiun Berikutnya">
              <SkipForward size={18} />
            </button>
          </div>

          <div className="volume-controls">
            <button className="vol-btn" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input type="range" min="0" max="1" step="0.01"
              value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="volume-slider" />
          </div>

          {currentStation && (
            <button className={`fav-current-btn ${isFavorite(currentStation) ? 'favorited' : ''}`}
              onClick={() => toggleFavorite(currentStation)}
              title={isFavorite(currentStation) ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}>
              <Heart size={18} fill={isFavorite(currentStation) ? '#FF4081' : 'none'} />
            </button>
          )}
        </div>

        <div className="connection-status">
          {isPlaying ? ( <><Wifi size={12} /> <span>Live</span></> )
            : currentStation ? ( <><WifiOff size={12} /> <span>Paused</span></> ) : null}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="radio-toolbar">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-ico" />
            <input type="text" placeholder="Cari stasiun radio, genre, negara..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="radio-search-input" />
            {searchQuery && (
              <button type="button" className="clear-btn"
                onClick={() => { setSearchQuery(''); handleFilterClick('indonesia'); }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" className="search-submit-btn" disabled={!searchQuery.trim()}>Cari</button>
        </form>

        <div className="filter-tags-row">
          <button className={`filter-tag ${showFavorites ? 'active' : ''}`}
            onClick={() => setShowFavorites(!showFavorites)}>
            <Heart size={14} fill={showFavorites ? '#FF4081' : 'none'} />
            Favorit ({favorites.length})
          </button>
          {QUICK_FILTERS.map(f => (
            <button key={f.id}
              className={`filter-tag ${activeFilter === f.id && !showFavorites ? 'active' : ''}`}
              onClick={() => handleFilterClick(f.id)}>
              <span className="filter-emoji">{FILTER_ICONS[f.id]}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="radio-error-toast">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Stations Grid */}
      <div className="stations-container">
        {loading ? (
          <div className="stations-loading">
            <Loader size={28} className="spin-loader" />
            <span>Mencari stasiun radio...</span>
          </div>
        ) : displayStations.length === 0 ? (
          <div className="stations-empty">
            <Radio size={40} />
            <span>{showFavorites ? 'Belum ada stasiun favorit.' : 'Tidak ada stasiun ditemukan.'}</span>
            {!showFavorites && (
              <button className="retry-btn" onClick={() => fetchStations('', activeFilter || 'indonesia')}>
                <RefreshCw size={16} /> Coba Lagi
              </button>
            )}
          </div>
        ) : (
          <div className="stations-grid">
            {displayStations.map((station) => {
              const isActive = currentStation?.stationuuid === station.stationuuid;
              return (
                <div key={station.stationuuid}
                  className={`station-card ${isActive ? 'active' : ''} ${isActive && isPlaying ? 'playing' : ''}`}
                  onClick={() => playStation(station)}>
                  <div className="station-card-icon">
                    {station.favicon ? (
                      <img src={station.favicon} alt=""
                        onError={(e) => { e.target.style.display = 'none'; if(e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div className="fallback-icon" style={station.favicon ? { display: 'none' } : {}}>
                      <Music size={22} />
                    </div>
                    {isActive && isPlaying && (
                      <div className="equalizer-bars"><span></span><span></span><span></span><span></span></div>
                    )}
                  </div>
                  <div className="station-card-info">
                    <span className="card-station-name" title={station.name}>{station.name}</span>
                    <span className="card-station-tags">
                      {station.country || 'Unknown'}
                      {station.tags && ` · ${station.tags.split(',').slice(0, 2).join(', ')}`}
                    </span>
                    {station.bitrate > 0 && (
                      <span className="card-bitrate">{station.bitrate} kbps · {station.codec || 'MP3'}</span>
                    )}
                  </div>
                  <button className={`card-fav-btn ${isFavorite(station) ? 'favorited' : ''}`}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(station); }}
                    title={isFavorite(station) ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}>
                    <Star size={16} fill={isFavorite(station) ? '#FFB300' : 'none'} stroke={isFavorite(station) ? '#FFB300' : 'currentColor'} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!loading && displayStations.length > 0 && (
        <div className="stations-footer-count">
          Menampilkan {displayStations.length} stasiun{showFavorites ? ' favorit' : ''}
        </div>
      )}
    </div>
  );
}
