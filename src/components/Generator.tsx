import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from '../types';
import VideoPlayer from './VideoPlayer';
import { analyzeScript, generateNarration } from '../services/gemini';
import { fetchPixabayMedia, fetchPixabayAudio } from '../services/pixabay';
import { fetchPexelsMedia } from '../services/pexels';
import { fetchUnsplashMedia } from '../services/unsplash';
import { Loader2, Wand2, RefreshCw, Upload, ArrowLeft, Music, FileAudio, Volume2, Clock, Zap } from 'lucide-react';
import SettingsPanel from './SettingsPanel';

const DEFAULT_SCRIPT = "In the heart of an ancient forest, sunlight filters through the dense canopy. A gentle stream winds its way over mossy rocks, singing a quiet song. Suddenly, a majestic deer steps into the clearing, ears twitching at the sound of the wind. Nature pauses, holding its breath in a moment of perfect tranquility.";
const DEFAULT_PIXABAY_KEY = "21014376-3347c14254556d44ac7acb25e";
const DEFAULT_PEXELS_KEY = "2BbnKbFvEGwKENV4lhRTrQwu3txrXFsisvTjNlrqYYytWjACy9PmwkoM";
const DEFAULT_UNSPLASH_KEY = "inICXEimMWagCfHA86bD4k9MprjkgEFmG0bW9UREkOo";

interface GeneratorProps {
  onBack: () => void;
}

const Generator: React.FC<GeneratorProps> = ({ onBack }) => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [config, setConfig] = useState<AppConfig & { includeMusic: boolean }>({
    pixabayApiKey: DEFAULT_PIXABAY_KEY,
    pexelsApiKey: DEFAULT_PEXELS_KEY,
    unsplashApiKey: DEFAULT_UNSPLASH_KEY,
    orientation: VideoOrientation.Portrait,
    visualSubject: '',
    voiceName: 'Kore',
    negativePrompt: '',
    includeMusic: true
  });
  const [status, setStatus] = useState<GenerationStatus>({ step: 'idle' });
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState<string | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.3);
  
  const [generationsToday, setGenerationsToday] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
      const license = localStorage.getItem('license_key');
      setIsPro(!!license);

      const usageRaw = localStorage.getItem('app_usage');
      const today = new Date().toDateString();
      if (usageRaw) {
          const usage = JSON.parse(usageRaw);
          if (usage.date === today) {
              setGenerationsToday(usage.count);
          } else {
              setGenerationsToday(0);
              localStorage.setItem('app_usage', JSON.stringify({ date: today, count: 0 }));
          }
      }
  }, []);

  useEffect(() => {
    let interval: any;
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);
  
  const usedMediaUrlsRef = useRef<Set<string>>(new Set());

  const updateConfig = (newConfig: AppConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const getStockMediaForScene = async (
      query: string, 
      mediaType: 'image' | 'video', 
      usedUrls: Set<string>
  ): Promise<{ url: string | null, source: string }> => {
      
      const providers: Array<'pixabay' | 'pexels' | 'unsplash'> = [];
      if (config.pixabayApiKey) providers.push('pixabay');
      if (config.pexelsApiKey) providers.push('pexels');
      if (config.unsplashApiKey) providers.push('unsplash');
      
      const shuffled = providers.sort(() => 0.5 - Math.random());

      for (const provider of shuffled) {
          let url: string | null = null;
          
          if (provider === 'pixabay') {
              url = await fetchPixabayMedia(
                  query, 
                  mediaType, 
                  config.pixabayApiKey, 
                  config.orientation, 
                  usedUrls, 
                  config.visualSubject,
                  config.negativePrompt
              );
          } else if (provider === 'pexels') {
              url = await fetchPexelsMedia(
                  query, 
                  mediaType, 
                  config.pexelsApiKey, 
                  config.orientation, 
                  usedUrls, 
                  config.visualSubject,
                  config.negativePrompt
              );
          } else if (provider === 'unsplash') {
              url = await fetchUnsplashMedia(
                  query,
                  mediaType,
                  config.unsplashApiKey,
                  config.orientation,
                  usedUrls,
                  config.visualSubject,
                  config.negativePrompt
              );
          }

          if (url) return { url, source: provider };
      }
      return { url: null, source: 'none' };
  };

  const handleGenerate = async () => {
    if (!isPro && generationsToday >= 5) {
        alert("Daily limit reached (5/5). Please upgrade to Lifetime for unlimited videos!");
        return;
    }
    if (cooldown > 0) return;

    // Start Cooldown
    setCooldown(60);

    // Determine which API Key to use
    // If Pro and the Pro Key exists in env, use it. Otherwise use default.
    const activeApiKey = (isPro && process.env.API_KEY_PRO) ? process.env.API_KEY_PRO : undefined;
    const isUsingFastMode = !!activeApiKey; // If we have a specific Pro key, we go fast.

    if (!process.env.API_KEY && !activeApiKey) {
       console.warn("API_KEY is likely missing from environment variables.");
    }

    try {
      setScenes([]);
      setBackgroundMusicUrl(null);
      usedMediaUrlsRef.current = new Set();
      
      setStatus({ step: 'analyzing', message: 'Analyzing script...' });
      
      const { scenes: analyzedScenes } = await analyzeScript(script, config.visualSubject, activeApiKey);
      
      if (config.includeMusic) {
          if (musicFile) {
              const objectUrl = URL.createObjectURL(musicFile);
              setBackgroundMusicUrl(objectUrl);
          } else {
              setStatus({ step: 'fetching_media', message: 'Searching for background music...' });
              const mood = config.visualSubject || 'cinematic ambient';
              const musicUrl = await fetchPixabayAudio(config.pixabayApiKey, mood);
              if (musicUrl) {
                  setBackgroundMusicUrl(musicUrl);
              } else {
                  const fallbackMusic = await fetchPixabayAudio(config.pixabayApiKey, 'background music');
                  if (fallbackMusic) setBackgroundMusicUrl(fallbackMusic);
              }
          }
      }

      setStatus({ step: 'fetching_media', message: 'Finding stock media...' });
      
      const scenesWithMedia: Scene[] = [];

      for (let i = 0; i < analyzedScenes.length; i++) {
        const scene = analyzedScenes[i];
        let mediaUrl: string | undefined;
        let mediaType = scene.mediaType;

        setStatus({ step: 'fetching_media', message: `Searching media for scene ${i + 1}/${analyzedScenes.length}...` });
             
        let result = await getStockMediaForScene(scene.visualSearchTerm, mediaType, usedMediaUrlsRef.current);
        if (!result.url && mediaType === 'video') {
            mediaType = 'image';
            result = await getStockMediaForScene(scene.visualSearchTerm, mediaType, usedMediaUrlsRef.current);
        }
             
        mediaUrl = result.url || undefined;
        
        if (!mediaUrl && config.visualSubject) {
             const fallbackResult = await getStockMediaForScene(config.visualSubject, 'image', new Set()); 
             mediaUrl = fallbackResult.url || undefined;
             mediaType = 'image';
        }

        if (!mediaUrl) {
           if (i > 0 && scenesWithMedia[i-1].mediaUrl) {
               mediaUrl = scenesWithMedia[i-1].mediaUrl;
               mediaType = scenesWithMedia[i-1].mediaType;
           } else {
               const width = config.orientation === VideoOrientation.Landscape ? 1280 : 720;
               const height = config.orientation === VideoOrientation.Landscape ? 720 : 1280;
               mediaUrl = `https://placehold.co/${width}x${height}/000000/FFF?text=Scene+1`;
               mediaType = 'image';
           }
        } else {
            if (mediaUrl) {
                usedMediaUrlsRef.current.add(mediaUrl);
            }
        }
        scenesWithMedia.push({ ...scene, mediaUrl, mediaType });
      }

      // --- AUDIO GENERATION LOGIC ---
      if (isUsingFastMode) {
          // PRO MODE: Parallel Generation (Fast)
          setStatus({ step: 'generating_audio', message: `⚡ Pro Mode: Narrating all scenes instantly...` });
          
          const finalScenes = await Promise.all(
            scenesWithMedia.map(async (scene) => {
              try {
                const audioData = await generateNarration(scene.narration, config.voiceName, activeApiKey);
                return { ...scene, audioData };
              } catch (e) {
                console.error(`TTS failed for scene: ${scene.id}`, e);
                return scene; 
              }
            })
          );
          setScenes(finalScenes as Scene[]);

      } else {
          // FREE MODE: Sequential Generation (Slow, Safe)
          setStatus({ step: 'generating_audio', message: `Narrating scenes (Slow mode for Free Tier)...` });
          
          const finalScenes: Scene[] = [];
          for (let i = 0; i < scenesWithMedia.length; i++) {
              const scene = scenesWithMedia[i];
              setStatus({ step: 'generating_audio', message: `Narrating scene ${i+1}/${scenesWithMedia.length}...` });
              
              // 5s Delay for Rate Limits
              if (i > 0) await new Promise(r => setTimeout(r, 5000));

              try {
                  const audioData = await generateNarration(scene.narration, config.voiceName, activeApiKey);
                  finalScenes.push({ ...scene, audioData });
              } catch (e: any) {
                  console.error(`TTS failed for scene: ${scene.id}`, e);
                  
                  // Simple Retry Logic for Free Tier
                  if (JSON.stringify(e).includes('429')) {
                      setStatus({ step: 'generating_audio', message: `Rate limit hit. Retrying in 60s...` });
                      await new Promise(r => setTimeout(r, 65000));
                      try {
                          const retryAudio = await generateNarration(scene.narration, config.voiceName, activeApiKey);
                          finalScenes.push({ ...scene, audioData: retryAudio });
                      } catch (retryError) {
                          finalScenes.push(scene);
                      }
                  } else {
                      finalScenes.push(scene);
                  }
              }
          }
          setScenes(finalScenes);
      }

      setStatus({ step: 'ready' });
      
      const newCount = generationsToday + 1;
      setGenerationsToday(newCount);
      localStorage.setItem('app_usage', JSON.stringify({ date: new Date().toDateString(), count: newCount }));

    } catch (error: any) {
      console.error("Generation Error:", error);
      let errorMessage = 'Something went wrong. Please check your API keys or try again.';
      if (typeof error === 'object' && error !== null) {
          const errString = JSON.stringify(error) + (error.message || '');
          if (errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED')) {
              errorMessage = 'High Traffic: Free tier limits reached. Please wait 60 seconds.';
          }
      }
      setStatus({ step: 'error', message: errorMessage });
    }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;

    // Use correct key for regeneration too
    const activeApiKey = (isPro && process.env.API_KEY_PRO) ? process.env.API_KEY_PRO : undefined;

    const newScenes = [...scenes];
    newScenes[sceneIndex] = { ...newScenes[sceneIndex], isRegenerating: true };
    setScenes(newScenes);

    const scene = scenes[sceneIndex];
    let mediaUrl: string | undefined;
    let mediaType = scene.mediaType;

    let result = await getStockMediaForScene(scene.visualSearchTerm, mediaType, usedMediaUrlsRef.current);
    if (!result.url && mediaType === 'video') {
        mediaType = 'image';
        result = await getStockMediaForScene(scene.visualSearchTerm, mediaType, usedMediaUrlsRef.current);
    }
    mediaUrl = result.url || undefined;

    if (mediaUrl) {
        usedMediaUrlsRef.current.add(mediaUrl);
        newScenes[sceneIndex] = {
            ...scene,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            isRegenerating: false
        };
    } else {
        newScenes[sceneIndex] = { ...scene, isRegenerating: false };
        alert("No more unique media found.");
    }
    setScenes(newScenes);
  };

  const handleFileUpload = (sceneId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? 'video' : 'image';
    setScenes(prev => prev.map(s => {
        if (s.id === sceneId) {
            return { ...s, mediaUrl: objectUrl, mediaType: type, isRegenerating: false };
        }
        return s;
    }));
  };

  const isGenerating = status.step !== 'idle' && status.step !== 'ready' && status.step !== 'error';

  return (
    <div className="h-[calc(100vh-80px)] flex-1 w-full flex flex-col p-4 lg:p-6 overflow-hidden">
        <div className="mb-4 flex items-center justify-between shrink-0">
            <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            <div className="flex items-center gap-3">
                {isPro && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                        <Zap className="w-3 h-3" /> PRO MODE ACTIVE
                    </div>
                )}
                {!isPro && (
                    <div className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                        Daily Limit: <span className={generationsToday >= 5 ? 'text-red-500' : 'text-cyan-500'}>{generationsToday}</span>/5
                    </div>
                )}
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
          
          {/* Story Col */}
          <div className="w-full lg:w-[360px] shrink-0 flex flex-col h-full bg-[#11141b] border border-zinc-800 rounded-2xl shadow-lg overflow-hidden relative">
             <div className="p-4 border-b border-zinc-800 flex items-center gap-2 shrink-0">
                 <div className="w-6 h-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400">1</div>
                 <h2 className="text-white font-semibold text-sm">Story Script</h2>
             </div>
             <div className="flex-1 p-4 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pb-24">
                 <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    maxLength={1000}
                    className="flex-1 w-full bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 text-zinc-300 text-sm focus:ring-1 focus:ring-cyan-500 outline-none resize-none mb-2 min-h-[200px]"
                    placeholder="Enter your story script here..."
                 />
                 <div className="flex items-center justify-end mb-2">
                    <span className="text-xs text-zinc-500 font-mono">{script.length}/1000 chars</span>
                 </div>
             </div>
             <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#11141b]/95 backdrop-blur-md border-t border-zinc-800 z-10">
                 <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !script.trim() || cooldown > 0}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg py-3.5 rounded-xl transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                 >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : cooldown > 0 ? `Wait ${cooldown}s` : "Generate Video"}
                 </button>
             </div>
          </div>

          {/* Config Col */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col h-full bg-[#11141b] border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
             <div className="p-4 border-b border-zinc-800 flex items-center gap-2 shrink-0">
                 <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">2</div>
                 <h2 className="text-white font-semibold text-sm">Configuration</h2>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
                <SettingsPanel config={config} onConfigChange={updateConfig} />
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Music className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm font-medium text-zinc-300">Background Music</span>
                        </div>
                        <input type="checkbox" checked={config.includeMusic} onChange={(e) => setConfig(prev => ({...prev, includeMusic: e.target.checked}))} />
                    </div>
                    {config.includeMusic && (
                        <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                            <div className="flex items-center gap-3">
                                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-zinc-400 cursor-pointer">
                                    <FileAudio className="w-3 h-3" />
                                    <span>{musicFile ? 'File Selected' : 'Upload MP3'}</span>
                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => { if(e.target.files?.[0]) setMusicFile(e.target.files[0]); }} />
                                </label>
                            </div>
                            <div className="flex items-center gap-3">
                                <Volume2 className="w-4 h-4 text-zinc-500" />
                                <input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="flex-1 h-1.5 bg-zinc-700 rounded-lg" />
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </div>

          {/* Preview Col */}
          <div className="flex-1 min-w-0 flex flex-col h-full bg-[#11141b] border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
             <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">3</div>
                     <h2 className="text-white font-semibold text-sm">Preview & Export</h2>
                 </div>
             </div>
             <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-[400px] shrink-0 bg-[#0b0e14] border-b border-zinc-800 overflow-hidden relative flex flex-col items-center justify-center">
                    <VideoPlayer scenes={scenes} orientation={config.orientation} backgroundMusicUrl={backgroundMusicUrl} musicVolume={musicVolume} />
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-4 bg-[#0b0e14]/50">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                        {scenes.map((scene, idx) => (
                            <div key={scene.id} className="relative group">
                                <div className={`w-full aspect-video bg-[#0b0e14] rounded-lg overflow-hidden border border-zinc-800 relative`}>
                                    {scene.mediaType === 'video' ? <video src={scene.mediaUrl} className="w-full h-full object-cover" /> : <img src={scene.mediaUrl} className="w-full h-full object-cover" />}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                        <button onClick={() => handleRegenerateScene(scene.id)} className="p-1.5 bg-black/60 rounded-full text-white"><RefreshCw className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <p className="mt-1 text-[10px] text-zinc-500 truncate">Scene {idx+1}</p>
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
