import React, { useState, useRef } from 'react';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from './types';
import VideoPlayer from './components/VideoPlayer';
import { analyzeScript, generateNarration } from './services/gemini';
import { fetchPixabayMedia } from './services/pixabay';
import { fetchPexelsMedia } from './services/pexels';
import { fetchUnsplashMedia } from './services/unsplash';
import { Loader2, Wand2, RefreshCw, Monitor, Smartphone, Mic, Focus, Ban, Upload } from 'lucide-react';

const DEFAULT_SCRIPT = "In the heart of an ancient forest, sunlight filters through the dense canopy. A gentle stream winds its way over mossy rocks, singing a quiet song. Suddenly, a majestic deer steps into the clearing, ears twitching at the sound of the wind. Nature pauses, holding its breath in a moment of perfect tranquility.";
const DEFAULT_PIXABAY_KEY = "21014376-3347c14254556d44ac7acb25e";
const DEFAULT_PEXELS_KEY = "2BbnKbFvEGwKENV4lhRTrQwu3txrXFsisvTjNlrqYYytWjACy9PmwkoM";
const DEFAULT_UNSPLASH_KEY = "inICXEimMWagCfHA86bD4k9MprjkgEFmG0bW9UREkOo"; // Unsplash Access Key

const GEMINI_VOICES = [
  { id: 'Kore', label: 'Kore (Female, Calm)' },
  { id: 'Puck', label: 'Puck (Male, Playful)' },
  { id: 'Charon', label: 'Charon (Male, Deep)' },
  { id: 'Fenrir', label: 'Fenrir (Male, Intense)' },
  { id: 'Aoede', label: 'Aoede (Female, Elegant)' },
];

const App: React.FC = () => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [config, setConfig] = useState<AppConfig>({
    pixabayApiKey: DEFAULT_PIXABAY_KEY,
    pexelsApiKey: DEFAULT_PEXELS_KEY,
    unsplashApiKey: DEFAULT_UNSPLASH_KEY,
    orientation: VideoOrientation.Portrait,
    visualSubject: '',
    voiceName: 'Kore',
    negativePrompt: '',
  });
  const [status, setStatus] = useState<GenerationStatus>({ step: 'idle' });
  const [scenes, setScenes] = useState<Scene[]>([]);
  
  // Persist used URLs across renders so regeneration knows what is already taken
  const usedMediaUrlsRef = useRef<Set<string>>(new Set());

  // Helper to update config
  const updateConfig = (key: keyof AppConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Helper to try multiple providers
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
    // Basic check for missing key in UI
    if (!process.env.API_KEY) {
       console.warn("API_KEY is likely missing from environment variables.");
    }

    try {
      setScenes([]);
      usedMediaUrlsRef.current = new Set();
      console.log("Media history cleared for new generation.");
      
      setStatus({ step: 'analyzing', message: 'Analyzing script & creating storyboard...' });
      
      // 1. Analyze Script
      const { scenes: analyzedScenes } = await analyzeScript(script, config.visualSubject);
      
      setStatus({ step: 'fetching_media', message: 'Finding stock media...' });
      
      const scenesWithMedia: Scene[] = [];

      for (let i = 0; i < analyzedScenes.length; i++) {
        const scene = analyzedScenes[i];
        
        // FIXED: Use undefined instead of null to match Scene interface
        let mediaUrl: string | undefined; 
        let mediaType = scene.mediaType;

        // STOCK LOGIC
        setStatus({ step: 'fetching_media', message: `Searching media for scene ${i + 1}/${analyzedScenes.length}...` });
             
        let result = await getStockMediaForScene(scene.visualSearchTerm, mediaType, usedMediaUrlsRef.current);
        if (!result.url && mediaType === 'video') {
            mediaType = 'image';
            result = await getStockMediaForScene(scene.visualSearchTerm, mediaType, usedMediaUrlsRef.current);
        }
             
        // FIXED: Convert possible null from API to undefined
        mediaUrl = result.url || undefined;
        
        // Final Fallback for visual subject reuse
        if (!mediaUrl && config.visualSubject) {
             const fallbackResult = await getStockMediaForScene(config.visualSubject, 'image', new Set()); 
             mediaUrl = fallbackResult.url || undefined;
             mediaType = 'image';
        }

        // CONTINUITY FALLBACK (Shared)
        if (!mediaUrl) {
           if (i > 0 && scenesWithMedia[i-1].mediaUrl) {
               mediaUrl = scenesWithMedia[i-1].mediaUrl;
               mediaType = scenesWithMedia[i-1].mediaType;
           } else {
               // Black placeholder for first scene failure
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

    } catch (error) {
      console.error(error);
      setStatus({ step: 'error', message: 'Something went wrong. Please check your API keys or try again.' });
    }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;

    const newScenes = [...scenes];
    newScenes[sceneIndex] = { ...newScenes[sceneIndex], isRegenerating: true };
    setScenes(newScenes);

    const scene = scenes[sceneIndex];
    
    // FIXED: Use undefined instead of null
    let mediaUrl: string | undefined;
    let mediaType = scene.mediaType;

    // Stock Regeneration
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
    <div className="min-h-screen bg-[#0b0e14] text-zinc-300 font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col">
      <div className="flex-1 max-w-[1600px] mx-auto p-6 lg:p-8 w-full h-full">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* Left Column (Input & Settings) - Spans 4 cols on large screens */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
            
            {/* Panel 1: Your Story */}
            <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 flex flex-col shadow-lg">
               <h2 className="text-white font-semibold text-lg mb-4">Your Story</h2>
               <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="flex-1 min-h-[200px] w-full bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 text-zinc-300 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none transition-all placeholder:text-zinc-600 mb-4"
                  placeholder="Enter your story, script, or text here... Use '---' to manually force a new scene."
               />
               
               <div className="flex items-center justify-end">
                  <span className="text-xs text-zinc-500 font-mono">{script.length} chars</span>
               </div>
            </div>

            {/* Panel 2: Video Settings */}
            <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 shadow-lg">
               <h2 className="text-white font-semibold text-lg mb-5">Video Settings</h2>
               
               <div className="flex flex-col gap-5">

                  {/* Orientation & Voice */}
                  <div className="grid grid-cols-1 gap-4">
                     <div className="flex flex-col gap-2">
                        <label className="text-xs font-medium text-zinc-400">Orientation</label>
                        <div className="flex bg-[#0b0e14] p-1 rounded-lg border border-zinc-800">
                           <button 
                             onClick={() => updateConfig('orientation', VideoOrientation.Landscape)}
                             className={`flex-1 py-2 rounded-md flex items-center justify-center transition-all ${config.orientation === VideoOrientation.Landscape ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                             title="Landscape"
                           >
                              <Monitor className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => updateConfig('orientation', VideoOrientation.Portrait)}
                             className={`flex-1 py-2 rounded-md flex items-center justify-center transition-all ${config.orientation === VideoOrientation.Portrait ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                             title="Portrait"
                           >
                              <Smartphone className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                     
                     {/* Voice */}
                     <div className="flex flex-col gap-3">
                         <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-zinc-400">Narrator Voice</label>
                         </div>

                         <div className="relative">
                            <select 
                               value={config.voiceName}
                               onChange={(e) => updateConfig('voiceName', e.target.value)}
                               className="w-full bg-[#0b0e14] border border-zinc-800 rounded-lg py-2.5 px-3 text-sm text-zinc-200 appearance-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                            >
                                {GEMINI_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                            </select>
                            <Mic className="absolute right-3 top-3 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                        </div>
                     </div>
                  </div>

                  {/* Extra Controls */}
                  <div className="space-y-3 pt-2 border-t border-zinc-800/50">
                      <div>
                        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Main Visual Subject</label>
                        <div className="relative">
                            <Focus className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                            <input
                                type="text"
                                value={config.visualSubject}
                                onChange={(e) => updateConfig('visualSubject', e.target.value)}
                                placeholder="Force subject (e.g. Rottweiler)"
                                className="w-full bg-[#0b0e14] border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-200 focus:border-cyan-500 outline-none placeholder:text-zinc-600"
                            />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Negative Prompt</label>
                        <div className="relative">
                            <Ban className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                            <input
                                type="text"
                                value={config.negativePrompt}
                                onChange={(e) => updateConfig('negativePrompt', e.target.value)}
                                placeholder="Exclude (e.g. text, people)"
                                className="w-full bg-[#0b0e14] border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-200 focus:border-cyan-500 outline-none placeholder:text-zinc-600"
                            />
                        </div>
                      </div>
                  </div>

               </div>
            </div>
            
             {/* Generate Button (Moved here for better mobile flow, can stay here on desktop too) */}
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

          {/* Right Column (Preview) - Spans 8 cols */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-hidden">
             
             {/* Preview Card */}
             <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-6 h-full flex flex-col shadow-lg overflow-hidden">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-white font-semibold text-lg">Preview</h2>
                    <div className="flex items-center gap-2">
                         {scenes.length > 0 && (
                             <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">Ready to Export</span>
                         )}
                         <button className="px-3 py-1 bg-[#11141b] hover:bg-[#1a1e26] text-zinc-400 hover:text-white text-xs font-medium rounded-lg border border-zinc-800 transition-colors">
                            Quick Preview
                        </button>
                    </div>
                </div>

                {/* Video Player Area - FIXED HEIGHT TO PREVENT STRETCHING */}
                <div className="h-[480px] shrink-0 bg-[#0b0e14] rounded-xl border border-zinc-800 overflow-hidden relative flex flex-col items-center justify-center mb-6">
                    <VideoPlayer scenes={scenes} orientation={config.orientation} />
                </div>

                {/* Selected Images Grid - Scrollable area */}
                <div className="flex-1 overflow-y-auto min-h-0">
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
                                        
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                            <p className="text-[10px] text-zinc-300 truncate">
                                                {config.negativePrompt ? <span className="text-red-400 mr-1">!</span> : null}
                                                {scene.visualSearchTerm}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-1.5 text-[10px] text-zinc-500 truncate">Scene {idx+1}: {scene.narration.substring(0, 20)}...</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default App;
