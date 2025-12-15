// src/components/Generator.tsx
import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from '../types';
import VideoPlayer from './VideoPlayer';
import { analyzeScript, generateNarration } from '../services/gemini';
import { fetchPixabayMedia, fetchPixabayAudio } from '../services/pixabay';
import { fetchPexelsMedia } from '../services/pexels';
import { fetchUnsplashMedia } from '../services/unsplash';
import { Loader2, Wand2, RefreshCw, Upload, ArrowLeft, Trash2, FileVideo, ImageIcon, Plus, Music, Volume2, Focus, Ban } from 'lucide-react';
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
  
  const [isManualMode, setIsManualMode] = useState(false);

  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState<string | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicVolume, setMusicVolume] = useState<number>(0.15);

  const [customUploads, setCustomUploads] = useState<UploadedFile[]>([]);
  
  const [generationsToday, setGenerationsToday] = useState(0);
  const [isPro, setIsPro] = useState(false);

  // ----------  NEW:  call backend instead of importing userService  ----------
  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/limits?userId=user-id-placeholder&type=auto');
      if (!res.ok) return;
      const data = await res.json();
      setGenerationsToday(data.remaining ? data.remaining.auto : 0);
    } catch {}
  };
  useEffect(() => { fetchUsage(); }, []);

  const checkLimits = async (type: 'auto' | 'manual') => {
    const res = await fetch(`/api/limits?userId=user-id-placeholder&type=${type}`);
    if (!res.ok) {
      const { error } = await res.json();
      alert(error);
      return false;
    }
    return true;
  };
  // --------------------------------------------------------------------------

  const usedMediaUrlsRef = useRef<Set<string>>(new Set());

  const updateConfig = (newConfig: AppConfig) => setConfig(prev => ({ ...prev, ...newConfig }));
  const handleUpdateConfigField = (field: keyof AppConfig, value: string) => setConfig(prev => ({ ...prev, [field]: value }));

  const handleAddVisualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles: UploadedFile[] = Array.from(e.target.files).map(file => {
      const isVideo = file.type.startsWith('video') || !!file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i);
      return { id: Math.random().toString(36).slice(2, 11), file, previewUrl: URL.createObjectURL(file), type: isVideo ? 'video' : 'image' };
    });
    setCustomUploads(prev => [...prev, ...newFiles]);
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMusicFile(file);
    setBackgroundMusicUrl(URL.createObjectURL(file));
  };

  const removeVisualUpload = (id: string) => setCustomUploads(prev => prev.filter(u => u.id !== id));

  const getStockMediaForScene = async (query: string, mediaType: 'image' | 'video', usedUrls: Set<string>) => {
    const providers: Array<'pixabay' | 'pexels' | 'unsplash'> = [];
    if (config.pixabayApiKey) providers.push('pixabay');
    if (config.pexelsApiKey) providers.push('pexels');
    if (config.unsplashApiKey) providers.push('unsplash');
    const shuffled = providers.sort(() => 0.5 - Math.random());

    for (const provider of shuffled) {
      let url: string | null = null;
      if (provider === 'pixabay') url = await fetchPixabayMedia(query, mediaType, config.pixabayApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      else if (provider === 'pexels') url = await fetchPexelsMedia(query, mediaType, config.pexelsApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      else if (provider === 'unsplash') url = await fetchUnsplashMedia(query, mediaType, config.unsplashApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      if (url) return { url, source: provider };
    }
    return { url: null, source: 'none' };
  };

  const handleGenerate = async () => {
    const ok = await checkLimits(isManualMode ? 'manual' : 'auto');
    if (!ok) return;

    if (!isPro && generationsToday >= 5) {
      alert('Daily limit reached (5/5). Upgrade to Lifetime for unlimited videos!');
      return;
    }

    try {
      setScenes([]);
      if (!musicFile && !isManualMode) setBackgroundMusicUrl(null);
      usedMediaUrlsRef.current = new Set();

      setStatus({ step: 'analyzing', message: 'Analyzing script & creating storyboard...' });
      const { scenes: analyzedScenes } = await analyzeScript(script, config.visualSubject);

      if (!isManualMode && !musicFile) {
        const mood = config.visualSubject || 'cinematic ambient';
        fetchPixabayAudio(config.pixabayApiKey, mood)
          .then(url => url ? setBackgroundMusicUrl(url) : fetchPixabayAudio(config.pixabayApiKey, 'background music').then(setBackgroundMusicUrl))
          .catch(() => {});
      }

      setStatus({ step: 'fetching_media', message: 'Allocating media...' });
      const scenesWithMedia: Scene[] = [];

      for (let i = 0; i < analyzedScenes.length; i++) {
        const scene = analyzedScenes[i];
        let mediaUrl: string | undefined;
        let mediaType = scene.mediaType;

        if (isManualMode && i < customUploads.length) {
          setStatus({ step: 'fetching_media', message: `Assigning custom media to Scene ${i + 1}...` });
          mediaUrl = customUploads[i].previewUrl;
          mediaType = customUploads[i].type;
        } else {
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
          const width = config.orientation === VideoOrientation.Landscape ? 1280 : 720;
          const height = config.orientation === VideoOrientation.Landscape ? 720 : 1280;
          mediaUrl = `https://placehold.co/${width}x${height}/000000/FFF?text=Scene+${i + 1}`;
          mediaType = 'image';
        } else usedMediaUrlsRef.current.add(mediaUrl);
        scenesWithMedia.push({ ...scene, mediaUrl, mediaType });
      }

      setStatus({ step: 'generating_audio', message: `Narrating with Gemini...` });
      const finalScenes = await Promise.all(
        scenesWithMedia.map(async (scene) => {
          try {
            const audioData = await generateNarration(scene.narration, config.voiceName);
            return { ...scene, audioData };
          } catch {
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
      console.error(error);
      setStatus({ step: 'error', message: 'Error generating video.' });
    }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;
    const newScenes = [...scenes];
    newScenes[sceneIndex] = { ...newScenes[sceneIndex], isRegenerating: true };
    setScenes(newScenes);
    const scene = scenes[sceneIndex];
    let result = await getStockMediaForScene(scene.visualSearchTerm, scene.mediaType, usedMediaUrlsRef.current);
    if (result.url) {
      usedMediaUrlsRef.current.add(result.url);
      newScenes[sceneIndex] = { ...scene, mediaUrl: result.url, isRegenerating: false };
    } else {
      newScenes[sceneIndex] = { ...scene, isRegenerating: false };
    }
    setScenes(newScenes);
  };

  const handleSingleFileUpload = (sceneId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video') || !!file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i);
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, mediaUrl: objectUrl, mediaType: isVideo ? 'video' : 'image', id: s.id + '-up' } : s));
  };

  const isGenerating = status.step !== 'idle' && status.step !== 'ready' && status.step !== 'error';

  return (
    <div className="flex-1 max-w-[1800px] mx-auto p-4 lg:p-6 w-full h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
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
        {/* COLUMN 1: Story Script */}
        <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
          <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 flex flex-col shadow-lg h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">1. Story Script</h2>
              <span className="text-xs text-zinc-500 font-mono">{script.length} chars</span>
            </div>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="flex-1 w-full bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 text-zinc-300 text-sm focus:ring-1 focus:ring-cyan-500 outline-none resize-none transition-all placeholder:text-zinc-600 leading-relaxed custom-scrollbar"
              placeholder="Paste your script here..."
            />
          </div>
        </div>

        {/* COLUMN 2: Config & Media */}
        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
          {/* 1. TOGGLE (Top of Col 2) */}
          <div className="bg-[#11141b] border border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-lg">
            <span className="text-sm font-bold text-zinc-100">Manual Media Mode</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isManualMode} onChange={(e) => setIsManualMode(e.target.checked)} />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* 2. GENERATE BUTTON */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !script.trim()}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {status.message || 'Processing...'}</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Generate Video</>
            )}
          </button>

          {/* 3. CONDITIONAL CONTENT */}
          {isManualMode ? (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Visual Media Library */}
              <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 shadow-lg flex-1 min-h-[200px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold text-sm">Your Visual Media</h2>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Files</span>
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleAddVisualUpload} />
                  </label>
                </div>
                <div className="flex-1 bg-[#0b0e14] border border-zinc-800 rounded-xl p-3 overflow-y-auto custom-scrollbar max-h-[300px]">
                  {customUploads.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center p-4 border border-dashed border-zinc-800 rounded-lg min-h-[100px]">
                      <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-xs">Drag & drop images or videos.</p>
                      <p className="text-[10px] mt-1 opacity-50">Used sequentially.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customUploads.map((upload, idx) => (
                        <div key={upload.id} className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
                          <div className="w-10 h-10 shrink-0 bg-black rounded overflow-hidden relative">
                            {upload.type === 'video' ? <video src={upload.previewUrl} className="w-full h-full object-cover" /> : <img src={upload.previewUrl} className="w-full h-full object-cover" alt="" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-300 truncate">{upload.file.name}</p>
                            <p className="text-[10px] text-zinc-500">Scene {idx + 1}</p>
                          </div>
                          <button onClick={() => removeVisualUpload(upload.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Background Music Section */}
              <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-white font-semibold text-sm">Background Music</h2>
                  </div>
                  {musicFile && (
                    <button onClick={() => { setMusicFile(null); setBackgroundMusicUrl(null); }} className="text-xs text-red-400 hover:text-red-300 hover:underline">Remove</button>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <label className={`flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${musicFile ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-[#0b0e14]'}`}>
                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                      {musicFile ? (
                        <p className="text-xs text-indigo-200 truncate max-w-[200px]">{musicFile.name}</p>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-zinc-500 mb-1" />
                          <p className="text-[10px] text-zinc-400">Click to upload MP3</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept="audio/mp3,audio/mpeg" className="hidden" onChange={handleMusicUpload} />
                  </label>
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-zinc-500" />
                    <input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-2 mb-4 text-zinc-100 font-semibold">
                <Focus className="w-4 h-4 text-indigo-400" />
                <h2>Visual Settings</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Main Visual Subject</label>
                  <input type="text" value={config.visualSubject || ''} onChange={(e) => handleUpdateConfigField('visualSubject', e.target.value)} placeholder="e.g. Cyberpunk City" className="w-full bg-[#0b0e14] border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-200 focus:ring-1 focus:ring-cyan-500 outline-none placeholder:text-zinc-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Negative Prompts</label>
                  <div className="relative">
                    <Ban className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input type="text" value={config.negativePrompt || ''} onChange={(e) => handleUpdateConfigField('negativePrompt', e.target.value)} placeholder="e.g. text, blurry" className="w-full bg-[#0b0e14] border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:ring-1 focus:ring-cyan-500 outline-none placeholder:text-zinc-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Global Settings (Always Visible) */}
          <SettingsPanel config={config} onConfigChange={updateConfig} />
        </div>

        {/* COLUMN 3: Preview */}
        <div className="lg:col-span-6 flex flex-col gap-6 h-full overflow-hidden">
          <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-6 h-full flex flex-col shadow-lg overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-white font-semibold text-lg">3. Preview</h2>
            </div>
            <div className="h-[400px] 2xl:h-[480px] shrink-0 bg-[#0b0e14] rounded-xl border border-zinc-800 overflow-hidden relative flex flex-col items-center justify-center mb-6">
              <VideoPlayer scenes={scenes} orientation={config.orientation} backgroundMusicUrl={backgroundMusicUrl} musicVolume={musicVolume} />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
              <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#11141b] z-10 pb-2">
                <h3 className="text-sm font-medium text-zinc-400">Storyboard Scenes</h3>
                <span className="text-xs text-zinc-600">{scenes.length} Scenes</span>
              </div>
              {scenes.length === 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 opacity-30">
                  {[1, 2, 3].map(i => <div key={i} className="aspect-video bg-[#0b0e14] rounded-lg border border-zinc-800 flex items-center justify-center text-zinc-600 text-xs">Scene {i}</div>)}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4 pb-2">
                  {scenes.map((scene, idx) => (
                    <div key={scene.id} className="relative group">
                      <div className={`w-full ${config.orientation === VideoOrientation.Landscape ? 'aspect-video' : 'aspect-[9/16]'} bg-[#0b0e14] rounded-lg overflow-hidden border border-zinc-800 relative`}>
                        {scene.mediaType === 'video' ? <video src={scene.mediaUrl} className="w-full h-full object-cover" muted /> : <img src={scene.mediaUrl} className="w-full h-full object-cover" alt="" />}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                          <button onClick={() => handleRegenerateScene(scene.id)} className="p-1.5 bg-black/60 rounded-full text-white hover:bg-cyan-500 transition-colors border border-white/10"><RefreshCw className={`w-3.5 h-3.5 ${scene.isRegenerating ? 'animate-spin' : ''}`} /></button>
                          <label className="p-1.5 bg-black/60 rounded-full text-white hover:bg-cyan-500 transition-colors cursor-pointer border border-white/10">
                            <Upload className="w-3.5 h-3.5" />
                            <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleSingleFileUpload(scene.id, e)} />
                          </label>
                        </div>
                      </div>
                      <p className="mt-1.5 text-[10px] text-zinc-500 truncate">Scene {idx + 1}: {scene.narration.substring(0, 25)}...</p>
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
