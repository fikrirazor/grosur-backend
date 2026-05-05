// prisma/seed.ts
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as bcrypt from "bcrypt";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting comprehensive database seed...");
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 0. Cleanup existing data (Idempotent seed)
  console.log("Cleaning up existing data...");
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

  // 1. Create SUPER_ADMINs
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      isVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "fikri@grosur.com",
      password: hashedPassword,
      name: "Rozan Admin",
      role: "SUPER_ADMIN",
      isVerified: true,
    },
  });

  // 2. Create Regular USER
  const user = await prisma.user.create({
    data: {
      email: "user@example.com",
      password: hashedPassword,
      name: "Regular User",
      role: "USER",
      isVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "damar@grosur.com",
      password: hashedPassword,
      name: "damar grosur",
      role: "USER",
      isVerified: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "endang@grosur.com",
      password: hashedPassword,
      name: "Endang Grosur",
      role: "USER",
      isVerified: true,
    },
  });

  // 3. Create Sample STORES
  const store = await prisma.store.create({
    data: {
      name: "Grosur Pusat Jakarta",
      description: "Cabang utama Grosur di Jakarta Selatan",
      address: "Jl. Sudirman No. 1, Jakarta Selatan",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      district: "Kebayoran Baru",
      latitude: -6.2269,
      longitude: 106.8222,
      maxRadius: 100,
    },
  });

  const storeBandung = await prisma.store.create({
    data: {
      name: "Grosur Cabang Bandung",
      description: "Cabang Grosur di Bandung",
      address: "Jl. Asia Afrika No. 10, Bandung",
      province: "Jawa Barat",
      city: "Bandung",
      district: "Bandung Wetan",
      latitude: -6.9175,
      longitude: 107.6191,
      maxRadius: 80,
    },
  });

  const storeSurabaya = await prisma.store.create({
    data: {
      name: "Grosur Cabang Surabaya",
      description: "Cabang Grosur di Surabaya",
      address: "Jl. Tunjungan No. 5, Surabaya",
      province: "Jawa Timur",
      city: "Surabaya",
      district: "Genteng",
      latitude: -7.2575,
      longitude: 112.7521,
      maxRadius: 90,
    },
  });

  const storeYogyakarta = await prisma.store.create({
    data: {
      name: "Grosur Cabang Yogyakarta",
      description: "Cabang Grosur di Yogyakarta",
      address: "Jl. Malioboro No. 16, Sosromenduran",
      province: "DI Yogyakarta",
      city: "Kota Yogyakarta",
      district: "Gedong Tengen",
      latitude: -7.7926,
      longitude: 110.3658,
      maxRadius: 90,
    },
  });

  // 4. Create STORE_ADMINs
  const storeAdmin = await prisma.user.create({
    data: {
      email: "storeadmin@example.com",
      password: hashedPassword,
      name: "Store Admin Jakarta",
      role: "STORE_ADMIN",
      isVerified: true,
      managedStoreId: store.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "storeadmin.bandung@example.com",
      password: hashedPassword,
      name: "Store Admin Bandung",
      role: "STORE_ADMIN",
      isVerified: true,
      managedStoreId: storeBandung.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "storeadmin.surabaya@example.com",
      password: hashedPassword,
      name: "Store Admin Surabaya",
      role: "STORE_ADMIN",
      isVerified: true,
      managedStoreId: storeSurabaya.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "storeadmin.jogja@example.com",
      password: hashedPassword,
      name: "Store Admin Yogyakarta",
      role: "STORE_ADMIN",
      isVerified: true,
      managedStoreId: storeYogyakarta.id,
    },
  });

  // 5. Create CATEGORIES
  const catSembako = await prisma.category.create({
    data: { name: "Sembako", slug: "sembako" },
  });

  const catFresh = await prisma.category.create({
    data: { name: "Fresh Food", slug: "fresh-food" },
  });

  const catSayurBuah = await prisma.category.create({
    data: { name: "Sayur & Buah", slug: "sayur-buah" },
  });

  const catDagingSeafood = await prisma.category.create({
    data: { name: "Daging & Seafood", slug: "daging-seafood" },
  });

  const catBumbu = await prisma.category.create({
    data: { name: "Bumbu Dapur", slug: "bumbu-dapur" },
  });

  const catSnack = await prisma.category.create({
    data: { name: "Makanan Ringan", slug: "makanan-ringan" },
  });

  const catMinuman = await prisma.category.create({
    data: { name: "Minuman", slug: "minuman" },
  });

  // 6. Create PRODUCTS
  const prodRice = await prisma.product.create({
    data: {
      name: "Beras Premium 5kg",
      slug: "beras-premium-5kg",
      description: "Beras putih kualitas premium, pulen dan bersih.",
      price: 75000,
      categoryId: catSembako.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A7771620002167_20250909172806518_small.jpg",
        },
      },
    },
  });

  const prodMilk = await prisma.product.create({
    data: {
      name: "Susu UHT Full Cream 1L",
      slug: "susu-uht-full-cream",
      description: "Susu sapi segar kemasan siap minum.",
      price: 18500,
      categoryId: catFresh.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A13170001234_20240603182523899_small.jpg",
        },
      },
    },
  });

  const prodEgg = await prisma.product.create({
    data: {
      name: "Telur Ayam Negeri 10pcs",
      slug: "telur-ayam-negeri-10pcs",
      description: "Telur ayam negeri segar pilihan.",
      price: 25000,
      categoryId: catFresh.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A7681540001310_20240711151832762_small.jpg",
        },
      },
    },
  });

  const prodOil = await prisma.product.create({
    data: {
      name: "Minyak Goreng 2L",
      slug: "minyak-goreng-2l",
      description: "Minyak goreng kelapa sawit berkualitas 2 liter.",
      price: 35000,
      categoryId: catSembako.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A09350002156_20240507154551859_small.jpg",
        },
      },
    },
  });

  const prodSugar = await prisma.product.create({
    data: {
      name: "Gula Pasir 1kg",
      slug: "gula-pasir-1kg",
      description: "Gula pasir putih premium kemasan 1kg.",
      price: 15000,
      categoryId: catSembako.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A09170001675_20240507165616835_small.jpg",
        },
      },
    },
  });

  // New Products - Sayur & Buah
  const prodApel = await prisma.product.create({
    data: {
      name: "Apel Fuji 1kg",
      slug: "apel-fuji-1kg",
      description: "Apel Fuji segar manis dan renyah, kaya akan vitamin.",
      price: 45000,
      categoryId: catSayurBuah.id,
      isActive: true,
      images: {
        create: {
          url: "https://cdn-klik.klikindomaret.com/klik-catalog/product/20126547_thumb.jpg",
        },
      },
    },
  });

  const prodPisang = await prisma.product.create({
    data: {
      name: "Pisang Cavendish 1 Sisir",
      slug: "pisang-cavendish-1-sisir",
      description: "Pisang Cavendish segar dengan tekstur lembut.",
      price: 25000,
      categoryId: catSayurBuah.id,
      isActive: true,
      images: {
        create: {
          url: "https://cdn-klik.klikindomaret.com/klik-catalog/product/20047700_thumb.jpg",
        },
      },
    },
  });

  const prodBrokoli = await prisma.product.create({
    data: {
      name: "Brokoli Segar 500g",
      slug: "brokoli-segar-500g",
      description:
        "Brokoli hijau segar pilihan terbaik untuk kesehatan keluarga.",
      price: 15000,
      categoryId: catSayurBuah.id,
      isActive: true,
      images: {
        create: {
          url: "https://cdn-klik.klikindomaret.com/klik-catalog/product/20047770_thumb.jpg",
        },
      },
    },
  });

  const prodWortel = await prisma.product.create({
    data: {
      name: "Wortel Berastagi 1kg",
      slug: "wortel-berastagi-1kg",
      description: "Wortel Berastagi segar kualitas premium.",
      price: 12000,
      categoryId: catSayurBuah.id,
      isActive: true,
      images: {
        create: {
          url: "https://cdn-klik.klikindomaret.com/klik-catalog/product/20126551_thumb.jpg",
        },
      },
    },
  });

  const prodTomat = await prisma.product.create({
    data: {
      name: "Tomat Merah 1kg",
      slug: "tomat-merah-1kg",
      description: "Tomat merah segar cocok untuk masakan dan jus.",
      price: 18000,
      categoryId: catSayurBuah.id,
      isActive: true,
      images: {
        create: {
          url: "https://cdn-klik.klikindomaret.com/klik-catalog/product/20126554_thumb.jpg",
        },
      },
    },
  });

  // New Products - Daging & Seafood
  const prodDagingSapi = await prisma.product.create({
    data: {
      name: "Daging Sapi Slice 500g",
      slug: "daging-sapi-slice-500g",
      description:
        "Daging sapi slice tipis cocok for shabu-shabu or yakiniku.",
      price: 65000,
      categoryId: catDagingSeafood.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A8405160002167_20260428155246112_small.jpg",
        },
      },
    },
  });

  const prodDadaAyam = await prisma.product.create({
    data: {
      name: "Dada Ayam Fillet 1kg",
      slug: "dada-ayam-fillet-1kg",
      description: "Dada ayam fillet tanpa tulang, segar dan bersih.",
      price: 55000,
      categoryId: catDagingSeafood.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A8405200002167_20260428155609001_small.jpg",
        },
      },
    },
  });

  const prodSalmon = await prisma.product.create({
    data: {
      name: "Ikan Salmon Fillet 200g",
      slug: "ikan-salmon-fillet-200g",
      description: "Ikan salmon fillet segar premium kaya omega 3.",
      price: 85000,
      categoryId: catDagingSeafood.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A8405110002167_20260428154416785_small.jpg",
        },
      },
    },
  });

  const prodUdang = await prisma.product.create({
    data: {
      name: "Udang Kupas 500g",
      slug: "udang-kupas-500g",
      description: "Udang kupas segar tanpa kulit dan kepala.",
      price: 75000,
      categoryId: catDagingSeafood.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A8405100002167_20260428154146059_small.jpg",
        },
      },
    },
  });

  const prodDagingGiling = await prisma.product.create({
    data: {
      name: "Daging Sapi Giling 500g",
      slug: "daging-sapi-giling-500g",
      description: "Daging sapi giling segar, cocok untuk bakso atau saus.",
      price: 60000,
      categoryId: catDagingSeafood.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A8405140002167_20260428154740476_small.jpg",
        },
      },
    },
  });

  // New Products - Bumbu Dapur
  const prodBawangMerah = await prisma.product.create({
    data: {
      name: "Bawang Merah 500g",
      slug: "bawang-merah-500g",
      description: "Bawang merah segar pilihan kualitas terbaik.",
      price: 25000,
      categoryId: catBumbu.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A8405300002167_20260428161157812_small.jpg",
        },
      },
    },
  });

  const prodBawangPutih = await prisma.product.create({
    data: {
      name: "Bawang Putih Kating 500g",
      slug: "bawang-putih-kating-500g",
      description: "Bawang putih kating kualitas super, aroma lebih wangi.",
      price: 22000,
      categoryId: catBumbu.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A8405530002190_20260422161421174_small.jpg",
        },
      },
    },
  });

  const prodCabeMerah = await prisma.product.create({
    data: {
      name: "Cabe Merah Keriting 250g",
      slug: "cabe-merah-keriting-250g",
      description: "Cabe merah keriting segar, pedas alami.",
      price: 15000,
      categoryId: catBumbu.id,
      isActive: true,
      images: {
        create: {
          url: "https://cdn-klik.klikindomaret.com/klik-catalog/product/20125039_thumb.jpg",
        },
      },
    },
  });

  const prodMerica = await prisma.product.create({
    data: {
      name: "Merica Bubuk Ladaku 30g",
      slug: "merica-bubuk-ladaku-30g",
      description: "Merica putih bubuk praktis murni 100%.",
      price: 5000,
      categoryId: catBumbu.id,
      isActive: true,
      images: {
        create: {
          url: "https://cdn-klik.klikindomaret.com/klik-catalog/product/20134372_thumb.jpg",
        },
      },
    },
  });

  const prodGaram = await prisma.product.create({
    data: {
      name: "Garam Meja Dolphing 500g",
      slug: "garam-meja-dolphing-500g",
      description: "Garam beryodium berkualitas untuk melezatkan masakan.",
      price: 4000,
      categoryId: catBumbu.id,
      isActive: true,
      images: {
        create: {
          url: "https://cdn-klik.klikindomaret.com/klik-catalog/product/20026676_thumb.jpg",
        },
      },
    },
  });

  // New Products - Makanan Ringan
  const prodChitato = await prisma.product.create({
    data: {
      name: "Chitato Rasa Sapi Panggang 68g",
      slug: "chitato-sapi-panggang-68g",
      description:
        "Keripik kentang bergelombang rasa sapi panggang yang gurih.",
      price: 11500,
      categoryId: catSnack.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A7371590001001_20260501003905630_small.jpg",
        },
      },
    },
  });

  const prodTaro = await prisma.product.create({
    data: {
      name: "Taro Net Seaweed 65g",
      slug: "taro-net-seaweed-65g",
      description: "Snack renyah bentuk net dengan rasa rumput laut.",
      price: 10000,
      categoryId: catSnack.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/A7657080002165_A7657080002165_20230919103312567_small.jpg",
        },
      },
    },
  });

  const prodQtela = await prisma.product.create({
    data: {
      name: "Qtela Keripik Singkong 185g",
      slug: "qtela-keripik-singkong-185g",
      description: "Keripik singkong renyah rasa original.",
      price: 16000,
      categoryId: catSnack.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A7371590001001_20260501003905630_small.jpg",
        },
      },
    },
  });

  const prodBengBeng = await prisma.product.create({
    data: {
      name: "Beng-Beng Share It 10x9.5g",
      slug: "beng-beng-share-it",
      description: "Wafer cokelat karamel renyah dalam kemasan mini.",
      price: 14500,
      categoryId: catSnack.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A10160000157_20250915095146879_small.jpg",
        },
      },
    },
  });

  const prodSilverQueen = await prisma.product.create({
    data: {
      name: "SilverQueen Milk Chocolate 58g",
      slug: "silverqueen-milk-chocolate-58g",
      description: "Cokelat susu lezat berpadu dengan kacang mete pilihan.",
      price: 17500,
      categoryId: catSnack.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A11870001957_20250109092239225_small.jpg",
        },
      },
    },
  });

  // New Products - Minuman
  const prodAqua = await prisma.product.create({
    data: {
      name: "Aqua Air Mineral 600ml",
      slug: "aqua-air-mineral-600ml",
      description: "Air mineral pegunungan alami botol 600ml.",
      price: 3500,
      categoryId: catMinuman.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A12460003260_20260216152319086_small.jpg",
        },
      },
    },
  });

  const prodCocaCola = await prisma.product.create({
    data: {
      name: "Coca-Cola 1.5L",
      slug: "coca-cola-1-5l",
      description: "Minuman berkarbonasi rasa cola menyegarkan.",
      price: 16500,
      categoryId: catMinuman.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A12700006001_20240628151513632_small.jpg",
        },
      },
    },
  });

  const prodSprite = await prisma.product.create({
    data: {
      name: "Sprite 1.5L",
      slug: "sprite-1-5l",
      description: "Minuman berkarbonasi rasa lemon lime.",
      price: 16500,
      categoryId: catMinuman.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A12700006001_20240628151513632_small.jpg",
        },
      },
    },
  });

  const prodPocari = await prisma.product.create({
    data: {
      name: "Pocari Sweat 500ml",
      slug: "pocari-sweat-500ml",
      description: "Minuman isotonik pengganti ion tubuh yang hilang.",
      price: 7500,
      categoryId: catMinuman.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A12630003575_20240801142839005_small.jpg",
        },
      },
    },
  });

  const prodUltraMilk = await prisma.product.create({
    data: {
      name: "Ultra Milk Coklat 1L",
      slug: "ultra-milk-coklat-1l",
      description: "Susu cair segar rasa coklat yang lezat dan sehat.",
      price: 19500,
      categoryId: catMinuman.id,
      isActive: true,
      images: {
        create: {
          url: "https://c.alfagift.id/product/1/1_A13170001038_20251015092354827_small.jpg",
        },
      },
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
    // New Products Stocks (Adding to Jakarta store for simplicity)
    { productId: prodApel.id, storeId: store.id, quantity: 50 },
    { productId: prodPisang.id, storeId: store.id, quantity: 40 },
    { productId: prodBrokoli.id, storeId: store.id, quantity: 30 },
    { productId: prodWortel.id, storeId: store.id, quantity: 60 },
    { productId: prodTomat.id, storeId: store.id, quantity: 45 },
    { productId: prodDagingSapi.id, storeId: store.id, quantity: 20 },
    { productId: prodDadaAyam.id, storeId: store.id, quantity: 25 },
    { productId: prodSalmon.id, storeId: store.id, quantity: 15 },
    { productId: prodUdang.id, storeId: store.id, quantity: 30 },
    { productId: prodDagingGiling.id, storeId: store.id, quantity: 20 },
    { productId: prodBawangMerah.id, storeId: store.id, quantity: 100 },
    { productId: prodBawangPutih.id, storeId: store.id, quantity: 100 },
    { productId: prodCabeMerah.id, storeId: store.id, quantity: 80 },
    { productId: prodMerica.id, storeId: store.id, quantity: 200 },
    { productId: prodGaram.id, storeId: store.id, quantity: 150 },
    { productId: prodChitato.id, storeId: store.id, quantity: 120 },
    { productId: prodTaro.id, storeId: store.id, quantity: 100 },
    { productId: prodQtela.id, storeId: store.id, quantity: 80 },
    { productId: prodBengBeng.id, storeId: store.id, quantity: 150 },
    { productId: prodSilverQueen.id, storeId: store.id, quantity: 90 },
    { productId: prodAqua.id, storeId: store.id, quantity: 300 },
    { productId: prodCocaCola.id, storeId: store.id, quantity: 100 },
    { productId: prodSprite.id, storeId: store.id, quantity: 100 },
    { productId: prodPocari.id, storeId: store.id, quantity: 150 },
    { productId: prodUltraMilk.id, storeId: store.id, quantity: 120 },
    // Jogja Store Stocks
    { productId: prodRice.id, storeId: storeYogyakarta.id, quantity: 40 },
    { productId: prodMilk.id, storeId: storeYogyakarta.id, quantity: 60 },
    { productId: prodEgg.id, storeId: storeYogyakarta.id, quantity: 80 },
    { productId: prodOil.id, storeId: storeYogyakarta.id, quantity: 50 },
    { productId: prodSugar.id, storeId: storeYogyakarta.id, quantity: 40 },
    { productId: prodApel.id, storeId: storeYogyakarta.id, quantity: 30 },
    { productId: prodPisang.id, storeId: storeYogyakarta.id, quantity: 25 },
    { productId: prodBrokoli.id, storeId: storeYogyakarta.id, quantity: 20 },
    { productId: prodWortel.id, storeId: storeYogyakarta.id, quantity: 35 },
    { productId: prodTomat.id, storeId: storeYogyakarta.id, quantity: 30 },
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
    where: {
      productId_storeId: { productId: prodSugar.id, storeId: store.id },
    },
  });
  const riceStockBandung = await prisma.stock.findUnique({
    where: {
      productId_storeId: { productId: prodRice.id, storeId: storeBandung.id },
    },
  });
  const milkStockBandung = await prisma.stock.findUnique({
    where: {
      productId_storeId: { productId: prodMilk.id, storeId: storeBandung.id },
    },
  });
  await prisma.stock.findUnique({
    where: {
      productId_storeId: { productId: prodEgg.id, storeId: storeSurabaya.id },
    },
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
    const currentQtyAfterFeb =
      stock.quantity -
      Math.floor(stock.quantity * 0.2) +
      Math.floor(stock.quantity * 0.3) -
      Math.floor(stock.quantity * 0.15);

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
    const currentQtyAfterMarch =
      stock.quantity -
      Math.floor(stock.quantity * 0.2) +
      Math.floor(stock.quantity * 0.3) -
      Math.floor(stock.quantity * 0.15) +
      Math.floor(stock.quantity * 0.25) -
      Math.floor(stock.quantity * 0.2);

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

  console.log(
    `✅ Created ${journalCount} stock journals for ${allStocks.length} products across all stores (Jan-Apr 2026)`,
  );

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
        {
          productId: prodRice.id,
          stockId: riceStockJakarta!.id,
          quantity: 2,
          price: 75000,
          subtotal: 150000,
        },
        {
          productId: prodMilk.id,
          stockId: milkStockJakarta!.id,
          quantity: 3,
          price: 18500,
          subtotal: 55500,
        },
        {
          productId: prodOil.id,
          stockId: oilStockJakarta!.id,
          quantity: 1,
          price: 35000,
          subtotal: 35000,
        },
      ],
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
        {
          productId: prodRice.id,
          stockId: riceStockJakarta!.id,
          quantity: 1,
          price: 75000,
          subtotal: 75000,
        },
        {
          productId: prodSugar.id,
          stockId: sugarStockJakarta!.id,
          quantity: 5,
          price: 15000,
          subtotal: 75000,
        },
      ],
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
        {
          productId: prodMilk.id,
          stockId: milkStockBandung!.id,
          quantity: 10,
          price: 18500,
          subtotal: 185000,
        },
      ],
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
        {
          productId: prodRice.id,
          stockId: riceStockJakarta!.id,
          quantity: 4,
          price: 75000,
          subtotal: 300000,
        },
      ],
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
        {
          productId: prodMilk.id,
          stockId: milkStockJakarta!.id,
          quantity: 5,
          price: 18500,
          subtotal: 92500,
        },
      ],
    },
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
          create: o.items.map((i) => ({
            productId: i.productId,
            stockId: i.stockId,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.subtotal,
          })),
        },
      },
    });
  }

  // 13. STOCK JOURNALS
  console.log("Adding Stock Journals...");
  const aprilDates = [
    new Date("2026-04-02T09:00:00Z"),
    new Date("2026-04-05T14:30:00Z"),
    new Date("2026-04-10T11:15:00Z"),
    new Date("2026-04-15T16:45:00Z"),
  ];

  if (riceStockJakarta) {
    await prisma.stockJournal.createMany({
      data: [
        {
          stockId: riceStockJakarta.id,
          oldQty: 50,
          newQty: 100,
          change: 50,
          type: "IN",
          reason: "Monthly restock",
          createdAt: aprilDates[0],
          userId: admin.id,
        },
        {
          stockId: riceStockJakarta.id,
          oldQty: 100,
          newQty: 95,
          change: -5,
          type: "OUT",
          reason: "Damaged goods",
          createdAt: aprilDates[2],
          userId: storeAdmin.id,
        },
      ],
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
      },
    });
  }

  // 14. Create SAMPLE BANNERS
  await prisma.banner.createMany({
    data: [
      {
        title: "Diskon Sembako Murah!",
        subtitle: "Hemat hingga 30% untuk kebutuhan pokok",
        imageUrl:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000",
        bgGradient: "from-green-600 to-green-400",
        contentColor: "text-white",
        isActive: true,
        showText: true,
      },
      {
        title: "Daging Segar Setiap Hari",
        subtitle: "Kualitas premium langsung dari peternak",
        imageUrl:
          "https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=1000",
        bgGradient: "from-red-600 to-red-400",
        contentColor: "text-white",
        isActive: true,
        showText: true,
      },
      {
        title: "Buah & Sayur Organik",
        subtitle: "Tanpa pestisida, lebih sehat untuk keluarga",
        imageUrl:
          "https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=1000",
        bgGradient: "from-orange-500 to-yellow-400",
        contentColor: "text-white",
        isActive: true,
        showText: true,
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
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
