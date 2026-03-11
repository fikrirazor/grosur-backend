// src/services/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../generated/prisma";

export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

export const verifyPassword = async (plain: string, hashed: string) => {
  return await bcrypt.compare(plain, hashed);
};

export const generateAuthToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, { expiresIn: "1d" });
};