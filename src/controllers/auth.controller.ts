// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { sendVerificationEmail, sendResetPasswordEmail } from "../services/mailer.service";
import prisma from "../config/database";

// Get this from your Google Cloud Console
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import {
  findUserByEmail,
  verifyPassword,
  generateAuthToken,
  createUnverifiedUser,
  generateRandomToken,
  createVerifyToken,
  validateVerificationToken,
  verifyUserAndSetPassword,
  createResetToken,
  validateResetToken,
  updatePasswordAndUseToken,
} from "../services/auth.service";

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    // 1. Check if user exists
    if (!user) {
      return res.status(401).json({ message: "Email tidak ditemukan" });
    }

    // 2. Check if they registered via Google but are trying to use a password
    if (!user.password) {
      return res.status(401).json({ message: "Silakan gunakan login dengan Google" });
    }

    // 3. Verify the password
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Password salah" });
    }

    // 4. CRITICAL: Check if they have verified their email
    if (!user.isVerified) {
      return res.status(403).json({ message: "Mohon verifikasi email Anda terlebih dahulu" });
    }

    const token = generateAuthToken(user.id, user.role);
    return sendTokenResponse(res, token, user);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const sendTokenResponse = (res: Response, token: string, user: any) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400000,
  });

  return res.status(200).json({
    message: "Login successful",
    data: { id: user.id, email: user.email, role: user.role },
  });
};

export const registerHandler = async (req: Request, res: Response) => {
  try {
    const { email, referredBy } = req.body;
    let user = await findUserByEmail(email);

    if (user && user.isVerified) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (!user) user = await createUnverifiedUser(email, referredBy);

    const token = generateRandomToken();
    await createVerifyToken(user.id, token);
    await sendVerificationEmail(email, token);

    return res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const verifyHandler = async (req: Request, res: Response) => {
  try {
    const { email, token, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const dbToken = await validateVerificationToken(user.id, token);
    if (!dbToken) return res.status(400).json({ message: "Invalid token" });

    const hashedPass = await bcrypt.hash(password, 10);
    await verifyUserAndSetPassword(user.id, dbToken.id, hashedPass);

    return res.status(200).json({ message: "Account verified successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPasswordHandler = async (req: Request, res: Response) => {
  try {
    const user = await findUserByEmail(req.body.email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = generateRandomToken();
    await createResetToken(user.id, token);
    await sendResetPasswordEmail(user.email, token);

    return res.status(200).json({ message: "Reset email sent" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { email, token, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const dbToken = await validateResetToken(user.id, token);
    if (!dbToken) return res.status(400).json({ message: "Invalid token" });

    const hashedPass = await bcrypt.hash(password, 10);
    await updatePasswordAndUseToken(user.id, dbToken.id, hashedPass);

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body; // The token sent from the Next.js frontend

    // 1. Verify the token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { email, name } = payload;

    // 2. Check if the user already exists in your database
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // 3. If not, create a new user. 
      // Note: Social logins are automatically considered "verified" 
      user = await prisma.user.create({
        data: {
          email,
          name: name || "Google User",
          isVerified: true,
          role: "USER",
          // You might want to add a 'profilePicture' field to your Prisma schema later to save 'picture'
        },
      });
    }

    // 4. Generate your application's JWT (Same as your standard login)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
    });
  } catch (error) {
    console.error("GOOGLE_AUTH_ERROR:", error);
    return res.status(500).json({ message: "Failed to authenticate with Google" });
  }
};