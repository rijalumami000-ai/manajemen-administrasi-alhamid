export type KelasJenis = 'Diniyah' | 'Sekolah';

export interface KelasItem {
  id: number;
  jenis: KelasJenis;
  nama: string;
  tingkat: number | null;
  created_at?: string;
  mustahiq_id?: number | null;
  muhafadzoh_mapel_id?: number | null;
  qiroatul_mapel_id?: number | null;
  mustahiq_nama?: string | null;
  muhafadzoh_nama?: string | null;
  qiroatul_nama?: string | null;
  jumlah_santri?: number;
}

export interface TahunAjaran {
  id: number;
  kode: string;
  nama?: string;
  is_active: boolean;
  semester?: string;
}

export interface GuruItem {
  id: number;
  nama: string;
  nip?: string;
  status?: string;
}

export interface MapelItem {
  id: number;
  nama: string;
  jenis?: string;
  tingkat?: number | null;
}

export interface KelasFormData {
  jenis: KelasJenis;
  nama: string;
  tingkat: number | null;
  mustahiq_id?: number | null;
  muhafadzoh_mapel_id?: number | null;
  qiroatul_mapel_id?: number | null;
  tahun_ajaran_id?: number | null;
}

