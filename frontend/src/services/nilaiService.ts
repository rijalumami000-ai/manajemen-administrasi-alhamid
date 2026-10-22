import { apiGet, apiPost } from './apiClient';

export const nilaiService = {
  // Kategori Evaluasi
  fetchKategori: async (): Promise<any> => {
    return apiGet('/nilai/kategori');
  },

  // Kriteria Nilai
  fetchKriteria: async (
    tingkat: string | number,
    mapelId: string | number,
    tahunAjaranId: string | number | null = null,
    kategoriId: string | number | null = null
  ): Promise<any> => {
    let url = `/nilai/kriteria/${tingkat}/${mapelId}`;
    const params: string[] = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategoriId) params.push(`kategori_evaluasi_id=${kategoriId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiGet(url);
  },

  saveKriteria: async (data: any): Promise<any> => {
    return apiPost('/nilai/kriteria', data);
  },

  fetchMapelTingkat: async (
    tahunAjaranId: string | number | null = null,
    kategoriId: string | number | null = null
  ): Promise<any> => {
    let url = '/nilai/mapel-tingkat';
    const params: string[] = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategoriId) params.push(`kategori_evaluasi_id=${kategoriId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiGet(url);
  },

  saveMapelTingkat: async (
    tingkat: string | number,
    mapelIds: (string | number)[],
    tahunAjaranId: string | number | null = null,
    kategoriId: string | number | null = null
  ): Promise<any> => {
    return apiPost('/nilai/mapel-tingkat', { tingkat, mapelIds, tahun_ajaran_id: tahunAjaranId, kategori_evaluasi_id: kategoriId });
  },

  // Nilai Santri
  fetchNilaiSantri: async (filters: Record<string, any>): Promise<any> => {
    const params = new URLSearchParams(filters).toString();
    const data = await apiGet(`/nilai/santri${params ? '?' + params : ''}`);
    if (Array.isArray(data)) {
      return data.map(item => {
        let n = item.nilai_angka;
        if (n !== null && n !== undefined && n !== '') {
          const num = Number(n);
          if (!isNaN(num)) {
            n = Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
          }
        }
        return { ...item, nilai_angka: n };
      });
    }
    return data;
  },

  saveNilaiBulk: async (data: any): Promise<any> => {
    let payload = data;
    if (data && Array.isArray(data.data)) {
      payload = {
        ...data,
        data: data.data.map((item: any) => {
          let n = item.nilai_angka;
          if (n === '' || n === undefined || n === null) {
            n = null;
          } else {
            const num = Number(n);
            n = isNaN(num) ? null : num;
          }
          return {
            ...item,
            nilai_angka: n,
            capaian: item.capaian || null,
            predikat: item.predikat || null
          };
        })
      };
    }
    return apiPost('/nilai/santri/bulk', payload);
  },

  fetchRekapNilai: async (filters: Record<string, any>): Promise<any> => {
    const params = new URLSearchParams(filters).toString();
    const data = await apiGet(`/nilai/rekap${params ? '?' + params : ''}`);
    if (Array.isArray(data)) {
      return data.map(item => {
        let n = item.nilai_angka;
        if (n !== null && n !== undefined && n !== '') {
          const num = Number(n);
          if (!isNaN(num)) {
            n = Number.isInteger(num) ? num : parseFloat(num.toFixed(2));
          }
        }
        return { ...item, nilai_angka: n };
      });
    }
    return data;
  },

  // Rapor Data
  fetchRaporData: async (filters: Record<string, any>): Promise<any> => {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/nilai/rapor${params ? '?' + params : ''}`);
  },

  fetchRekapAbsensiBulanan: async (filters: Record<string, any>): Promise<any> => {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/nilai/rekap-absensi-bulanan${params ? '?' + params : ''}`);
  },

  savePeringkatManual: async (data: any): Promise<any> => {
    return apiPost('/nilai/peringkat-manual', data);
  },

  saveRaporBulk: async (data: any): Promise<any> => {
    return apiPost('/nilai/rapor/bulk', data);
  },

  fetchCetakRapor: async (
    tahunAjaranId: string | number,
    kelasId: string | number,
    kategoriId: string | number,
    santriId: string | number
  ): Promise<any> => {
    return apiGet(`/nilai/rapor-cetak/${tahunAjaranId}/${kelasId}/${kategoriId}/${santriId}`);
  },

  // Master Data
  fetchKelas: async (tahunAjaranId: string | number | null = null): Promise<any> => {
    const query = tahunAjaranId ? `?tahun_ajaran_id=${tahunAjaranId}` : '';
    return apiGet(`/kelas${query}`);
  },

  fetchMataPelajaran: async (): Promise<any> => {
    return apiGet('/mata-pelajaran');
  },

  fetchTahunAjaran: async (): Promise<any> => {
    return apiGet('/tahun-ajaran');
  },

  fetchSantriReport: async (tahunAjaranId: string | number, kategoriId: string | number | null = null): Promise<any> => {
    let url = `/nilai/santri-report?tahun_ajaran_id=${tahunAjaranId}`;
    if (kategoriId) {
      url += `&kategori_id=${kategoriId}`;
    }
    return apiGet(url);
  },

  fetchAkumulasiKelas: async (filters: Record<string, any>): Promise<any> => {
    const params = new URLSearchParams(filters).toString();
    return apiGet(`/nilai/akumulasi-kelas${params ? '?' + params : ''}`);
  },

  fetchMuhafadzohInfo: async (
    tahunAjaranId: string | number,
    kategoriEvaluasiId: string | number
  ): Promise<any> => {
    let url = '/nilai/muhafadzoh-info';
    const params: string[] = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategoriEvaluasiId) params.push(`kategori_evaluasi_id=${kategoriEvaluasiId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiGet(url);
  },

  saveMuhafadzohInfo: async (data: any): Promise<any> => {
    return apiPost('/nilai/muhafadzoh-info', data);
  },

  fetchQiroahMaqro: async (
    tahunAjaranId: string | number,
    kategoriEvaluasiId: string | number
  ): Promise<any> => {
    let url = '/nilai/qiroah-maqro';
    const params: string[] = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategoriEvaluasiId) params.push(`kategori_evaluasi_id=${kategoriEvaluasiId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiGet(url);
  },

  saveQiroahMaqro: async (data: any): Promise<any> => {
    return apiPost('/nilai/qiroah-maqro', data);
  },

  fetchTaftisyMateri: async (
    tahunAjaranId: string | number,
    kategoriEvaluasiId: string | number,
    kelasId: string | number
  ): Promise<any> => {
    let url = '/nilai/taftisy-materi';
    const params: string[] = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategoriEvaluasiId) params.push(`kategori_evaluasi_id=${kategoriEvaluasiId}`);
    if (kelasId) params.push(`kelas_id=${kelasId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiGet(url);
  },

  saveTaftisyMateri: async (data: any): Promise<any> => {
    return apiPost('/nilai/taftisy-materi', data);
  },

  fetchMateriUjianTulis: async (
    tahunAjaranId: string | number,
    kategoriEvaluasiId: string | number,
    tingkat: string | number
  ): Promise<any> => {
    let url = '/nilai/materi-ujian-tulis';
    const params: string[] = [];
    if (tahunAjaranId) params.push(`tahun_ajaran_id=${tahunAjaranId}`);
    if (kategoriEvaluasiId) params.push(`kategori_evaluasi_id=${kategoriEvaluasiId}`);
    if (tingkat !== undefined && tingkat !== null) params.push(`tingkat=${tingkat}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiGet(url);
  },

  saveMateriUjianTulis: async (data: any): Promise<any> => {
    return apiPost('/nilai/materi-ujian-tulis', data);
  },

  fetchKalenderAkademik: async (tahunAjaranId: string | number, semester: string): Promise<any> => {
    return apiGet(`/nilai/kalender-akademik?tahun_ajaran_id=${tahunAjaranId}&semester=${encodeURIComponent(semester)}`);
  },

  saveKalenderAkademik: async (data: any): Promise<any> => {
    return apiPost('/nilai/kalender-akademik', data);
  },

  fetchSilabus: async (
    tahunAjaranId: string | number,
    semester: string,
    tingkat?: string | number | null,
    kelasId?: string | number | null
  ): Promise<any> => {
    let url = `/nilai/silabus?tahun_ajaran_id=${tahunAjaranId}&semester=${encodeURIComponent(semester)}`;
    if (tingkat !== undefined && tingkat !== null) url += `&tingkat=${tingkat}`;
    if (kelasId) url += `&kelas_id=${kelasId}`;
    return apiGet(url);
  },

  saveSilabus: async (data: any): Promise<any> => {
    return apiPost('/nilai/silabus', data);
  }
};

export default nilaiService;
