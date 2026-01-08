// api/stats/index.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma.js'; // Added .js

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Prevent Vercel Caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    // We count the actual rows in the Generation table (created every time a video finishes)
    const realGenerations = await prisma.generation.count();

    return res.status(200).json({ 
      success: true, 
      // 4018 is your "base" number + real new ones
      totalVideos: 4018 + realGenerations 
    });
  } catch (error: any) {
    // If database fails, return the base number so the UI doesn't look broken
    return res.status(200).json({ success: true, totalVideos: 4018 });
  }
}
