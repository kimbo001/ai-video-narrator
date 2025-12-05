import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Scene } from '../types';

export const analyzeScript = async (script: string, globalTopic?: string): Promise<{ scenes: Scene[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are a professional video director. Break down the following script into distinct visual scenes.
    
    IMPORTANT INSTRUCTION: 
    The user may use '---' (triple dash) in the text to indicate a forced scene break. 
    You MUST start a new scene exactly where the user has placed '---'.
    If there are no triple dashes, break the script naturally based on sentences or ideas.
    
    For each scene:
    1. 'narration': The exact text to be spoken.
    2. 'visual_search_term': A SINGLE concrete noun (e.g. "forest", "lion") representing the scene.
    3. 'media_type': Choose 'video' if there is distinct motion/action. Choose 'image' for static concepts or specific details.
    
    Script:
    "${script}"
  `;

  try {
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

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze script.");
  }
};

export const generateNarration = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!text || !text.trim()) {
    throw new Error("Narration text is empty");
  }

  try {
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

  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};