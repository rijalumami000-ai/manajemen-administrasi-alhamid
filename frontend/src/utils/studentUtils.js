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
 * Berdasarkan evaluasi 24 field isian data riil santri.
 */
export function calculateProfileCompleteness(santri) {
  if (!santri) return 0;

  const criteria = [
    // 1. Data Diri & Identitas Pokok (11 Parameter)
    Boolean(santri.nama && String(santri.nama).trim()),
    Boolean(santri.nis && String(santri.nis).trim()),
    Boolean(santri.nik && String(santri.nik).trim()),
    Boolean(santri.jenis_kelamin),
    Boolean(santri.tempat_lahir && String(santri.tempat_lahir).trim()),
    Boolean(santri.tanggal_lahir),
    Boolean(santri.alamat && String(santri.alamat).trim()),
    Boolean(santri.anak_ke !== null && santri.anak_ke !== undefined && santri.anak_ke !== ''),
    Boolean(santri.agama && String(santri.agama).trim()),
    Boolean(santri.status_keluarga && String(santri.status_keluarga).trim()),
    Boolean(santri.foto_url && String(santri.foto_url).trim()),

    // 2. Data Akademik & Asrama (4 Parameter)
    Boolean(santri.kelas_diniyah || santri.kelas_diniyah_id || santri.nama_diniyah),
    Boolean(santri.kelas_sekolah || santri.kelas_sekolah_id || santri.nama_sekolah),
    Boolean(santri.nama_kamar || santri.kamar_id),
    Boolean(santri.tahun_masuk),

    // 3. Data Orang Tua (7 Parameter)
    Boolean(santri.nama_ayah && String(santri.nama_ayah).trim()),
    Boolean(santri.nik_ayah && String(santri.nik_ayah).trim()),
    Boolean(santri.pekerjaan_ayah && String(santri.pekerjaan_ayah).trim()),
    Boolean(santri.nama_ibu && String(santri.nama_ibu).trim()),
    Boolean(santri.nik_ibu && String(santri.nik_ibu).trim()),
    Boolean(santri.pekerjaan_ibu && String(santri.pekerjaan_ibu).trim()),
    Boolean((santri.no_hp_ayah && String(santri.no_hp_ayah).trim()) || (santri.no_hp_ibu && String(santri.no_hp_ibu).trim())),

    // 4. Info Administratif Instansi (2 Parameter)
    Boolean(
      santri.status_masuk &&
      (santri.status_masuk !== 'Pindahan' || (santri.pesantren_sebelumnya && String(santri.pesantren_sebelumnya).trim()))
    ),
    Boolean(
      (santri.sekolah_asal_nama && String(santri.sekolah_asal_nama).trim()) ||
      santri.diterima_kelas_madin ||
      santri.diterima_tanggal_madin
    )
  ];

  const fulfilledCount = criteria.filter(Boolean).length;
  return Math.round((fulfilledCount / criteria.length) * 100);
}

/**
 * Mengambil rincian detail kelengkapan per kategori
 */
export function getProfileCompletenessDetails(santri) {
  if (!santri) return { percentage: 0, fulfilledCount: 0, totalCount: 24 };

  const percentage = calculateProfileCompleteness(santri);
  return {
    percentage,
    isComplete: percentage === 100
  };
}
