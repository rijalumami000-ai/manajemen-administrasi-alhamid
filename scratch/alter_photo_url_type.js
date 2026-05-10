const db = require('../db');

db.query("ALTER TABLE users ALTER COLUMN photo_url TYPE TEXT")
  .then(res => {
    console.log('Column type changed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
