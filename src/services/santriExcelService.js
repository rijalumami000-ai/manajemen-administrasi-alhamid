const xlsx = require('xlsx');
const db = require('../../db');
const { syncSantriToSpecificTahunAjaran } = require('./tahunAjaranService');
const { nullableInt } = require('../utils/normalizers');

class SantriExcelService {
  excelDateToJSDate(serial) {
    if (!serial) return null;
    if (typeof serial === 'string') return serial; // Already a string
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
  }

  async importFromExcel(buffer, tahunAjaranId) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const stats = {
      total: data.length,
      imported: 0,
      updated: 0,
      errors: []
    };

    // Get reference data for mapping
    const [kelasRes, kamarRes] = await Promise.all([
      db.query('SELECT id, nama, jenis FROM kelas'),
      db.query('SELECT id, nama FROM kamar')
    ]);

    const kelasMap = {};
    kelasRes.rows.forEach(k => {
      const key = `${k.nama.toLowerCase().trim()}_${k.jenis.toLowerCase().trim()}`;
      kelasMap[key] = k.id;
    });

    const kamarMap = {};
    kamarRes.rows.forEach(k => {
      kamarMap[k.nama.toLowerCase().trim()] = k.id;
    });

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        const NIS = row['NIS'] ? row['NIS'].toString().trim() : null;
        const NIK = row['NIK'] ? row['NIK'].toString().trim() : null;
        const Nama = row['Nama'] ? row['Nama'].toString().trim() : null;
        const jk = row['Jenis Kelamin'] ? row['Jenis Kelamin'].toString().trim() : null;
        const tempatLahir = row['Tempat Lahir'] ? row['Tempat Lahir'].toString().trim() : null;
        const tanggalLahir = this.excelDateToJSDate(row['Tanggal Lahir']);
        const Alamat = row['Alamat'] ? row['Alamat'].toString().trim() : null;
        const kelasDiniyahNama = row['Kelas Diniyah'] ? row['Kelas Diniyah'].toString().trim() : null;
        const kelasSekolahNama = row['Kelas Sekolah'] ? row['Kelas Sekolah'].toString().trim() : null;
        const kamarNama = row['Kamar'] ? row['Kamar'].toString().trim() : null;
        const namaAyah = row['Nama Ayah'] ? row['Nama Ayah'].toString().trim() : null;
        const namaIbu = row['Nama Ibu'] ? row['Nama Ibu'].toString().trim() : null;
        const pekerjaanAyah = row['Pekerjaan Ayah'] ? row['Pekerjaan Ayah'].toString().trim() : null;
        const pekerjaanIbu = row['Pekerjaan Ibu'] ? row['Pekerjaan Ibu'].toString().trim() : null;
        const noHpAyah = row['No HP Ayah'] ? row['No HP Ayah'].toString().trim() : null;
        const noHpIbu = row['No HP Ibu'] ? row['No HP Ibu'].toString().trim() : null;
        const status = row['Status'] ? row['Status'].toString().toLowerCase().trim() : 'aktif';
        const catatan = row['Catatan'] ? row['Catatan'].toString().trim() : null;

        if (!NIS || !Nama) {
          stats.errors.push(`Baris ${rowNum}: NIS dan Nama wajib diisi.`);
          continue;
        }

        // Map IDs
        const kelasDiniyahId = kelasDiniyahNama ? kelasMap[`${kelasDiniyahNama.toLowerCase()}_diniyah`] : null;
        const kelasSekolahId = kelasSekolahNama ? kelasMap[`${kelasSekolahNama.toLowerCase()}_sekolah`] : null;
        const kamarId = kamarNama ? kamarMap[kamarNama.toLowerCase()] : null;

        // Start transaction for each santri
        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');

          const existingSantri = await client.query('SELECT id, orangtua_id FROM santri WHERE nis = $1', [NIS]);
          
          let santriId;
          let orangtuaId;

          if (existingSantri.rows.length > 0) {
            santriId = existingSantri.rows[0].id;
            orangtuaId = existingSantri.rows[0].orangtua_id;

            if (orangtuaId) {
              await client.query(
                `UPDATE orangtua SET 
                  nama_ayah = COALESCE($1, nama_ayah), 
                  nama_ibu = COALESCE($2, nama_ibu), 
                  pekerjaan_ayah = COALESCE($3, pekerjaan_ayah), 
                  pekerjaan_ibu = COALESCE($4, pekerjaan_ibu), 
                  no_hp_ayah = COALESCE($5, no_hp_ayah), 
                  no_hp_ibu = COALESCE($6, no_hp_ibu)
                 WHERE id = $7`,
                [namaAyah, namaIbu, pekerjaanAyah, pekerjaanIbu, noHpAyah, noHpIbu, orangtuaId]
              );
            } else if (namaAyah || namaIbu) {
              const otRes = await client.query(
                `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [namaAyah, namaIbu, pekerjaanAyah, pekerjaanIbu, noHpAyah, noHpIbu]
              );
              orangtuaId = otRes.rows[0].id;
            }

            await client.query(
              `UPDATE santri SET 
                nik = COALESCE($1, nik), 
                nama = $2, 
                jenis_kelamin = COALESCE($3, jenis_kelamin), 
                kelas_diniyah_id = COALESCE($4, kelas_diniyah_id), 
                kelas_sekolah_id = COALESCE($5, kelas_sekolah_id), 
                kamar_id = COALESCE($6, kamar_id), 
                tempat_lahir = COALESCE($7, tempat_lahir), 
                tanggal_lahir = COALESCE($8, tanggal_lahir), 
                alamat = COALESCE($9, alamat),
                orangtua_id = $10
               WHERE id = $11`,
              [NIK, Nama, jk, kelasDiniyahId, kelasSekolahId, kamarId, tempatLahir, tanggalLahir, Alamat, orangtuaId, santriId]
            );
            stats.updated++;
          } else {
            if (namaAyah || namaIbu) {
              const otRes = await client.query(
                `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [namaAyah, namaIbu, pekerjaanAyah, pekerjaanIbu, noHpAyah, noHpIbu]
              );
              orangtuaId = otRes.rows[0].id;
            }

            const sRes = await client.query(
              `INSERT INTO santri (nis, nik, nama, jenis_kelamin, kelas_diniyah_id, kelas_sekolah_id, kamar_id, tempat_lahir, tanggal_lahir, alamat, orangtua_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
              [NIS, NIK, Nama, jk, kelasDiniyahId, kelasSekolahId, kamarId, tempatLahir, tanggalLahir, Alamat, orangtuaId]
            );
            santriId = sRes.rows[0].id;
            stats.imported++;
          }

          await syncSantriToSpecificTahunAjaran(santriId, tahunAjaranId, {
            status_tahun_ajaran: status,
            catatan_tahun_ajaran: catatan
          }, client);

          await client.query('COMMIT');
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error(`Error importing row ${rowNum}:`, err);
        stats.errors.push(`Baris ${rowNum}: ${err.message}`);
      }
    }

    return stats;
  }
}

module.exports = new SantriExcelService();
