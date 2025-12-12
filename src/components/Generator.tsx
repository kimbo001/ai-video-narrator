import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from '../types';
import VideoPlayer from './VideoPlayer';
import { analyzeScript, generateNarration } from '../services/gemini';
import { fetchPixabayMedia, fetchPixabayAudio } from '../services/pixabay';
import { fetchPexelsMedia } from '../services/pexels';
import { fetchUnsplashMedia } from '../services/unsplash';
import { Loader2, Wand2, RefreshCw, Upload, ArrowLeft, Trash2, FileVideo, ImageIcon, Plus } from 'lucide-react';
import SettingsPanel from './SettingsPanel';

const DEFAULT_SCRIPT = "In the heart of an ancient forest, sunlight filters through the dense canopy. A gentle stream winds its way over mossy rocks, singing a quiet song. Suddenly, a majestic deer steps into the clearing, ears twitching at the sound of the wind. Nature pauses, holding its breath in a moment of perfect tranquility.";
const DEFAULT_PIXABAY_KEY = "21014376-3347c14254556d44ac7acb25e";
const DEFAULT_PEXELS_KEY = "2BbnKbFvEGwKENV4lhRTrQwu3txrXFsisvTjNlrqYYytWjACy9PmwkoM";
const DEFAULT_UNSPLASH_KEY = "inICXEimMWagCfHA86bD4k9MprjkgEFmG0bW9UREkOo";

interface GeneratorProps {
  onBack: () => void;
}

interface UploadedFile {
    id: string;
    file: File;
    previewUrl: string;
    type: 'image' | 'video';
}

const Generator: React.FC<GeneratorProps> = ({ onBack }) => {
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
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState<string | null>(null);
  
  // Custom Media State
  const [customUploads, setCustomUploads] = useState<UploadedFile[]>([]);
  
  // Usage Tracking
  const [generationsToday, setGenerationsToday] = useState(0);
  const [isPro, setIsPro] = useState(false);

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
  
  const usedMediaUrlsRef = useRef<Set<string>>(new Set());

  const updateConfig = (newConfig: AppConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // --- UPLOAD HANDLERS ---
  const handleAddUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
          const newFiles: UploadedFile[] = Array.from(event.target.files).map(file => {
              const isVideo = file.type.startsWith('video') || file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i);
              return {
                  id: Math.random().toString(36).substr(2, 9),
                  file,
                  previewUrl: URL.createObjectURL(file),
                  type: isVideo ? 'video' : 'image'
              };
          });
          setCustomUploads(prev => [...prev, ...newFiles]);
      }
  };

  const removeUpload = (id: string) => {
      setCustomUploads(prev => prev.filter(u => u.id !== id));
  };

  // --- API HANDLERS ---
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
              url = await fetchPixabayMedia(query, mediaType, config.pixabayApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
          } else if (provider === 'pexels') {
              url = await fetchPexelsMedia(query, mediaType, config.pexelsApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
          } else if (provider === 'unsplash') {
              url = await fetchUnsplashMedia(query, mediaType, config.unsplashApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
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

    try {
      setScenes([]);
      setBackgroundMusicUrl(null);
      usedMediaUrlsRef.current = new Set();
      
      setStatus({ step: 'analyzing', message: 'Analyzing script & creating storyboard...' });
      
      const { scenes: analyzedScenes } = await analyzeScript(script, config.visualSubject);
      
      // Auto-fetch music
      const mood = config.visualSubject || 'cinematic ambient';
      fetchPixabayAudio(config.pixabayApiKey, mood).then(url => {
          if (url) setBackgroundMusicUrl(url);
          else fetchPixabayAudio(config.pixabayApiKey, 'background music').then(u => setBackgroundMusicUrl(u));
      });

      setStatus({ step: 'fetching_media', message: 'Allocating media...' });
      
      const scenesWithMedia: Scene[] = [];

      for (let i = 0; i < analyzedScenes.length; i++) {
        const scene = analyzedScenes[i];
        let mediaUrl: string | undefined;
        let mediaType = scene.mediaType;

        // 1. CHECK CUSTOM UPLOADS FIRST
        if (i < customUploads.length) {
            setStatus({ step: 'fetching_media', message: `Assigning custom media to Scene ${i + 1}...` });
            mediaUrl = customUploads[i].previewUrl;
            mediaType = customUploads[i].type;
        } 
        // 2. FETCH STOCK IF NO UPLOAD AVAILABLE
        else {
            setStatus({ step: 'fetching_media', message: `Searching stock media for Scene ${i + 1}...` });
             
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
        }

        if (!mediaUrl) {
             // Fallback placeholder
             const width = config.orientation === VideoOrientation.Landscape ? 1280 : 720;
             const height = config.orientation === VideoOrientation.Landscape ? 720 : 1280;
             mediaUrl = `https://placehold.co/${width}x${height}/000000/FFF?text=Scene+${i+1}`;
             mediaType = 'image';
        } else {
            usedMediaUrlsRef.current.add(mediaUrl);
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
      
      const newCount = generationsToday + 1;
      setGenerationsToday(newCount);
      localStorage.setItem('app_usage', JSON.stringify({ date: new Date().toDateString(), count: newCount }));

    } catch (error: any) {
      console.error("Generation Error:", error);
      setStatus({ step: 'error', message: 'Something went wrong. Please check your API keys or try again.' });
    }
  };

  // Helper for single scene updates (Post-Generation)
  const handleSingleFileUpload = (sceneId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video') || file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i);
    const type = isVideo ? 'video' : 'image';

    setScenes(prev => prev.map(s => {
        if (s.id === sceneId) {
            return { 
                ...s, 
                mediaUrl: objectUrl, 
                mediaType: type, 
                isRegenerating: false,
                id: s.id + '-uploaded' 
            };
        }
        return s;
    }));
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
        newScenes[sceneIndex] = { ...scene, mediaUrl: mediaUrl, mediaType: mediaType, isRegenerating: false };
    } else {
        newScenes[sceneIndex] = { ...scene, isRegenerating: false };
        alert("No more unique media found.");
    }
    setScenes(newScenes);
  };

  const isGenerating = status.step !== 'idle' && status.step !== 'ready' && status.step !== 'error';

  return (
    <div className="flex-1 max-w-[1800px] mx-auto p-4 lg:p-6 w-full h-full flex flex-col">
        {/* Header */}
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

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full flex-1 min-h-0">
          
          {/* COLUMN 1: Story Script (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
            <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 flex flex-col shadow-lg h-full">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold text-lg">1. Story Script</h2>
                  <span className="text-xs text-zinc-500 font-mono">{script.length} chars</span>
               </div>
               <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="flex-1 w-full bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 text-zinc-300 text-sm focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none transition-all placeholder:text-zinc-600 leading-relaxed custom-scrollbar"
                  placeholder="Paste your script here. &#10;&#10;The AI will break this text into scenes. &#10;&#10;If you upload media in column 2, it will use your files first."
               />
            </div>
          </div>

          {/* COLUMN 2: Config & Uploads (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
            
            {/* 2a: Media Library (Uploads) */}
            <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 shadow-lg flex-1 min-h-[300px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold text-lg">2. Your Media</h2>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Files</span>
                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleAddUpload} />
                    </label>
                </div>

                <div className="flex-1 bg-[#0b0e14] border border-zinc-800 rounded-xl p-3 overflow-y-auto custom-scrollbar">
                    {customUploads.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center p-4">
                            <Upload className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-xs">Upload videos/images here.</p>
                            <p className="text-[10px] mt-2 opacity-50">They will be used sequentially for Scene 1, Scene 2, etc.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {customUploads.map((upload, idx) => (
                                <div key={upload.id} className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800 group">
                                    <div className="w-10 h-10 shrink-0 bg-black rounded overflow-hidden relative">
                                        {upload.type === 'video' ? (
                                            <video src={upload.previewUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={upload.previewUrl} className="w-full h-full object-cover" alt="" />
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            {upload.type === 'video' ? <FileVideo className="w-4 h-4 text-white" /> : <ImageIcon className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-zinc-300 truncate">{upload.file.name}</p>
                                        <p className="text-[10px] text-zinc-500">Assigned to Scene {idx + 1}</p>
                                    </div>
                                    <button 
                                        onClick={() => removeUpload(upload.id)}
                                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 2b: Settings */}
            <SettingsPanel config={config} onConfigChange={updateConfig} />
            
            {/* Generate Button */}
            <button 
                onClick={handleGenerate}
                disabled={isGenerating || !script.trim()}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {status.step === 'analyzing' && 'Analyzing...'}
                        {status.step === 'fetching_media' && 'Allocating...'}
                        {status.step === 'generating_audio' && 'Narrating...'}
                    </>
                ) : (
                    <>
                        <Wand2 className="w-5 h-5" />
                        Generate Video
                    </>
                )}
            </button>
          </div>

          {/* COLUMN 3: Preview (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6 h-full overflow-hidden">
             
             <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-6 h-full flex flex-col shadow-lg overflow-hidden">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-white font-semibold text-lg">3. Preview</h2>
                    <div className="flex items-center gap-2">
                         {scenes.length > 0 && (
                             <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20">Ready to Export</span>
                         )}
                    </div>
                </div>

                {/* Player */}
                <div className="h-[400px] 2xl:h-[480px] shrink-0 bg-[#0b0e14] rounded-xl border border-zinc-800 overflow-hidden relative flex flex-col items-center justify-center mb-6">
                    <VideoPlayer scenes={scenes} orientation={config.orientation} backgroundMusicUrl={backgroundMusicUrl} />
                </div>

                {/* Storyboard List */}
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#11141b] z-10 pb-2">
                        <h3 className="text-sm font-medium text-zinc-400">Storyboard Scenes</h3>
                        <span className="text-xs text-zinc-600">{scenes.length} Scenes</span>
                    </div>
                    
                    {scenes.length === 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 opacity-30">
                            {[1,2,3].map(i => (
                                <div key={i} className="aspect-video bg-[#0b0e14] rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-600 text-xs">
                                    Scene {i}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4 pb-2">
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
                                        
                                        {/* Action Buttons */}
                                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                                            <button 
                                                onClick={() => handleRegenerateScene(scene.id)}
                                                disabled={scene.isRegenerating}
                                                className="p-1.5 bg-black/60 rounded-full text-white hover:bg-cyan-500 hover:text-white transition-colors shadow-lg border border-white/10"
                                                title="Regenerate Visual"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${scene.isRegenerating ? 'animate-spin' : ''}`} />
                                            </button>
                                            <label className="p-1.5 bg-black/60 rounded-full text-white hover:bg-cyan-500 hover:text-white transition-colors cursor-pointer shadow-lg border border-white/10" title="Replace Media">
                                                <Upload className="w-3.5 h-3.5" />
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*,video/*"
                                                    onChange={(e) => handleSingleFileUpload(scene.id, e)}
                                                />
                                            </label>
                                        </div>
                                        
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6 pointer-events-none">
                                            <p className="text-[10px] text-zinc-300 truncate">
                                                {scene.visualSearchTerm}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-1.5 text-[10px] text-zinc-500 truncate">Scene {idx+1}: {scene.narration.substring(0,25)}...</p>
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
