const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool();

async function migrate() {
    console.log('Connecting to PostgreSQL to add palm_descriptors column...');
    try {
        await pool.query('ALTER TABLE santri_face_data ADD COLUMN palm_descriptors TEXT');
        console.log('Successfully added palm_descriptors column.');
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log('Column palm_descriptors already exists.');
        } else {
            console.error('Migration error:', e.message);
        }
    }
    await pool.end();
}

migrate();
