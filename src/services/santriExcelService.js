const xlsx = require('xlsx');
const db = require('../../db');
const { syncSantriToSpecificTahunAjaran } = require('./tahunAjaranService');
const { nullableInt } = require('../utils/normalizers');

class SantriExcelService {
  excelDateToJSDate(serial) {
    if (!serial) return null;
    if (serial instanceof Date) {
      if (isNaN(serial.getTime())) return null;
      return serial.toISOString().split('T')[0];
    }
    if (typeof serial === 'string') {
      const trimmed = serial.trim();
      if (!trimmed) return null;
      // Handle format DD/MM/YYYY atau DD-MM-YYYY
      const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, '0');
        const month = dmyMatch[2].padStart(2, '0');
        const year = dmyMatch[3];
        return `${year}-${month}-${day}`;
      }
      // Handle format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      const dt = new Date(trimmed);
      if (!isNaN(dt.getTime())) {
        return dt.toISOString().split('T')[0];
      }
      return null;
    }
    if (typeof serial === 'number') {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().split('T')[0];
    }
    return null;
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
        const anakKe = row['Anak Ke'] !== undefined && row['Anak Ke'] !== null && row['Anak Ke'] !== '' ? parseInt(row['Anak Ke']) : null;
        const agama = row['Agama'] ? row['Agama'].toString().trim() : 'Islam';
        const statusKeluarga = row['Status Keluarga'] ? row['Status Keluarga'].toString().trim() : 'Kandung';
        const tempatLahir = row['Tempat Lahir'] ? row['Tempat Lahir'].toString().trim() : null;
        const tanggalLahir = this.excelDateToJSDate(row['Tanggal Lahir']);
        const Alamat = row['Alamat'] ? row['Alamat'].toString().trim() : null;
        const tahunMasuk = row['Tahun Masuk'] ? parseInt(row['Tahun Masuk']) : null;
        const kelasDiniyahNama = row['Kelas Diniyah'] ? row['Kelas Diniyah'].toString().trim() : null;
        const kelasSekolahNama = row['Kelas Sekolah'] ? row['Kelas Sekolah'].toString().trim() : null;
        const kamarNama = row['Kamar'] ? row['Kamar'].toString().trim() : null;
        const namaAyah = row['Nama Ayah'] ? row['Nama Ayah'].toString().trim() : null;
        const nikAyah = row['NIK Ayah'] ? row['NIK Ayah'].toString().trim() : null;
        const namaIbu = row['Nama Ibu'] ? row['Nama Ibu'].toString().trim() : null;
        const nikIbu = row['NIK Ibu'] ? row['NIK Ibu'].toString().trim() : null;
        const pekerjaanAyah = row['Pekerjaan Ayah'] ? row['Pekerjaan Ayah'].toString().trim() : null;
        const pekerjaanIbu = row['Pekerjaan Ibu'] ? row['Pekerjaan Ibu'].toString().trim() : null;
        const noHpAyah = row['No HP Ayah'] ? row['No HP Ayah'].toString().trim() : null;
        const noHpIbu = row['No HP Ibu'] ? row['No HP Ibu'].toString().trim() : null;
        const statusMasuk = row['Status Masuk'] ? row['Status Masuk'].toString().trim() : 'Baru';
        const pesantrenSebelumnya = row['Pesantren Sebelumnya'] ? row['Pesantren Sebelumnya'].toString().trim() : null;
        const sekolahAsalNama = row['Sekolah Asal Nama'] ? row['Sekolah Asal Nama'].toString().trim() : null;
        const sekolahAsalAlamat = row['Sekolah Asal Alamat'] ? row['Sekolah Asal Alamat'].toString().trim() : null;
        const diterimaKelasMadin = row['Diterima Kelas Madin'] ? row['Diterima Kelas Madin'].toString().trim() : null;
        const diterimaTanggalMadin = this.excelDateToJSDate(row['Diterima Tanggal Madin']);
        const keluarMadinTanggal = this.excelDateToJSDate(row['Keluar Madin Tanggal']);
        const keluarMadinStatus = row['Keluar Madin Status'] ? row['Keluar Madin Status'].toString().trim() : null;
        const keluarPondokTanggal = this.excelDateToJSDate(row['Keluar Pondok Tanggal']);
        const keluarPondokStatus = row['Keluar Pondok Status'] ? row['Keluar Pondok Status'].toString().trim() : null;
        const keluarSekolahTingkat = row['Keluar Sekolah Tingkat'] ? row['Keluar Sekolah Tingkat'].toString().trim() : null;
        const keluarSekolahTanggal = this.excelDateToJSDate(row['Keluar Sekolah Tanggal']);
        const keluarSekolahStatus = row['Keluar Sekolah Status'] ? row['Keluar Sekolah Status'].toString().trim() : null;
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
                  no_hp_ibu = COALESCE($6, no_hp_ibu),
                  nik_ayah = COALESCE($7, nik_ayah),
                  nik_ibu = COALESCE($8, nik_ibu)
                 WHERE id = $9`,
                [namaAyah, namaIbu, pekerjaanAyah, pekerjaanIbu, noHpAyah, noHpIbu, nikAyah, nikIbu, orangtuaId]
              );
            } else if (namaAyah || namaIbu || nikAyah || nikIbu) {
              const otRes = await client.query(
                `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu, nik_ayah, nik_ibu)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [namaAyah, namaIbu, pekerjaanAyah, pekerjaanIbu, noHpAyah, noHpIbu, nikAyah, nikIbu]
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
                orangtua_id = $10,
                tahun_masuk = COALESCE($11, tahun_masuk),
                anak_ke = COALESCE($12, anak_ke),
                agama = COALESCE($13, agama),
                status_keluarga = COALESCE($14, status_keluarga),
                status_masuk = COALESCE($15, status_masuk),
                pesantren_sebelumnya = COALESCE($16, pesantren_sebelumnya),
                sekolah_asal_nama = COALESCE($17, sekolah_asal_nama),
                sekolah_asal_alamat = COALESCE($18, sekolah_asal_alamat),
                diterima_kelas_madin = COALESCE($19, diterima_kelas_madin),
                diterima_tanggal_madin = COALESCE($20, diterima_tanggal_madin),
                keluar_madin_tanggal = COALESCE($21, keluar_madin_tanggal),
                keluar_madin_status = COALESCE($22, keluar_madin_status),
                keluar_pondok_tanggal = COALESCE($23, keluar_pondok_tanggal),
                keluar_pondok_status = COALESCE($24, keluar_pondok_status),
                keluar_sekolah_tingkat = COALESCE($25, keluar_sekolah_tingkat),
                keluar_sekolah_tanggal = COALESCE($26, keluar_sekolah_tanggal),
                keluar_sekolah_status = COALESCE($27, keluar_sekolah_status)
               WHERE id = $28`,
              [
                NIK, Nama, jk, kelasDiniyahId, kelasSekolahId, kamarId, tempatLahir, tanggalLahir, Alamat, orangtuaId,
                tahunMasuk, anakKe, agama, statusKeluarga, statusMasuk, pesantrenSebelumnya, sekolahAsalNama, sekolahAsalAlamat,
                diterimaKelasMadin, diterimaTanggalMadin,
                keluarMadinTanggal, keluarMadinStatus,
                keluarPondokTanggal, keluarPondokStatus,
                keluarSekolahTingkat, keluarSekolahTanggal, keluarSekolahStatus,
                santriId
              ]
            );
            stats.updated++;
          } else {
            if (namaAyah || namaIbu || nikAyah || nikIbu) {
              const otRes = await client.query(
                `INSERT INTO orangtua (nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu, nik_ayah, nik_ibu)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [namaAyah, namaIbu, pekerjaanAyah, pekerjaanIbu, noHpAyah, noHpIbu, nikAyah, nikIbu]
              );
              orangtuaId = otRes.rows[0].id;
            }

            const sRes = await client.query(
              `INSERT INTO santri (
                nis, nik, nama, jenis_kelamin, kelas_diniyah_id, kelas_sekolah_id, kamar_id, tempat_lahir, tanggal_lahir, alamat, orangtua_id,
                tahun_masuk, anak_ke, agama, status_keluarga, status_masuk, pesantren_sebelumnya, sekolah_asal_nama, sekolah_asal_alamat,
                diterima_kelas_madin, diterima_tanggal_madin,
                keluar_madin_tanggal, keluar_madin_status,
                keluar_pondok_tanggal, keluar_pondok_status,
                keluar_sekolah_tingkat, keluar_sekolah_tanggal, keluar_sekolah_status
              )
              VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16, $17, $18, $19,
                $20, $21,
                $22, $23,
                $24, $25,
                $26, $27, $28
              ) RETURNING id`,
              [
                NIS, NIK, Nama, jk, kelasDiniyahId, kelasSekolahId, kamarId, tempatLahir, tanggalLahir, Alamat, orangtuaId,
                tahunMasuk, anakKe, agama, statusKeluarga, statusMasuk, pesantrenSebelumnya, sekolahAsalNama, sekolahAsalAlamat,
                diterimaKelasMadin, diterimaTanggalMadin,
                keluarMadinTanggal, keluarMadinStatus,
                keluarPondokTanggal, keluarPondokStatus,
                keluarSekolahTingkat, keluarSekolahTanggal, keluarSekolahStatus
              ]
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
