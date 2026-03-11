// src/services/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../generated/prisma";
import crypto from "crypto";

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

export const createUnverifiedUser = async (email: string) => {
  return await prisma.user.create({ data: { email, isVerified: false } });
};

export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const createVerifyToken = async (userId: string, token: string) => {
  const hashedToken = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
  return await prisma.verificationToken.create({
    data: { userId, token: hashedToken, type: "EMAIL_VERIFY", expiresAt },
  });
};

// Add these to src/services/auth.service.ts

export const validateVerificationToken = async (
  userId: string,
  rawToken: string,
) => {
  const dbToken = await prisma.verificationToken.findFirst({
    where: { userId, type: "EMAIL_VERIFY", isUsed: false },
  });
  if (!dbToken || dbToken.expiresAt < new Date()) return null;

  const isValid = await bcrypt.compare(rawToken, dbToken.token);
  return isValid ? dbToken : null;
};

export const verifyUserAndSetPassword = async (
  userId: string,
  tokenId: string,
  hashedPass: string,
) => {
  return await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashedPass, isVerified: true },
    }),
    prisma.verificationToken.update({
      where: { id: tokenId },
      data: { isUsed: true },
    }),
  ]);
};

// Add these to src/services/auth.service.ts

export const createResetToken = async (userId: string, token: string) => {
  const hashedToken = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
  return await prisma.verificationToken.create({
    data: { userId, token: hashedToken, type: "RESET_PASSWORD", expiresAt },
  });
};

export const validateResetToken = async (userId: string, rawToken: string) => {
  const dbToken = await prisma.verificationToken.findFirst({
    where: { userId, type: "RESET_PASSWORD", isUsed: false },
  });
  if (!dbToken || dbToken.expiresAt < new Date()) return null;

  const isValid = await bcrypt.compare(rawToken, dbToken.token);
  return isValid ? dbToken : null;
};

export const updatePasswordAndUseToken = async (
  userId: string,
  tokenId: string,
  hashedPass: string,
) => {
  return await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashedPass },
    }),
    prisma.verificationToken.update({
      where: { id: tokenId },
      data: { isUsed: true },
    }),
  ]);
};