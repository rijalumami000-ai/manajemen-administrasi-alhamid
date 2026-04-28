const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const pool = new Pool();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
