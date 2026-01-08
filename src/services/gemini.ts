// src/services/gemini.ts

export async function analyzeScript(script: string, visualSubject: string, userId: string) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      script, 
      visualSubject, 
      userId // <--- We added this so the backend knows who to charge
    }),
  });

  // This is important: If the backend returns "Insufficient credits" (403), 
  // we catch it here and send the message back to your Generator.
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to analyze script');
  }

  return response.json();
}

/** 
 * You likely have generateNarration here too. 
 * We don't need to change it for now since we charge for the whole script at once in Analyze.
 */
export async function generateNarration(text: string, voiceName: string, sceneIndex: number) {
  const response = await fetch('/api/narrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName, sceneIndex }),
  });

  if (!response.ok) throw new Error('Narration failed');
  const data = await response.json();
  return data.audioBase64;
}
