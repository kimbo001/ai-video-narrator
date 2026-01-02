import { PrismaClient } from '@prisma/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Use POST');

  const { userId, email } = req.body;

  if (!userId || !email) return res.status(400).json({ error: 'Missing data' });

  try {
    // This "Upsert" ensures the user exists in your Postgres table
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: { email: email }, // Update email if they changed it in Clerk
      create: {
        id: userId,
        email: email,
        plan: 'FREE', // Start everyone as free
      },
    });

    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
