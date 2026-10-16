const db = require('../../db');

async function check() {
  const [g, u] = await Promise.all([
    db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'guru'"),
    db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'")
  ]);
  console.log('guru columns:', g.rows.map(x => x.column_name + ' (' + x.data_type + ')').join(', '));
  console.log('users columns:', u.rows.map(x => x.column_name + ' (' + x.data_type + ')').join(', '));
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
