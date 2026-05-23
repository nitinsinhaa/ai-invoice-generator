import pg from 'pg';
import dotenv from 'dotenv';
import { getDatabasePoolConfig } from './dbConfig.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool(getDatabasePoolConfig());

pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

export default pool;
