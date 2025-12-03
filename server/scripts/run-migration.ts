import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: join(__dirname, '..', '.env') });

async function runMigration() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: 5432,
    user: process.env.POSTGRES_USERNAME,
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const migrationPath = join(
      __dirname,
      '..',
      'migrations',
      'add_user_and_clan_guards_stats.sql',
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('Running migration...');
    await client.query(migrationSQL);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

