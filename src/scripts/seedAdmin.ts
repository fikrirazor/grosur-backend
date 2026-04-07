import "dotenv/config";
import prisma from "../config/database";
import { hashPassword } from "../utils/password.util";

async function seedAdmin() {
  const email = "superadmin@grosur.com";
  const password = "password123";
  
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    
    if (existing) {
      console.log("Admin already exists!");
      return;
    }

    const hashed = await hashPassword(password);
    
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email,
        password: hashed,
        role: "SUPER_ADMIN",
        isVerified: true
      }
    });

    console.log("✅ Super Admin created successfully!");
    console.log("Email: " + email);
    console.log("Password: " + password);
  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
