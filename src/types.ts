// src/types.ts
export enum VideoOrientation {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

export interface AppConfig {
  pixabayApiKey: string;
  pexelsApiKey: string;
  unsplashApiKey: string;
  orientation: VideoOrientation;
  visualSubject?: string;
  voiceName: string;
  negativePrompt?: string;
}

export interface Scene {
  id: string;
  narration: string;
  visualSearchTerm: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video';
  audioData: Uint8Array | null;
  duration: number;
  isRegenerating?: boolean;
}

export type GenerationStep =
  | 'idle'
  | 'weaving'
  | 'analyzing'
  | 'narration'
  | 'media'
  | 'complete'
  | 'error';

export interface GenerationStatus {
  step: GenerationStep;
  progress?: number;
  total?: number;
  message?: string;
}

// ──────── STORY WEAVER ────────
export interface StoryVariation {
  id: string;
  title: string;
  description: string;
  script: string;
  mood: string;
}

export type GenerationMode = 'single' | 'weave';

export type Page = 'home' | 'generator' | 'pricing' | 'legal';
