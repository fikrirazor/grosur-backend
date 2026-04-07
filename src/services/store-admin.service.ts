import prisma from "../config/database";
import { AppError } from "../middleware/error.middleware";
import { hashPassword } from "../utils/password.util";

export const createStoreAdmin = async (data: any) => {
  const { name, email, password, managedStoreId } = data;

  // 1. Cek apakah email sudah terdaftar
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError(400, "Email already registered");
  }

  // 2. Cek apakah Store ada
  const store = await prisma.store.findUnique({
    where: { id: managedStoreId },
  });
  if (!store) {
    throw new AppError(404, "Store not found");
  }

  // 3. Hash password
  const hashedPassword = await hashPassword(password);

  // 4. Simpan ke database
  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      managedStoreId,
      role: "STORE_ADMIN",
      isVerified: true, // Langsung aktif karena dibuat oleh Super Admin
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      managedStore: true,
      createdAt: true,
    },
  });
};

export const getStoreAdmins = async (query: any) => {
  const { page = 1, limit = 10 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const [admins, totalRows] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STORE_ADMIN" },
      include: { managedStore: true },
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where: { role: "STORE_ADMIN" } }),
  ]);

  return {
    admins,
    pagination: {
      page: Number(page),
      totalPage: Math.ceil(totalRows / Number(limit)),
      totalRows,
    },
  };
};

export const updateStoreAdmin = async (id: string, data: any) => {
  const { name, email, managedStoreId, isVerified } = data;

  // 1. Cek keberadaan admin
  const admin = await prisma.user.findUnique({ where: { id } });
  if (!admin || admin.role !== "STORE_ADMIN") {
    throw new AppError(404, "Store Admin not found");
  }

  // 2. Jika email diubah, cek keunikan
  if (email && email !== admin.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new AppError(400, "Email already in use");
  }

  // 3. Jika managedStoreId diubah, cek keberadaan Store
  if (managedStoreId) {
    const store = await prisma.store.findUnique({
      where: { id: managedStoreId },
    });
    if (!store) throw new AppError(404, "Store not found");
  }

  return prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      managedStoreId,
      isVerified,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      managedStore: true,
    },
  });
};

export const deleteStoreAdmin = async (id: string) => {
  const admin = await prisma.user.findUnique({ where: { id } });
  if (!admin || admin.role !== "STORE_ADMIN") {
    throw new AppError(404, "Store Admin not found");
  }

  return prisma.user.delete({ where: { id } });
};

export const getStores = async () => {
  return prisma.store.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });
};

