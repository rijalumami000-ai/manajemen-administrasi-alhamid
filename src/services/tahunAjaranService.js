const db = require('../../db');
const { normalizeSantriStatus, normalizeText } = require('../utils/normalizers');

async function getActiveTahunAjaran(client = db) {
  const result = await client.query('SELECT * FROM tahun_ajaran WHERE is_active = TRUE LIMIT 1');
  return result.rows[0] || null;
}

async function syncSantriToActiveTahunAjaran(santriId, options = {}, client = db) {
  const activeYear = await getActiveTahunAjaran(client);
  if (!activeYear) {
    return null;
  }

  return await syncSantriToSpecificTahunAjaran(santriId, activeYear.id, options, client);
}

async function syncSantriToSpecificTahunAjaran(santriId, tahunAjaranId, options = {}, client = db) {
  const status = normalizeSantriStatus(options.status_tahun_ajaran);
  const catatan = normalizeText(options.catatan_tahun_ajaran);

  console.log(`📌 syncSantriToSpecificTahunAjaran called:`, {
    santriId,
    tahunAjaranId,
    tahunAjaranId_type: typeof tahunAjaranId,
    status,
    catatan
  });

  const result = await client.query(`
    INSERT INTO santri_tahun_ajaran (
      tahun_ajaran_id, santri_id, kelas_diniyah_id, kelas_sekolah_id, kamar_id, status, catatan,
      nis, nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat,
      nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu, updated_at
    )
    SELECT
      $1, s.id, s.kelas_diniyah_id, s.kelas_sekolah_id, s.kamar_id, $3, $4,
      s.nis, s.nik, s.nama, s.jenis_kelamin, s.tempat_lahir, s.tanggal_lahir, s.alamat,
      o.nama_ayah, o.nama_ibu, o.pekerjaan_ayah, o.pekerjaan_ibu, o.no_hp_ayah, o.no_hp_ibu, NOW()
    FROM santri s
    LEFT JOIN orangtua o ON s.orangtua_id = o.id
    WHERE s.id = $2
    ON CONFLICT (tahun_ajaran_id, santri_id) DO UPDATE SET
      kelas_diniyah_id = EXCLUDED.kelas_diniyah_id,
      kelas_sekolah_id = EXCLUDED.kelas_sekolah_id,
      kamar_id = EXCLUDED.kamar_id,
      status = EXCLUDED.status,
      catatan = EXCLUDED.catatan,
      nis = EXCLUDED.nis,
      nik = EXCLUDED.nik,
      nama = EXCLUDED.nama,
      jenis_kelamin = EXCLUDED.jenis_kelamin,
      tempat_lahir = EXCLUDED.tempat_lahir,
      tanggal_lahir = EXCLUDED.tanggal_lahir,
      alamat = EXCLUDED.alamat,
      nama_ayah = EXCLUDED.nama_ayah,
      nama_ibu = EXCLUDED.nama_ibu,
      pekerjaan_ayah = EXCLUDED.pekerjaan_ayah,
      pekerjaan_ibu = EXCLUDED.pekerjaan_ibu,
      no_hp_ayah = EXCLUDED.no_hp_ayah,
      no_hp_ibu = EXCLUDED.no_hp_ibu,
      updated_at = NOW()
    RETURNING *
  `, [tahunAjaranId, santriId, status, catatan]);

  console.log(`✅ Inserted/Updated santri_tahun_ajaran:`, result.rows[0]);

  // Sync to alumni table if status is pindah/keluar, or delete if active again
  if (status === 'pindah' || status === 'keluar') {
    console.log(`🔄 Student ${santriId} status is ${status}. Syncing to alumni table as 'pindah'...`);
    // Get student details
    const santriResult = await client.query(`
      SELECT s.nis, s.nik, s.nama, s.tempat_lahir, s.tanggal_lahir, s.alamat,
             kd.nama AS kelas_diniyah, ks.nama AS kelas_sekolah
      FROM santri s
      LEFT JOIN kelas kd ON s.kelas_diniyah_id = kd.id
      LEFT JOIN kelas ks ON s.kelas_sekolah_id = ks.id
      WHERE s.id = $1
    `, [santriId]);

    if (santriResult.rows.length > 0) {
      const santri = santriResult.rows[0];
      const yearResult = await client.query('SELECT tahun_selesai, kode FROM tahun_ajaran WHERE id = $1', [tahunAjaranId]);
      const yearInfo = yearResult.rows[0];
      const tahunLulus = yearInfo ? yearInfo.tahun_selesai : new Date().getFullYear();
      const yearKode = yearInfo ? yearInfo.kode : '';

      const kelasArray = [];
      if (santri.kelas_diniyah) kelasArray.push(santri.kelas_diniyah);
      if (santri.kelas_sekolah) kelasArray.push(santri.kelas_sekolah);
      const kelasTerakhir = kelasArray.join(' / ') || null;

      await client.query(`
        INSERT INTO alumni (
          santri_id, nis, nik, nama, tempat_lahir, tanggal_lahir,
          tahun_lulus, kelas_terakhir, alamat, keterangan, tahun_ajaran_id, tipe
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (santri_id) DO UPDATE SET
          tahun_lulus = EXCLUDED.tahun_lulus,
          kelas_terakhir = EXCLUDED.kelas_terakhir,
          keterangan = EXCLUDED.keterangan,
          tahun_ajaran_id = EXCLUDED.tahun_ajaran_id,
          tipe = EXCLUDED.tipe
      `, [
        santriId,
        santri.nis,
        santri.nik,
        santri.nama,
        santri.tempat_lahir,
        santri.tanggal_lahir,
        tahunLulus,
        kelasTerakhir,
        santri.alamat,
        catatan || `Pindah/keluar pada tahun ajaran ${yearKode}`,
        tahunAjaranId,
        'pindah'
      ]);
      console.log(`✅ Alumni record (pindah) synced successfully for santri ${santriId}`);
    }
  } else {
    // Delete from alumni if student becomes active again
    console.log(`🔄 Student ${santriId} status is ${status} (active). Deleting from alumni if exists...`);
    await client.query('DELETE FROM alumni WHERE santri_id = $1', [santriId]);
  }

  return result.rows[0] || null;
}

module.exports = {
  getActiveTahunAjaran,
  syncSantriToActiveTahunAjaran,
  syncSantriToSpecificTahunAjaran,
};
