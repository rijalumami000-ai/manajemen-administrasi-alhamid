import db from '../../db';

async function run(): Promise<void> {
  try {
    await db.query(`ALTER TABLE rapor_santri ADD COLUMN keputusan_kenaikan VARCHAR(255);`);
    console.log('Successfully added keputusan_kenaikan to rapor_santri table.');
  } catch (err: any) {
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
