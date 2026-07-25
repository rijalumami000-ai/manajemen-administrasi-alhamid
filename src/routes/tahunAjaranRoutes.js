const db = require('../../db');
const { getActiveTahunAjaran, syncSantriToActiveTahunAjaran } = require('../services/tahunAjaranService');
const { isUniqueViolation } = require('../utils/databaseErrors');
const { normalizeKelasJenis, normalizeText, normalizeYearCode, nullableInt } = require('../utils/normalizers');
const AutoAdvanceEngine = require('../services/autoAdvanceEngine');
const AlumniManager = require('../services/alumniManager');
const MigrationValidator = require('../services/migrationValidator');

function registerTahunAjaranRoutes(app) {
  // ===== TAHUN AJARAN API =====
  app.get('/api/tahun-ajaran', async (req, res) => {
    try {
      const result = await db.query(`
        SELECT
          ta.*,
          COUNT(sta.id) FILTER (WHERE sta.status = 'aktif')::INTEGER AS jumlah_santri,
          (
            SELECT COALESCE(COUNT(DISTINCT class_id), 0)::INTEGER
            FROM (
              SELECT kelas_diniyah_id AS class_id
              FROM santri_tahun_ajaran
              WHERE tahun_ajaran_id = ta.id AND status = 'aktif' AND kelas_diniyah_id IS NOT NULL
              UNION
              SELECT kelas_sekolah_id AS class_id
              FROM santri_tahun_ajaran
              WHERE tahun_ajaran_id = ta.id AND status = 'aktif' AND kelas_sekolah_id IS NOT NULL
            ) uc
          ) AS jumlah_kelas
        FROM tahun_ajaran ta
        LEFT JOIN santri_tahun_ajaran sta ON sta.tahun_ajaran_id = ta.id
        GROUP BY ta.id
        ORDER BY ta.tahun_mulai
      `);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat tahun ajaran.' });
    }
  });

  app.get('/api/tahun-ajaran/active', async (req, res) => {
    try {
      const activeYear = await getActiveTahunAjaran();
      if (!activeYear) {
        return res.status(404).json({ error: 'Tahun ajaran berjalan belum disetel.' });
      }
      res.json(activeYear);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat tahun ajaran berjalan.' });
    }
  });

  app.get('/api/tahun-ajaran/:id/santri', async (req, res) => {
    const { id } = req.params;

    try {
      const result = await db.query(`
        SELECT
          s.id,
          s.orangtua_id,
          s.created_at,
          sta.id AS santri_tahun_ajaran_id,
          sta.tahun_ajaran_id,
          ta.kode AS tahun_ajaran,
          ta.is_active AS tahun_ajaran_aktif,
          sta.status AS status_tahun_ajaran,
          sta.catatan AS catatan_tahun_ajaran,
          sta.aktif_ganjil,
          sta.aktif_genap,
          sta.nis,
          sta.nik,
          sta.nama,
          sta.jenis_kelamin,
          sta.kelas_diniyah_id,
          sta.kelas_sekolah_id,
          sta.kamar_id,
          sta.tempat_lahir,
          sta.tanggal_lahir,
          sta.alamat,
          sta.nama_ayah,
          sta.nama_ibu,
          sta.pekerjaan_ayah,
          sta.pekerjaan_ibu,
          sta.no_hp_ayah,
          sta.no_hp_ibu,
          kd.nama AS nama_diniyah,
          ks.nama AS nama_sekolah,
          k.nama AS nama_kamar,
          k.gedung AS kamar_gedung,
          k.lantai AS kamar_lantai
        FROM santri_tahun_ajaran sta
        JOIN tahun_ajaran ta ON sta.tahun_ajaran_id = ta.id
        JOIN santri s ON sta.santri_id = s.id
        LEFT JOIN kelas kd ON sta.kelas_diniyah_id = kd.id
        LEFT JOIN kelas ks ON sta.kelas_sekolah_id = ks.id
        LEFT JOIN kamar k ON sta.kamar_id = k.id
        WHERE sta.tahun_ajaran_id = $1
          AND NOT EXISTS (
            SELECT 1 FROM alumni a WHERE a.santri_id = s.id OR a.nis = sta.nis
          )
          AND COALESCE(sta.status, 'aktif') IN ('aktif', 'draft', 'tidak_naik')
        ORDER BY sta.nama
      `, [id]);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Gagal memuat data santri tahun ajaran.' });
    }
  });

  // ===== ENHANCED MIGRATION ENDPOINT WITH AUTO-ADVANCE & ALUMNI MANAGEMENT =====
  app.post('/api/tahun-ajaran/migrate', async (req, res) => {
    const targetKode = normalizeYearCode(req.body.target_kode);
    const excludedSantriIds = req.body.excluded_santri_ids || []; // Santri yang tidak naik
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      console.log('🔍 Migration started');

      // ===== STEP 1: Initialize Services =====
      const autoAdvanceEngine = new AutoAdvanceEngine();
      const alumniManager = new AlumniManager();
      const migrationValidator = new MigrationValidator();

      // ===== STEP 2: Get Source Year =====
      const source = await getActiveTahunAjaran(client);
      if (!source) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Tahun ajaran berjalan belum disetel.' });
      }

      const nextKode = targetKode || `${source.tahun_selesai}-${source.tahun_selesai + 1}`;

      console.log(`   Source: ${source.kode} (ID: ${source.id})`);
      console.log(`   Target: ${nextKode}`);
      console.log(`   Excluded: ${excludedSantriIds.length} santri`);

      // ===== STEP 3: Run Validation =====
      console.log('🔍 Running migration validation...');
      const validation = await migrationValidator.validateMigration(nextKode, client);

      if (!validation.valid) {
        await client.query('ROLLBACK');
        console.log('❌ Validation failed');
        return res.status(400).json({
          error: 'Migration validation failed',
          errors: validation.errors,
          missing_classes: validation.missingClasses
        });
      }

      console.log('✅ Validation passed');

      // Get validated data
      const existingAlumniIds = validation.alumniIds;
      let target = validation.targetYear;

      // ===== STEP 4: Create Target Year if Needed =====
      if (!target) {
        const tahunMulai = source.tahun_selesai;
        const tahunSelesai = source.tahun_selesai + 1;

        console.log(`📝 Creating new tahun ajaran: ${nextKode}`);

        const createResult = await client.query(`
          INSERT INTO tahun_ajaran (kode, tahun_mulai, tahun_selesai, status, is_active)
          VALUES ($1, $2, $3, 'draft', FALSE)
          RETURNING *
        `, [nextKode, tahunMulai, tahunSelesai]);

        target = createResult.rows[0];
        console.log('✅ Target year created:', target);
      }

      if (target.id === source.id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Target migrasi tidak boleh sama dengan tahun ajaran berjalan.' });
      }

      // ===== STEP 5: Fetch Source Santri with Class Info =====
      console.log('🔄 Fetching source santri...');
      const santriResult = await client.query(`
        SELECT
          sta.id,
          sta.santri_id,
          sta.kelas_diniyah_id,
          sta.kelas_sekolah_id,
          sta.kamar_id,
          sta.status,
          sta.catatan,
          sta.nis,
          sta.nik,
          sta.nama,
          sta.jenis_kelamin,
          sta.tempat_lahir,
          sta.tanggal_lahir,
          sta.alamat,
          sta.nama_ayah,
          sta.nama_ibu,
          sta.pekerjaan_ayah,
          sta.pekerjaan_ibu,
          sta.no_hp_ayah,
          sta.no_hp_ibu,
          kd.tingkat AS kelas_diniyah_tingkat,
          kd.nama AS kelas_diniyah_nama,
          ks.tingkat AS kelas_sekolah_tingkat,
          ks.nama AS kelas_sekolah_nama
        FROM santri_tahun_ajaran sta
        LEFT JOIN kelas kd ON sta.kelas_diniyah_id = kd.id
        LEFT JOIN kelas ks ON sta.kelas_sekolah_id = ks.id
        WHERE sta.tahun_ajaran_id = $1
          AND sta.status = 'aktif'
          AND sta.aktif_genap = TRUE
        ORDER BY sta.nama
      `, [source.id]);

      const sourceSantri = santriResult.rows;
      console.log(`   Found ${sourceSantri.length} active santri`);

      // ===== STEP 6: Fetch Available Target Classes =====
      console.log('🔄 Fetching available target classes...');
      const kelasResult = await client.query(
        'SELECT id, jenis, nama, tingkat FROM kelas ORDER BY jenis, tingkat'
      );
      const availableClasses = kelasResult.rows;
      console.log(`   Found ${availableClasses.length} available classes`);

      // ===== STEP 7: Process Each Santri =====
      console.log('🔄 Processing santri for migration...');

      // Convert promotions list to a map for fast lookup
      const customPromotions = {};
      if (req.body.promotions && Array.isArray(req.body.promotions)) {
        req.body.promotions.forEach(p => {
          customPromotions[Number(p.santri_id)] = {
            kelas_diniyah_id: p.kelas_diniyah_id,
            kelas_sekolah_id: p.kelas_sekolah_id
          };
        });
      }

      let migratedCount = 0;
      let alumniCreatedCount = 0;
      let mtsGraduatesCount = 0;
      let existingAlumniExcludedCount = 0;

      for (const santri of sourceSantri) {
        try {
          // Process excluded (non-promoted) santri: migrate them but keep them in the same class
          if (excludedSantriIds.includes(santri.santri_id)) {
            console.log(`   📌 Processing non-promoted santri: ${santri.nama} (ID: ${santri.santri_id})`);
            
            const advancedClasses = {
              kelas_diniyah_id: santri.kelas_diniyah_id,
              kelas_sekolah_id: santri.kelas_sekolah_id
            };
            
            const catatanNote = `Migrasi dari ${source.kode} | Tidak naik (mengulang)`;
            
            await client.query(`
              INSERT INTO santri_tahun_ajaran (
                tahun_ajaran_id, santri_id, kelas_diniyah_id, kelas_sekolah_id, kamar_id, status, catatan,
                nis, nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat,
                nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            `, [
              target.id,
              santri.santri_id,
              advancedClasses.kelas_diniyah_id,
              advancedClasses.kelas_sekolah_id,
              santri.kamar_id,
              'aktif',
              catatanNote,
              santri.nis,
              santri.nik,
              santri.nama,
              santri.jenis_kelamin,
              santri.tempat_lahir,
              santri.tanggal_lahir,
              santri.alamat,
              santri.nama_ayah,
              santri.nama_ibu,
              santri.pekerjaan_ayah,
              santri.pekerjaan_ibu,
              santri.no_hp_ayah,
              santri.no_hp_ibu
            ]);
            
            migratedCount++;
            console.log(`   ✅ Non-promoted santri migrated in same class`);
            continue;
          }

          // Skip existing alumni
          if (existingAlumniIds.includes(santri.santri_id)) {
            console.log(`   ⏭️  Skipping existing alumni: ${santri.nama} (ID: ${santri.santri_id})`);
            existingAlumniExcludedCount++;
            continue;
          }

          console.log(`\n🔄 Processing: ${santri.nama} (ID: ${santri.santri_id})`);

          // ===== STEP 7.1: Check for Graduation (Alumni Manager) =====
          const graduationResult = await alumniManager.processGraduation(santri, source, client);

          // Case 1: Became Alumni (Diniyah 6 + Sekolah 12)
          if (graduationResult.becameAlumni) {
            console.log(`   🎓 Became alumni: ${graduationResult.status}`);
            alumniCreatedCount++;
            // Don't migrate alumni to target year
            continue;
          }

          // Case 2: Has graduation notes (Lulus Diniyah, Lulus MTs, Lulus MA)
          if (graduationResult.graduationNotes && graduationResult.graduationNotes.length > 0) {
            console.log(`   📝 Graduation notes: ${graduationResult.graduationNotes.join(', ')}`);

            // Count MTs graduates for statistics
            if (graduationResult.isMtsComplete) {
              mtsGraduatesCount++;
            }

            // Continue to migration (will migrate to next year)
          }

          // ===== STEP 7.2: Auto-Advance Class Levels =====
          let advancedClasses = { kelas_diniyah_id: null, kelas_sekolah_id: null };
          const customPromo = customPromotions[Number(santri.santri_id)];

          if (customPromo) {
            // Run default auto-advance as fallback values
            const autoAdvanced = await autoAdvanceEngine.advanceSantri(santri, availableClasses);
            
            advancedClasses.kelas_diniyah_id = customPromo.kelas_diniyah_id !== undefined 
              ? (customPromo.kelas_diniyah_id === null ? null : Number(customPromo.kelas_diniyah_id)) 
              : autoAdvanced.kelas_diniyah_id;
              
            advancedClasses.kelas_sekolah_id = customPromo.kelas_sekolah_id !== undefined 
              ? (customPromo.kelas_sekolah_id === null ? null : Number(customPromo.kelas_sekolah_id)) 
              : autoAdvanced.kelas_sekolah_id;
              
            console.log(`   📚 Custom promotion applied (with auto-advance fallback):`, advancedClasses);
          } else {
            advancedClasses = await autoAdvanceEngine.advanceSantri(santri, availableClasses);
            console.log(`   📚 Auto-advanced classes:`, advancedClasses);
          }

          // Build catatan note
          let catatanNote = `Migrasi dari ${source.kode}`;

          // Add graduation notes if any (already added to source year by alumniManager)
          // No need to add again here

          // ===== STEP 7.3: Migrate to Target Year =====
          // Check if santri already exists in target year (shouldn't happen, but safety check)
          const existingCheck = await client.query(
            'SELECT id FROM santri_tahun_ajaran WHERE tahun_ajaran_id = $1 AND santri_id = $2',
            [target.id, santri.santri_id]
          );

          if (existingCheck.rows.length > 0) {
            console.log(`   ⚠️  Santri already exists in target year, skipping...`);
            continue;
          }

          await client.query(`
            INSERT INTO santri_tahun_ajaran (
              tahun_ajaran_id, santri_id, kelas_diniyah_id, kelas_sekolah_id, kamar_id, status, catatan,
              nis, nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat,
              nama_ayah, nama_ibu, pekerjaan_ayah, pekerjaan_ibu, no_hp_ayah, no_hp_ibu
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          `, [
            target.id,
            santri.santri_id,
            advancedClasses.kelas_diniyah_id,
            advancedClasses.kelas_sekolah_id,
            santri.kamar_id,
            'aktif',
            catatanNote,
            santri.nis,
            santri.nik,
            santri.nama,
            santri.jenis_kelamin,
            santri.tempat_lahir,
            santri.tanggal_lahir,
            santri.alamat,
            santri.nama_ayah,
            santri.nama_ibu,
            santri.pekerjaan_ayah,
            santri.pekerjaan_ibu,
            santri.no_hp_ayah,
            santri.no_hp_ibu
          ]);

          migratedCount++;
          console.log(`   ✅ Migrated successfully`);

        } catch (error) {
          console.error(`   ❌ Error processing santri ${santri.santri_id}:`, error.message);
          throw error; // Rollback entire transaction on any error
        }
      }

      // ===== STEP 7.5: Process Non-Migrated Students (Pindah/Keluar/Inactive Semesters) =====
      console.log('🔄 Processing non-migrated santri (pindah/inactive)...');
      const nonMigratedResult = await client.query(`
        SELECT
          sta.santri_id,
          sta.nis,
          sta.nik,
          sta.nama,
          sta.tempat_lahir,
          sta.tanggal_lahir,
          sta.alamat,
          sta.status,
          sta.catatan,
          kd.nama AS kelas_diniyah,
          ks.nama AS kelas_sekolah
        FROM santri_tahun_ajaran sta
        LEFT JOIN kelas kd ON sta.kelas_diniyah_id = kd.id
        LEFT JOIN kelas ks ON sta.kelas_sekolah_id = ks.id
        WHERE sta.tahun_ajaran_id = $1
          AND (sta.status IN ('pindah', 'keluar') OR sta.aktif_ganjil = FALSE OR sta.aktif_genap = FALSE)
      `, [source.id]);

      let nonMigratedPindahCount = 0;
      for (const row of nonMigratedResult.rows) {
        const kelasArray = [];
        if (row.kelas_diniyah) kelasArray.push(row.kelas_diniyah);
        if (row.kelas_sekolah) kelasArray.push(row.kelas_sekolah);
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
          row.santri_id,
          row.nis,
          row.nik,
          row.nama,
          row.tempat_lahir,
          row.tanggal_lahir,
          source.tahun_selesai,
          kelasTerakhir,
          row.alamat,
          row.catatan || `Pindah/keluar pada tahun ajaran ${source.kode}`,
          source.id,
          'pindah'
        ]);
        nonMigratedPindahCount++;
      }
      console.log(`   ✅ Processed ${nonMigratedPindahCount} non-migrated santri to alumni table as 'pindah'`);

      console.log('\n📊 Migration Summary:');
      console.log(`   Migrated: ${migratedCount}`);
      console.log(`   Alumni Created: ${alumniCreatedCount}`);
      console.log(`   MTs Graduates: ${mtsGraduatesCount}`);
      console.log(`   Existing Alumni Excluded: ${existingAlumniExcludedCount}`);
      console.log(`   Manually Excluded: ${excludedSantriIds.length}`);

      // ===== STEP 8: Mark Excluded Santri as "tidak_naik" =====
      if (excludedSantriIds.length > 0) {
        console.log('🔄 Marking excluded santri as tidak_naik...');
        await client.query(`
          UPDATE santri_tahun_ajaran
          SET status = 'tidak_naik',
              catatan = CASE
                WHEN catatan IS NULL OR catatan = '' THEN $2
                ELSE catatan || ' | ' || $2
              END
          WHERE tahun_ajaran_id = $1
            AND santri_id = ANY($3::int[])
        `, [source.id, `Tidak naik ke ${nextKode}`, excludedSantriIds]);
        console.log('✅ Marked as tidak_naik');
      }

      // ===== STEP 9: Update Year Statuses =====
      console.log('🔄 Updating year statuses...');
      // First, set all years to inactive to avoid constraint violation
      await client.query('UPDATE tahun_ajaran SET is_active = FALSE');
      // Then set statuses
      await client.query('UPDATE tahun_ajaran SET status = $1, is_active = FALSE WHERE id = $2', ['arsip', source.id]);
      await client.query('UPDATE tahun_ajaran SET status = $1, is_active = TRUE WHERE id = $2', ['berjalan', target.id]);
      console.log('✅ Year statuses updated');

      // ===== STEP 10: Save Migration Log =====
      console.log('📝 Saving migration log...');
      await client.query(`
        INSERT INTO migration_log (
          source_tahun_ajaran_id,
          target_tahun_ajaran_id,
          migrated_count,
          excluded_santri_ids
        ) VALUES ($1, $2, $3, $4)
      `, [source.id, target.id, migratedCount, excludedSantriIds]);
      console.log('✅ Migration log saved');

      await client.query('COMMIT');
      console.log('✅ Migration committed successfully');

      res.json({
        message: `Migrasi ke tahun ajaran ${target.kode} berhasil.`,
        source: {
          id: source.id,
          kode: source.kode
        },
        target: {
          id: target.id,
          kode: target.kode
        },
        migrated: migratedCount,
        excluded: excludedSantriIds.length,
        alumni_created: alumniCreatedCount,
        mts_graduates: mtsGraduatesCount,
        existing_alumni_excluded: existingAlumniExcludedCount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Migration error:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({ error: 'Gagal migrasi tahun ajaran: ' + error.message });
    } finally {
      client.release();
    }
  });

  // ===== ROLLBACK MIGRATION =====
  app.post('/api/tahun-ajaran/rollback', async (req, res) => {
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Get current active year
      const currentYear = await getActiveTahunAjaran(client);
      if (!currentYear) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Tahun ajaran berjalan belum disetel.' });
      }

      console.log('🔍 Rollback started for tahun ajaran:', currentYear.kode);

      // Get latest migration log for current year
      const logResult = await client.query(`
        SELECT * FROM migration_log
        WHERE target_tahun_ajaran_id = $1
        ORDER BY migration_date DESC
        LIMIT 1
      `, [currentYear.id]);

      if (!logResult.rows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Tidak ada log migrasi untuk tahun ajaran ini.' });
      }

      const log = logResult.rows[0];
      console.log('📝 Migration log found:', log);

      // Get source year info
      const sourceResult = await client.query('SELECT * FROM tahun_ajaran WHERE id = $1', [log.source_tahun_ajaran_id]);
      if (!sourceResult.rows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Tahun ajaran sumber tidak ditemukan.' });
      }

      const sourceYear = sourceResult.rows[0];

      // Get all santri IDs that were migrated (to restore them)
      console.log('🔄 Getting migrated santri IDs...');
      const migratedSantriResult = await client.query(`
        SELECT santri_id FROM santri_tahun_ajaran
        WHERE tahun_ajaran_id = $1
          AND catatan LIKE $2
      `, [currentYear.id, `%Migrasi dari ${sourceYear.kode}%`]);
      const migratedSantriIds = migratedSantriResult.rows.map(r => r.santri_id);
      console.log('📝 Migrated santri IDs:', migratedSantriIds);

      // Delete migrated data from target year
      console.log('🔄 Deleting migrated data from target year...');
      const deleteResult = await client.query(`
        DELETE FROM santri_tahun_ajaran
        WHERE tahun_ajaran_id = $1
        RETURNING santri_id
      `, [currentYear.id]);
      console.log('✅ Deleted migrated data:', deleteResult.rowCount, 'rows');

      // Restore "alumni" status back to "aktif" in source year (for santri who became alumni)
      if (migratedSantriIds.length > 0) {
        console.log('🔄 Restoring alumni status to aktif...');
        const restoreAlumniResult = await client.query(`
          UPDATE santri_tahun_ajaran
          SET status = 'aktif'
          WHERE tahun_ajaran_id = $1
            AND santri_id = ANY($2::int[])
            AND status = 'alumni'
        `, [sourceYear.id, migratedSantriIds]);
        console.log('✅ Restored alumni to aktif:', restoreAlumniResult.rowCount, 'rows');

        // Restore "lulus" status back to "aktif" in source year (for MTs graduates)
        const restoreLulusResult = await client.query(`
          UPDATE santri_tahun_ajaran
          SET status = 'aktif',
              catatan = REGEXP_REPLACE(catatan, ' \\| Lulus MTs', '', 'g')
          WHERE tahun_ajaran_id = $1
            AND santri_id = ANY($2::int[])
            AND status = 'lulus'
        `, [sourceYear.id, migratedSantriIds]);
        console.log('✅ Restored lulus to aktif:', restoreLulusResult.rowCount, 'rows');
      }

      // Restore "tidak_naik" status back to "aktif" in source year
      if (log.excluded_santri_ids && log.excluded_santri_ids.length > 0) {
        console.log('🔄 Restoring tidak_naik status to aktif...');
        const restoreResult = await client.query(`
          UPDATE santri_tahun_ajaran
          SET status = 'aktif',
              catatan = REGEXP_REPLACE(catatan, ' \\| Tidak naik ke .*', '', 'g')
          WHERE tahun_ajaran_id = $1
            AND santri_id = ANY($2::int[])
            AND status = 'tidak_naik'
        `, [sourceYear.id, log.excluded_santri_ids]);
        console.log('✅ Restored tidak_naik to aktif:', restoreResult.rowCount, 'rows');
      }

      // Delete alumni records created during migration
      console.log('🔄 Deleting alumni records created during migration...');
      const deleteAlumniResult = await client.query(`
        DELETE FROM alumni
        WHERE tahun_ajaran_id = $1
      `, [sourceYear.id]);
      console.log('✅ Deleted alumni records:', deleteAlumniResult.rowCount, 'rows');

      // Restore year statuses
      console.log('🔄 Restoring year statuses...');
      // First, set all years to inactive to avoid constraint violation
      await client.query('UPDATE tahun_ajaran SET is_active = FALSE');
      // Then restore statuses
      await client.query('UPDATE tahun_ajaran SET status = $1, is_active = TRUE WHERE id = $2', ['berjalan', sourceYear.id]);
      await client.query('UPDATE tahun_ajaran SET status = $1, is_active = FALSE WHERE id = $2', ['draft', currentYear.id]);
      console.log('✅ Year statuses restored');

      // Delete migration log after successful rollback
      console.log('🔄 Deleting migration log...');
      await client.query('DELETE FROM migration_log WHERE id = $1', [log.id]);
      console.log('✅ Migration log deleted');

      await client.query('COMMIT');
      console.log('✅ Rollback committed successfully');

      res.json({
        message: `Rollback ke tahun ajaran ${sourceYear.kode} berhasil.`,
        sourceYear,
        currentYear,
        deletedCount: deleteResult.rowCount,
        restoredCount: migratedSantriIds.length + (log.excluded_santri_ids ? log.excluded_santri_ids.length : 0),
        alumni_deleted: deleteAlumniResult.rowCount
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Rollback error:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({ error: 'Gagal rollback migrasi: ' + error.message });
    } finally {
      client.release();
    }
  });
}

module.exports = registerTahunAjaranRoutes;
