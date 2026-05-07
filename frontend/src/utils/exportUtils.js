import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data, filename = 'data-santri.xlsx') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Santri');
  XLSX.writeFile(workbook, filename);
};

export const exportToPDF = (data, columns, title = 'Data Santri', filename = 'data-santri.pdf') => {
  const doc = jsPDF({ orientation: 'landscape' });
  
  doc.text(title, 14, 15);
  
  const tableData = data.map(item => columns.map(col => item[col.dataIndex] || ''));
  const tableHeaders = columns.map(col => col.title);

  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 20,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillStyle: [41, 128, 185], textColor: 255 }
  });

  doc.save(filename);
};

export const downloadTemplate = () => {
  const template = [
    {
      'NIS': '12345',
      'NIK': '3201234567890001',
      'Nama': 'Ahmad Fauzi',
      'Jenis Kelamin': 'L',
      'Tempat Lahir': 'Jakarta',
      'Tanggal Lahir': '2010-01-01',
      'Alamat': 'Jl. Kebon Jeruk No. 1',
      'Kelas Diniyah': '1 Diniyah',
      'Kelas Sekolah': '7 SMP',
      'Kamar': 'Abu Bakar 01',
      'Nama Ayah': 'Sulaiman',
      'Nama Ibu': 'Siti',
      'Pekerjaan Ayah': 'Buruh',
      'Pekerjaan Ibu': 'IRT',
      'No HP Ayah': '08123456789',
      'No HP Ibu': '08123456780',
      'Status': 'aktif',
      'Catatan': '-'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Import');
  
  // Add instructions or validation if needed
  XLSX.writeFile(workbook, 'template-import-santri.xlsx');
};
