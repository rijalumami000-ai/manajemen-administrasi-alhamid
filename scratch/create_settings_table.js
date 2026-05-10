const db = require('../db');

async function run() {
  try {
    console.log('Creating system_settings table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT
      );
    `);
    
    console.log('Seeding default settings...');
    await db.query(`
      INSERT INTO system_settings (key, value) VALUES 
      ('app_name', 'Alhamid Cintamulya'),
      ('app_logo', null)
      ON CONFLICT (key) DO NOTHING;
    `);
    
    console.log('Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
