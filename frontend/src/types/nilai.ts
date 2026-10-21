export type InputSectionType = 'muhafadzoh' | 'qiroah' | 'taftisy' | 'ujian_tulis';

export interface KelasItem {
  id: number;
  nama: string;
  tingkat: number | null;
  jenis: string;
  mustahiq_id?: number | null;
  mustahiq_nama?: string | null;
  jumlah_santri?: number;
}

export interface MataPelajaranItem {
  id: number;
  nama: string;
  jenis: 'Reguler' | 'Muhafadzoh' | 'Qiroah' | 'Taftisy' | string;
  tingkat?: number | null;
  keterangan?: string | null;
}

export interface KategoriItem {
  id: number;
  nama: string;
  is_active?: boolean;
}

export interface TahunAjaranItem {
  id: number;
  kode: string;
  nama?: string;
  is_active: boolean;
  semester?: string;
}

export interface MapelTingkatItem {
  id?: number;
  tahun_ajaran_id?: number;
  kategori_evaluasi_id?: number;
  tingkat: number;
  mata_pelajaran_id: number;
}

export interface SantriNilaiItem {
  santri_id: number;
  nama: string;
  nis?: string;
  foto_url?: string | null;
  nilai_angka?: number | string | null;
  predikat?: string;
  capaian?: string;
}

export interface KriteriaConfig {
  id?: number;
  tingkat?: number;
  mata_pelajaran_id?: number;
  tipe_input?: 'Angka' | 'Teks';
  konfigurasi?: any;
}

export interface ConfigTeksItem {
  bab: string;
  predikat: string;
}

export interface RekapRowItem {
  santri_id: number;
  nis: string;
  nama: string;
  total_nilai: number;
  rata_rata: number | string;
  mapel_count?: number;
  peringkat_sistem: number;
  peringkat_manual?: number | null;
  peringkat: number;
  [key: string]: any;
}

export interface ManualRankItem {
  santri_id: number;
  nama: string;
  nis: string;
  total_nilai: number;
  rata_rata: number | string;
  peringkat_sistem: number;
  peringkat_manual: number | string;
}

export interface ManajemenNilaiProps {
  mode?: 'input' | 'rekap' | 'input-ujian';
}
