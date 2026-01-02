export enum VideoOrientation {
  Landscape = 'horizontal',
  Portrait = 'vertical'
}

export interface Scene {
  id: string;
  narration: string;
  visualSearchTerm: string;
  mediaType: 'image' | 'video';
  mediaUrl?: string;
  audioData?: string;
  duration?: number;
  isRegenerating?: boolean;
  isBranding?: boolean;
  _file?: File; // raw uploaded file (manual mode)
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
  voiceName: string;
  negativePrompt: string;
  manualMode?: boolean;
}

export type Page = 'home' | 'generator' | 'pricing' | 'legal';
