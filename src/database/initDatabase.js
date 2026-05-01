const fs = require('fs');
const path = require('path');
const db = require('../../db');

async function initDatabase() {
  const initPath = path.join(__dirname, '..', '..', 'sql', 'init.sql');
  if (!fs.existsSync(initPath)) {
    console.warn('Database init file not found:', initPath);
    return;
  }

  const sql = fs.readFileSync(initPath, 'utf8');
  await db.query(sql);
}

module.exports = initDatabase;
