// api/analyze.ts
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'
// Import the credit helper we created
import { checkAndDeductCredits } from './_lib/credits.js';

const rawKeys = process.env.GEMINI_KEY_A || process.env.GEMINI_API_KEY || '';
const keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // 1. Get script AND userId from the request
  const { script, userId } = req.body;

  if (!script) {
    return res.status(400).json({ error: "No script provided" });
  }

  // Very important: If no userId, we can't charge them!
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: No User ID provided" });
  }

  if (keys.length === 0) {
    return res.status(500).json({ error: "API keys are missing." });
  }

  try {
    // 2. THE CREDIT GATEKEEPER
    // This will check if they have enough characters left.
    // If they have 5,000 credits and the script is 6,000 chars, this throws an error.
    await checkAndDeductCredits(userId, script);

    // 3. Initialize Gemini (Only happens if they had enough credits)
    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const genAI = new GoogleGenerativeAI(activeKey);
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            scenes: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  narration: { type: SchemaType.STRING },
                  visual_search_term: { type: SchemaType.STRING },
                  media_type: { 
  type: SchemaType.STRING, 
  enum: ['image', 'video'],
  // @ts-ignore - This tells TS to stop complaining about the 'format' field
  format: "enum" 
},
                },
                required: ['narration', 'visual_search_term', 'media_type'],
              },
            },
          },
        },
      }
    });

    const prompt = `Break the following script into EXACT scenes for a video.
    Script: "${script}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const rawData = JSON.parse(text);
    const scenes = (rawData.scenes || []).map((item: any, i: number) => ({
      id: `scene-${i}-${Date.now()}`,
      narration: item.narration,
      visualSearchTerm: item.visual_search_term,
      mediaType: item.media_type || 'video',
    }));

    // 4. Return the scenes + how many credits they just used
    return res.json({ 
        scenes, 
        creditsDeducted: script.length 
    });

  } catch (e: any) {
    console.error("Analysis Failed:", e.message);

    // If the error came from our credit helper, return a 403 Forbidden
    if (e.message.includes('Insufficient credits')) {
        return res.status(403).json({ error: e.message });
    }

    return res.status(500).json({ 
      error: "AI Analysis Failed", 
      detail: e.message 
    });
  }
}
