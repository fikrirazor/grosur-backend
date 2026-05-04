import prisma from "../config/database";
import { AppError } from "../middlewares/error.middleware";
import { formatPaginationMeta } from "../utils/pagination.util";

const USER_PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Mendapatkan profil user berdasarkan ID.
 */
export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...USER_PROFILE_SELECT,
      addresses: true,
    },
  });

  if (!user) throw new AppError(404, "User not found");
  return user;
};

/**
 * Get all registered users (Super Admin only requirement)
 */
/**
 * Mendapatkan daftar semua user yang terdaftar (Super Admin).
 */
export const getAllUsers = async (query: any) => {
  const { page = 1, limit = 10, search } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_PROFILE_SELECT,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    meta: formatPaginationMeta(total, Number(page), Number(limit)),
  };
};
