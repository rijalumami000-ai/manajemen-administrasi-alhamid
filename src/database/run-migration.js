const db = require('../../db.js');

async function run() {
  try {
    await db.query(`ALTER TABLE guru ADD COLUMN ttd_url VARCHAR(255);`);
    console.log('Successfully added ttd_url to guru table.');
  } catch (err) {
    if (err.code === '42701') {
      console.log('Column already exists.');
    } else {
      console.error(err);
    }
  } finally {
    process.exit(0);
  }
}

run();
