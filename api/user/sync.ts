// api/user/sync.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
// We use ../ because this file is inside the /user folder
import { prisma } from '../_lib/prisma.js'; 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: "Missing userId or email" });
  }

  try {
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { email }, // Update email if it changed, but keep credits
      create: {
        id: userId,
        email: email,
        plan: 'FREE',
        credits: 5000 // Welcome credits for new users
      }
    });
    
    console.log(`User synced: ${email} (${userId})`);
    return res.json(user);
  } catch (e: any) {
    console.error("Sync Error:", e.message);
    return res.status(500).json({ error: e.message });
  }
}
