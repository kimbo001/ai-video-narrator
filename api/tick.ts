// /api/tick.ts  (project root)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../src/lib/prisma'; // ← relative from project root
import { bumpVideoCounter } from '../src/services/statsService';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  await bumpVideoCounter();
  res.status(200).json({ ok: true });
}
