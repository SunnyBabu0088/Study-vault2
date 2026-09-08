const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: false }
        : (process.env.DATABASE_SSL === 'false'
            ? false
            : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)),
});

pool.on('connect', () => {
    console.log('PostgreSQL connected');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle Postgres client', err);
});


module.exports = { pool };
