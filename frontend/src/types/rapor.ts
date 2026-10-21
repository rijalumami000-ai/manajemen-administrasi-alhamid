// =============================================================================
// RAPOR PRINT & STATISTIK — TYPESCRIPT DEFINITIONS
// Option A: macOS Sequoia & VisionOS Translucent Acrylic Skeuomorphism
// =============================================================================

export interface RaporSantriInfo {
  id?: number;
  santri_id?: number;
  nis?: string;
  nama?: string;
  jenis_kelamin?: 'L' | 'P' | string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  alamat?: string;
  nama_ayah?: string;
  nama_ibu?: string;
  nomor_induk?: string;
  no_induk?: string;
  [key: string]: any;
}

export interface RaporKelasInfo {
  id?: number;
  nama?: string;
  tingkat?: number | string;
  wali_kelas?: string;
  mustahiq?: string;
  [key: string]: any;
}

export interface RaporNilaiItem {
  mapel_id?: number;
  mapel_nama?: string;
  mapel_nama_arab?: string;
  mapel_jenis?: 'Reguler' | 'Muhafadzoh' | 'Qiroah' | 'Taftisy' | string;
  kkm?: number | null;
  nilai_angka?: number | null;
  nilai_huruf?: string | null;
  predikat?: string | null;
  capaian?: string | null;
  catatan?: string | null;
  [key: string]: any;
}

export interface RaporData {
  santri?: RaporSantriInfo;
  kelas?: RaporKelasInfo;
  tahun_ajaran?: string;
  semester?: string;
  nilai?: RaporNilaiItem[];
  tambahan?: Record<string, any>;
  statistik?: {
    peringkat?: number | string;
    total?: number;
    rata_rata?: number;
    jumlah_santri?: number;
  };
  settings?: Record<string, any>;
}
