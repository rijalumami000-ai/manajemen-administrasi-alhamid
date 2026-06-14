const fs = require('fs');
const path = require('path');
const db = require('../../db');

async function initDatabase() {
  // Run main init.sql
  const initPath = path.join(__dirname, '..', '..', 'sql', 'init.sql');
  if (fs.existsSync(initPath)) {
    const sql = fs.readFileSync(initPath, 'utf8');
    await db.query(sql);
    console.log('✓ Main database schema initialized');
  } else {
    console.warn('Database init file not found:', initPath);
  }

  // Run auth_schema.sql
  const authPath = path.join(__dirname, '..', '..', 'sql', 'auth_schema.sql');
  if (fs.existsSync(authPath)) {
    const authSql = fs.readFileSync(authPath, 'utf8');
    await db.query(authSql);
    console.log('✓ Authentication schema initialized');
  } else {
    console.log('⚠ Authentication schema file not found (optional)');
  }

  // Run lembar_ujian.sql
  const lembarUjianPath = path.join(__dirname, '..', '..', 'sql', 'lembar_ujian.sql');
  if (fs.existsSync(lembarUjianPath)) {
    const lembarUjianSql = fs.readFileSync(lembarUjianPath, 'utf8');
    await db.query(lembarUjianSql);
    console.log('✓ Lembar Ujian schema initialized');
  } else {
    console.log('⚠ Lembar Ujian schema file not found');
  }

  // Run performance_indexes.sql (idempotent — all IF NOT EXISTS)
  const indexPath = path.join(__dirname, '..', '..', 'sql', 'performance_indexes.sql');
  if (fs.existsSync(indexPath)) {
    // Strip the SELECT at end (not valid in batch query context)
    let indexSql = fs.readFileSync(indexPath, 'utf8');
    // Remove everything from SELECT onwards (verification query — not needed on init)
    const selectIdx = indexSql.indexOf('SELECT\n    schemaname');
    if (selectIdx !== -1) indexSql = indexSql.substring(0, selectIdx);
    await db.query(indexSql);
    console.log('✓ Performance indexes applied');
  } else {
    console.log('⚠ Performance indexes file not found');
  }
}

module.exports = initDatabase;
