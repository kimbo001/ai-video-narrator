// api/narrate.ts
import { createHash } from 'crypto'
import { getCachedNarration, setCachedNarration } from './_lib/redis.js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Split keys and clean them
const keys = (process.env.GEMINI_KEY_A || '').split(',').map(k => k.trim()).filter(Boolean);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { text, voiceName = 'Kore', sceneIndex = 0, attempt = 0 } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' })
  if (keys.length === 0) return res.status(500).json({ error: "No API keys configured" });

  // THE KEY JUMPER: Uses both scene number and retry attempt to find a working key
  const activeKeyIndex = (Number(sceneIndex) + Number(attempt)) % keys.length;
  const activeKey = keys[activeKeyIndex];

  const hash = createHash('sha256').update(text + voiceName).digest('hex')

  try {
    const cached = await getCachedNarration(hash)
    if (cached) return res.json({ audioBase64: cached, cached: true })
  } catch (e) {
    console.error('Redis error:', e)
  }

  try {
    const model = 'gemini-2.5-flash-preview-tts'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "Maintain a consistent volume and professional tone." }]
        },
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'], 
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } }
          }
        }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      // Return the actual Google error message instead of a generic 500
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (!audioBase64) throw new Error('No audio data found in response')

    await setCachedNarration(hash, audioBase64)
    return res.status(200).json({ audioBase64, cached: false })

  } catch (e: any) {
    console.error('TTS execution error:', e.message)
    res.status(500).json({ error: e.message || 'TTS generation failed' })
  }
}
