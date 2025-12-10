// src/components/Generator.tsx  ←  FINAL WORKING VERSION
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

const DEFAULT_SCRIPT = "A curious red panda discovers a hidden bamboo forest at sunrise.";

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

  const getStockMediaForScene = async (query: string) => {
    const providers = ['pixabay', 'pexels', 'unsplash'].filter(p =>
      p === 'pixabay' ? config.pixabayApiKey :
      p === 'pexels' ? config.pexelsApiKey : config.unsplashApiKey
    );

    for (const p of providers.sort(() => Math.random() - 0.5)) {
      let url: string | null = null;
      if (p === 'pixabay') url = await fetchPixabayMedia(query, 'image', config.pixabayApiKey, config.orientation, usedMediaUrlsRef.current, config.visualSubject, config.negativePrompt);
      if (p === 'pexels') url = await fetchPexelsMedia(query, 'image', config.pexelsApiKey, config.orientation, usedMediaUrlsRef.current, config.visualSubject, config.negativePrompt);
      if (p === 'unsplash') url = await fetchUnsplashMedia(query, 'image', config.unsplashApiKey, config.orientation, usedMediaUrlsRef.current, config.visualSubject, config.negativePrompt);
      if (url) {
        usedMediaUrlsRef.current.add(url);
        return url;
      }
    }
    return null;
  };

  const generateSingleVideo = async (text: string) => {
    setIsGenerating(true);
    setScenes([]);

    try {
      const result = await analyzeScript(text);
      const newScenes: Scene[] = result.scenes.map((s: any) => ({
        id: crypto.randomUUID(),
        narration: s.narration,
        // This line fixes the black video bug
        visualSearchTerm: s.mediaQuery || s.narration.substring(0, 80),
        mediaUrl: '',
        mediaType: 'image' as const,
        audioData: null,
        duration: 6,
        isRegenerating: false,
      }));
      setScenes(newScenes);

      for (let i = 0; i < newScenes.length; i++) {
        const scene = newScenes[i];

        // Narration
        const nar = await generateNarration(scene.narration, config.voiceName);
        scene.audioData = nar.audioData as Uint8Array;
        scene.duration = nar.duration || 6;

        // Media
        const mediaUrl = await getStockMediaForScene(scene.visualSearchTerm);
        if (mediaUrl) {
          scene.mediaUrl = mediaUrl;
          scene.mediaType = mediaUrl.includes('.mp4') ? 'video' : 'image';
        }

        setScenes([...newScenes]);
      }

      // Background music
      if (config.includeMusic) {
        const audio = await fetchPixabayAudio("uplifting acoustic", config.pixabayApiKey);
        if (audio) setBackgroundMusicUrl(audio);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    // WEAVER: first click → create variations
    if (mode === 'weave' && variations.length === 0) {
      try {
        const vars = await generateStoryVariations(script);
        setVariations(vars.map(v => ({ ...v, id: crypto.randomUUID() })));
      } catch (e) {
        console.error('Weaver failed', e);
      }
      return;
    }

    // GENERATE SELECTED VIDEOS
    const scripts = mode === 'single'
      ? [script]
      : variations.filter(v => selectedVariationIds.includes(v.id)).map(v => v.script);

    for (const s of scripts) {
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
        {/* LEFT */}
        <div className="bg-[#11141b] border border-zinc-800 rounded-2xl flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <span className="font-bold text-white">Script</span>
            {mode === 'weave' && <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />}
          </div>

          <div className="flex-1 p-4">
            <textarea
              value={script}
              onChange={e => setScript(e.target.value)}
              className="w-full h-80 bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div className="p-4 border-t border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">AI Story Weaver</span>
              <button
                onClick={() => setMode(mode === 'weave' ? 'single' : 'weave')}
                className={`relative w-12 h-7 rounded-full ${mode === 'weave' ? 'bg-cyan-500' : 'bg-zinc-700'}`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full transition ${mode === 'weave' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {mode === 'weave' && variations.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {variations.map(v => (
                  <label key={v.id} className={`flex items-center gap-3 p-3 rounded-lg border ${selectedVariationIds.includes(v.id) ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-700'}`}>
                    <input
                      type="checkbox"
                      checked={selectedVariationIds.includes(v.id)}
                      onChange={() => toggleVariation(v.id)}
                    />
                    <div>
                      <div className="font-semibold">{v.title}</div>
                      <div className="text-xs text-zinc-400">{v.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !script.trim()}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : 'Generate Video(s)'}
            </button>
          </div>
        </div>

        {/* MIDDLE & RIGHT – your existing columns */}
        <div className="bg-[#11141b] border border-zinc-800 rounded-2xl flex flex-col">
          <div className="p-4 border-b border-zinc-800 font-bold text-white">Configuration</div>
          <div className="flex-1 overflow-y-auto p-4">
            <SettingsPanel config={config} onConfigChange={updateConfig} />
          </div>
        </div>

        <div className="bg-[#11141b] border border-zinc-800 rounded-2xl flex flex-col">
          <div className="p-4 border-b border-zinc-800 font-bold text-white">Preview & Export</div>
          <div className="flex-1 bg-black flex items-center justify-center">
            <VideoPlayer scenes={scenes} orientation={config.orientation} backgroundMusicUrl={backgroundMusicUrl} musicVolume={0.3} />
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3">
              {scenes.map((s, i) => (
                <div key={s.id} className="aspect-video bg-zinc-900 rounded overflow-hidden border border-zinc-800">
                  {s.mediaUrl ? (
                    s.mediaType === 'video' ? (
                      <video src={s.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={s.mediaUrl} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
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
  );
};

export default Generator;
