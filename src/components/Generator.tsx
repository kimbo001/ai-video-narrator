// src/components/Generator.tsx — YOUR ORIGINAL CODE, ONLY FIXED
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
  const [config, setConfig] = useState<AppConfig & { includeMusic: boolean }>({
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

  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const getStockMediaForScene = async (query: string, type: 'image' | 'video') => {
    const providers = [];
    if (config.pixabayApiKey) providers.push('pixabay');
    if (config.pexelsApiKey) providers.push('pexels');
    if (config.unsplashApiKey) providers.push('unsplash');

    for (const p of providers.sort(() => 0.5 - Math.random())) {
      let url: string | null = null;
      if (p === 'pixabay') url = await fetchPixabayMedia(query, type, config.pixabayApiKey, config.orientation, usedMediaUrlsRef.current, config.visualSubject, config.negativePrompt);
      if (p === 'pexels') url = await fetchPexelsMedia(query, type, config.pexelsApiKey, config.orientation, usedMediaUrlsRef.current, config.visualSubject, config.negativePrompt);
      if (p === 'unsplash') url = await fetchUnsplashMedia(query, type, config.unsplashApiKey, config.orientation, usedMediaUrlsRef.current, config.visualSubject, config.negativePrompt);
      if (url) {
        usedMediaUrlsRef.current.add(url);
        return url;
      }
    }
    return null;
  };

  const generateSingleVideo = async (text: string) => {
    setIsGenerating(true);
    setStatus({ step: 'analyzing' });
    setScenes([]);

    try {
      const analysis = await analyzeScript(text);
      const newScenes: Scene[] = analysis.scenes.map((s: any) => ({
        id: crypto.randomUUID(),
        narration: s.narration,
        visualSearchTerm: s.mediaQuery || s.narration.slice(0, 60),
        mediaUrl: '',
        mediaType: 'image',
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
        scene.duration = narration.duration || 6;

        setStatus({ step: 'media', progress: i + 1, total: newScenes.length });
        const url = await getStockMediaForScene(scene.visualSearchTerm, 'image');
        if (url) {
          scene.mediaUrl = url;
          scene.mediaType = url.includes('.mp4') ? 'video' : 'image';
        }

        setScenes([...newScenes]);
      }

      if (config.includeMusic) {
        const audio = await fetchPixabayAudio("calm", config.pixabayApiKey);
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
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — YOUR ORIGINAL DESIGN */}
        <div className="w-full lg:w-[360px] shrink-0 flex flex-col h-full bg-[#11141b] border border-zinc-800 rounded-2xl shadow-lg overflow-hidden relative">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">1</div>
              <h2 className="text-white font-semibold text-sm">Story Script</h2>
            </div>
            {mode === 'weave' && <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />}
          </div>

          <div className="flex-1 p-4 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pb-32">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              maxLength={1000}
              className="flex-1 w-full bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 text-zinc-300 text-sm focus:ring-1 focus:ring-cyan-500 outline-none resize-none mb-2 min-h-[200px]"
              placeholder="Enter your story script here..."
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#11141b]/95 backdrop-blur-md border-t border-zinc-800 z-10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400">AI Story Weaver</span>
              <button
                onClick={() => setMode(mode === 'weave' ? 'single' : 'weave')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${mode === 'weave' ? 'bg-cyan-500' : 'bg-zinc-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mode === 'weave' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {mode === 'weave' && variations.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {variations.map(v => (
                  <label key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${selectedVariationIds.includes(v.id) ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-700'}`}>
                    <input type="checkbox" checked={selectedVariationIds.includes(v.id)} onChange={() => toggleVariation(v.id)} />
                    <div>
                      <div className="font-medium text-white">{v.title}</div>
                      <div className="text-xs text-zinc-400">{v.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !script.trim()}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg py-3 rounded-xl transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Video'}
            </button>
          </div>
        </div>

        {/* MIDDLE — FULLY INTERACTIVE SETTINGS */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col h-full bg-[#11141b] border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">2</div>
            <h2 className="text-white font-semibold text-sm">Configuration</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <SettingsPanel config={config} onConfigChange={updateConfig} />
          </div>
        </div>

        {/* RIGHT — PREVIEW */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-[#11141b] border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">3</div>
              <h2 className="text-white font-semibold text-sm">Preview & Export</h2>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-[400px] shrink-0 bg-[#0b0e14] border-b border-zinc-800 overflow-hidden relative flex items-center justify-center">
              <VideoPlayer
                scenes={scenes}
                orientation={config.orientation}
                backgroundMusicUrl={backgroundMusicUrl}
                musicVolume={0.3}
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#0b0e14]/50">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {scenes.map((scene, idx) => (
                  <div key={scene.id} className="relative group">
                    <div className="w-full aspect-video bg-[#0b0e14] rounded-lg overflow-hidden border border-zinc-800">
                      {scene.mediaUrl ? (
                        scene.mediaType === 'video' ? (
                          <video src={scene.mediaUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={scene.mediaUrl} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                          Scene {idx + 1}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button className="p-2 bg-black/60 rounded-full text-white">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generator;
