// lib/prisma.ts
// Singleton PrismaClient — чтобы при горячей перезагрузке в dev
// не создавалось множество подключений к базе.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
