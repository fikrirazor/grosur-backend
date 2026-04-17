// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import config from "../config/env";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { sendVerificationEmail, sendResetPasswordEmail } from "../services/mailer.service";
import prisma from "../config/database";
import { sendResponse } from "../utils/response.util";
import {
  findUserByEmail,
  findUserByReferralCode,
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
import { generateFriendlyReferralCode } from "../utils/referral.util";
import { issueReferralVouchers } from "../services/voucher.service";

const googleClient = new OAuth2Client(config.google.clientId);

export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, referredBy: referralCode } = req.body;
    let user = await findUserByEmail(email);

    if (user && user.isVerified) {
      return sendResponse(res, 400, false, "Email already registered");
    }

    if (!user) {
      let referrerId = undefined;
      if (referralCode) {
        const referrer = await findUserByReferralCode(referralCode);
        referrerId = referrer?.id;
      }
      user = await createUnverifiedUser(email, referrerId);
    }

    const token = generateRandomToken();
    await createVerifyToken(user.id, token);
    await sendVerificationEmail(email, token);

    return sendResponse(res, 200, true, "Verification email sent");
  } catch (error) {
    next(error);
  }
};

export const signIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if (!user) {
      return sendResponse(res, 401, false, "Email tidak ditemukan");
    }

    if (!user.password) {
      return sendResponse(res, 401, false, "Silakan gunakan login dengan Google");
    }

    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return sendResponse(res, 401, false, "Password salah");
    }

    if (!user.isVerified) {
      return sendResponse(res, 403, false, "Mohon verifikasi email Anda terlebih dahulu");
    }

    const token = generateAuthToken(user.id, user.role);
    
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000, // 24 hours
    });

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000,
    });

    return sendResponse(res, 200, true, "Login successful", {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        profilePicture: user.photo,
        referralCode: user.referralCode
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const formattedUser = {
      ...user,
      profilePicture: user.photo,
    };
    delete formattedUser.photo;

    return sendResponse(res, 200, true, "User profile fetched", { user: formattedUser });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("token");
    res.clearCookie("access_token");
    res.clearCookie("role");
    return sendResponse(res, 200, true, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

export const verifyHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, token, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return sendResponse(res, 404, false, "User not found");

    const dbToken = await validateVerificationToken(user.id, token);
    if (!dbToken) return sendResponse(res, 400, false, "Invalid token");

    const hashedPass = await bcrypt.hash(password, 10);
    await verifyUserAndSetPassword(user.id, dbToken.id, hashedPass);

    // Issue referral vouchers if user was referred
    if (user.referredBy) {
      try {
        await issueReferralVouchers(user.id, user.referredBy);
      } catch (e) {
        console.error("⚠️ Failed to issue referral vouchers:", e);
      }
    }

    return sendResponse(res, 200, true, "Account verified successfully");
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await findUserByEmail(req.body.email);
    if (!user) return sendResponse(res, 404, false, "User not found");

    const token = generateRandomToken();
    await createResetToken(user.id, token);
    await sendResetPasswordEmail(user.email, token);

    return sendResponse(res, 200, true, "Reset email sent");
  } catch (error) {
    next(error);
  }
};

export const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, token, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return sendResponse(res, 404, false, "User not found");

    const dbToken = await validateResetToken(user.id, token);
    if (!dbToken) return sendResponse(res, 400, false, "Invalid token");

    const hashedPass = await bcrypt.hash(password, 10);
    await updatePasswordAndUseToken(user.id, dbToken.id, hashedPass);

    return sendResponse(res, 200, true, "Password reset successfully");
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return sendResponse(res, 400, false, "Invalid Google token");
    }

    const { email, name } = payload;
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const { referredBy: referralCode } = req.body;
      let referrerId = undefined;
      if (referralCode) {
        const referrer = await findUserByReferralCode(referralCode);
        referrerId = referrer?.id;
      }
      const newReferralCode = await generateFriendlyReferralCode(name || email);

      user = await prisma.user.create({
        data: {
          email,
          name: name || "Google User",
          isVerified: true,
          role: "USER",
          referredBy: referrerId,
          referralCode: newReferralCode,
          provider: "GOOGLE",
        },
      });

      // Issue referral vouchers if user was referred via Google login
      if (referrerId) {
        try {
          await issueReferralVouchers(user.id, referrerId);
        } catch (e) {
          console.error("⚠️ Failed to issue referral vouchers (Google):", e);
        }
      }
    }

    const token = generateAuthToken(user.id, user.role);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000,
    });

    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400000,
    });

    return sendResponse(res, 200, true, "Login successful", {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
        profilePicture: user.photo
      },
      token
    });
  } catch (error) {
    next(error);
  }
};
