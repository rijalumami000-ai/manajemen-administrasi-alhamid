export interface GuruItem {
  id: number;
  nip?: string | null;
  nama: string;
  mata_pelajaran_id?: number | null;
  mata_pelajaran?: string | null;
  jabatan_id?: number | null;
  jabatan?: string | null;
  no_hp?: string | null;
  alamat?: string | null;
  status: 'Aktif' | 'Cuti' | 'Pensiun' | string;
  foto_url?: string | null;
  ttd_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MataPelajaranItem {
  id: number;
  nama: string;
  nama_arab?: string | null;
  jenis?: string | null;
  tingkat?: number | null;
  created_at?: string;
}

export interface JabatanItem {
  id: number;
  nama: string;
  keterangan?: string | null;
  created_at?: string;
}

export interface GuruFormData {
  nip?: string | null;
  nama: string;
  mata_pelajaran_id: number | null;
  jabatan_id: number | null;
  no_hp: string;
  status: string;
  alamat: string;
}

export interface MasterFormData {
  nama: string;
  nama_arab?: string;
}
