import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const strukturService = {
  // Fetch academic years
  async fetchTahunAjaran(): Promise<any> {
    return apiGet('/tahun-ajaran', { noCache: true });
  },

  // Fetch structure cards by type
  async fetchStruktur(
    tipe: string,
    tahunAjaranId?: number | string | null,
    kategori?: string | null,
    semester?: string | null
  ): Promise<any> {
    const params = new URLSearchParams();
    if (tahunAjaranId) params.append('tahun_ajaran_id', String(tahunAjaranId));
    if (kategori && kategori !== 'ALL') params.append('kategori', kategori);
    if (semester) params.append('semester', semester);
    const qp = params.toString() ? `?${params.toString()}` : '';
    return apiGet(`/struktur/${tipe}${qp}`, { noCache: true });
  },

  // Update a structure position assignment
  async updateStruktur(data: any): Promise<any> {
    return apiPost('/struktur', data);
  },

  // Add a new structure card
  async addStruktur(data: any): Promise<any> {
    return apiPost('/struktur/add', data);
  },

  // Delete a structure card by ID
  async deleteStruktur(id: number | string): Promise<any> {
    return apiDelete(`/struktur/${id}`);
  },

  // Reset all assignments for a structure type
  async resetStruktur(tipe: string, tahunAjaranId?: number | string | null, semester?: string | null): Promise<any> {
    return apiPost('/struktur/reset', { tipe, tahun_ajaran_id: tahunAjaranId, semester });
  },

  // ── Category (Sub-Tab) CRUD ──────────────────────────────────────────────
  async fetchKategori(tipe: string): Promise<any> {
    return apiGet(`/struktur/kategori/${tipe}`, { noCache: true });
  },

  async createKategori(tipe: string, namaKategori: string, noUrut = 0): Promise<any> {
    return apiPost('/struktur/kategori', { tipe, nama_kategori: namaKategori, no_urut: noUrut });
  },

  async updateKategori(id: number | string, namaKategori: string, noUrut: number): Promise<any> {
    return apiPut(`/struktur/kategori/${id}`, { nama_kategori: namaKategori, no_urut: noUrut });
  },

  async deleteKategori(id: number | string, force = false): Promise<any> {
    return apiDelete(`/struktur/kategori/${id}${force ? '?force=true' : ''}`);
  },

  // ── Position (Jabatan) Template CRUD ─────────────────────────────────────
  async fetchJabatan(tipe: string, kategori: string | null = null): Promise<any> {
    const qp = kategori ? `?kategori=${encodeURIComponent(kategori)}` : '';
    return apiGet(`/struktur/jabatan/${tipe}${qp}`, { noCache: true });
  },

  async createJabatan(
    tipe: string,
    kategori: string,
    namaJabatan: string,
    keteranganDefault: string | null = null,
    noUrut = 0
  ): Promise<any> {
    return apiPost('/struktur/jabatan', {
      tipe,
      kategori,
      nama_jabatan: namaJabatan,
      keterangan_default: keteranganDefault,
      no_urut: noUrut
    });
  },

  async updateJabatan(
    id: number | string,
    namaJabatan: string,
    keteranganDefault: string | null,
    noUrut: number
  ): Promise<any> {
    return apiPut(`/struktur/jabatan/${id}`, {
      nama_jabatan: namaJabatan,
      keterangan_default: keteranganDefault,
      no_urut: noUrut
    });
  },

  async deleteJabatan(id: number | string): Promise<any> {
    return apiDelete(`/struktur/jabatan/${id}`);
  },

  // ── Santri / Buku Induk Live Search ──────────────────────────────────────
  async searchSantri(query = ''): Promise<any> {
    const qp = query ? `?q=${encodeURIComponent(query)}` : '';
    return apiGet(`/struktur/santri/search${qp}`);
  }
};

export default strukturService;
