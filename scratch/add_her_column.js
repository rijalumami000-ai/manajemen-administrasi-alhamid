const db = require('../db');

async function run() {
  try {
    await db.query('ALTER TABLE lembar_ujian ADD COLUMN IF NOT EXISTS is_her BOOLEAN DEFAULT false');
    console.log('✓ Column is_her added to lembar_ujian!');
  } catch (error) {
    console.error('❌ Error adding column:', error);
  }
  process.exit(0);
}
run();
