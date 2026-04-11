import prisma from '../src/config/database';
import bcrypt from 'bcrypt';

async function main() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create SUPER_ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
    },
  });

  // 2. Create USER
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Regular User',
      role: 'USER',
      isVerified: true,
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

  // 3.5. Create STORE_ADMIN (after store is created)
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
    },
  });

  // 4. Create CATEGORIES
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

  // 5. Create PRODUCTS
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
        create: { url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400' }
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
        create: { url: 'https://images.unsplash.com/photo-1563636619-e9107da5a76a?auto=format&fit=crop&q=80&w=400' }
      }
    },
  });

  const prodEgg = await prisma.product.upsert({
    where: { slug: 'telur-ayam-negeri-10pcs' },
    update: {},
    create: {
      name: 'Telur Ayam Negeri 10pcs',
      slug: 'telur-ayam-negeri-10pcs',
      description: 'Telur ayam negeri segar pilihan.',
      price: 25000,
      categoryId: catFresh.id,
      isActive: true,
      images: {
        create: { url: 'https://images.unsplash.com/photo-1582722872445-44355050985c?auto=format&fit=crop&q=80&w=400' }
      }
    },
  });

  // 6. Create STOCKS
  const stocks = [
    { productId: prodRice.id, storeId: store.id, quantity: 50 },
    { productId: prodMilk.id, storeId: store.id, quantity: 100 },
    { productId: prodEgg.id, storeId: store.id, quantity: 0 }, // Out of stock example
  ];

  for (const s of stocks) {
    await prisma.stock.upsert({
      where: {
        productId_storeId: {
          productId: s.productId,
          storeId: s.storeId,
        },
      },
      update: { quantity: s.quantity },
      create: s,
    });
  }

  console.log('Seed completed successfully!');
  console.log({ admin, storeAdmin, user, store, products: [prodRice, prodMilk, prodEgg] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
