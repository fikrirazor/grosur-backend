import prisma from "../config/database";
import bcrypt from "bcrypt";

async function main() {
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  const user = await prisma.user.upsert({
    where: { email: "nama@email.com" },
    update: {
      isVerified: true,
    },
    create: {
      email: "nama@email.com",
      password: hashedPassword,
      name: "Sample User",
      role: "USER",
      isVerified: true,
    },
  });

  console.log("User created:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
