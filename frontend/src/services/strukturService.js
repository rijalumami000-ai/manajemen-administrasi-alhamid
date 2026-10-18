import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const strukturService = {
  // Fetch academic years
  async fetchTahunAjaran() {
    return apiGet('/tahun-ajaran', { noCache: true });
  },

  // Fetch structure cards by type
  async fetchStruktur(tipe, tahunAjaranId, kategori, semester) {
    const params = new URLSearchParams();
    if (tahunAjaranId) params.append('tahun_ajaran_id', tahunAjaranId);
    if (kategori && kategori !== 'ALL') params.append('kategori', kategori);
    if (semester) params.append('semester', semester);
    const qp = params.toString() ? `?${params.toString()}` : '';
    return apiGet(`/struktur/${tipe}${qp}`, { noCache: true });
  },

  // Update a structure position assignment
  async updateStruktur(data) {
    return apiPost('/struktur', data);
  },

  // Add a new structure card
  async addStruktur(data) {
    return apiPost('/struktur/add', data);
  },

  // Delete a structure card by ID
  async deleteStruktur(id) {
    return apiDelete(`/struktur/${id}`);
  },

  // Reset all assignments for a structure type
  async resetStruktur(tipe, tahunAjaranId, semester) {
    return apiPost('/struktur/reset', { tipe, tahun_ajaran_id: tahunAjaranId, semester });
  },

  // ── Category (Sub-Tab) CRUD ──────────────────────────────────────────────
  async fetchKategori(tipe) {
    return apiGet(`/struktur/kategori/${tipe}`, { noCache: true });
  },

  async createKategori(tipe, namaKategori, noUrut = 0) {
    return apiPost('/struktur/kategori', { tipe, nama_kategori: namaKategori, no_urut: noUrut });
  },

  async updateKategori(id, namaKategori, noUrut) {
    return apiPut(`/struktur/kategori/${id}`, { nama_kategori: namaKategori, no_urut: noUrut });
  },

  async deleteKategori(id, force = false) {
    return apiDelete(`/struktur/kategori/${id}${force ? '?force=true' : ''}`);
  },

  // ── Position (Jabatan) Template CRUD ─────────────────────────────────────
  async fetchJabatan(tipe, kategori = null) {
    const qp = kategori ? `?kategori=${encodeURIComponent(kategori)}` : '';
    return apiGet(`/struktur/jabatan/${tipe}${qp}`, { noCache: true });
  },

  async createJabatan(tipe, kategori, namaJabatan, keteranganDefault = null, noUrut = 0) {
    return apiPost('/struktur/jabatan', {
      tipe,
      kategori,
      nama_jabatan: namaJabatan,
      keterangan_default: keteranganDefault,
      no_urut: noUrut
    });
  },

  async updateJabatan(id, namaJabatan, keteranganDefault, noUrut) {
    return apiPut(`/struktur/jabatan/${id}`, {
      nama_jabatan: namaJabatan,
      keterangan_default: keteranganDefault,
      no_urut: noUrut
    });
  },

  async deleteJabatan(id) {
    return apiDelete(`/struktur/jabatan/${id}`);
  },

  // ── Santri / Buku Induk Live Search ──────────────────────────────────────
  async searchSantri(query = '') {
    const qp = query ? `?q=${encodeURIComponent(query)}` : '';
    return apiGet(`/struktur/santri/search${qp}`);
  }
};
