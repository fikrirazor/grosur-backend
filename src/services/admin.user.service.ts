import { Prisma } from "../generated/prisma";
import prisma from "../config/database";

export const getAllUsers = async (query: any) => {
  const {
    search,
    role,
    isVerified,
    startDate,
    endDate,
    sortBy = "createdAt",
    order = "desc",
    page = 1,
    limit = 20, // Hard limit 20 per requirements
  } = query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Math.min(Number(limit), 20);

  const where: Prisma.UserWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isVerified !== undefined) {
    where.isVerified = isVerified === "true";
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [users, totalRows] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        managedStore: {
          select: { name: true },
        },
      },
      orderBy: { [sortBy]: order },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page: Number(page),
      limit: take,
      totalPage: Math.ceil(totalRows / take),
      totalRows,
    },
  };
};
