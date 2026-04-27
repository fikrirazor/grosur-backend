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
  console.log('🌱 Starting comprehensive database seed...');
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 0. Cleanup existing data (Idempotent seed)
  console.log('Cleaning up existing data...');
  // Delete in reverse order of dependencies
  await prisma.actionLog.deleteMany();
  await prisma.cronJobLog.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.stockJournal.deleteMany();
  await prisma.order.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.shippingCost.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create SUPER_ADMIN
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      isVerified: true,
    },
  });

  // 2. Create Regular USER
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Regular User',
      role: 'USER',
      isVerified: true,
    },
  });

  // 3. Create Sample STORES
  const store = await prisma.store.create({
    data: {
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

  const storeBandung = await prisma.store.create({
    data: {
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

  const storeSurabaya = await prisma.store.create({
    data: {
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
  const storeAdmin = await prisma.user.create({
    data: {
      email: 'storeadmin@example.com',
      password: hashedPassword,
      name: 'Store Admin Jakarta',
      role: 'STORE_ADMIN',
      isVerified: true,
      managedStoreId: store.id,
    },
  });

  // 5. Create CATEGORIES
  const catSembako = await prisma.category.create({
    data: { name: 'Sembako', slug: 'sembako' },
  });

  const catFresh = await prisma.category.create({
    data: { name: 'Fresh Food', slug: 'fresh-food' },
  });

  // 6. Create PRODUCTS
  const prodRice = await prisma.product.create({
    data: {
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

  const prodMilk = await prisma.product.create({
    data: {
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

  const prodEgg = await prisma.product.create({
    data: {
      name: 'Telur Ayam Negeri 10pcs',
      slug: 'telur-ayam-negeri-10pcs',
      description: 'Telur ayam negeri segar pilihan.',
      price: 25000,
      categoryId: catFresh.id,
      isActive: true,
      images: {
        create: { url: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//94/MTA-21123796/supernova_mart_supernova_mart_telur_ayam_negeri_-10_pcs-_full02_bdw4tyso.jpg' }
      }
    },
  });

  const prodOil = await prisma.product.create({
    data: {
      name: 'Minyak Goreng 2L',
      slug: 'minyak-goreng-2l',
      description: 'Minyak goreng kelapa sawit berkualitas 2 liter.',
      price: 35000,
      categoryId: catSembako.id,
      isActive: true,
      images: {
        create: { url: 'https://down-id.img.susercontent.com/file/sg-11134201-22110-sah56w6uldjv17' }
      }
    },
  });

  const prodSugar = await prisma.product.create({
    data: {
      name: 'Gula Pasir 1kg',
      slug: 'gula-pasir-1kg',
      description: 'Gula pasir putih premium kemasan 1kg.',
      price: 15000,
      categoryId: catSembako.id,
      isActive: true,
      images: {
        create: { url: 'https://image.astronauts.cloud/product-images/2025/6/SusGulaPasirLokal1kg_299edd6a-0919-45fc-9f18-6ea257238cb5_900x900.jpg' }
      }
    },
  });

  // 7. Create STOCKS
  const stocks = [
    { productId: prodRice.id, storeId: store.id, quantity: 50 },
    { productId: prodMilk.id, storeId: store.id, quantity: 100 },
    { productId: prodEgg.id, storeId: store.id, quantity: 0 },
    { productId: prodOil.id, storeId: store.id, quantity: 75 },
    { productId: prodSugar.id, storeId: store.id, quantity: 30 },
    { productId: prodRice.id, storeId: storeBandung.id, quantity: 20 },
    { productId: prodMilk.id, storeId: storeBandung.id, quantity: 30 },
    { productId: prodEgg.id, storeId: storeBandung.id, quantity: 45 },
    { productId: prodOil.id, storeId: storeBandung.id, quantity: 60 },
    { productId: prodSugar.id, storeId: storeBandung.id, quantity: 25 },
    { productId: prodRice.id, storeId: storeSurabaya.id, quantity: 15 },
    { productId: prodMilk.id, storeId: storeSurabaya.id, quantity: 25 },
    { productId: prodEgg.id, storeId: storeSurabaya.id, quantity: 40 },
    { productId: prodOil.id, storeId: storeSurabaya.id, quantity: 50 },
    { productId: prodSugar.id, storeId: storeSurabaya.id, quantity: 20 },
  ];

  for (const s of stocks) {
    await prisma.stock.create({ data: s });
  }

  // 8. Create ADDRESSES
  const addressJakarta = await prisma.address.create({
    data: {
      userId: user.id,
      name: "Rumah Jakarta",
      phone: "081234567890",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      district: "Kebayoran Baru",
      detail: "Jl. Sudirman No. 10",
      provinceId: "6",
      cityId: "151",
      isDefault: true,
    },
  });

  const addressBandung = await prisma.address.create({
    data: {
      userId: user.id,
      name: "Rumah Bandung",
      phone: "081234567891",
      province: "Jawa Barat",
      city: "Bandung",
      district: "Bandung Wetan",
      detail: "Jl. Asia Afrika No. 20",
      provinceId: "9",
      cityId: "23",
      isDefault: false,
    },
  });

  await prisma.address.create({
    data: {
      userId: user.id,
      name: "Rumah Surabaya",
      phone: "081234567892",
      province: "Jawa Timur",
      city: "Surabaya",
      district: "Genteng",
      detail: "Jl. Tunjungan No. 30",
      provinceId: "11",
      cityId: "444",
      isDefault: false,
    },
  });

  // 9. Get stock IDs for testing journals and orders
  const riceStockJakarta = await prisma.stock.findUnique({
    where: { productId_storeId: { productId: prodRice.id, storeId: store.id } },
  });
  const milkStockJakarta = await prisma.stock.findUnique({
    where: { productId_storeId: { productId: prodMilk.id, storeId: store.id } },
  });
  const oilStockJakarta = await prisma.stock.findUnique({
    where: { productId_storeId: { productId: prodOil.id, storeId: store.id } },
  });
  const sugarStockJakarta = await prisma.stock.findUnique({
    where: { productId_storeId: { productId: prodSugar.id, storeId: store.id } },
  });
  const riceStockBandung = await prisma.stock.findUnique({
    where: { productId_storeId: { productId: prodRice.id, storeId: storeBandung.id } },
  });
  const milkStockBandung = await prisma.stock.findUnique({
    where: { productId_storeId: { productId: prodMilk.id, storeId: storeBandung.id } },
  });
  await prisma.stock.findUnique({
    where: { productId_storeId: { productId: prodEgg.id, storeId: storeSurabaya.id } },
  });

  // 7.5. Create COMPREHENSIVE STOCK JOURNALS for Report Testing (Jan-Apr 2026)
  // This will create 30+ journals across all products and stores
  
  // Get all stock records
  const allStocks = await prisma.stock.findMany({
    include: {
      product: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
    },
  });

  let journalCount = 0;

  // January 2026 - Initial stocks and first sales
  for (const stock of allStocks) {
    // IN: Initial stock
    await prisma.stockJournal.create({
      data: {
        stockId: stock.id,
        oldQty: 0,
        newQty: stock.quantity,
        change: stock.quantity,
        type: "IN",
        reason: "Initial stock January 2026",
        userId: admin.id,
        createdAt: new Date(`2026-01-05T08:00:00Z`),
      },
    });
    journalCount++;

    // OUT: Some sales (20% of stock)
    const janOutQty = Math.floor(stock.quantity * 0.2);
    if (janOutQty > 0) {
      await prisma.stockJournal.create({
        data: {
          stockId: stock.id,
          oldQty: stock.quantity,
          newQty: stock.quantity - janOutQty,
          change: -janOutQty,
          type: "OUT",
          reason: "Sales January 2026",
          userId: user.id,
          createdAt: new Date(`2026-01-20T14:00:00Z`),
        },
      });
      journalCount++;
    }
  }

  // February 2026 - Restocks and sales
  for (const stock of allStocks) {
    const currentQty = stock.quantity - Math.floor(stock.quantity * 0.2);
    
    // IN: Restock (30% of original)
    const febInQty = Math.floor(stock.quantity * 0.3);
    await prisma.stockJournal.create({
      data: {
        stockId: stock.id,
        oldQty: currentQty,
        newQty: currentQty + febInQty,
        change: febInQty,
        type: "IN",
        reason: "Restock February 2026",
        userId: storeAdmin.id,
        createdAt: new Date(`2026-02-10T09:00:00Z`),
      },
    });
    journalCount++;

    // OUT: Sales (15% of original)
    const febOutQty = Math.floor(stock.quantity * 0.15);
    if (febOutQty > 0) {
      await prisma.stockJournal.create({
        data: {
          stockId: stock.id,
          oldQty: currentQty + febInQty,
          newQty: currentQty + febInQty - febOutQty,
          change: -febOutQty,
          type: "OUT",
          reason: "Sales February 2026",
          userId: user.id,
          createdAt: new Date(`2026-02-25T16:00:00Z`),
        },
      });
      journalCount++;
    }
  }

  // March 2026 - More activity
  for (const stock of allStocks) {
    const currentQtyAfterFeb = stock.quantity - Math.floor(stock.quantity * 0.2) + Math.floor(stock.quantity * 0.3) - Math.floor(stock.quantity * 0.15);
    
    // IN: Restock (25% of original)
    const marchInQty = Math.floor(stock.quantity * 0.25);
    await prisma.stockJournal.create({
      data: {
        stockId: stock.id,
        oldQty: currentQtyAfterFeb,
        newQty: currentQtyAfterFeb + marchInQty,
        change: marchInQty,
        type: "IN",
        reason: "Restock March 2026",
        userId: admin.id,
        createdAt: new Date(`2026-03-08T10:00:00Z`),
      },
    });
    journalCount++;

    // OUT: Sales (20% of original)
    const marchOutQty = Math.floor(stock.quantity * 0.2);
    if (marchOutQty > 0) {
      await prisma.stockJournal.create({
        data: {
          stockId: stock.id,
          oldQty: currentQtyAfterFeb + marchInQty,
          newQty: currentQtyAfterFeb + marchInQty - marchOutQty,
          change: -marchOutQty,
          type: "OUT",
          reason: "Sales March 2026",
          userId: user.id,
          createdAt: new Date(`2026-03-22T13:00:00Z`),
        },
      });
      journalCount++;
    }
  }

  // April 2026 - Current month activity
  for (const stock of allStocks) {
    const currentQtyAfterMarch = stock.quantity - Math.floor(stock.quantity * 0.2) + Math.floor(stock.quantity * 0.3) - Math.floor(stock.quantity * 0.15) + Math.floor(stock.quantity * 0.25) - Math.floor(stock.quantity * 0.2);
    
    // IN: Restock (20% of original)
    const aprilInQty = Math.floor(stock.quantity * 0.2);
    await prisma.stockJournal.create({
      data: {
        stockId: stock.id,
        oldQty: currentQtyAfterMarch,
        newQty: currentQtyAfterMarch + aprilInQty,
        change: aprilInQty,
        type: "IN",
        reason: "Restock April 2026",
        userId: storeAdmin.id,
        createdAt: new Date(`2026-04-05T08:00:00Z`),
      },
    });
    journalCount++;

    // OUT: Sales (10% of original)
    const aprilOutQty = Math.floor(stock.quantity * 0.1);
    if (aprilOutQty > 0) {
      await prisma.stockJournal.create({
        data: {
          stockId: stock.id,
          oldQty: currentQtyAfterMarch + aprilInQty,
          newQty: currentQtyAfterMarch + aprilInQty - aprilOutQty,
          change: -aprilOutQty,
          type: "OUT",
          reason: "Sales April 2026",
          userId: user.id,
          createdAt: new Date(`2026-04-18T15:00:00Z`),
        },
      });
      journalCount++;
    }
  }

  console.log(`✅ Created ${journalCount} stock journals for ${allStocks.length} products across all stores (Jan-Apr 2026)`);

  // 10. Create SAMPLE DISCOUNTS
  // Jakarta Discounts
  await prisma.discount.create({
    data: {
      storeId: store.id,
      productId: prodRice.id,
      type: "PERCENT",
      value: 20,
      minSpend: 100000,
      maxDiscount: 50000,
      startDate: new Date("2026-04-19T00:00:00Z"),
      endDate: new Date("2026-06-30T23:59:59Z"),
      isActive: true,
    },
  });

  await prisma.discount.create({
    data: {
      storeId: store.id,
      productId: prodMilk.id,
      type: "B1G1",
      value: 0,
      buyQty: 2,
      freeQty: 1,
      startDate: new Date("2026-04-01T00:00:00Z"),
      endDate: new Date("2026-05-31T23:59:59Z"),
      isActive: true,
    },
  });

  // Bandung Discounts
  await prisma.discount.create({
    data: {
      storeId: storeBandung.id,
      productId: prodOil.id,
      type: "NOMINAL",
      value: 5000,
      minSpend: 50000,
      startDate: new Date("2026-04-19T00:00:00Z"),
      endDate: new Date("2026-06-15T23:59:59Z"),
      isActive: true,
    },
  });

  // Surabaya Discounts
  await prisma.discount.create({
    data: {
      storeId: storeSurabaya.id,
      productId: prodSugar.id,
      type: "PERCENT",
      value: 15,
      minSpend: 30000,
      maxDiscount: 10000,
      startDate: new Date("2026-04-15T00:00:00Z"),
      endDate: new Date("2026-06-30T23:59:59Z"),
      isActive: true,
    },
  });

  // 11. Create SAMPLE VOUCHERS
  await prisma.voucher.create({
    data: {
      code: "WELCOME25",
      userId: user.id,
      type: "TOTAL",
      value: 25,
      maxDiscount: 50000,
      minSpend: 100000,
      qty: 1,
      expiryDate: new Date("2027-12-31T23:59:59Z"),
      isUsed: false,
    },
  });

  // 12. Create SAMPLE ORDERS (spread across months for reports)
  const orderData = [
    {
      orderNumber: "ORD-20260115-001",
      createdAt: new Date("2026-01-15T10:30:00Z"),
      storeId: store.id,
      addressId: addressJakarta.id,
      subtotal: 240500,
      shippingCost: 10000,
      discountAmount: 0,
      totalAmount: 250500,
      items: [
        { productId: prodRice.id, stockId: riceStockJakarta!.id, quantity: 2, price: 75000, subtotal: 150000 },
        { productId: prodMilk.id, stockId: milkStockJakarta!.id, quantity: 3, price: 18500, subtotal: 55500 },
        { productId: prodOil.id, stockId: oilStockJakarta!.id, quantity: 1, price: 35000, subtotal: 35000 },
      ]
    },
    {
      orderNumber: "ORD-20260120-002",
      createdAt: new Date("2026-01-20T14:15:00Z"),
      storeId: store.id,
      addressId: addressJakarta.id,
      subtotal: 150000,
      shippingCost: 10000,
      discountAmount: 15000,
      totalAmount: 145000,
      items: [
        { productId: prodRice.id, stockId: riceStockJakarta!.id, quantity: 1, price: 75000, subtotal: 75000 },
        { productId: prodSugar.id, stockId: sugarStockJakarta!.id, quantity: 5, price: 15000, subtotal: 75000 },
      ]
    },
    {
      orderNumber: "ORD-20260118-003",
      createdAt: new Date("2026-01-18T09:45:00Z"),
      storeId: storeBandung.id,
      addressId: addressBandung.id,
      subtotal: 185000,
      shippingCost: 12000,
      discountAmount: 0,
      totalAmount: 197000,
      items: [
        { productId: prodMilk.id, stockId: milkStockBandung!.id, quantity: 10, price: 18500, subtotal: 185000 },
      ]
    },
    {
      orderNumber: "ORD-20260210-004",
      createdAt: new Date("2026-02-10T16:20:00Z"),
      storeId: store.id,
      addressId: addressJakarta.id,
      subtotal: 300000,
      shippingCost: 10000,
      discountAmount: 30000,
      totalAmount: 280000,
      items: [
        { productId: prodRice.id, stockId: riceStockJakarta!.id, quantity: 4, price: 75000, subtotal: 300000 },
      ]
    },
    {
      orderNumber: "ORD-20260305-007",
      createdAt: new Date("2026-03-05T13:30:00Z"),
      storeId: store.id,
      addressId: addressJakarta.id,
      subtotal: 92500,
      shippingCost: 10000,
      discountAmount: 0,
      totalAmount: 102500,
      items: [
        { productId: prodMilk.id, stockId: milkStockJakarta!.id, quantity: 5, price: 18500, subtotal: 92500 },
      ]
    }
  ];

  for (const o of orderData) {
    await prisma.order.create({
      data: {
        orderNumber: o.orderNumber,
        userId: user.id,
        storeId: o.storeId,
        addressId: o.addressId,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        subtotal: o.subtotal,
        shippingCost: o.shippingCost,
        discountAmount: o.discountAmount,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        items: {
          create: o.items.map(i => ({
            productId: i.productId,
            stockId: i.stockId,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.subtotal
          }))
        }
      }
    });
  }

  // 13. STOCK JOURNALS
  console.log('Adding Stock Journals...');
  const aprilDates = [
    new Date("2026-04-02T09:00:00Z"),
    new Date("2026-04-05T14:30:00Z"),
    new Date("2026-04-10T11:15:00Z"),
    new Date("2026-04-15T16:45:00Z"),
  ];

  if (riceStockJakarta) {
    await prisma.stockJournal.createMany({
      data: [
        { stockId: riceStockJakarta.id, oldQty: 50, newQty: 100, change: 50, type: "IN", reason: "Monthly restock", createdAt: aprilDates[0], userId: admin.id },
        { stockId: riceStockJakarta.id, oldQty: 100, newQty: 95, change: -5, type: "OUT", reason: "Damaged goods", createdAt: aprilDates[2], userId: storeAdmin.id }
      ]
    });
  }

  if (riceStockBandung && riceStockJakarta) {
    await prisma.stockJournal.create({
      data: {
        stockId: riceStockBandung.id,
        oldQty: 30,
        newQty: 20,
        change: -10,
        type: "TRANSFER",
        reason: "Transfer to Jakarta",
        createdAt: aprilDates[3],
        userId: admin.id,
      }
    });
  }

  console.log('✅ Seed completed successfully!');
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
