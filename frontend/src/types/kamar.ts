export type KamarJenis = 'Putra' | 'Putri';
export type KamarStatus = 'Tersedia' | 'Penuh' | 'Maintenance';

export interface KamarItem {
  id: number;
  nama: string;
  gedung?: string | null;
  lantai?: number | null;
  kapasitas: number;
  terisi: number;
  terisi_real?: number;
  jenis: KamarJenis | string;
  status?: KamarStatus | string;
  fasilitas?: string | null;
  keterangan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface KamarFormData {
  nama: string;
  jenis: string;
  gedung?: string | null;
  lantai?: number | null;
  kapasitas: number;
  terisi?: number;
  status?: string;
  fasilitas?: string | null;
  keterangan?: string | null;
}

export interface KamarAnggotaSantri {
  id: number;
  nama: string;
  nis?: string | null;
  jenis_kelamin?: string;
  foto_url?: string | null;
  alamat?: string | null;
  kelas_diniyah?: string | null;
  kelas_sekolah?: string | null;
}

export interface KamarDetailResponse {
  kamar: KamarItem;
  anggota: KamarAnggotaSantri[];
}

export interface KamarDeleteConfirmState {
  isOpen: boolean;
  kamarId: number | null;
  kamarNama: string;
}
