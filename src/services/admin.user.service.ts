import { Prisma, Role } from "../generated/prisma";
import prisma from "../config/database";
import * as bcrypt from "bcrypt";

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

export const createUser = async (data: any) => {
  const { email, password, name, role } = data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role as Role,
      isVerified: true, // Admin-created users are verified by default
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
};

export const updateUser = async (id: string, data: any) => {
  const { email, password, name, role } = data;

  const updateData: any = {
    email,
    name,
    role: role as Role,
  };

  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  return await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
};

export const deleteUser = async (id: string) => {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Prevent deleting self (can be added if we have actorId)
  
  return await prisma.user.delete({
    where: { id },
  });
};
