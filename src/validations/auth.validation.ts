import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  referredBy: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});
