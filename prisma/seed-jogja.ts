import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed for Yogyakarta branch...");

  let jogjaStore = await prisma.store.findFirst({
    where: { 
      OR: [
        { name: { contains: "Yogyakarta", mode: "insensitive" } },
        { city: { contains: "Yogyakarta", mode: "insensitive" } }
      ]
    },
  });

  if (!jogjaStore) {
    console.log("📍 Yogyakarta store not found, creating it...");
    jogjaStore = await prisma.store.create({
      data: {
        name: "Grosur Cabang Yogyakarta",
        description: "Cabang Grosur di Yogyakarta",
        address: "Jl. Malioboro No. 1, Yogyakarta",
        province: "DI Yogyakarta",
        city: "Yogyakarta",
        district: "Danurejan",
        latitude: -7.7956,
        longitude: 110.3695,
        maxRadius: 50,
        isMain: false,
        isActive: true,
      }
    });
    console.log("✅ Yogyakarta store created.");
  }

  console.log(`📍 Found Store: ${jogjaStore.name} (${jogjaStore.id})`);

  // 2. Ensure Categories Exist
  const categoriesData = [
    { name: "Sembako", slug: "sembako" },
    { name: "Fresh Food", slug: "fresh-food" },
    { name: "Minuman", slug: "minuman" },
    { name: "Snack", slug: "snack" },
    { name: "Kebersihan", slug: "kebersihan" },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories.push(createdCat);
  }
  console.log(`✅ ${categories.length} Categories ready.`);

  // 3. Define Products
  const productsData = [
    // Sembako
    { 
      name: "Beras Jawa Premium 5kg", 
      slug: "beras-jawa-premium-5kg", 
      price: 75000, 
      categorySlug: "sembako",
      description: "Beras putih kualitas premium asli Jawa.",
      imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800"
    },
    { 
      name: "Minyak Goreng SunCo 2L", 
      slug: "minyak-goreng-sunco-2l", 
      price: 36500, 
      categorySlug: "sembako",
      description: "Minyak goreng bening, sehat untuk keluarga.",
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800"
    },
    { 
      name: "Gula Pasir Gulaku 1kg", 
      slug: "gula-pasir-gulaku-1kg", 
      price: 18000, 
      categorySlug: "sembako",
      description: "Gula tebu pilihan asli Indonesia.",
      imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=800"
    },
    // Fresh Food
    { 
      name: "Telur Ayam Negeri 1kg", 
      slug: "telur-ayam-negeri-1kg", 
      price: 28500, 
      categorySlug: "fresh-food",
      description: "Telur ayam negeri segar pilihan.",
      imageUrl: "https://images.unsplash.com/photo-1582722472060-247a5b174fd5?auto=format&fit=crop&q=80&w=800"
    },
    { 
      name: "Susu UHT Full Cream 1L", 
      slug: "susu-uht-full-cream-1l", 
      price: 19500, 
      categorySlug: "fresh-food",
      description: "Susu cair segar kemasan UHT.",
      imageUrl: "https://images.unsplash.com/photo-1563636619-e910009355bb?auto=format&fit=crop&q=80&w=800"
    },
    // Minuman
    { 
      name: "Aqua Air Mineral 600ml", 
      slug: "aqua-air-mineral-600ml", 
      price: 3500, 
      categorySlug: "minuman",
      description: "Air mineral pegunungan asli.",
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=800"
    },
    { 
      name: "Teh Botol Sosro 450ml", 
      slug: "teh-botol-sosro-450ml", 
      price: 6500, 
      categorySlug: "minuman",
      description: "Teh asli dalam kemasan botol.",
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800"
    }
  ];


  // 4. Seed Products and Stocks
  for (const item of productsData) {
    const category = categories.find(c => c.slug === item.categorySlug);
    if (!category) continue;

    // Create Product
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        price: item.price,
        categoryId: category.id,
      },
      create: {
        name: item.name,
        slug: item.slug,
        price: item.price,
        description: item.description,
        categoryId: category.id,
        images: {
          create: { url: item.imageUrl }
        }
      },
    });

    // Create/Update Stock for Jogja Store
    await prisma.stock.upsert({
      where: {
        productId_storeId: {
          productId: product.id,
          storeId: jogjaStore.id,
        },
      },
      update: {
        quantity: 100, // Reset to 100 for demo
      },
      create: {
        productId: product.id,
        storeId: jogjaStore.id,
        quantity: 100,
      },
    });

    console.log(`📦 Product & Stock Ready: ${item.name}`);
  }

  console.log("✨ Seed completed for Yogyakarta!");
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
