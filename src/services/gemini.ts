// src/services/gemini.ts

import { StoryVariation } from '../types';

// Your existing analyzeScript and generateNarration functions (keep exactly as they were)

export const analyzeScript = async (script: string) => {
  const prompt = `
You are an expert video director. Break the following script into 6–10 short scenes suitable for TikTok/Reels/Shorts (3–8 seconds each).

For each scene return:
- narration: exact text to speak
- mediaQuery: detailed search term for royalty-free stock footage/photo

Return valid JSON only:

{
  "scenes": [
    {
      "narration": "text",
      "mediaQuery": "search terms"
    }
  ]
}

Script:
"""${script}"""
`.trim();

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // fallback if Gemini returns malformed JSON
    return { scenes: [{ narration: script, mediaQuery: 'beautiful nature landscape' }] };
  }
};

export const generateNarration = async (text: string, voiceName: string) => {
  const res = await fetch('/api/gemini-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voice: voiceName, // Kore, Puck, Charon, Fenrir, Aoede
    }),
  });

  const data = await res.json();

  return {
    audioData: Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0)),
    duration: data.duration || text.length / 15,
  };
};

// AI STORY WEAVER — NEW FEATURE
export const generateStoryVariations = async (originalScript: string): Promise<StoryVariation[]> => {
  const prompt = `
You are a world-class Hollywood screenwriter.
Create EXACTLY 4 wildly different but equally compelling variations of the script below.
Keep the core idea and roughly the same length (±10%), but dramatically change tone, ending, or style.

Return ONLY valid JSON (no markdown, no extra text):

[
  {
    "id": "temp",
    "title": "Short catchy title",
    "description": "One-sentence vibe description",
    "script": "Full rewritten script here",
    "mood": "funny|dramatic|wholesome|horror|mysterious|motivational|dark|epic"
  }
]

Original script:
"""${originalScript}"""
`.trim();

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_tokens: 2048 }),
    });

    const text = await res.text();
    const cleaned = text.replace(/^```json\n|\n```$/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed)) {
      return parsed.slice(0, 4).map((v: any) => ({
        ...v,
        id: crypto.randomUUID(),
      }));
    }
    return [];
  } catch (e) {
    console.error('Story Weaver failed:', e);
    return [];
  }
};
