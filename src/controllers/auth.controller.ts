// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import {
  findUserByEmail,
  verifyPassword,
  generateAuthToken,
} from "../services/auth.service";

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