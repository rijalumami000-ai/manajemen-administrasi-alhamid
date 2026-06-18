/**
 * db.ts — Database connection untuk modul keuangan
 * Menggunakan pool pg yang sama dengan proyek utama
 * (require dari node_modules root, bukan install ulang)
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const pool = new Pool({
  host:     process.env.PGHOST     || 'localhost',
  user:     process.env.PGUSER     || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'sekolah_info',
  port:     Number(process.env.PGPORT) || 5432,
  max:      10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
export { pool };
