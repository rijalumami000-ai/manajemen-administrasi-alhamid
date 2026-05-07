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
}

module.exports = initDatabase;
