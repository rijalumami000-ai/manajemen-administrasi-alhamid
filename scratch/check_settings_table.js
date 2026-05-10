const db = require('../db');
async function run() {
  try {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND (table_name LIKE '%setting%' OR table_name LIKE '%konfig%');
    `);
    console.log(result.rows);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
run();
