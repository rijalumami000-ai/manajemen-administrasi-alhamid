export type MateriSidangKategori = 'madin' | 'pmq' | 'pondok' | 'haflah';

export interface MateriSidangItem {
  id: number;
  tahun_ajaran_id?: number | null;
  tahun_masehi?: string | null;
  kategori: MateriSidangKategori | string;
  judul: string;
  no_surat?: string | null;
  tanggal?: string | null;
  halaman?: number | null;
  ukuran?: string | null;
  status?: string | null;
  pengesah?: string | null;
  ringkasan?: string | null;
  file_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MateriSidangFormData {
  tahun_ajaran_id?: number | null;
  tahun_masehi?: string;
  kategori: string;
  judul: string;
  no_surat?: string;
  tanggal?: string;
  halaman?: number | string;
  ukuran?: string;
  status?: string;
  pengesah?: string;
  ringkasan?: string;
}

export interface MateriSidangDeleteConfirmState {
  isOpen: boolean;
  id: number | null;
  judul: string;
}
