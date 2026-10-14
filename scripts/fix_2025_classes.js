const db = require('../db');

async function fix2025Classes() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🚀 Starting restoration of 2025-2026 classes and santri records...');

    // 1. Ensure kelas 5A, 5B, 6 exist in `kelas` table
    console.log('Step 1: Upserting distinct classes 5A, 5B, 6 into `kelas`...');
    
    // 5A (Tingkat 5, Mustahiq Ust. Muhson Tsatibi: id 20)
    const res5A = await client.query(`
      INSERT INTO kelas (jenis, nama, tingkat, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
      VALUES ('Diniyah', '5A', 5, 20, 3, 31)
      ON CONFLICT (jenis, nama) DO UPDATE 
      SET tingkat = 5, mustahiq_id = 20, muhafadzoh_mapel_id = 3, qiroatul_mapel_id = 31
      RETURNING id, nama, tingkat;
    `);
    const id5A = res5A.rows[0].id;
    console.log(`✅ Kelas 5A id: ${id5A}`);

    // 5B (Tingkat 5, Mustahiq Ust. Muhammad Choirul Wafa: id 4)
    const res5B = await client.query(`
      INSERT INTO kelas (jenis, nama, tingkat, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
      VALUES ('Diniyah', '5B', 5, 4, 3, 31)
      ON CONFLICT (jenis, nama) DO UPDATE 
      SET tingkat = 5, mustahiq_id = 4, muhafadzoh_mapel_id = 3, qiroatul_mapel_id = 31
      RETURNING id, nama, tingkat;
    `);
    const id5B = res5B.rows[0].id;
    console.log(`✅ Kelas 5B id: ${id5B}`);

    // 6 (Tingkat 6, Mustahiq Ust. Ahmad Syukron Rosyid: id 21)
    const res6 = await client.query(`
      INSERT INTO kelas (jenis, nama, tingkat, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
      VALUES ('Diniyah', '6', 6, 21, 3, 31)
      ON CONFLICT (jenis, nama) DO UPDATE 
      SET tingkat = 6, mustahiq_id = 21, muhafadzoh_mapel_id = 3, qiroatul_mapel_id = 31
      RETURNING id, nama, tingkat;
    `);
    const id6 = res6.rows[0].id;
    console.log(`✅ Kelas 6 id: ${id6}`);

    // Verify 2026-2027 classes (55 -> 5, 58 -> 6A, 57 -> 6B)
    console.log('Step 2: Ensuring 2026-2027 classes remain pristine...');
    await client.query(`
      UPDATE kelas SET nama = '5', tingkat = 5 WHERE id = 55;
      UPDATE kelas SET nama = '6A', tingkat = 6 WHERE id = 58;
      UPDATE kelas SET nama = '6B', tingkat = 6 WHERE id = 57;
    `);
    console.log('✅ Kelas 55 (5), 58 (6A), 57 (6B) preserved for 2026-2027.');

    // 2. Fix kelas_tahun_ajaran for tahun_ajaran_id = 10 (2025-2026)
    console.log('Step 3: Updating kelas_tahun_ajaran for tahun_ajaran_id = 10...');
    // Delete any links to 55, 57, 58 in 2025-2026
    const delKta = await client.query(`
      DELETE FROM kelas_tahun_ajaran 
      WHERE tahun_ajaran_id = 10 AND kelas_id IN (55, 57, 58);
    `);
    console.log(`Deleted ${delKta.rowCount} old/incorrect kelas_tahun_ajaran records for year 10.`);

    // Delete any links to 5A, 5B, 6 in 2026-2027 (year 11)
    await client.query(`
      DELETE FROM kelas_tahun_ajaran 
      WHERE tahun_ajaran_id = 11 AND kelas_id IN ($1, $2, $3);
    `, [id5A, id5B, id6]);

    // Upsert 5A, 5B, 6 for tahun_ajaran_id = 10
    await client.query(`
      INSERT INTO kelas_tahun_ajaran (kelas_id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
      VALUES ($1, 10, 20, 3, 31)
      ON CONFLICT (kelas_id, tahun_ajaran_id) DO UPDATE SET mustahiq_id = 20, muhafadzoh_mapel_id = 3, qiroatul_mapel_id = 31;
    `, [id5A]);

    await client.query(`
      INSERT INTO kelas_tahun_ajaran (kelas_id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
      VALUES ($1, 10, 4, 3, 31)
      ON CONFLICT (kelas_id, tahun_ajaran_id) DO UPDATE SET mustahiq_id = 4, muhafadzoh_mapel_id = 3, qiroatul_mapel_id = 31;
    `, [id5B]);

    await client.query(`
      INSERT INTO kelas_tahun_ajaran (kelas_id, tahun_ajaran_id, mustahiq_id, muhafadzoh_mapel_id, qiroatul_mapel_id)
      VALUES ($1, 10, 21, 3, 31)
      ON CONFLICT (kelas_id, tahun_ajaran_id) DO UPDATE SET mustahiq_id = 21, muhafadzoh_mapel_id = 3, qiroatul_mapel_id = 31;
    `, [id6]);
    console.log('✅ kelas_tahun_ajaran updated for 5A, 5B, 6 in year 10.');

    // 3. Update santri_tahun_ajaran for tahun_ajaran_id = 10
    console.log('Step 4: Restoring kelas_diniyah_id in santri_tahun_ajaran for tahun_ajaran_id = 10...');
    
    // Boys in 5A (santri_id 549..566)
    const update5A = await client.query(`
      UPDATE santri_tahun_ajaran
      SET kelas_diniyah_id = $1
      WHERE tahun_ajaran_id = 10 
        AND santri_id BETWEEN 549 AND 566;
    `, [id5A]);
    console.log(`✅ Updated ${update5A.rowCount} santri to kelas 5A (expected 18).`);

    // Girls in 5B (santri_id 567..590)
    const update5B = await client.query(`
      UPDATE santri_tahun_ajaran
      SET kelas_diniyah_id = $1
      WHERE tahun_ajaran_id = 10 
        AND santri_id BETWEEN 567 AND 590;
    `, [id5B]);
    console.log(`✅ Updated ${update5B.rowCount} santri to kelas 5B (expected 24).`);

    // Alumni in 6 (santri_id 591..613 and 593)
    const update6 = await client.query(`
      UPDATE santri_tahun_ajaran
      SET kelas_diniyah_id = $1, 
          status = 'alumni', 
          catatan = COALESCE(NULLIF(catatan, ''), 'Lulus Diniyah')
      WHERE tahun_ajaran_id = 10 
        AND (santri_id BETWEEN 591 AND 613 OR santri_id = 593);
    `, [id6]);
    console.log(`✅ Updated ${update6.rowCount} santri to kelas 6 (expected 23).`);

    // 4. Update peserta_ujian for tahun_ajaran_id = 10
    console.log('Step 5: Restoring kelas_diniyah_id in peserta_ujian for tahun_ajaran_id = 10...');
    const pu5A = await client.query(`
      UPDATE peserta_ujian
      SET kelas_diniyah_id = $1
      WHERE tahun_ajaran_id = 10 
        AND santri_id BETWEEN 549 AND 566;
    `, [id5A]);
    console.log(`✅ Updated ${pu5A.rowCount} peserta_ujian to kelas 5A.`);

    const pu5B = await client.query(`
      UPDATE peserta_ujian
      SET kelas_diniyah_id = $1
      WHERE tahun_ajaran_id = 10 
        AND santri_id BETWEEN 567 AND 590;
    `, [id5B]);
    console.log(`✅ Updated ${pu5B.rowCount} peserta_ujian to kelas 5B.`);

    const pu6 = await client.query(`
      UPDATE peserta_ujian
      SET kelas_diniyah_id = $1
      WHERE tahun_ajaran_id = 10 
        AND (santri_id BETWEEN 591 AND 613 OR santri_id = 593);
    `, [id6]);
    console.log(`✅ Updated ${pu6.rowCount} peserta_ujian to kelas 6.`);

    await client.query('COMMIT');
    console.log('🎉 All updates committed successfully!');

    // Verification
    console.log('\n--- VERIFICATION: santri_tahun_ajaran for year 10 ---');
    const ver10 = await client.query(`
      SELECT sta.kelas_diniyah_id, k.nama as kelas_nama, COUNT(*) 
      FROM santri_tahun_ajaran sta
      LEFT JOIN kelas k ON sta.kelas_diniyah_id = k.id
      WHERE sta.tahun_ajaran_id = 10
      GROUP BY sta.kelas_diniyah_id, k.nama
      ORDER BY k.nama NULLS LAST;
    `);
    console.table(ver10.rows);

    console.log('\n--- VERIFICATION: santri_tahun_ajaran for year 11 ---');
    const ver11 = await client.query(`
      SELECT sta.kelas_diniyah_id, k.nama as kelas_nama, COUNT(*) 
      FROM santri_tahun_ajaran sta
      LEFT JOIN kelas k ON sta.kelas_diniyah_id = k.id
      WHERE sta.tahun_ajaran_id = 11
      GROUP BY sta.kelas_diniyah_id, k.nama
      ORDER BY k.nama NULLS LAST;
    `);
    console.table(ver11.rows);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error executing fix:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

fix2025Classes();
