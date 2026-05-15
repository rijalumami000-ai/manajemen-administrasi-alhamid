const db = require('../db');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../sql/lembar_ujian.sql'), 'utf8');
    await db.query(sql);
    console.log('✓ Table lembar_ujian created or already exists!');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  }
  process.exit(0);
}
run();
