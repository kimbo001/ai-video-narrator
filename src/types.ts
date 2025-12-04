
export enum VideoOrientation {
  Landscape = 'horizontal',
  Portrait = 'vertical'
}

export interface Scene {
  id: string;
  narration: string;
  visualSearchTerm: string;
  mediaType: 'image' | 'video';
  mediaUrl?: string; // URL for image or video
  audioData?: string; // Base64 PCM
  duration?: number; // Calculated duration in seconds
  isRegenerating?: boolean; // UI state for regeneration
}

export interface GenerationStatus {
  step: 'idle' | 'analyzing' | 'fetching_media' | 'generating_visuals' | 'generating_audio' | 'ready' | 'error' | 'exporting';
  message?: string;
  progress?: number;
}

export interface AppConfig {
  pixabayApiKey: string;
  pexelsApiKey: string;
  unsplashApiKey: string;
  orientation: VideoOrientation;
  visualSubject: string;
  voiceName: string; // Gemini voice name
  negativePrompt: string;
}

export type Page = 'home' | 'generator' | 'pricing' | 'legal';
