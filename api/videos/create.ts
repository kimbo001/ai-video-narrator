// api/videos/create.ts
import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body;
  // ignore guests, only log real users
  if (!userId) return res.status(200).json({ success: true });

  try {
    await prisma.generation.create({ data: { userId } });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('CREATE ERROR:', error);
    res.status(500).json({ error: 'Failed to log generation' });
  }
}
