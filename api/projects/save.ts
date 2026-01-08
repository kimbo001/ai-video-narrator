// api/projects/save.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
// We use ../ to go up one level to find the _lib folder
import { prisma } from '../_lib/prisma.js'; 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, script, scenes, title, config } = req.body;

  // 2. Validate essential data
  if (!userId || !script || !scenes) {
    return res.status(400).json({ error: "Missing required project data (userId, script, or scenes)" });
  }

  try {
    // 3. Save the "Recipe" to the Project table
    const project = await prisma.project.create({
      data: {
        userId,
        script,
        // We auto-generate a title if one wasn't provided
        title: title || script.substring(0, 30).trim() + "...",
        // 'data' is the JSON field in your schema
        // We store the scenes array AND the user's config (voice, orientation, etc.)
        data: {
          scenes,
          config
        }
      }
    });

    console.log(`✅ Project Saved: ${project.id} for user ${userId}`);

    return res.status(200).json({ 
      success: true, 
      projectId: project.id 
    });

  } catch (error: any) {
    console.error("Project Save Error:", error.message);
    return res.status(500).json({ 
      error: "Failed to save project to cloud history.",
      details: error.message 
    });
  }
}
