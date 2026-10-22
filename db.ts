import dotenv from 'dotenv';
import { Pool, QueryResult, QueryResultRow } from 'pg';

dotenv.config();

export const pool = new Pool();

export const query = <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => pool.query<T>(text, params);

const db = {
  query,
  pool,
};

module.exports = db;
export default db;
