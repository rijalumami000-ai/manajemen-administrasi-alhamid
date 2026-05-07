const db = require('../db');

async function updateMapelTypes() {
  try {
    console.log('Starting mata_pelajaran types standardization...');

    // 1. Update Muhafadzoh
    const muhafadzohRes = await db.query(`
      UPDATE mata_pelajaran 
      SET jenis = 'Muhafadzoh' 
      WHERE (nama ILIKE '%muhafadzoh%' OR nama ILIKE '%akbar%' OR nama ILIKE '%mini%')
      AND jenis != 'Muhafadzoh'
      RETURNING nama
    `);
    console.log(`Updated ${muhafadzohRes.rowCount} subjects to 'Muhafadzoh'`);

    // 2. Update Qiroah
    const qiroahRes = await db.query(`
      UPDATE mata_pelajaran 
      SET jenis = 'Qiroah' 
      WHERE (nama ILIKE '%qiroat%' OR nama ILIKE '%qiroah%')
      AND jenis != 'Qiroah'
      RETURNING nama
    `);
    console.log(`Updated ${qiroahRes.rowCount} subjects to 'Qiroah'`);

    // 3. Update Taftisy
    const taftisyRes = await db.query(`
      UPDATE mata_pelajaran 
      SET jenis = 'Taftisy' 
      WHERE nama ILIKE '%taftisy%'
      AND jenis != 'Taftisy'
      RETURNING nama
    `);
    console.log(`Updated ${taftisyRes.rowCount} subjects to 'Taftisy'`);

    console.log('Standardization complete.');
  } catch (err) {
    console.error('Error during standardization:', err);
  } finally {
    process.exit();
  }
}

updateMapelTypes();
