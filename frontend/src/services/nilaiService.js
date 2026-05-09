import { apiGet, apiPost } from './apiClient';

export const nilaiService = {
  // Kategori Evaluasi
  fetchKategori: async () => {
    return apiGet('/nilai/kategori');
  },

  // Kriteria Nilai
  fetchKriteria: async (tingkat, mapelId) => {
    return apiGet(`/nilai/kriteria/${tingkat}/${mapelId}`);
  },

  saveKriteria: async (data) => {
    return apiPost('/nilai/kriteria', data);
  },

  fetchMapelTingkat: async () => {
    return apiGet('/nilai/mapel-tingkat');
  },

  saveMapelTingkat: async (tingkat, mapelIds) => {
    return apiPost('/nilai/mapel-tingkat', { tingkat, mapelIds });
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

  fetchSantriReport: async (tahunAjaranId) => {
    return apiGet(`/nilai/santri-report?tahun_ajaran_id=${tahunAjaranId}`);
  },

  fetchAkumulasiKelas: async (filters) => {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/nilai/akumulasi-kelas${params ? '?' + params : ''}`);
  }
};
