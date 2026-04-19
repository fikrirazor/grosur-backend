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
        create: { url: 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//94/MTA-21123796/supernova_mart_supernova_mart_telur_ayam_negeri_-10_pcs-_full02_bdw4tyso.jpg' }
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
        create: { url: 'https://down-id.img.susercontent.com/file/sg-11134201-22110-sah56w6uldjv17' }
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
        create: { url: 'https://image.astronauts.cloud/product-images/2025/6/SusGulaPasirLokal1kg_299edd6a-0919-45fc-9f18-6ea257238cb5_900x900.jpg' }
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

  // 10. Create SAMPLE ADDRESSES (required for orders)
  const addressJakarta = await prisma.address.create({
    data: {
      userId: user.id,
      name: "Rumah Jakarta",
      phone: "081234567890",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      district: "Kebayoran Baru",
      detail: "Jl. Sudirman No. 10",
      postalCode: "12190",
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
      postalCode: "40115",
      isDefault: false,
    },
  });

  const addressSurabaya = await prisma.address.create({
    data: {
      userId: user.id,
      name: "Rumah Surabaya",
      phone: "081234567892",
      province: "Jawa Timur",
      city: "Surabaya",
      district: "Genteng",
      detail: "Jl. Tunjungan No. 30",
      postalCode: "60275",
      isDefault: false,
    },
  });

  // Get stock IDs for order items
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
  const milkStockBandung = await prisma.stock.findUnique({
    where: { productId_storeId: { productId: prodMilk.id, storeId: storeBandung.id } },
  });
  const eggStockSurabaya = await prisma.stock.findUnique({
    where: { productId_storeId: { productId: prodEgg.id, storeId: storeSurabaya.id } },
  });

  // 11. Create SAMPLE ORDERS (for sales report testing)
  // Order 1: January 2024 - Jakarta Store
  await prisma.order.create({
    data: {
      orderNumber: "ORD-20240115-001",
      userId: user.id,
      storeId: store.id,
      addressId: addressJakarta.id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      subtotal: "240500",
      shippingCost: "10000",
      discountAmount: "0",
      totalAmount: "250500",
      createdAt: new Date("2026-01-15T10:30:00Z"),
      paidAt: new Date("2026-01-15T10:35:00Z"),
      confirmedAt: new Date("2026-01-15T11:00:00Z"),
      items: {
        create: [
          {
            productId: prodRice.id,
            stockId: riceStockJakarta!.id,
            quantity: 2,
            price: "75000",
            discount: "0",
            subtotal: "150000",
          },
          {
            productId: prodMilk.id,
            stockId: milkStockJakarta!.id,
            quantity: 3,
            price: "18500",
            discount: "0",
            subtotal: "55500",
          },
          {
            productId: prodOil.id,
            stockId: oilStockJakarta!.id,
            quantity: 1,
            price: "35000",
            discount: "0",
            subtotal: "35000",
          },
        ],
      },
    },
  });

  // Order 2: January 2024 - Jakarta Store
  await prisma.order.create({
    data: {
      orderNumber: "ORD-20240120-002",
      userId: user.id,
      storeId: store.id,
      addressId: addressJakarta.id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      subtotal: "150000",
      shippingCost: "10000",
      discountAmount: "15000",
      totalAmount: "145000",
      createdAt: new Date("2026-01-20T14:15:00Z"),
      paidAt: new Date("2026-01-20T14:20:00Z"),
      confirmedAt: new Date("2026-01-20T15:00:00Z"),
      items: {
        create: [
          {
            productId: prodRice.id,
            stockId: riceStockJakarta!.id,
            quantity: 1,
            price: "75000",
            discount: "0",
            subtotal: "75000",
          },
          {
            productId: prodSugar.id,
            stockId: sugarStockJakarta!.id,
            quantity: 5,
            price: "15000",
            discount: "0",
            subtotal: "75000",
          },
        ],
      },
    },
  });

  // Order 3: January 2024 - Bandung Store
  await prisma.order.create({
    data: {
      orderNumber: "ORD-20240118-003",
      userId: user.id,
      storeId: storeBandung.id,
      addressId: addressBandung.id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      subtotal: "185000",
      shippingCost: "12000",
      discountAmount: "0",
      totalAmount: "197000",
      createdAt: new Date("2026-01-18T09:45:00Z"),
      paidAt: new Date("2026-01-18T09:50:00Z"),
      confirmedAt: new Date("2026-01-18T10:30:00Z"),
      items: {
        create: [
          {
            productId: prodMilk.id,
            stockId: milkStockBandung!.id,
            quantity: 10,
            price: "18500",
            discount: "0",
            subtotal: "185000",
          },
        ],
      },
    },
  });

  // Order 4: February 2024 - Jakarta Store
  await prisma.order.create({
    data: {
      orderNumber: "ORD-20240210-004",
      userId: user.id,
      storeId: store.id,
      addressId: addressJakarta.id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      subtotal: "300000",
      shippingCost: "10000",
      discountAmount: "30000",
      totalAmount: "280000",
      createdAt: new Date("2026-02-10T16:20:00Z"),
      paidAt: new Date("2026-02-10T16:25:00Z"),
      confirmedAt: new Date("2026-02-10T17:00:00Z"),
      items: {
        create: [
          {
            productId: prodRice.id,
            stockId: riceStockJakarta!.id,
            quantity: 4,
            price: "75000",
            discount: "0",
            subtotal: "300000",
          },
        ],
      },
    },
  });

  // Order 5: January 2024 - Surabaya Store
  await prisma.order.create({
    data: {
      orderNumber: "ORD-20240125-005",
      userId: user.id,
      storeId: storeSurabaya.id,
      addressId: addressSurabaya.id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      subtotal: "125000",
      shippingCost: "15000",
      discountAmount: "0",
      totalAmount: "140000",
      createdAt: new Date("2026-01-25T11:00:00Z"),
      paidAt: new Date("2026-01-25T11:05:00Z"),
      confirmedAt: new Date("2026-01-25T12:00:00Z"),
      items: {
        create: [
          {
            productId: prodEgg.id,
            stockId: eggStockSurabaya!.id,
            quantity: 5,
            price: "25000",
            discount: "0",
            subtotal: "125000",
          },
        ],
      },
    },
  });

  // Order 6: PENDING order (should NOT appear in sales report)
  await prisma.order.create({
    data: {
      orderNumber: "ORD-20240128-006",
      userId: user.id,
      storeId: store.id,
      addressId: addressJakarta.id,
      status: "WAITING_PAYMENT",
      paymentStatus: "PENDING",
      subtotal: "467500",
      shippingCost: "10000",
      discountAmount: "0",
      totalAmount: "477500",
      createdAt: new Date("2026-01-28T08:00:00Z"),
      items: {
        create: [
          {
            productId: prodRice.id,
            stockId: riceStockJakarta!.id,
            quantity: 5,
            price: "75000",
            discount: "0",
            subtotal: "375000",
          },
          {
            productId: prodMilk.id,
            stockId: milkStockJakarta!.id,
            quantity: 5,
            price: "18500",
            discount: "0",
            subtotal: "92500",
          },
        ],
      },
    },
  });

  // Order 7: March 2024 - Jakarta Store (More variety)
  await prisma.order.create({
    data: {
      orderNumber: "ORD-20240305-007",
      userId: user.id,
      storeId: store.id,
      addressId: addressJakarta.id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      subtotal: "92500",
      shippingCost: "10000",
      discountAmount: "0",
      totalAmount: "102500",
      createdAt: new Date("2026-03-05T13:30:00Z"),
      paidAt: new Date("2026-03-05T13:35:00Z"),
      confirmedAt: new Date("2026-03-05T14:00:00Z"),
      items: {
        create: [
          {
            productId: prodMilk.id,
            stockId: milkStockJakarta!.id,
            quantity: 5,
            price: "18500",
            discount: "0",
            subtotal: "92500",
          },
        ],
      },
    },
  });

  // Order 8: March 2024 - Bandung Store
  await prisma.order.create({
    data: {
      orderNumber: "ORD-20240310-008",
      userId: user.id,
      storeId: storeBandung.id,
      addressId: addressBandung.id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      subtotal: "112500",
      shippingCost: "12000",
      discountAmount: "0",
      totalAmount: "124500",
      createdAt: new Date("2026-03-10T10:15:00Z"),
      paidAt: new Date("2026-03-10T10:20:00Z"),
      confirmedAt: new Date("2026-03-10T11:00:00Z"),
      items: {
        create: [
          {
            productId: prodEgg.id,
            stockId: eggStockSurabaya!.id,
            quantity: 3,
            price: "25000",
            discount: "0",
            subtotal: "75000",
          },
          {
            productId: prodSugar.id,
            stockId: sugarStockJakarta!.id,
            quantity: 2,
            price: "15000",
            discount: "0",
            subtotal: "30000",
          },
        ],
      },
    },
  });

  // Order 9: January 2024 - Surabaya Store (More products)
  await prisma.order.create({
    data: {
      orderNumber: "ORD-20240130-009",
      userId: user.id,
      storeId: storeSurabaya.id,
      addressId: addressSurabaya.id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      subtotal: "160000",
      shippingCost: "15000",
      discountAmount: "0",
      totalAmount: "175000",
      createdAt: new Date("2026-01-30T15:45:00Z"),
      paidAt: new Date("2026-01-30T15:50:00Z"),
      confirmedAt: new Date("2026-01-30T16:30:00Z"),
      items: {
        create: [
          {
            productId: prodRice.id,
            stockId: riceStockJakarta!.id,
            quantity: 1,
            price: "75000",
            discount: "0",
            subtotal: "75000",
          },
          {
            productId: prodOil.id,
            stockId: oilStockJakarta!.id,
            quantity: 1,
            price: "35000",
            discount: "0",
            subtotal: "35000",
          },
          {
            productId: prodSugar.id,
            stockId: sugarStockJakarta!.id,
            quantity: 3,
            price: "15000",
            discount: "0",
            subtotal: "45000",
          },
        ],
      },
    },
  });

  // Order 10: February 2024 - Bandung Store
  await prisma.order.create({
    data: {
      orderNumber: "ORD-20240215-010",
      userId: user.id,
      storeId: storeBandung.id,
      addressId: addressBandung.id,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      subtotal: "210000",
      shippingCost: "12000",
      discountAmount: "20000",
      totalAmount: "202000",
      createdAt: new Date("2026-02-15T09:00:00Z"),
      paidAt: new Date("2026-02-15T09:05:00Z"),
      confirmedAt: new Date("2026-02-15T10:00:00Z"),
      items: {
        create: [
          {
            productId: prodRice.id,
            stockId: riceStockJakarta!.id,
            quantity: 2,
            price: "75000",
            discount: "0",
            subtotal: "150000",
          },
          {
            productId: prodOil.id,
            stockId: oilStockJakarta!.id,
            quantity: 1,
            price: "35000",
            discount: "0",
            subtotal: "35000",
          },
          {
            productId: prodSugar.id,
            stockId: sugarStockJakarta!.id,
            quantity: 1,
            price: "15000",
            discount: "0",
            subtotal: "15000",
          },
        ],
      },
    },
  });

  // 12. ADD APRIL 2024 STOCK JOURNALS FOR REPORT TESTING
  console.log('Adding April 2026 test records...');
  
  const aprilDates = [
    new Date("2026-04-02T09:00:00Z"),
    new Date("2026-04-05T14:30:00Z"),
    new Date("2026-04-10T11:15:00Z"),
    new Date("2026-04-15T16:45:00Z"),
    new Date("2026-04-18T10:00:00Z"),
  ];

  // Restock for Beras Premium 5kg in Jakarta
  if (riceStockJakarta) {
    await prisma.stockJournal.createMany({
      data: [
        {
          stockId: riceStockJakarta.id,
          oldQty: 50,
          newQty: 100,
          change: 50,
          type: "IN",
          reason: "Monthly restock from main supplier",
          createdAt: aprilDates[0],
          userId: admin.id,
        },
        {
          stockId: riceStockJakarta.id,
          oldQty: 100,
          newQty: 95,
          change: -5,
          type: "OUT",
          reason: "Manual adjustment: Damaged packaging",
          createdAt: aprilDates[2],
          userId: storeAdmin.id,
        }
      ]
    });
  }

  // Restock for Susu in Jakarta
  if (milkStockJakarta) {
    await prisma.stockJournal.create({
      data: {
        stockId: milkStockJakarta.id,
        oldQty: 100,
        newQty: 150,
        change: 50,
        type: "IN",
        reason: "Supplier delivery A-55",
        createdAt: aprilDates[1],
        userId: admin.id,
      }
    });
  }

  // Transfer for Beras: Bandung to Jakarta
  if (riceStock && riceStockBandung) {
    await prisma.stockJournal.createMany({
      data: [
        {
          stockId: riceStockBandung.id,
          oldQty: 30,
          newQty: 20,
          change: -10,
          type: "TRANSFER",
          reason: "Stock redistribution to Jakarta branch",
          createdAt: aprilDates[3],
          userId: admin.id,
        },
        {
          stockId: riceStock.id,
          oldQty: 95,
          newQty: 105,
          change: 10,
          type: "TRANSFER",
          reason: "Received from Bandung branch",
          createdAt: aprilDates[3],
          userId: admin.id,
        }
      ]
    });
  }

  // Sale for Egg in Surabaya
  if (eggStockSurabaya) {
    await prisma.stockJournal.create({
      data: {
        stockId: eggStockSurabaya.id,
        oldQty: 40,
        newQty: 30,
        change: -10,
        type: "OUT",
        reason: "Offline walk-in purchase batch",
        createdAt: aprilDates[4],
        userId: admin.id,
      }
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
