import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Scene } from '../types';

const MAX_RETRIES = 4;
const RETRY_CODES = [429, 500, 502, 503, 504];

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.status || 0;
      if (RETRY_CODES.includes(status) && i < MAX_RETRIES - 1) {
        const delay = Math.pow(2, i) * 1000;
        console.warn(`Gemini rate-limit hit, retrying in ${delay}ms …`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      console.error('Gemini API final error:', err);
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

export const analyzeScript = async (script: string, globalTopic?: string): Promise<{ scenes: Scene[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
You are a professional video director.  
Break the following script into EXACT scenes.

IMPORTANT:  
The user may use "---" to force a scene break.  
Each segment between "---" becomes its own scene.  

For EVERY scene output:
1. narration: the exact text segment (no "---", trimmed)  
2. visual_search_term: single concrete noun  
3. media_type: "video" if action, else "image"  

Script:
"${script}"
  `;

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
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
                  media_type: { type: Type.STRING, enum: ["image", "video"] }
                },
                required: ["narration", "visual_search_term", "media_type"]
              }
            }
          }
        }
      }
    });

    const rawData = JSON.parse(response.text || "{}");
    const scenes = (rawData.scenes || []).map((item: any, index: number) => ({
      id: `scene-${index}-${Date.now()}`,
      narration: item.narration,
      visualSearchTerm: item.visual_search_term,
      mediaType: item.media_type || 'image',
    }));

    return { scenes };
  });
};

export const generateNarration = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!text || !text.trim()) {
    throw new Error("Narration text is empty");
  }

  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    if (audioPart?.inlineData?.data) {
      return audioPart.inlineData.data;
    }
    
    console.warn("Gemini TTS response missing audio data:", response);
    throw new Error("No audio data returned from Gemini API");
  });
};
