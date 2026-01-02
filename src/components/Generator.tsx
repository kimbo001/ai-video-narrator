import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSafeUser } from '../lib/useSafeUser';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from '../types';
import VideoPlayer from './VideoPlayer';
import { analyzeScript, generateNarration } from '../services/gemini';
import { fetchPixabayMedia, fetchPixabayAudio } from '../services/pixabay';
import { fetchPexelsMedia } from '../services/pexels';
import { fetchUnsplashMedia } from '../services/unsplash';
import { Loader2, Wand2, RefreshCw, Upload, ArrowLeft, Trash2, FileVideo, ImageIcon, Plus, Music, Volume2, Focus, Ban } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import { SignIn } from '@clerk/clerk-react';

const DEFAULT_SCRIPT = "In the heart of an ancient forest, sunlight filters through the dense canopy. A gentle stream winds its way over mossy rocks, singing a quiet song. Suddenly, a majestic deer steps into the clearing, ears twitching at the sound of the wind. Nature pauses, holding its breath in a moment of perfect tranquility.";
const DEFAULT_PIXABAY_KEY = import.meta.env.VITE_PIXABAY_KEY || "21014376-3347c14254556d44ac7acb25e";
const DEFAULT_PEXELS_KEY = import.meta.env.VITE_PEXELS_KEY || "2BbnKbFvEGwKENV4lhRTrQwu3txrXFsisvTjNlrqYYytWjACy9PmwkoM";
const DEFAULT_UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_KEY || "inICXEimMWagCfHA86bD4k9MprjkgEFmG0bW9UREkOo";

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
  // --- 1. HOOKS ---
  const location = useLocation();
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
  const [maxLimit, setMaxLimit] = useState(3);
  const [userPlan, setUserPlan] = useState('FREE');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const usedMediaUrlsRef = useRef<Set<string>>(new Set());
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const { user } = useSafeUser();
  const userId = user?.id ?? '';

  // --- 2. EFFECTS ---
  useEffect(() => {
    const syncUser = async () => {
      if (user && user.id && user.primaryEmailAddress) {
        await fetch('/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.primaryEmailAddress.emailAddress }),
        });
        fetchUsage();
      }
    };
    syncUser();
  }, [user]);

  useEffect(() => {
    if (location.state?.initialText) setScript(location.state.initialText);
  }, [location.state]);

  useEffect(() => {
    if (user) user.reload().then(() => fetchUsage());
  }, [user]);

  // --- 3. LOGIC HELPERS ---
  const fetchUsage = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/limits?userId=${userId}&t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (res.ok) {
        const data = await res.json();
        setGenerationsToday(data.used);
        setMaxLimit(data.limit);
        setUserPlan(data.plan); 
      }
    } catch (err) { console.warn("Usage check failed."); }
  };

  const checkLimits = async () => {
    if (!userId) return true;
    try {
      const res = await fetch(`/api/limits?userId=${userId}&t=${Date.now()}`);
      if (!res.ok) return true;
      const data = await res.json();
      if (data.allowed === false) {
        alert(`Daily limit reached for your ${data.plan} plan.`);
        return false;
      }
      return true;
    } catch (e) { return true; }
  };

  const logVideoToDb = async () => {
    if (!userId) return;
    try {
      await fetch('/api/videos/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
      await fetch('/api/stats/bump', { method: 'POST' });
      await fetchUsage(); 
    } catch (err) { console.warn("Logging failed."); }
  };

  const updateConfig = (newConfig: AppConfig) => setConfig(prev => ({ ...prev, ...newConfig }));
  const handleUpdateConfigField = (field: keyof AppConfig, value: string) => setConfig(prev => ({ ...prev, [field]: value }));
  const removeVisualUpload = (id: string) => setCustomUploads(prev => prev.filter(u => u.id !== id));

  const getStockMediaForScene = async (query: string, mediaType: 'image' | 'video', usedUrls: Set<string>) => {
    const providers: Array<'pixabay' | 'pexels' | 'unsplash'> = ['pixabay', 'pexels', 'unsplash'];
    const shuffled = providers.sort(() => 0.5 - Math.random());
    for (const provider of shuffled) {
      let url: string | null = null;
      if (provider === 'pixabay') url = await fetchPixabayMedia(query, mediaType, config.pixabayApiKey, config.orientation, usedUrls);
      else if (provider === 'pexels') url = await fetchPexelsMedia(query, mediaType, config.pexelsApiKey, config.orientation, usedUrls);
      else if (provider === 'unsplash') url = await fetchUnsplashMedia(query, mediaType, config.unsplashApiKey, config.orientation, usedUrls);
      if (url) return { url, source: provider };
    }
    return { url: null, source: 'none' };
  };

  // --- 4. SEQUENTIAL GENERATION LOGIC ---
  const handleGenerate = async () => {
    try {
      const allowed = await checkLimits();
      if (!allowed) return;
      setScenes([]);
      usedMediaUrlsRef.current = new Set();
      setStatus({ step: 'analyzing', message: 'Breaking script into scenes...' });

      const parts = script.split(/---/).map(s => s.trim()).filter(Boolean);
      let rawScenesData: any[] = [];
      for (const p of parts) {
        if (p.length > 150) {
          const analyzed = await analyzeScript(p, config.visualSubject);
          if (analyzed && analyzed.scenes) rawScenesData.push(...analyzed.scenes);
          else rawScenesData.push({ narration: p, visualSearchTerm: config.visualSubject || p.substring(0, 30) });
        } else {
          rawScenesData.push({ narration: p, visualSearchTerm: config.visualSubject || p.substring(0, 30) });
        }
      }

      if (rawScenesData.length === 0) throw new Error("AI failed to create scenes.");

      // START SEQUENTIAL WORKFLOW
      for (let i = 0; i < rawScenesData.length; i++) {
        const sceneData = rawScenesData[i];
        const sceneId = `sc-${i}-${Math.random().toString(36).substring(7)}`;

        setStatus({ step: 'fetching_media', message: `Visuals: Scene ${i + 1} of ${rawScenesData.length}...` });
        const result = await getStockMediaForScene(sceneData.visualSearchTerm, 'video', usedMediaUrlsRef.current);
        const mediaUrl = result.url || `https://placehold.co/720x1280/0b0e14/FFF?text=Scene+${i + 1}`;
        if (result.url) usedMediaUrlsRef.current.add(result.url);

        setStatus({ step: 'generating_audio', message: `Voice: Scene ${i + 1} of ${rawScenesData.length}...` });
        let audioData: string | undefined = undefined;
        let attempts = 0;
        while (!audioData && attempts < 10) {
          try {
            audioData = await generateNarration(sceneData.narration, config.voiceName, i);
          } catch {
            attempts++;
            await new Promise(r => setTimeout(r, 3000));
          }
        }

        const finishedScene: Scene = {
          id: sceneId,
          narration: sceneData.narration,
          visualSearchTerm: sceneData.visualSearchTerm,
          mediaUrl,
          mediaType: result.url ? 'video' : 'image',
          audioData
        };
        
        setScenes(prev => [...prev, finishedScene]);

        // FUNNY 15s COOLDOWN
        if (i < rawScenesData.length - 1) {
          const funLines = [
            "AI is clearing its throat...",
            "Teaching the narrator how to emphasize...",
            "Consulting the digital gods for the perfect tone...",
            "AI is doing some deep thinking... please hold.",
            "Polishing the narration for your masterpiece...",
            "Whispering the next part to the server..."
          ];
          setStatus({ step: 'generating_audio', message: funLines[i % funLines.length] });
          await new Promise(r => setTimeout(r, 15000));
        }
      }

      await logVideoToDb();
      setStatus({ step: 'ready' });
    } catch (error: any) { setStatus({ step: 'error', message: error.message }); }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    const sceneIndex = scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;
    const updated = [...scenes];
    updated[sceneIndex].isRegenerating = true;
    setScenes(updated);
    let audioData: string | undefined = undefined;
    let attempts = 0;
    while (!audioData && attempts < 10) {
      try { audioData = await generateNarration(scenes[sceneIndex].narration, config.voiceName, sceneIndex); }
      catch { attempts++; await new Promise(r => setTimeout(r, 2000)); }
    }
    updated[sceneIndex].audioData = audioData;
    updated[sceneIndex].isRegenerating = false;
    setScenes([...updated]);
  };

  const handleSingleFileUpload = (sceneId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, mediaUrl: URL.createObjectURL(file), mediaType: file.type.startsWith('video') ? 'video' : 'image' } : s));
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setMusicFile(file); setBackgroundMusicUrl(URL.createObjectURL(file)); }
  };

  if (!user) return <div className="flex-1 flex items-center justify-center bg-[#0b0e14]"><SignIn routing="hash" /></div>;

  const isGenerating = status.step !== 'idle' && status.step !== 'ready' && status.step !== 'error';

  // --- 5. RENDER UI (Your exact style restored) ---
  return (
    <div className="flex-1 max-w-[1800px] mx-auto p-4 lg:p-6 w-full h-full flex flex-col font-sans">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Back to Home</button>
        <div className="flex gap-2 font-sans">
            <div className="text-[10px] font-bold text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800 uppercase tracking-widest">PLAN: <span className="text-cyan-400 font-sans">{userPlan}</span></div>
            <div className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 font-bold tracking-tight">Daily Limit: <span className={generationsToday >= maxLimit ? 'text-red-500' : 'text-cyan-500'}>{generationsToday}</span>/{maxLimit >= 1000 ? '∞' : maxLimit}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full flex-1 min-h-0 text-zinc-300 font-sans">
        <div className="lg:col-span-3 flex flex-col h-full overflow-hidden font-sans">
          <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 flex flex-col shadow-lg h-full font-sans">
            <div className="flex items-center justify-between mb-4 font-sans">
              <h2 className="text-white font-semibold text-lg italic font-sans">1. Story Script</h2>
              <span className="text-xs text-zinc-500 font-mono font-sans">{script.length} chars</span>
            </div>
            <textarea value={script} onChange={(e) => setScript(e.target.value)} className="flex-1 w-full bg-[#0b0e14] border border-zinc-800 rounded-xl p-4 text-zinc-300 text-sm focus:ring-1 focus:ring-cyan-500 outline-none resize-none custom-scrollbar leading-relaxed font-sans" placeholder="Paste your script here... Use --- for manual splits." />
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1 font-sans">
          <button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-3 font-sans">
            {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> {status.message}</> : <><Wand2 className="w-5 h-5" /> Generate Video</>}
          </button>

          <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col gap-4 font-sans animate-in fade-in duration-300">
             <div className="flex items-center justify-between font-sans">
                <h2 className="text-white font-semibold text-sm italic">Background Music</h2>
                {musicFile && <button onClick={() => { setMusicFile(null); setBackgroundMusicUrl(null); }} className="text-xs text-red-400 font-mono italic underline">Remove</button>}
             </div>
             <label className={`flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${musicFile ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-500 bg-[#0b0e14]'}`}><div className="flex flex-col items-center justify-center pt-2 pb-2">{musicFile ? <p className="text-xs text-indigo-200 truncate max-w-[200px] font-sans">{musicFile.name}</p> : <><Upload className="w-4 h-4 text-zinc-500 mb-1" /><p className="text-[10px] text-zinc-400 uppercase tracking-tighter">Upload MP3</p></>}</div><input type="file" accept="audio/mp3,audio/mpeg" className="hidden" onChange={handleMusicUpload} /></label>
             <div className="flex items-center gap-3"><Volume2 className="w-4 h-4 text-zinc-500" /><input type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={(e) => setMusicVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" /></div>
          </div>

          <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 shadow-lg animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-4 text-zinc-100 font-semibold italic font-sans"><Focus className="w-4 h-4 text-indigo-400" /><h2>Visual Settings</h2></div>
              <div className="space-y-5 font-sans">
                <div><label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-widest font-mono font-sans">Main Visual Subject</label><input type="text" value={config.visualSubject || ''} onChange={(e) => handleUpdateConfigField('visualSubject', e.target.value)} placeholder="e.g. Cyberpunk City" className="w-full bg-[#0b0e14] border border-zinc-800 rounded-lg py-2.5 px-4 text-sm text-zinc-200 focus:ring-1 focus:ring-cyan-500 outline-none placeholder:text-zinc-600 font-sans font-sans" /></div>
                <div><label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-widest font-mono font-sans">Negative Prompts</label><div className="relative font-sans"><Ban className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" /><input type="text" value={config.negativePrompt || ''} onChange={(e) => handleUpdateConfigField('negativePrompt', e.target.value)} placeholder="e.g. text, blurry" className="w-full bg-[#0b0e14] border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:ring-1 focus:ring-cyan-500 outline-none placeholder:text-zinc-600 font-sans" /></div></div>
              </div>
          </div>
          <SettingsPanel config={config} onConfigChange={updateConfig} />
        </div>

        <div className="lg:col-span-6 flex flex-col gap-6 h-full overflow-hidden font-sans text-zinc-300">
          <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-6 h-full flex flex-col shadow-lg overflow-hidden font-sans">
            <div className="flex items-center justify-between mb-4 shrink-0 font-sans"><h2 className="text-white font-semibold text-lg italic font-sans">3. Preview</h2></div>
            <div className="h-[320px] 2xl:h-[400px] shrink-0 bg-[#0b0e14] rounded-xl border border-zinc-800 overflow-hidden relative flex flex-col items-center justify-center mb-6 font-sans"><VideoPlayer scenes={scenes} orientation={config.orientation} backgroundMusicUrl={backgroundMusicUrl} musicVolume={musicVolume} /></div>
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar font-sans border-t border-zinc-800 pt-4 font-sans">
              <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#11141b] z-10 pb-2 font-sans font-sans">
                <h3 className="text-sm font-medium text-zinc-400 italic">Storyboard Scenes</h3>
                <span className="text-xs text-zinc-600 font-mono font-sans">{scenes.length} Scenes</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-2 font-sans font-sans">
                  {scenes.map((scene, idx) => (
                    <div key={scene.id} className="relative group font-sans">
                      <div className={`w-full ${config.orientation === VideoOrientation.Landscape ? 'aspect-video' : 'aspect-[9/16]'} bg-[#0b0e14] rounded-lg overflow-hidden border border-zinc-800 relative font-sans font-sans`}>
                        {scene.mediaType === 'video' ? <video src={scene.mediaUrl} className="w-full h-full object-cover" muted /> : <img src={scene.mediaUrl} className="w-full h-full object-cover" alt="" />}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-20 font-sans">
                          <button onClick={() => handleRegenerateScene(scene.id)} className="p-1.5 bg-black/60 rounded-full text-white hover:bg-cyan-500 transition-colors border border-white/10 shadow-lg font-sans"><RefreshCw className={`w-3.5 h-3.5 ${scene.isRegenerating ? 'animate-spin' : ''}`} /></button>
                          <label className="p-1.5 bg-black/60 rounded-full text-white hover:bg-cyan-500 transition-colors cursor-pointer border border-white/10 shadow-lg font-sans font-sans font-sans font-sans"><Upload className="w-3.5 h-3.5" /><input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleSingleFileUpload(scene.id, e)} /></label>
                        </div>
                      </div>
                      <p className="mt-1.5 text-[10px] text-zinc-500 truncate font-mono tracking-tighter font-sans">#{idx + 1}: {scene.narration.substring(0, 25)}...</p>
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
