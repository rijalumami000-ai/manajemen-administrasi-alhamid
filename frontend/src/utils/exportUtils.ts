import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface ColumnDef {
  title: string;
  dataIndex: string;
  [key: string]: any;
}

export const exportToExcel = (data: any[], filename = 'data-santri.xlsx'): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Santri');
  XLSX.writeFile(workbook, filename);
};

export const exportToPDF = (
  data: any[],
  columns: ColumnDef[],
  title = 'Data Santri',
  filename = 'data-santri.pdf'
): void => {
  const doc = new jsPDF({ orientation: 'landscape' }) as any;
  
  doc.text(title, 14, 15);
  
  const tableData = data.map(item => columns.map(col => item[col.dataIndex] || ''));
  const tableHeaders = columns.map(col => col.title);

  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 20,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }
  });

  doc.save(filename);
};

export const downloadTemplate = (): void => {
  const template = [
    {
      'NIS': '10001',
      'NIK': '3201234567890001',
      'Nama': 'Muhammad Faiz Pratama',
      'Jenis Kelamin': 'Laki-laki',
      'Anak Ke': 1,
      'Agama': 'Islam',
      'Status Keluarga': 'Kandung',
      'Tempat Lahir': 'Cilacap',
      'Tanggal Lahir': '15/05/2009',
      'Alamat': 'Jl. Merdeka No. 12, RT 02/RW 05, Cilacap',
      'Kelas Diniyah': '1 Diniyah',
      'Kelas Sekolah': '7 SMP',
      'Kamar': 'Abu Bakar 01',
      'Tahun Masuk': 2024,
      'Nama Ayah': 'Ahmad Sudirman',
      'NIK Ayah': '3201234567890002',
      'Pekerjaan Ayah': 'Wiraswasta',
      'No HP Ayah': '081234567891',
      'Nama Ibu': 'Siti Aminah',
      'NIK Ibu': '3201234567890003',
      'Pekerjaan Ibu': 'Guru',
      'No HP Ibu': '081234567892',
      'Status Masuk': 'Baru',
      'Pesantren Sebelumnya': '',
      'Sekolah Asal Nama': 'SD Negeri 1 Cilacap',
      'Sekolah Asal Alamat': 'Jl. Ahmad Yani No. 10, Cilacap',
      'Diterima Kelas Madin': '1 Diniyah',
      'Diterima Tanggal Madin': '15/07/2024',
      'Keluar Madin Tanggal': '',
      'Keluar Madin Status': '',
      'Keluar Pondok Tanggal': '',
      'Keluar Pondok Status': '',
      'Keluar Sekolah Tingkat': '',
      'Keluar Sekolah Tanggal': '',
      'Keluar Sekolah Status': '',
      'Status': 'aktif',
      'Catatan': 'Santri baru berprestasi'
    },
    {
      'NIS': '10002',
      'NIK': '3201234567890004',
      'Nama': 'Aisyah Nur Rahmah',
      'Jenis Kelamin': 'Perempuan',
      'Anak Ke': 2,
      'Agama': 'Islam',
      'Status Keluarga': 'Kandung',
      'Tempat Lahir': 'Banyumas',
      'Tanggal Lahir': '22/08/2008',
      'Alamat': 'Jl. Diponegoro No. 45, Banyumas',
      'Kelas Diniyah': '2 Diniyah',
      'Kelas Sekolah': '8 MTs',
      'Kamar': 'Khadijah 02',
      'Tahun Masuk': 2024,
      'Nama Ayah': 'Bambang Irawan',
      'NIK Ayah': '3201234567890005',
      'Pekerjaan Ayah': 'PNS',
      'No HP Ayah': '081345678901',
      'Nama Ibu': 'Khadijah Maryam',
      'NIK Ibu': '3201234567890006',
      'Pekerjaan Ibu': 'Ibu Rumah Tangga',
      'No HP Ibu': '081345678902',
      'Status Masuk': 'Pindahan',
      'Pesantren Sebelumnya': 'Ponpes Al-Falah Purwokerto',
      'Sekolah Asal Nama': 'MTs Al-Falah',
      'Sekolah Asal Alamat': 'Jl. Raya Purwokerto Km. 5',
      'Diterima Kelas Madin': '2 Diniyah',
      'Diterima Tanggal Madin': '20/07/2024',
      'Keluar Madin Tanggal': '',
      'Keluar Madin Status': '',
      'Keluar Pondok Tanggal': '',
      'Keluar Pondok Status': '',
      'Keluar Sekolah Tingkat': '',
      'Keluar Sekolah Tanggal': '',
      'Keluar Sekolah Status': '',
      'Status': 'aktif',
      'Catatan': 'Pindahan dari Ponpes Al-Falah'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import');
  
  XLSX.writeFile(workbook, 'template-import-santri.xlsx');
};
