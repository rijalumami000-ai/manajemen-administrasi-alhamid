/**
 * Format tanggal ke format DD/MM/YYYY (contoh: 15/07/2024)
 */
export function formatDateDMY(dateInput) {
  if (!dateInput) return '-';
  try {
    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      if (!trimmed) return '-';
      // Jika sudah DD/MM/YYYY
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        return trimmed;
      }
      // Jika YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        const [y, m, d] = trimmed.substring(0, 10).split('-');
        return `${d}/${m}/${y}`;
      }
    }
    const dt = new Date(dateInput);
    if (isNaN(dt.getTime())) return String(dateInput);
    const day = String(dt.getDate()).padStart(2, '0');
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const year = dt.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Menghitung persentase validitas kelengkapan profil santri
 * Berdasarkan isian nyata seluruh field yang relevan.
 */
export function calculateProfileCompleteness(santri) {
  if (!santri) return 0;

  const criteria = [
    // 1. Data Diri Pokok
    Boolean(santri.nama && santri.nama.trim()),
    Boolean(santri.nis && String(santri.nis).trim()),
    Boolean(santri.nik && String(santri.nik).trim()),
    Boolean(santri.jenis_kelamin),
    Boolean(santri.tempat_lahir && santri.tempat_lahir.trim()),
    Boolean(santri.tanggal_lahir),
    Boolean(santri.alamat && santri.alamat.trim()),
    
    // 2. Data Identitas Tambahan
    Boolean(santri.anak_ke !== null && santri.anak_ke !== undefined && santri.anak_ke !== ''),
    Boolean(santri.status_keluarga),
    
    // 3. Data Orang Tua
    Boolean(santri.nama_ayah && santri.nama_ayah.trim()),
    Boolean(santri.nik_ayah && String(santri.nik_ayah).trim()),
    Boolean(santri.nama_ibu && santri.nama_ibu.trim()),
    Boolean(santri.nik_ibu && String(santri.nik_ibu).trim()),
    Boolean((santri.no_hp_ayah && santri.no_hp_ayah.trim()) || (santri.no_hp_ibu && santri.no_hp_ibu.trim())),

    // 4. Info Administratif Instansi
    Boolean(
      santri.status_masuk &&
      (santri.status_masuk !== 'Pindahan' || (santri.pesantren_sebelumnya && santri.pesantren_sebelumnya.trim()))
    ),
    Boolean(santri.sekolah_asal_nama && santri.sekolah_asal_nama.trim()),
    Boolean(santri.diterima_kelas_madin || santri.diterima_tanggal_madin),

    // 5. Foto Profil
    Boolean(santri.foto_url)
  ];

  const fulfilledCount = criteria.filter(Boolean).length;
  return Math.round((fulfilledCount / criteria.length) * 100);
}
