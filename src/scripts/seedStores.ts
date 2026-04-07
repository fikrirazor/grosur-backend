import prisma from "../config/database";

async function seedStores() {
  const stores = [
    {
      name: "Grosur Jakarta Pusat",
      address: "Jl. Pecenongan No. 72, Gambir",
      city: "Jakarta Pusat",
      province: "DKI Jakarta",
      district: "Gambir",
      latitude: -6.1674,
      longitude: 106.8314,
    },
    {
      name: "Grosur Bandung Kota",
      address: "Jl. Asia Afrika No. 65",
      city: "Bandung",
      province: "Jawa Barat",
      district: "Sumur Bandung",
      latitude: -6.9217,
      longitude: 107.6108,
    },
    {
      name: "Grosur Surabaya Timur",
      address: "Jl. Manyar Kertoarjo No. 1",
      city: "Surabaya",
      province: "Jawa Timur",
      district: "Mulyorejo",
      latitude: -7.2796,
      longitude: 112.7681,
    },
  ];

  try {
    for (const store of stores) {
      await prisma.store.upsert({
        where: { name: store.name },
        update: {},
        create: store,
      });
    }
    console.log("✅ Stores seeded successfully!");
  } catch (error) {
    console.error("Error seeding stores:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedStores();
