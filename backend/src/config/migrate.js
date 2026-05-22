import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    try {
      await pool.query(schema);
      console.log('Full schema applied.');
    } catch (error) {
      if (error.code === '42P07') {
        console.log('Tables already exist, skipping full schema.');
      } else {
        throw error;
      }
    }

    const migrationsPath = path.join(__dirname, 'migrations.sql');
    const migrations = fs.readFileSync(migrationsPath, 'utf8');
    await pool.query(migrations);
    console.log('Incremental migrations applied.');
    
    console.log('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
