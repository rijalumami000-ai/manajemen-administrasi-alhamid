import { apiGet, apiPost } from './apiClient';

export const nilaiService = {
  // Kategori Evaluasi
  fetchKategori: async () => {
    return apiGet('/nilai/kategori');
  },

  // Kriteria Nilai
  fetchKriteria: async (tingkat, mapelId, tahunAjaranId = null, kategoriId = null) => {
    let url = `/nilai/kriteria/${tingkat}/${mapelId}`;
    const params = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategoriId) params.push(`kategori_evaluasi_id=${kategoriId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiGet(url);
  },

  saveKriteria: async (data) => {
    return apiPost('/nilai/kriteria', data);
  },

  fetchMapelTingkat: async (tahunAjaranId = null, kategoriId = null) => {
    let url = '/nilai/mapel-tingkat';
    const params = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategoriId) params.push(`kategori_evaluasi_id=${kategoriId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiGet(url);
  },

  saveMapelTingkat: async (tingkat, mapelIds, tahunAjaranId = null, kategoriId = null) => {
    return apiPost('/nilai/mapel-tingkat', { tingkat, mapelIds, tahun_ajaran_id: tahunAjaranId, kategori_evaluasi_id: kategoriId });
  },

  // Nilai Santri
  fetchNilaiSantri: async (filters) => {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/nilai/santri${params ? '?' + params : ''}`);
  },

  saveNilaiBulk: async (data) => {
    return apiPost('/nilai/santri/bulk', data);
  },

  fetchRekapNilai: async (filters) => {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/nilai/rekap${params ? '?' + params : ''}`);
  },

  // Rapor Data
  fetchRaporData: async (filters) => {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/nilai/rapor${params ? '?' + params : ''}`);
  },

  savePeringkatManual: async (data) => {
    return apiPost('/nilai/peringkat-manual', data);
  },

  saveRaporBulk: async (data) => {
    return apiPost('/nilai/rapor/bulk', data);
  },

  fetchCetakRapor: async (tahunAjaranId, kelasId, kategoriId, santriId) => {
    return apiGet(`/nilai/rapor-cetak/${tahunAjaranId}/${kelasId}/${kategoriId}/${santriId}`);
  },

  // Master Data
  fetchKelas: async () => {
    return apiGet('/kelas');
  },

  fetchMataPelajaran: async () => {
    return apiGet('/mata-pelajaran');
  },

  fetchTahunAjaran: async () => {
    return apiGet('/tahun-ajaran');
  },

  fetchSantriReport: async (tahunAjaranId, kategoriId = null) => {
    let url = `/nilai/santri-report?tahun_ajaran_id=${tahunAjaranId}`;
    if (kategoriId) {
      url += `&kategori_id=${kategoriId}`;
    }
    return apiGet(url);
  },

  fetchAkumulasiKelas: async (filters) => {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/nilai/akumulasi-kelas${params ? '?' + params : ''}`);
  },

  fetchMuhafadzohInfo: async (tahunAjaranId, kategoriEvaluasiId) => {
    let url = '/nilai/muhafadzoh-info';
    const params = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategoriEvaluasiId) params.push(`kategori_evaluasi_id=${kategoriEvaluasiId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiGet(url);
  },

  saveMuhafadzohInfo: async (data) => {
    return apiPost('/nilai/muhafadzoh-info', data);
  },

  fetchQiroahMaqro: async (tahunAjaranId, kategoriEvaluasiId) => {
    let url = '/nilai/qiroah-maqro';
    const params = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategoriEvaluasiId) params.push(`kategori_evaluasi_id=${kategoriEvaluasiId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiGet(url);
  },

  saveQiroahMaqro: async (data) => {
    return apiPost('/nilai/qiroah-maqro', data);
  }
};
