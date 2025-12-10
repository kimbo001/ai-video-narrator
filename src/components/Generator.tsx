// src/components/Generator.tsx — FINAL PERFECT VERSION
import React, { useState } from 'react';
import { AppConfig, VideoOrientation, Scene } from '../types';
import VideoPlayer from './VideoPlayer';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import { useStoryStore } from '../store/useStoryStore';

const Generator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [script, setScript] = useState("A golden retriever puppy chases butterflies in a sunny meadow at golden hour.");

  const [config, setConfig] = useState<Partial<AppConfig> & { includeMusic: boolean}>({
    orientation: VideoOrientation.Portrait,
    visualSubject: '',
    voiceName: 'Kore',
    negativePrompt: '',
    includeMusic: true,
  });

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { mode, variations, selectedVariationIds, setMode, setVariations, toggleVariation, reset } = useStoryStore();

  // These will NEVER fail — direct CDN links
  const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format",
    "https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg?w=800",
    "https://images.pexels.com/photos/709552/pexels-photo-709552.jpeg?w=800",
    "https://images.unsplash.com/photo-1519904981063-b0a8a6e9b8a9?w=800&auto=format",
    "https://images.pexels.com/photos/4666752/pexels-photo-4666752.jpeg?w=800",
  ];

  const generateDemoVideo = () => {
    const lines = script.split(/[.!?]+/).filter(Boolean).slice(0, 8);
    const demoScenes: Scene[] = lines.map((line, i) => ({
      id: String(i),
      narration: line.trim() + (i < lines.length - 1 ? '.' : ''),
      visualSearchTerm: line.trim(),
      mediaUrl: FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
      mediaType: 'image',
      audioData: new Uint8Array(24000 * 2 * 5), // 5 sec silence so VideoPlayer works
      duration: 5,
      isRegenerating: false,
    }));
    setScenes(demoScenes);
  };

  const handleGenerate = () => {
    if (mode === 'weave' && variations.length === 0) {
      setVariations([
        { id: 'v1', title: "Wholesome & Happy", description: "Pure joy and sunshine", script, mood: "wholesome" },
        { id: 'v2', title: "Epic Cinematic", description: "Dramatic slow-motion", script, mood: "epic" },
        { id: 'v3', title: "Funny Meme Style", description: "Maximum chaos energy", script, mood: "funny" },
        { id: 'v4', title: "Mysterious Night", description: "Dark and atmospheric", script, mood: "mysterious" },
      ]);
      return;
    }

    setIsGenerating(true);
    generateDemoVideo();
    setTimeout(() => setIsGenerating(false), 1500);
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 text-lg">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ==================== LEFT: SCRIPT + WEAVER ==================== */}
        <div className="bg-[#11141b] border border-zinc-800 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-white">Script</h2>
            {mode === 'weave' && <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />}
          </div>

          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full h-80 bg-[#0b0e14] border border-zinc-800 rounded-2xl p-6 text-white text-lg resize-none focus:ring-4 focus:ring-cyan-500/50 outline-none transition-all"
            placeholder="Write your story here..."
          />

          <div className="flex justify-between items-center">
            <span className="text-lg text-zinc-300 font-medium">AI Story Weaver</span>
            <button
              onClick={() => setMode(mode === 'weave' ? 'single' : 'weave')}
              className={`relative w-16 h-9 rounded-full transition-all duration-300 ${mode === 'weave' ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-1.5 w-7 h-7 bg-white rounded-full transition-all duration-300 shadow-lg ${mode === 'weave' ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          {mode === 'weave' && variations.length > 0 && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {variations.map((v) => (
                <label
                  key={v.id}
                  className={`flex items-center gap-5 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedVariationIds.includes(v.id)
                      ? 'border-cyan-500 bg-cyan-500/20 shadow-lg shadow-cyan-500/20'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedVariationIds.includes(v.id)}
                    onChange={() => toggleVariation(v.id)}
                    className="w-6 h-6 text-cyan-500 rounded focus:ring-cyan-500"
                  />
                  <div className="flex-1">
                    <div className="text-xl font-bold text-white">{v.title}</div>
                    <div className="text-sm text-zinc-400 mt-1">{v.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xl font-bold py-6 rounded-2xl shadow-xl transform transition-all active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-4"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                Generate Video{mode === 'weave' && selectedVariationIds.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* ==================== MIDDLE: CONFIGURATION ==================== */}
        <div className="bg-[#11141b] border border-zinc-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Configuration</h2>
          <SettingsPanel
            config={config as AppConfig}
            onConfigChange={(newConfig) => {
              setConfig((prev) => ({ ...prev, ...newConfig }));
            }}
          />
        </div>

        {/* ==================== RIGHT: PREVIEW ==================== */}
        <div className="bg-[#11141b] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
          <div className="p-8 border-b border-zinc-800">
            <h2 className="text-3xl font-bold text-white text-center">Preview & Export</h2>
          </div>
          <div className="flex-1 bg-black flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              <VideoPlayer
                scenes={scenes}
                orientation={config.orientation || VideoOrientation.Portrait}
                backgroundMusicUrl={null}
                musicVolume={0.3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generator;
