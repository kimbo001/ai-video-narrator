import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Prevent Vercel Caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const stats = await prisma.globalStats.findUnique({
      where: { id: 'main' }
    });

    return res.status(200).json({ 
      success: true, 
      totalVideos: stats ? stats.totalVideos : 1240 
    });
  } catch (error: any) {
    return res.status(200).json({ success: true, totalVideos: 1240 });
  }
}
