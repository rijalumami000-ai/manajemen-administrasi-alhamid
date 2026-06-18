/**
 * db.ts — Database connection untuk modul keuangan
 * Menggunakan pool pg yang sama dengan proyek utama
 * (require dari node_modules root, bukan install ulang)
 */
import { Pool } from 'pg';
declare const pool: Pool;
export default pool;
export { pool };
