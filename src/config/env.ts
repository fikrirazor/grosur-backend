import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().positive().int().default(8000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLOUDINARY_URL: z.string().url().startsWith("cloudinary://"),
  RAJAONGKIR_API_KEY: z.string().min(1, "RAJAONGKIR_API_KEY is required"),
  OPENCAGE_API_KEY: z.string().min(1, "OPENCAGE_API_KEY is required"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Environment validation failed:");
  result.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

const env = result.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  directUrl: env.DIRECT_URL,
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  cloudinary: {
    url: env.CLOUDINARY_URL,
  },
  rajaOngkir: {
    apiKey: env.RAJAONGKIR_API_KEY,
  },
  openCage: {
    apiKey: env.OPENCAGE_API_KEY,
  },
} as const;

export default config;
