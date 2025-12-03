import React, { useState, useRef } from 'react';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from './types';
import VideoPlayer from './components/VideoPlayer';
import { analyzeScript, generateNarration } from './services/gemini';
import { fetchPixabayMedia } from './services/pixabay';
import { fetchPexelsMedia } from './services/pexels';
import { fetchUnsplashMedia } from './services/unsplash';
import { Loader2, Wand2, RefreshCw, Monitor, Smartphone, Mic, Focus, Ban, Upload } from 'lucide-react';

const DEFAULT_SCRIPT = "In the heart of an ancient forest..."; // (your default)
const DEFAULT_PIXABAY_KEY = "21014376-3347c14254556d44ac7acb25e";
const DEFAULT_PEXELS_KEY = "2BbnKbFvEGwKENV4lhRTrQwu3txrXFsisvTjNlrqYYytWjACy9PmwkoM";
const DEFAULT_UNSPLASH_KEY = "inICXEimMWagCfHA86bD4k9MprjkgEFmG0bW9UREkOo";

const GEMINI_VOICES = [
  { id: 'Kore', label: 'Kore (Female, Calm)' },
  { id: 'Puck', label: 'Puck (Male, Playful)' },
  { id: 'Charon', label: 'Charon (Male, Deep)' },
  { id: 'Fenrir', label: 'Fenrir (Male, Intense)' },
  { id: 'Aoede', label: 'Aoede (Female, Elegant)' },
];

const App: React.FC = () => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [config, setConfig] = useState<AppConfig>({ /* ... same as before */ });
  const [status, setStatus] = useState<GenerationStatus>({ step: 'idle' });
  const [scenes, setScenes] = useState<Scene[]>([]);
  const usedMediaUrlsRef = useRef<Set<string>>(new Set());

  const updateConfig = (key: keyof AppConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const getStockMediaForScene = async (
    query: string,
    mediaType: 'image' | 'video',
    usedUrls: Set<string>
  ): Promise<{ url: string | undefined; source: string }> => {
    const providers: ('pixabay' | 'pexels' | 'unsplash')[] = [];
    if (config.pixabayApiKey) providers.push('pixabay');
    if (config.pexelsApiKey) providers.push('pexels');
    if (config.unsplashApiKey) providers.push('unsplash');

    for (const provider of providers.sort(() => Math.random() - 0.5)) {
      let url: string | undefined = undefined;

      if (provider === 'pixabay') {
        url = await fetchPixabayMedia(query, mediaType, config.pixabayApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      } else if (provider === 'pexels') {
        url = await fetchPexelsMedia(query, mediaType, config.pexelsApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      } else if (provider === 'unsplash') {
        url = await fetchUnsplashMedia(query, mediaType, config.unsplashApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      }

      if (url) return { url, source: provider };
    }

    return { url: undefined, source: 'none' };
  };

  const handleGenerate = async () => {
    try {
      setScenes([]);
      usedMediaUrlsRef.current = new Set();
      setStatus({ step: 'analyzing', message: 'Analyzing script...' });

      const { scenes: analyzedScenes } = await analyzeScript(script, config.visualSubject);

      setStatus({ step: 'fetching_media', message: 'Finding media...' });

      const scenesWithMedia: Scene[] = [];

      for (let i = 0; i < analyzedScenes.length; i++) {
        const scene = analyzedScenes[i];
        let mediaUrl: string | undefined;
        let mediaType = scene.mediaType;

        setStatus({ step: 'fetching_media', message: `Scene ${i + 1}/${analyzedScenes.length}` });

        let result = await getStockMediaForScene(scene.visualSearchTerm, mediaType, usedMediaUrlsRef.current);

        if (!result.url && mediaType === 'video') {
          mediaType = 'image';
          result = await getStockMediaForScene(scene.visualSearchTerm, mediaType, usedMediaUrlsRef.current);
        }

        mediaUrl = result.url ?? undefined;

        if (!mediaUrl && config.visualSubject) {
          const fallback = await getStockMediaForScene(config.visualSubject, 'image', new Set());
          mediaUrl = fallback.url ?? undefined;
          mediaType = 'image';
        }

        if (!mediaUrl && i > 0 && scenesWithMedia[i - 1].mediaUrl) {
          mediaUrl = scenesWithMedia[i - 1].mediaUrl;
          mediaType = scenesWithMedia[i - 1].mediaType;
        }

        if (!mediaUrl) {
          const w = config.orientation === VideoOrientation.Landscape ? 1280 : 720;
          const h = config.orientation === VideoOrientation.Landscape ? 720 : 1280;
          mediaUrl = `https://placehold.co/${w}x${h}/000/FFF?text=No+Media`;
          mediaType = 'image';
        } else {
          usedMediaUrlsRef.current.add(mediaUrl);
        }

        scenesWithMedia.push({ ...scene, mediaUrl, mediaType });
      }

      setStatus({ step: 'generating_audio', message: 'Generating narration...' });

      const finalScenes = await Promise.all(
        scenesWithMedia.map(async (s) => {
          try {
            const audioData = await generateNarration(s.narration, config.voiceName);
            return { ...s, audioData };
          } catch {
            return s;
          }
        })
      );

      setScenes(finalScenes);
      setStatus({ step: 'ready' });
    } catch (err) {
      console.error(err);
      setStatus({ step: 'error', message: 'Failed. Check API keys.' });
    }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    const idx = scenes.findIndex(s => s.id === sceneId);
    if (idx === -1) return;

    setScenes(prev => prev.map((s, i) => i === idx ? { ...s, isRegenerating: true } : s));

    const scene = scenes[idx];
    let result = await getStockMediaForScene(scene.visualSearchTerm, scene.mediaType, usedMediaUrlsRef.current);
    if (!result.url && scene.mediaType === 'video') {
      result = await getStockMediaForScene(scene.visualSearchTerm, 'image', usedMediaUrlsRef.current);
    }

    const newUrl = result.url ?? undefined;

    setScenes(prev => prev.map((s, i) =>
      i === idx
        ? { ...s, mediaUrl: newUrl, mediaType: newUrl ? (scene.mediaType === 'video' ? 'video' : 'image') : s.mediaType, isRegenerating: false }
        : s
    ));

    if (newUrl) usedMediaUrlsRef.current.add(newUrl);
  };

  const handleFileUpload = (sceneId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? 'video' : 'image';
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, mediaUrl: url, mediaType: type } : s));
  };

  const isGenerating = !['idle', 'ready', 'error'].includes(status.step);

  // ... rest of your JSX (unchanged, just paste your original UI)
  return (
    // ← your full return JSX here (same as before)
    <div className="min-h-screen bg-[#0b0e14] ...">
      {/* ... entire UI ... */}
    </div>
  );
};

export default App;
