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

  // 3.2. Create Second Store (for transfer testing)
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

  // 3.3. Create Third Store (for more transfer options)
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

  // Product 4: Minyak Goreng (High stock)
  const prodOil = await prisma.product.upsert({
    where: { slug: 'minyak-goreng-2l' },
    update: {},
    create: {
      name: 'Minyak Goreng 2L',
      slug: 'minyak-goreng-2l',
      description: 'Minyak goreng kelapa sawit berkualitas 2 liter.',
      price: 35000,
      categoryId: catSembako.id,
      isActive: true,
      images: {
        create: { url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400' }
      }
    },
  });

  // Product 5: Gula Pasir (Medium stock)
  const prodSugar = await prisma.product.upsert({
    where: { slug: 'gula-pasir-1kg' },
    update: {},
    create: {
      name: 'Gula Pasir 1kg',
      slug: 'gula-pasir-1kg',
      description: 'Gula pasir putih premium kemasan 1kg.',
      price: 15000,
      categoryId: catSembako.id,
      isActive: true,
      images: {
        create: { url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&q=80&w=400' }
      }
    },
  });

  // 6. Create STOCKS
  const stocks = [
    { productId: prodRice.id, storeId: store.id, quantity: 50 },
    { productId: prodMilk.id, storeId: store.id, quantity: 100 },
    { productId: prodEgg.id, storeId: store.id, quantity: 0 }, // Out of stock example
    { productId: prodOil.id, storeId: store.id, quantity: 75 },
    { productId: prodSugar.id, storeId: store.id, quantity: 30 },
    // Stock for second store (Bandung)
    { productId: prodRice.id, storeId: storeBandung.id, quantity: 20 },
    { productId: prodMilk.id, storeId: storeBandung.id, quantity: 30 },
    { productId: prodEgg.id, storeId: storeBandung.id, quantity: 45 },
    { productId: prodOil.id, storeId: storeBandung.id, quantity: 60 },
    { productId: prodSugar.id, storeId: storeBandung.id, quantity: 25 },
    // Stock for third store (Surabaya)
    { productId: prodRice.id, storeId: storeSurabaya.id, quantity: 15 },
    { productId: prodMilk.id, storeId: storeSurabaya.id, quantity: 25 },
    { productId: prodEgg.id, storeId: storeSurabaya.id, quantity: 40 },
    { productId: prodOil.id, storeId: storeSurabaya.id, quantity: 50 },
    { productId: prodSugar.id, storeId: storeSurabaya.id, quantity: 20 },
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

  // 7. Create SAMPLE STOCK JOURNALS (for testing history)
  const riceStock = await prisma.stock.findUnique({
    where: {
      productId_storeId: {
        productId: prodRice.id,
        storeId: store.id,
      },
    },
  });

  if (riceStock) {
    // Journal 1: Initial stock IN
    await prisma.stockJournal.create({
      data: {
        stockId: riceStock.id,
        oldQty: 0,
        newQty: 50,
        change: 50,
        type: "IN",
        reason: "Initial stock from supplier",
        userId: admin.id,
      },
    });

    // Journal 2: Stock OUT (sale)
    await prisma.stockJournal.create({
      data: {
        stockId: riceStock.id,
        oldQty: 50,
        newQty: 45,
        change: -5,
        type: "OUT",
        reason: "Customer order #ORD-001",
        userId: user.id,
      },
    });

    // Journal 3: Stock IN (restock)
    await prisma.stockJournal.create({
      data: {
        stockId: riceStock.id,
        oldQty: 45,
        newQty: 50,
        change: 5,
        type: "IN",
        reason: "Restock from warehouse",
        userId: storeAdmin.id,
      },
    });
  }

  // Create sample TRANSFER journals
  const riceStockBandung = await prisma.stock.findUnique({
    where: {
      productId_storeId: {
        productId: prodRice.id,
        storeId: storeBandung.id,
      },
    },
  });

  if (riceStock && riceStockBandung) {
    // Transfer journal OUT (Jakarta)
    await prisma.stockJournal.create({
      data: {
        stockId: riceStock.id,
        oldQty: 50,
        newQty: 40,
        change: -10,
        type: "TRANSFER",
        reason: "Transfer to Bandung branch for restock",
        userId: admin.id,
      },
    });

    // Transfer journal IN (Bandung)
    await prisma.stockJournal.create({
      data: {
        stockId: riceStockBandung.id,
        oldQty: 20,
        newQty: 30,
        change: 10,
        type: "TRANSFER",
        reason: "Received transfer from Jakarta branch",
        userId: admin.id,
      },
    });
  }

  // 8. Create SAMPLE DISCOUNTS (for testing)
  // Discount 1: Percentage discount for Beras in Jakarta (ACTIVE - Future dates)
  await prisma.discount.create({
    data: {
      storeId: store.id,
      productId: prodRice.id,
      type: "PERCENT",
      value: "20", // 20%
      minSpend: "100000",
      maxDiscount: "50000",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2027-12-31T23:59:59Z"), // Active until end of 2027
      isActive: true,
    },
  });

  // Discount 2: B1G1 for Susu in Jakarta (ACTIVE - Future dates)
  await prisma.discount.create({
    data: {
      storeId: store.id,
      productId: prodMilk.id,
      type: "B1G1",
      value: "0",
      buyQty: 2,
      freeQty: 1,
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2027-12-31T23:59:59Z"), // Active until end of 2027
      isActive: true,
    },
  });

  // Discount 3: Nominal discount for all products in Bandung (ACTIVE - Future dates)
  await prisma.discount.create({
    data: {
      storeId: storeBandung.id,
      productId: null, // Store-wide discount
      type: "NOMINAL",
      value: "15000", // Rp 15,000 off
      minSpend: "50000",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2027-12-31T23:59:59Z"), // Active until end of 2027
      isActive: true,
    },
  });

  // 9. Create SAMPLE VOUCHERS (for testing)
  // Delete existing vouchers first to avoid unique constraint
  await prisma.voucher.deleteMany({
    where: {
      userId: user.id,
    },
  });

  // Voucher 1: Percentage voucher for user (ACTIVE - Future expiry)
  await prisma.voucher.create({
    data: {
      code: "WELCOME25",
      userId: user.id,
      type: "TOTAL",
      value: "25", // 25%
      maxDiscount: "50000",
      minSpend: "100000",
      qty: 1,
      expiryDate: new Date("2027-12-31T23:59:59Z"), // Active until end of 2027
      isUsed: false,
    },
  });

  // Voucher 2: Nominal voucher for product-specific (ACTIVE - Future expiry)
  await prisma.voucher.create({
    data: {
      code: "BERAS10K",
      userId: user.id,
      productId: prodRice.id,
      type: "PRODUCT",
      value: "10000", // Rp 10,000 off
      minSpend: "50000",
      qty: 3, // Can be used 3 times
      expiryDate: new Date("2027-06-30T23:59:59Z"), // Active until mid 2027
      isUsed: false,
    },
  });

  // Voucher 3: Free shipping voucher (ACTIVE - Future expiry)
  await prisma.voucher.create({
    data: {
      code: "FREESHIP",
      userId: user.id,
      type: "SHIPPING",
      value: "15000", // Rp 15,000 shipping discount
      minSpend: "75000",
      qty: 2,
      expiryDate: new Date("2027-04-30T23:59:59Z"), // Active until Apr 2027
      isUsed: false,
    },
  });

  // Voucher 4: Used voucher (for testing) - Keep as used/expired
  await prisma.voucher.create({
    data: {
      code: "USED50",
      userId: user.id,
      type: "TOTAL",
      value: "50000",
      minSpend: "200000",
      qty: 0, // Exhausted
      expiryDate: new Date("2024-03-31T23:59:59Z"), // Expired
      isUsed: true,
      usedAt: new Date("2024-02-15T10:30:00Z"),
    },
  });

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
