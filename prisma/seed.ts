// prisma/seed.ts
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create SUPER_ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'superadmin@grocery.com' },
    update: { password: hashedPassword },
    create: {
      email: 'superadmin@grocery.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
      referralCode: 'SUPER-ADMIN-001'
    },
  });

  // 2. Create Regular USER
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Regular User',
      role: 'USER',
      isVerified: true,
      referralCode: 'USER-REF-001'
    },
  });

  // 3. Create Sample STORES
  const store = await prisma.store.upsert({
    where: { name: 'Grosur Pusat Jakarta' },
    update: {},
    create: {
      name: 'Grosur Pusat Jakarta',
      description: 'Cabang utama Grosur di Jakarta Selatan',
      address: 'Jl. Sudirman No. 1, Jakarta Selatan',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      district: 'Kebayoran Baru',
      latitude: -6.2269,
      longitude: 106.8222,
      maxRadius: 100,
    },
  });

  const storeBandung = await prisma.store.upsert({
    where: { name: 'Grosur Cabang Bandung' },
    update: {},
    create: {
      name: 'Grosur Cabang Bandung',
      description: 'Cabang Grosur di Bandung',
      address: 'Jl. Asia Afrika No. 10, Bandung',
      province: 'Jawa Barat',
      city: 'Bandung',
      district: 'Bandung Wetan',
      latitude: -6.9175,
      longitude: 107.6191,
      maxRadius: 80,
    },
  });

  const storeSurabaya = await prisma.store.upsert({
    where: { name: 'Grosur Cabang Surabaya' },
    update: {},
    create: {
      name: 'Grosur Cabang Surabaya',
      description: 'Cabang Grosur di Surabaya',
      address: 'Jl. Tunjungan No. 5, Surabaya',
      province: 'Jawa Timur',
      city: 'Surabaya',
      district: 'Genteng',
      latitude: -7.2575,
      longitude: 112.7521,
      maxRadius: 90,
    },
  });

  // 4. Create STORE_ADMIN
  const storeAdmin = await prisma.user.upsert({
    where: { email: 'storeadmin@example.com' },
    update: {},
    create: {
      email: 'storeadmin@example.com',
      password: hashedPassword,
      name: 'Store Admin Jakarta',
      role: 'STORE_ADMIN',
      isVerified: true,
      managedStoreId: store.id,
      referralCode: 'ADMIN-REF-001'
    },
  });

  // 5. Create CATEGORIES
  const catSembako = await prisma.category.upsert({
    where: { slug: 'sembako' },
    update: {},
    create: { name: 'Sembako', slug: 'sembako' },
  });

  const catFresh = await prisma.category.upsert({
    where: { slug: 'fresh-food' },
    update: {},
    create: { name: 'Fresh Food', slug: 'fresh-food' },
  });

  // 6. Create PRODUCTS
  const prodRice = await prisma.product.upsert({
    where: { slug: 'beras-premium-5kg' },
    update: {},
    create: {
      name: 'Beras Premium 5kg',
      slug: 'beras-premium-5kg',
      description: 'Beras putih kualitas premium, pulen dan bersih.',
      price: 75000,
      categoryId: catSembako.id,
      isActive: true,
      images: {
        create: { url: 'https://image.astronauts.cloud/product-images/2024/12/JivaBerasPremium5kg_5e349be7-3097-4ca3-bb85-5cc5e0437c75_900x900.jpg' }
      }
    },
  });

  const prodMilk = await prisma.product.upsert({
    where: { slug: 'susu-uht-full-cream' },
    update: {},
    create: {
      name: 'Susu UHT Full Cream 1L',
      slug: 'susu-uht-full-cream',
      description: 'Susu sapi segar kemasan siap minum.',
      price: 18500,
      categoryId: catFresh.id,
      isActive: true,
      images: {
        create: { url: 'https://www.jni.co.id/cdn/shop/products/b1d42094-90a1-42a2-bf81-b183d95a2243-fullcream-946ml.jpg?v=1738552499' }
      }
    },
  });

  console.log('✅ Base data seeded successfully.');
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
