
import prisma from '../src/config/database';
import pg from 'pg';
import config from '../src/config/env';

async function main() {
  try {
    const connectionString = config.databaseUrl;
    const pool = new pg.Pool({ connectionString });
    
    console.log('Checking enums in the database...');
    const res = await pool.query("SELECT n.nspname as schema, t.typname as name FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typtype = 'e'");
    res.rows.forEach(row => console.log(`- Enum: ${row.name}`));

    await pool.end();
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
