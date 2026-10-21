// =============================================================================
// STRUKTUR ORGANISASI & MADRASAH DINIYAH TYPE DEFINITIONS
// Refers to backend contract in src/routes/strukturRoutes.js
// =============================================================================

import type { LucideIcon } from 'lucide-react';

export interface StrukturItem {
  id: number;
  tipe: string;
  kategori: string;
  jabatan: string;
  guru_id: number | null;
  santri_id: number | null;
  nama_custom: string | null;
  alamat: string | null;
  keterangan: string | null;
  no_urut: number;
  tahun_ajaran_id: number | null;
  semester: string | null;
  guru_nama?: string | null;
  guru_no_hp?: string | null;
  guru_foto_url?: string | null;
  santri_nama?: string | null;
  santri_nis?: string | null;
  santri_foto_url?: string | null;
  santri_alamat?: string | null;
  display_nama: string;
  display_foto_url?: string | null;
  display_alamat?: string | null;
}

export interface KategoriItem {
  id?: number;
  tipe?: string;
  nama_kategori: string;
  no_urut?: number;
  sem?: string;
}

export interface JabatanTemplateItem {
  id: number;
  tipe: string;
  kategori: string;
  nama_jabatan: string;
  keterangan_default: string | null;
  no_urut: number;
}

export interface TahunAjaranItem {
  id: number;
  nama?: string;
  kode?: string;
  tahun_mulai?: number;
  tahun_selesai?: number;
  semester?: string;
  is_active: boolean;
}

export interface SantriSearchResult {
  id: number;
  nama: string;
  nis?: string;
  kamar?: string;
  kelas?: string;
  alamat?: string;
  foto_url?: string | null;
}

export interface MainTabItem {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  desc: string;
  isSemester?: boolean;
}

export interface DeleteConfirmState {
  isOpen: boolean;
  nodeId: number | null;
  jabatan: string;
  nama: string;
}

export interface PersonFormData {
  id?: number;
  tipe: string;
  kategori: string;
  jabatan: string;
  guru_id: number | null;
  santri_id: number | null;
  nama_custom: string | null;
  alamat: string | null;
  keterangan: string | null;
  no_urut: number;
  tahun_ajaran_id: number | null;
  semester: string | null;
}

export interface GuruItem {
  id: number;
  nama: string;
  no_hp?: string | null;
  nip?: string | null;
  foto_url?: string | null;
  [key: string]: any;
}

export interface GroupedSection {
  isSection: boolean;
  item?: StrukturItem;
  title?: string;
  koordinator?: StrukturItem | null;
  anggota?: StrukturItem[];
}

export interface StrukturKepesantrenanProps {
  defaultTab?: string;
}

