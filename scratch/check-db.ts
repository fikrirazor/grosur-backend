
import prisma from '../src/config/database';
import pg from 'pg';
import config from '../src/config/env';

async function main() {
  try {
    console.log('Testing connection with app prisma instance...');
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log('Total users in DB:', userCount);

    const connectionString = config.databaseUrl;
    const pool = new pg.Pool({ connectionString });
    
    console.log('Checking columns in User table via direct PG query...');
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'User'");
    
    if (res.rows.length === 0) {
        console.log('Table "User" not found in information_schema. Maybe check lowercase "user"?');
        const res2 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user'");
        res2.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
    } else {
        res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
