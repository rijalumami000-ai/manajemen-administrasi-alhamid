const db = require('../db');

async function checkConstraints() {
  try {
    const res = await db.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'setting_kriteria_nilai'::regclass
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkConstraints();
