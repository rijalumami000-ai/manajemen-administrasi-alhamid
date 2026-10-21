export interface SetoranStats {
  totalSantri: number;
  countTuntasGanjil: number;
  countMelampaui: number;
  countBelumSetorPekanIni: number;
}

export interface KriteriaScaleRange {
  min?: number | string;
  max?: number | string;
  range_text?: string;
}

export interface KriteriaInfo {
  is_ganjil?: boolean;
  target_ganjil?: number;
  target_genap?: number;
  total_bab_ganjil?: number;
  total_bab_genap?: number;
  target_ganjil_nama?: string;
  target_genap_nama?: string;
  skala_aktif?: {
    mumtaz?: KriteriaScaleRange;
    jayyid?: KriteriaScaleRange;
    mutawassith?: KriteriaScaleRange;
    rodi?: KriteriaScaleRange;
  };
  skala_bab?: {
    mumtaz?: KriteriaScaleRange;
    jayyid?: KriteriaScaleRange;
    mutawassith?: KriteriaScaleRange;
    rodi?: KriteriaScaleRange;
  };
}

export interface SantriSetoranItem {
  id: number;
  nama: string;
  nis?: string;
  foto_url?: string;
  bait_terakhir: number;
  target_semester: number;
  target_genap: number;
  is_melampaui_ganjil: boolean;
  total_sesi_setoran: number;
  tanggal_setor_terakhir?: string | null;
  status_kelancaran_terakhir?: string | null;
  persentase: number;
  predikat: string;
  nama_bab_terakhir?: string | null;
  bab_index?: number | null;
  has_setor_this_week?: boolean;
}

export interface SetoranOverviewResponse {
  kelas?: {
    id: number;
    nama: string;
    mustahiq_nama?: string;
    muhafadzoh_nama?: string;
  };
  stats?: SetoranStats;
  kriteriaInfo?: KriteriaInfo;
  tipeInput?: 'Angka' | 'Teks' | string;
  is_semester_active?: boolean;
  system_active_semester?: string;
  santriList: SantriSetoranItem[];
}

export interface SetoranHistoryRow {
  id: number;
  tanggal_setor: string;
  status_kelancaran: string;
  tipe_setoran?: 'Bait' | 'Bab' | string;
  jumlah_bait?: number;
  bait_awal?: number;
  bait_akhir?: number;
  nama_bab?: string;
  catatan?: string;
  mustahiq_nama?: string;
}

export interface SantriHistoryResponse {
  santri: {
    id: number;
    nama: string;
    nis?: string;
  };
  riwayat: SetoranHistoryRow[];
}

export interface EditSetoranFormData {
  jumlah_bait: number | string;
  status_kelancaran: string;
  catatan: string;
  tanggal_setor: string;
}

export interface DeleteConfirmModalState {
  isOpen: boolean;
  rowId: number | null;
  dateStr?: string;
}
