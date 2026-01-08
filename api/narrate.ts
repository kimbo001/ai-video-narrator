// api/narrate.ts
import { createHash } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions'; 
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

    // 1. Cache Check (Saves you from using API keys unnecessarily)
    const hash = createHash('sha256').update(`${text}|${voiceName}`).digest('hex');
    const cachedAudio = await getCachedNarration(hash);
    if (cachedAudio) {
        console.log(">>> CACHE HIT: Serving audio from VPS");
        return res.json({ audioBase64: cachedAudio, cached: true });
    }

    // 2. Load and Prepare API Keys
    const rawKeys = process.env.GEMINI_KEY_A || process.env.GEMINI_API_KEY || '';
    const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (keys.length === 0) throw new Error('No API keys found in GEMINI_KEY_A');

    // 3. Round-Robin Rotation Logic
    let nextIndex = 0;
    try {
        // This ensures Key 1 -> Key 2 -> Key 3
        const globalCounter = await redis.incr('global_key_rotation_counter');
        nextIndex = globalCounter % keys.length;
    } catch (e) {
        nextIndex = Math.floor(Math.random() * keys.length);
    }

    const voiceId = VOICE_MAP[voiceName] || 'Kore';
    let lastError = null;

    // 4. Attempt Generation with Rotation
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
                    prebuilt_voice_config: { voice_name: voiceId }
                  }
                }
              }
            })
          }
        );

        const data = await response.json();

        if (response.status === 429) {
          console.warn(`Key ${currentIndex + 1} limited. Trying next...`);
          continue;
        }

        if (!response.ok) throw new Error(data.error?.message || `API Error ${response.status}`);

        const audioBase64 = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (!audioBase64) throw new Error('No audio returned from Gemini');

        // 5. VPS BACKGROUND UPLOAD
        // waitUntil ensures the user gets the video, but the server stays awake to save to VPS
        waitUntil(setCachedNarration(hash, audioBase64));

        return res.json({
          audioBase64,
          cached: false,
          keyUsed: currentIndex + 1, 
          model: 'Gemini 2.5 Flash TTS'
        });

      } catch (e: any) {
        lastError = e;
        console.error(`Key #${currentIndex + 1} failed:`, e.message);
      }
    }

    throw new Error(`All keys exhausted. Last error: ${lastError?.message}`);

  } catch (error: any) {
    console.error('Narrate Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
