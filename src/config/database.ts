import { PrismaPg } from "@prisma/adapter-pg";
import config from "../config/env";
import { PrismaClient } from "../generated/prisma";

import { Pool } from "pg";

// Create a singleton instance of PrismaClient
const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString: config.databaseUrl });
  return new PrismaClient({
    log:
      config.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
    adapter: new PrismaPg(pool),
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
