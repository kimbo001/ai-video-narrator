import { Scene } from '../types';

export const analyzeScript = async (script: string, globalTopic?: string): Promise<{ scenes: Scene[] }> => {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, globalTopic }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const generateNarration = async (text: string, voiceName = 'Kore', sceneIndex = 0, attempt = 0): Promise<string> => {
  const res = await fetch('/api/narrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName, sceneIndex, attempt }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(res.status + ": " + (errorData.error || 'TTS failed'));
  }
  
  const { audioBase64 } = await res.json();
  return audioBase64;
};
