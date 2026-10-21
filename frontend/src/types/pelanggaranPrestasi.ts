export interface PelanggaranItem {
  id: number;
  santri_id: number;
  nis?: string | null;
  nama_santri?: string | null;
  foto_url?: string | null;
  tahun_ajaran_id: number;
  tahun_ajaran_kode?: string | null;
  jenis: string;
  tanggal: string;
  deskripsi?: string | null;
  sanksi?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PelanggaranFormData {
  santri_id: number | string;
  tahun_ajaran_id: number | string;
  jenis: string;
  tanggal: string;
  deskripsi?: string | null;
  sanksi?: string | null;
}

export interface PrestasiItem {
  id: number;
  santri_id: number;
  nis?: string | null;
  nama_santri?: string | null;
  foto_url?: string | null;
  tahun_ajaran_id: number;
  tahun_ajaran_kode?: string | null;
  jenis: string;
  tanggal: string;
  deskripsi?: string | null;
  penghargaan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PrestasiFormData {
  santri_id: number | string;
  tahun_ajaran_id: number | string;
  jenis: string;
  tanggal: string;
  deskripsi?: string | null;
  penghargaan?: string | null;
}

export interface TahunAjaranSimple {
  id: number;
  kode: string;
  is_active: boolean | number;
  [key: string]: any;
}

export interface PelanggaranPrestasiDeleteConfirmState {
  isOpen: boolean;
  type: 'pelanggaran' | 'prestasi';
  id: number | null;
  namaSantri: string;
}
