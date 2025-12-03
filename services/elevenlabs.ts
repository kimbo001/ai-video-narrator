
import { arrayBufferToBase64 } from '../utils/audio';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export const generateElevenLabsSpeech = async (
  text: string, 
  voiceId: string, 
  apiKey: string
): Promise<string> => {
  if (!text || !text.trim()) {
    throw new Error("Narration text is empty");
  }
  if (!apiKey) {
      throw new Error("ElevenLabs API Key is missing");
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ElevenLabs API Error: ${response.status} ${errorData.detail?.message || response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    return arrayBufferToBase64(audioBuffer);

  } catch (error) {
    console.error("ElevenLabs TTS Error:", error);
    throw error;
  }
};
