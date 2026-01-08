// /api/tick.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
// We only need the service, not the prisma instance directly here
import { bumpVideoCounter } from './_lib/statsService.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    await bumpVideoCounter();
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Tick failed:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
