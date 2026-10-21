export type InventarisKategori = 'pondok' | 'madin' | 'pmq';
export type InventarisKondisi = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';

export interface InventarisItem {
  id: number;
  kategori: InventarisKategori | string;
  nama_barang: string;
  kode_barang?: string | null;
  jumlah: number;
  satuan?: string;
  kondisi: InventarisKondisi | string;
  lokasi?: string | null;
  penanggung_jawab?: string | null;
  keterangan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InventarisFormData {
  kategori: string;
  nama_barang: string;
  kode_barang?: string | null;
  jumlah: number;
  satuan: string;
  kondisi: string;
  lokasi?: string | null;
  penanggung_jawab?: string | null;
  keterangan?: string | null;
}

export interface InventarisRekapCategory {
  kategori: string;
  total_item: number;
  total_kuantitas: number;
  baik: number;
  rusak_ringan: number;
  rusak_berat: number;
}

export interface InventarisRekapTotal {
  total_item: number;
  total_kuantitas: number;
  baik: number;
  rusak_ringan: number;
  rusak_berat: number;
}

export interface InventarisRekapResponse {
  total: InventarisRekapTotal;
  kategori: InventarisRekapCategory[];
}

export interface InventarisFilterParams {
  kategori?: string;
  kondisi?: string;
  search?: string;
}

export interface InventarisDeleteConfirmState {
  isOpen: boolean;
  itemId: number | null;
  itemNama: string;
}
