import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Pass the adapter here
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create a Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@grocery.com' },
    update: {},
    create: {
      email: 'superadmin@grocery.com',
      password: 'hashed_password_here',
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
      referralCode: 'SUPER-ADMIN-REF-001', // Providing this manually helps
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 2. Create Test Stores with Real Coordinates
  const stores = [
    {
      name: 'Grocery Central Jakarta',
      address: 'Jl. Sudirman No. 1',
      province: 'DKI Jakarta',
      city: 'Jakarta Pusat',
      district: 'Menteng',
      latitude: -6.2088,
      longitude: 106.8456,
      maxRadius: 50,
    },
    {
      name: 'Grocery Bandung Hub',
      address: 'Jl. Asia Afrika No. 10',
      province: 'Jawa Barat',
      city: 'Bandung',
      district: 'Sumur Bandung',
      latitude: -6.9175,
      longitude: 107.6191,
      maxRadius: 50,
    },
    {
      name: 'Grocery Bantul Branch',
      address: 'Jl. Parangtritis Km 10',
      province: 'DI Yogyakarta',
      city: 'Bantul',
      district: 'Sewon',
      latitude: -7.8869,
      longitude: 110.3278,
      maxRadius: 50,
    },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { name: store.name },
      update: {},
      create: store,
    });
  }
  console.log('✅ 3 Test stores created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });