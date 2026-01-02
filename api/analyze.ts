// api/analyze.ts
import { GoogleGenAI, Type } from '@google/genai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// THE FIX: Split comma-separated keys
const keys = (process.env.GEMINI_KEY_A || '').split(',').map(k => k.trim()).filter(Boolean);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { script, globalTopic } = req.body

  if (keys.length === 0) {
    return res.status(500).json({ error: "No API keys configured in GEMINI_KEY_A" });
  }

  // Pick a key randomly to distribute load
  const activeKey = keys[Math.floor(Math.random() * keys.length)];
  const ai = new GoogleGenAI({ apiKey: activeKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
You are a professional video director.  
Break the following script into EXACT scenes.

For EVERY scene output:
1. narration: the exact text segment (trimmed)  
2. visual_search_term: single concrete noun  
3. media_type: "video" if action, else "image"  

Script:
"${script}"
      `,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  narration: { type: Type.STRING },
                  visual_search_term: { type: Type.STRING },
                  media_type: { type: Type.STRING, enum: ['image', 'video'] },
                },
                required: ['narration', 'visual_search_term', 'media_type'],
              },
            },
          },
        },
      },
    })

    const raw = JSON.parse(response.text || '{}')
    const scenes = (raw.scenes || []).map((item: any, i: number) => ({
      id: `scene-${i}-${Date.now()}`,
      narration: item.narration,
      visualSearchTerm: item.visual_search_term,
      mediaType: item.media_type || 'image',
    }))
    return res.json({ scenes })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
