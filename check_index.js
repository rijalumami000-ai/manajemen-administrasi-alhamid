const db = require('./db');

async function run() {
  try {
    const result = await db.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'mapel_tingkat'");
    console.log(result.rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
