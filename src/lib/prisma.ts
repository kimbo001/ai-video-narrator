// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Reuse the same PrismaClient instance in development to avoid "too many clients" warning
const client = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = client;
}

// Named export 'db' so `import { db } from './prisma'` works
export { client as db };

// Default export for backward compatibility (if you use `import prisma from '@/lib/prisma'`)
export default client;
