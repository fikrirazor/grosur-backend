// prisma/seed.ts
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt'; // 1. Import bcrypt
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // 2. Hash the password (using 10 salt rounds)
  const plainPassword = 'password123'; 
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // 3. Create the Super Admin with the HASHED password
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@grocery.com' },
    update: { password: hashedPassword }, // Ensure it updates if user exists
    create: {
      email: 'superadmin@grocery.com',
      password: hashedPassword, 
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
      referralCode: 'SUPER-ADMIN-REF-001',
    },
  });
  
  console.log(`✅ Super Admin created: ${superAdmin.email}`);
  // ... rest of your store seed logic
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });