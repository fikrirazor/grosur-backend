// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import {
  findUserByEmail,
  verifyPassword,
  generateAuthToken,
  createUnverifiedUser,
  generateRandomToken,
  createVerifyToken,
} from "../services/auth.service";
import { sendVerificationEmail } from "../services/mailer.service";

export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if (!user || !user.password || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
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
    const { email } = req.body;
    let user = await findUserByEmail(email);

    if (user && user.isVerified) {
      return res.status(400).json({ message: "Email already registered" });
    }
    
    if (!user) user = await createUnverifiedUser(email);

    const token = generateRandomToken();
    await createVerifyToken(user.id, token);
    await sendVerificationEmail(email, token);

    return res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};