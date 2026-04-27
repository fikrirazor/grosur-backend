// src/services/auth.service.ts

import jwt from "jsonwebtoken";
import prisma from "../config/database";
import crypto from "crypto";
import { AppError } from "../middlewares/error.middleware";
import { generateToken } from "../utils/jwt.util";
import { hashPassword, comparePassword } from "../utils/password.util";
import { generateFriendlyReferralCode } from "../utils/referral.util";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  managedStore: true,
  createdAt: true,
  updatedAt: true,
};

// --- Helper Functions ---

export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    include: { managedStore: true },
  });
};

export const findUserByReferralCode = async (referralCode: string) => {
  return await prisma.user.findUnique({
    where: { referralCode },
  });
};

export const verifyPassword = async (plain: string, hashed: string) => {
  return await comparePassword(plain, hashed);
};

// --- Structured Auth Functions (from develop) ---

export const registerUser = async (data: any) => {
  const { name, email, password } = data;
  if (await findUserByEmail(email)) {
    throw new AppError(409, "User with this email already exists");
  }
  const newUser = await createUserAccount(name, email, password);
  return formatAuthResponse(newUser);
};

export const loginUser = async (data: any) => {
  const user = await validateCredentials(data.email, data.password);
  return formatAuthResponse(user);
};

export const createUserAccount = async (name: string, email: string, pass: string) => {
  const hashedPassword = await hashPassword(pass);
  const referralCode = await generateFriendlyReferralCode(name || email);
  return await prisma.user.create({
    data: { name, email, password: hashedPassword, role: "USER", referralCode },
    select: USER_SELECT,
  });
};

export const validateCredentials = async (email: string, pass: string) => {
  const user = await findUserByEmail(email);
  if (
    !user ||
    !user.password ||
    !(await comparePassword(pass, user.password))
  ) {
    throw new AppError(401, "Invalid email or password");
  }
  return user;
};

export const formatAuthResponse = (user: any) => {
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};

// --- Referral & Verification Functions (from feat/referral-code) ---

export const generateAuthToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET as string, { expiresIn: "1d" });
};

export const createUnverifiedUser = async (email: string, referredBy?: string) => {
  const referralCode = await generateFriendlyReferralCode(email);
  return await prisma.user.create({
    data: {
      email,
      isVerified: false,
      role: "USER",
      referredBy: referredBy || null,
      referralCode,
    },
    include: { managedStore: true }
  });
};

export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// SHA-256 hash of a token — deterministic (correct for tokens, not passwords)
const sha256 = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createVerifyToken = async (userId: string, token: string) => {
  // Delete any existing unused verification tokens for this user first
  await prisma.verificationToken.deleteMany({
    where: { userId, type: "EMAIL_VERIFY", isUsed: false },
  });
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
  return await prisma.verificationToken.create({
    data: { userId, token: sha256(token), type: "EMAIL_VERIFY", expiresAt },
  });
};

export const validateVerificationToken = async (
  userId: string,
  rawToken: string,
) => {
  // Find by exact SHA-256 hash — no bcrypt ambiguity
  const dbToken = await prisma.verificationToken.findFirst({
    where: { userId, type: "EMAIL_VERIFY", isUsed: false, token: sha256(rawToken) },
  });
  if (!dbToken || dbToken.expiresAt < new Date()) return null;
  return dbToken;
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

export const createResetToken = async (userId: string, token: string) => {
  // Delete old reset tokens first
  await prisma.verificationToken.deleteMany({
    where: { userId, type: "RESET_PASSWORD", isUsed: false },
  });
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
  return await prisma.verificationToken.create({
    data: { userId, token: sha256(token), type: "RESET_PASSWORD", expiresAt },
  });
};

export const validateResetToken = async (userId: string, rawToken: string) => {
  const dbToken = await prisma.verificationToken.findFirst({
    where: { userId, type: "RESET_PASSWORD", isUsed: false, token: sha256(rawToken) },
  });
  if (!dbToken || dbToken.expiresAt < new Date()) return null;
  return dbToken;
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
