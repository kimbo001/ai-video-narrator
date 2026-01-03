// api/narrate.ts
import { createHash } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import redis from './_lib/redis.js'; 
import { getCachedNarration, setCachedNarration } from './_lib/redis.js';

const VOICE_MAP: Record<string, string> = {
  'Kore': 'Kore',
  'Aoede': 'Aoede',
  'Zephyr': 'Zephyr',
  'Puck': 'Puck',
  'Charon': 'Charon',
  'Fenrir': 'Fenrir',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, voiceName = 'Kore' } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });

    // 1. Cache Check
    const hash = createHash('sha256').update(`${text}|${voiceName}`).digest('hex');
    const cachedAudio = await getCachedNarration(hash);
    if (cachedAudio) return res.json({ audioBase64: cachedAudio, cached: true });

    // 2. Load API Keys
    const rawKeys = process.env.GEMINI_KEY_A || process.env.GEMINI_API_KEY || '';
    const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (keys.length === 0) throw new Error('No API keys found in GEMINI_KEY_A');

    // 3. Global Rotation Logic
    let nextIndex = 0;
    try {
        const globalCounter = await redis.incr('global_key_rotation_counter');
        nextIndex = globalCounter % keys.length;
    } catch (e) {
        nextIndex = Math.floor(Math.random() * keys.length);
    }

    const voiceId = VOICE_MAP[voiceName] || 'Kore';
    let lastError = null;

    // 4. Try the rotation
    for (let i = 0; i < keys.length; i++) {
      const currentIndex = (nextIndex + i) % keys.length;
      const activeKey = keys[currentIndex];
      
      console.log(`>>> ROTATION: Using Key #${currentIndex + 1} (Starts with: ${activeKey.substring(0, 8)})`);
      
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${activeKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: text }] }],
              generationConfig: {
                response_modalities: ["AUDIO"],
                speech_config: {
                  voice_config: {
                    // FIX: Ensure prebuilt_voice_config is present and contains voice_name
                    prebuilt_voice_config: {
                      voice_name: voiceId
                    }
                  }
                }
              }
            })
          }
        );

        const data = await response.json();

        if (response.status === 429) {
          console.warn(`Key ${currentIndex + 1} limited. Trying next key...`);
          continue;
        }

        if (!response.ok) {
            // This captures the exact error message from Google (like the one in your screenshot)
            throw new Error(data.error?.message || `API Error ${response.status}`);
        }

        const audioBase64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (!audioBase64) throw new Error('No audio returned');

        await setCachedNarration(hash, audioBase64);
        return res.json({
          audioBase64,
          cached: false,
          keyUsed: currentIndex + 1, 
          model: 'Gemini 2.5 Flash TTS'
        });

      } catch (e: any) {
        lastError = e;
        console.error(`Attempt with key ${currentIndex + 1} failed:`, e.message);
      }
    }

    throw new Error(`All keys failed. Last error: ${lastError?.message}`);

  } catch (error: any) {
    console.error('Narrate Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
