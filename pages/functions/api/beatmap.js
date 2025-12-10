// pages/functions/api/beatmap.js — Test worker for Story Weaver
const PROMPT = `You are a film director AI. 
Analyse the script below and split it into emotional beats (max 3 seconds each). 
Add natural pauses where breathing or dramatic effect is needed.

Return ONLY valid JSON (no markdown, no explanation):

{
  "emotion": [
    {"start": 0.0, "end": 2.8, "label": "excited", "energy": 0.8, "valence": 0.9}
  ],
  "pauses": [
    {"pos": 2.8, "duration": 0.6, "type": "breath"}
  ],
  "bRoll": [
    {"start": 5.1, "end": 9.2, "keywords": ["sunset over mountains", "slow drone shot"]}
  ]
}

Script:
`;

export async function onRequestPost({ request, env }) {
  const { script } = await request.json();
  if (!script || script.length > 15_000) 
    return new Response('Bad script', { status: 400 });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: PROMPT + script }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  );

  if (!res.ok) return new Response('Gemini failed', { status: 500 });

  const data = await res.json();
  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Clean markdown
  text = text.replace(/```json:disable-run

  let beatmap;
  try {
    beatmap = JSON.parse(text);
  } catch (e) {
    return new Response('Bad JSON from Gemini', { status: 500 });
  }

  return Response.json(beatmap);
}
