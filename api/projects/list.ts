// api/projects/list.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Newest first
      select: {
        id: true,
        title: true,
        createdAt: true,
        // We include the data so we can load it instantly
        data: true, 
        script: true
      }
    });

    return res.status(200).json(projects);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
