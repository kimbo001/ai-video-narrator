
import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from '../types';
import VideoPlayer from './VideoPlayer';
import { analyzeScript, generateNarration } from '../services/gemini';
import { fetchPixabayMedia, fetchPixabayAudio } from '../services/pixabay';
import { fetchPexelsMedia } from '../services/pexels';
import { fetchUnsplashMedia } from '../services/unsplash';
import { Loader2, Wand2, RefreshCw, Monitor, Smartphone, Mic, Focus, Ban, Upload, ArrowLeft, Music } from 'lucide-react';
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
  
  // Usage Tracking
  const [generationsToday, setGenerationsToday] = useState(0);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
      // Check Pro status
      const license = localStorage.getItem('license_key');
      setIsPro(!!license);

      // Check daily usage
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
    // 1. Check Usage Limits
    if (!isPro && generationsToday >= 5) {
        alert("Daily limit reached (5/5). Please upgrade to Lifetime for unlimited videos!");
        return;
    }

    if (!process.env.API_KEY) {
       console.warn("API_KEY is likely missing from environment variables.");
    }

    try {
      setScenes([]);
      setBackgroundMusicUrl(null);
      usedMediaUrlsRef.current = new Set();
      
      setStatus({ step: 'analyzing', message: 'Analyzing script & creating storyboard...' });
      
      const { scenes: analyzedScenes } = await analyzeScript(script, config.visualSubject);
      
      // FETCH MUSIC if enabled
      if (config.includeMusic) {
          setStatus({ step: 'fetching_media', message: 'Searching for background music...' });
          // Use visual subject as mood or default to cinematic
          const mood = config.visualSubject || 'cinematic ambient';
          const musicUrl = await fetchPixabayAudio(config.pixabayApiKey, mood);
          if (musicUrl) {
              setBackgroundMusicUrl(musicUrl);
          } else {
              // Fallback
              const fallbackMusic = await fetchPixabayAudio(config.pixabayApiKey, 'background music');
              if (fallbackMusic) setBackgroundMusicUrl(fallbackMusic);
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

      setStatus({ step: 'generating_audio', message: `Narrating with Gemini...` });
      
      const finalScenes = await Promise.all(
        scenesWithMedia.map(async (scene) => {
          try {
            const audioData = await generateNarration(scene.narration, config.voiceName);
            return { ...scene, audioData };
          } catch (e) {
            console.error(`TTS failed for scene: ${scene.id}`, e);
            return scene; 
          }
        })
      );

      setScenes(finalScenes as Scene[]);
      setStatus({ step: 'ready' });
      
      // Update Usage Logic
      const newCount = generationsToday + 1;
      setGenerationsToday(newCount);
      localStorage.setItem('app_usage', JSON.stringify({ date: new Date().toDateString(), count: newCount }));

    } catch (error: any) {
      console.error("Generation Error:", error);
      let errorMessage = 'Something went wrong. Please check your API keys or try again.';
      if (typeof error === 'object' && error !== null) {
          const errString = JSON.stringify(error) + (error.message || '');
          if (errString.includes('leaked') || errString.includes('revoked')) {
              errorMessage = 'ACCESS DENIED: API Key invalid.';
          }
      }
      setStatus({ step: 'error', message: errorMessage });
    }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;

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
    <div className="flex-1 max-w-[1600px] mx-auto p-4 lg:p-8 w-full h-full flex flex-col">
        <div className="mb-4 flex items-center justify-between">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </button>
            
            {!isPro && (
                <div className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                    Daily Limit: <span className={generationsToday >= 5 ? 'text-red-500' : 'text-cyan-500'}>{generationsToday}</span>/5
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full flex-1 min-h-0">
          
          {/* Left Column */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
            
            <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 flex flex-col shadow-lg">
               <h2 className="text-white font-semibold text-lg mb-4">Your Story</h2>
               <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="flex-1 min-h-[150px] w-full bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 text-zinc-300 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none transition-all placeholder:text-zinc-600 mb-4"
                  placeholder="Enter your story script here..."
               />
               <div className="flex items-center justify-end">
                  <span className="text-xs text-zinc-500 font-mono">{script.length} chars</span>
               </div>
            </div>

            <SettingsPanel config={config} onConfigChange={updateConfig} />
            
            {/* Music Toggle */}
            <div className="bg-[#11141b] border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Music className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-300">Background Music</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={config.includeMusic} onChange={(e) => setConfig(prev => ({...prev, includeMusic: e.target.checked}))} />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
            </div>
            
             <button 
                onClick={handleGenerate}
                disabled={isGenerating || !script.trim()}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3 mt-auto"
             >
                {isGenerating ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {status.step === 'analyzing' && 'Analyzing Script...'}
                        {status.step === 'fetching_media' && 'Finding Stock Media...'}
                        {status.step === 'generating_audio' && 'Recording Voice...'}
                    </>
                ) : (
                    <>
                        <Wand2 className="w-5 h-5" />
                        Generate Video
                    </>
                )}
             </button>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
             
             <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-6 h-full flex flex-col shadow-lg overflow-hidden">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-white font-semibold text-lg">Preview</h2>
                    <div className="flex items-center gap-2">
                         {scenes.length > 0 && (
                             <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">Ready to Export</span>
                         )}
                    </div>
                </div>

                <div className="h-[480px] shrink-0 bg-[#0b0e14] rounded-xl border border-zinc-800 overflow-hidden relative flex flex-col items-center justify-center mb-6">
                    <VideoPlayer scenes={scenes} orientation={config.orientation} backgroundMusicUrl={backgroundMusicUrl} />
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#11141b] z-10 pb-2">
                        <h3 className="text-sm font-medium text-zinc-400">Storyboard Scenes</h3>
                        <span className="text-xs text-zinc-600">{scenes.length} Scenes</span>
                    </div>
                    
                    {scenes.length === 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-30">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="aspect-video bg-[#0b0e14] rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-600 text-xs">
                                    Scene {i}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-2">
                            {scenes.map((scene, idx) => (
                                <div key={scene.id} className="relative group">
                                    <div className={`w-full ${config.orientation === VideoOrientation.Landscape ? 'aspect-video' : 'aspect-[9/16]'} bg-[#0b0e14] rounded-lg overflow-hidden border border-zinc-800 relative`}>
                                        {scene.mediaType === 'video' ? (
                                            <video 
                                                src={scene.mediaUrl} 
                                                className="w-full h-full object-cover" 
                                                muted 
                                                onMouseOver={e => e.currentTarget.play().catch(() => {})} 
                                                onMouseOut={e => e.currentTarget.pause()}
                                            />
                                        ) : (
                                            <img src={scene.mediaUrl} className="w-full h-full object-cover" alt="" />
                                        )}
                                        
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button 
                                                onClick={() => handleRegenerateScene(scene.id)}
                                                disabled={scene.isRegenerating}
                                                className="p-1.5 bg-black/60 rounded-full text-white hover:bg-cyan-500 hover:text-white transition-colors"
                                                title="Regenerate Visual"
                                            >
                                                <RefreshCw className={`w-4 h-4 ${scene.isRegenerating ? 'animate-spin' : ''}`} />
                                            </button>
                                            <label className="p-1.5 bg-black/60 rounded-full text-white hover:bg-cyan-500 hover:text-white transition-colors cursor-pointer" title="Upload Media">
                                                <Upload className="w-4 h-4" />
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*,video/*"
                                                    onChange={(e) => handleFileUpload(scene.id, e)}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <p className="mt-1.5 text-[10px] text-zinc-500 truncate">Scene {idx+1}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
             </div>
          </div>
        </div>
    </div>
  );
};

export default Generator;
