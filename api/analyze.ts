// api/analyze.ts
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Make sure your Vercel Environment Variable is named exactly GEMINI_KEY_A
// or update this line to match your dashboard.
const rawKeys = process.env.GEMINI_KEY_A || process.env.GEMINI_API_KEY || '';
const keys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Basic Validation
  if (req.method !== 'POST') return res.status(405).end();
  const { script } = req.body;

  if (!script) {
    return res.status(400).json({ error: "No script provided in request body" });
  }

  if (keys.length === 0) {
    return res.status(500).json({ error: "API keys are missing. Check Vercel Env Variables for GEMINI_KEY_A" });
  }

  try {
    // 2. Initialize SDK
    const activeKey = keys[Math.floor(Math.random() * keys.length)];
    const genAI = new GoogleGenerativeAI(activeKey);
    
    // In Jan 2026, 'gemini-2.0-flash' is the stable fast model
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
                  media_type: { type: SchemaType.STRING, enum: ['image', 'video'] },
                },
                required: ['narration', 'visual_search_term', 'media_type'],
              },
            },
          },
        },
      }
    });

    // 3. Generate Content
    const prompt = `Break the following script into EXACT scenes for a video.
    Script: "${script}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 4. Parse and Format
    const rawData = JSON.parse(text);
    const scenes = (rawData.scenes || []).map((item: any, i: number) => ({
      id: `scene-${i}-${Date.now()}`,
      narration: item.narration,
      visualSearchTerm: item.visual_search_term,
      mediaType: item.media_type || 'video',
    }));

    return res.json({ scenes });

  } catch (e: any) {
    console.error("Gemini Error:", e);
    return res.status(500).json({ 
      error: "AI Analysis Failed", 
      detail: e.message 
    });
  }
}
