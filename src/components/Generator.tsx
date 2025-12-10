// src/components/Generator.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from '../types';
import VideoPlayer from './VideoPlayer';
import { analyzeScript, generateNarration } from '../services/gemini';
import { generateStoryVariations } from '../services/gemini';
import { fetchPixabayMedia, fetchPixabayAudio } from '../services/pixabay';
import { fetchPexelsMedia } from '../services/pexels';
import { fetchUnsplashMedia } from '../services/unsplash';
import { Loader2, RefreshCw, ArrowLeft, Sparkles } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import { useStoryStore } from '../store/useStoryStore';

const DEFAULT_SCRIPT = "In the heart of an ancient forest, sunlight filters through the dense canopy. A gentle stream winds its way over mossy rocks. A majestic deer appears, ears twitching. Nature holds its breath.";

interface GeneratorProps {
  onBack: () => void;
}

const Generator: React.FC<GeneratorProps> = ({ onBack }) => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [config] = useState<AppConfig & { includeMusic: boolean }>({
    pixabayApiKey: "21014376-3347c14254556d44ac7acb25e",
    pexelsApiKey: "2BboNbFvEGwKENV4lhRTyQwu3txrXFsistvTjNlrqYYtwXjACy9PmwkoM",
    unsplashApiKey: "inICXEimMWagCfHA86bD4k9MprjkgEFmG0bW9UREKo",
    orientation: VideoOrientation.Portrait,
    visualSubject: '',
    voiceName: 'Kore',
    negativePrompt: '',
    includeMusic: true,
  });

  const [status, setStatus] = useState<GenerationStatus>({ step: 'idle' });
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const usedMediaUrlsRef = useRef<Set<string>>(new Set());

  const {
    mode,
    variations,
    selectedVariationIds,
    setMode,
    setVariations,
    toggleVariation,
    reset,
  } = useStoryStore();

  const getStockMediaForScene = async (query: string, mediaType: 'image' | 'video', usedUrls: Set<string>) => {
    const providers = [];
    if (config.pixabayApiKey) providers.push('pixabay');
    if (config.pexelsApiKey) providers.push('pexels');
    if (config.unsplashApiKey) providers.push('unsplash');

    for (const p of providers.sort(() => 0.5 - Math.random())) {
      let url: string | null = null;
      if (p === 'pixabay') url = await fetchPixabayMedia(query, mediaType, config.pixabayApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      if (p === 'pexels') url = await fetchPexelsMedia(query, mediaType, config.pexelsApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      if (p === 'unsplash') url = await fetchUnsplashMedia(query, mediaType, config.unsplashApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      if (url) return { url, source: p };
    }
    return { url: null, source: 'none' };
  };

  const generateSingleVideo = async (scriptToUse: string) => {
    setIsGenerating(true);
    setStatus({ step: 'analyzing' });
    setScenes([]);

    try {
      const analysis = await analyzeScript(scriptToUse);
      const newScenes: Scene[] = analysis.scenes.map((s: any) => ({
        id: crypto.randomUUID(),
        narration: s.narration,
        visualSearchTerm: s.mediaQuery || s.visualSearchTerm || '',
        mediaUrl: '',
        mediaType: 'image' as const,
        audioData: null,
        duration: 5,
        isRegenerating: false,
      }));
      setScenes(newScenes);

      for (let i = 0; i < newScenes.length; i++) {
        const scene = newScenes[i];
        setStatus({ step: 'narration', progress: i + 1, total: newScenes.length });

        const narration = await generateNarration(scene.narration, config.voiceName);
        scene.audioData = narration.audioData as Uint8Array;
        scene.duration = narration.duration || Math.max(3, scene.narration.length / 15);

        setStatus({ step: 'media', progress: i + 1, total: newScenes.length });
        const { url } = await getStockMediaForScene(scene.visualSearchTerm, 'image', usedMediaUrlsRef.current);
        if (url) {
          scene.mediaUrl = url;
          scene.mediaType = url.endsWith('.mp4') ? 'video' : 'image';
          usedMediaUrlsRef.current.add(url);
        }

        setScenes([...newScenes]);
      }

      if (config.includeMusic) {
        const audio = await fetchPixabayAudio("background", config.pixabayApiKey);
        if (audio) setBackgroundMusicUrl(audio);
      }

      setStatus({ step: 'complete' });
    } catch (e) {
      setStatus({ step: 'error', message: 'Failed' });
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (mode === 'weave' && variations.length === 0) {
      setStatus({ step: 'weaving' });
      const vars = await generateStoryVariations(script);
      setVariations(vars.map(v => ({ ...v, id: crypto.randomUUID() })));
      setStatus({ step: 'idle' });
      return;
    }

    const scripts = mode === 'single'
      ? [script]
      : variations.filter(v => selectedVariationIds.includes(v.id)).map(v => v.script);

    for (const s of scripts) {
      await generateSingleVideo(s);
      await new Promise(r => setTimeout(r, 800));
    }

    reset();
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN – SCRIPT + WEAVER */}
        <div className="w-full lg:w-[380px] bg-[#11141b] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">1</div>
              <span className="font-semibold text-white">Script</span>
            </div>
            {mode === 'weave' && <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />}
          </div>

          <div className="flex-1 p-4 overflow-y-auto pb-32">
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              className="w-full min-h-[300px] bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 text-sm resize-none focus:ring-1 focus:ring-cyan-500 outline-none"
              placeholder="Paste your script here..."
            />
          </div>

          {/* WEAVER TOGGLE */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-zinc-400">AI Story Weaver</span>
              <button
                onClick={() => setMode(mode === 'weave' ? 'single' : 'weave')}
                className={`relative w-11 h-6 rounded-full transition ${mode === 'weave' ? 'bg-cyan-500' : 'bg-zinc-700'}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full transition ${mode === 'weave' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {mode === 'weave' && variations.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {variations.map(v => (
                  <label key={v.id} className={`block p-3 rounded-lg border cursor-pointer ${selectedVariationIds.includes(v.id) ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-700'}`}>
                    <div className="flex gap-3">
                      <input type="checkbox" checked={selectedVariationIds.includes(v.id)} onChange={() => toggleVariation(v.id)} />
                      <div>
                        <div className="font-bold text-sm">{v.title}</div>
                        <div className="text-xs text-zinc-400">{v.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !script.trim()}
              className="mt-4 w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : mode === 'weave' && variations.length === 0 ? 'Weave Variations' : 'Generate Video(s)'}
            </button>
          </div>
        </div>

        {/* MIDDLE + RIGHT COLUMNS – keep your existing code */}
        {/* SettingsPanel and VideoPlayer columns go here exactly as before */}
      </div>
    </div>
  );
};

export default Generator;
