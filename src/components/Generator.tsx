// src/components/Generator.tsx
import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from '../types';
import VideoPlayer from './VideoPlayer';
import { analyzeScript, generateNarration } from '../services/gemini';
import { generateStoryVariations } from '../services/gemini';
import { fetchPixabayMedia, fetchPixabayAudio } from '../services/pixabay';
import { fetchPexelsMedia } from '../services/pexels';
import { fetchUnsplashMedia } from '../services/unsplash';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
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

  const getStockMediaForScene = async (query: string, type: 'image' | 'video', used: Set<string>) => {
    const providers = [];
    if (config.pixabayApiKey) providers.push('pixabay');
    if (config.pexelsApiKey) providers.push('pexels');
    if (config.unsplashApiKey) providers.push('unsplash');

    for (const p of providers.sort(() => 0.5 - Math.random())) {
      let url: string | null = null;
      if (p === 'pixabay') url = await fetchPixabayMedia(query, type, config.pixabayApiKey, config.orientation, used, config.visualSubject, config.negativePrompt);
      if (p === 'pexels') url = await fetchPexelsMedia(query, type, config.pexelsApiKey, config.orientation, used, config.visualSubject, config.negativePrompt);
      if (p === 'unsplash') url = await fetchUnsplashMedia(query, type, config.unsplashApiKey, config.orientation, used, config.visualSubject, config.negativePrompt);
      if (url) return { url, source: p };
    }
    return { url: null, source: 'none' };
  };

  const generateSingleVideo = async (scriptText: string) => {
    setIsGenerating(true);
    setStatus({ step: 'analyzing' });
    setScenes([]);

    try {
      const analysis = await analyzeScript(scriptText);
      const newScenes: Scene[] = analysis.scenes.map((s: any) => ({
        id: crypto.randomUUID(),
        narration: s.narration,
        visualSearchTerm: s.mediaQuery || s.visualSearchTerm || s.narration.slice(0, 60),
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
        const audio = await fetchPixabayAudio("calm ambient", config.pixabayApiKey);
        if (audio) setBackgroundMusicUrl(audio);
      }

      setStatus({ step: 'complete' });
    } catch (e) {
      setStatus({ step: 'error', message: 'Generation failed' });
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (mode === 'weave' && variations.length === 0) {
      setStatus({ step: 'weaving' });
      try {
        const vars = await generateStoryVariations(script);
        setVariations(vars.map(v => ({ ...v, id: crypto.randomUUID() })));
      } catch (e) {
        console.error('Weaver failed', e);
      }
      setStatus({ step: 'idle' });
      return;
    }

    const scriptsToUse = mode === 'single'
      ? [script]
      : variations
          .filter(v => selectedVariationIds.includes(v.id))
          .map(v => v.script);

    for (const s of scriptsToUse) {
      await generateSingleVideo(s);
      await new Promise(r => setTimeout(r, 1000));
    }

    reset();
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT – SCRIPT + WEAVER */}
        <div className="bg-[#11141b] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">1</div>
              <span className="font-semibold text-white">Script</span>
            </div>
            {mode === 'weave' && <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              className="w-full min-h-96 bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 text-sm resize-none focus:ring-1 focus:ring-cyan-500 outline-none"
              placeholder="Paste your script here..."
            />
          </div>

          <div className="p-4 border-t border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
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
                  <label key={v.id} className={`block p-3 rounded-lg border cursor-pointer transition ${selectedVariationIds.includes(v.id) ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-700'}`}>
                    <div className="flex gap-3 items-start">
                      <input
                        type="checkbox"
                        checked={selectedVariationIds.includes(v.id)}
                        onChange={() => toggleVariation(v.id)}
                        className="mt-1"
                      />
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
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : mode === 'weave' && variations.length === 0 ? (
                'Weave & Generate'
              ) : (
                `Generate ${mode === 'weave' ? selectedVariationIds.length : 1} Video${mode === 'weave' && selectedVariationIds.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>

        {/* MIDDLE – CONFIGURATION */}
        <div className="bg-[#11141b] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">2</div>
            <span className="font-semibold text-white">Configuration</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SettingsPanel config={config} onConfigChange={updateConfig} />
          </div>
        </div>

        {/* RIGHT – PREVIEW */}
        <div className="bg-[#11141b] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">3</div>
            <span className="font-semibold text-white">Preview & Export</span>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="h-96 bg-black flex items-center justify-center">
              <VideoPlayer
                scenes={scenes}
                orientation={config.orientation}
                backgroundMusicUrl={backgroundMusicUrl}
                musicVolume={0.3}
              />
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                {scenes.map((s, i) => (
                  <div key={s.id} className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
                    {s.mediaUrl ? (
                      s.mediaType === 'video' ? (
                        <video src={s.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={s.mediaUrl} className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                        Scene {i + 1}
                      </div>
                    )}
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
