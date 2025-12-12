import React, { useState, useEffect, useRef } from 'react';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from '../types';
import VideoPlayer from './VideoPlayer';
import { analyzeScript, generateNarration } from '../services/gemini';
import { fetchPixabayMedia, fetchPixabayAudio } from '../services/pixabay';
import { fetchPexelsMedia } from '../services/pexels';
import { fetchUnsplashMedia } from '../services/unsplash';
import { Loader2, RefreshCw, Upload, ArrowLeft } from 'lucide-react';
import SettingsPanel from './SettingsPanel';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_SCRIPT = "In the heart of an ancient forest, sunlight filters through the dense canopy. A gentle stream winds its way over mossy rocks, singing a quiet song. Suddenly, a majestic deer steps into the clearing, ears twitching at the sound of the wind. Nature pauses, holding its breath in a moment of perfect tranquility.";
const DEFAULT_PIXABAY_KEY = "21014376-3347c14254556d44ac7acb25e";
const DEFAULT_PEXELS_KEY = "2BboNbFvEGwKENV4lhRTyQwu3txrXFsistvTjNlrqYYtwXjACy9PmwkoM";
const DEFAULT_UNSPLASH_KEY = "inICXEimMWagCfHA86bD4k9MprjkgEFmG0bW9UREKo";

interface GeneratorProps {
  onBack: () => void;
}

/* ----------  SILENT-VIDEO HELPER  ---------- */
async function muteVideo(file: File): Promise<Blob> {
  return new Promise((res, rej) => {
    const vid = document.createElement('video');
    vid.muted = true;
    vid.src = URL.createObjectURL(file);
    vid.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = vid.videoWidth;
      canvas.height = vid.videoHeight;
      const stream = canvas.captureStream(); // <- no width/height args
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => res(new Blob(chunks, { type: 'video/webm' }));
      vid.play();
      rec.start();
      vid.onended = () => rec.stop();
    };
    vid.onerror = rej;
  });
}
const Generator: React.FC<GeneratorProps> = ({ onBack }) => {
  const [searchParams] = useSearchParams();
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [config, setConfig] = useState<AppConfig & { includeMusic: boolean }>({
    pixabayApiKey: DEFAULT_PIXABAY_KEY,
    pexelsApiKey: DEFAULT_PEXELS_KEY,
    unsplashApiKey: DEFAULT_UNSPLASH_KEY,
    orientation: VideoOrientation.Portrait,
    visualSubject: '',
    voiceName: 'Kore',
    negativePrompt: '',
    includeMusic: true,
    manualMode: false
  });
  const [status, setStatus] = useState<GenerationStatus>({ step: 'idle' });
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [backgroundMusicUrl, setBackgroundMusicUrl] = useState<string | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [generationsToday, setGenerationsToday] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const usedMediaUrlsRef = useRef<Set<string>>(new Set());

  /* 24 h reset */
  useEffect(() => {
    const license = localStorage.getItem('license_key');
    setIsPro(!!license);
    const usageRaw = localStorage.getItem('app_usage');
    const now = new Date();
    const nowTimestamp = now.getTime();
    if (usageRaw) {
      const usage = JSON.parse(usageRaw);
      const lastResetTimestamp = usage.lastResetTimestamp || 0;
      const hoursSinceReset = (nowTimestamp - lastResetTimestamp) / (1000 * 60 * 60);
      if (hoursSinceReset >= 24) {
        setGenerationsToday(0);
        localStorage.setItem('app_usage', JSON.stringify({ lastResetTimestamp: nowTimestamp, count: 0 }));
      } else {
        setGenerationsToday(usage.count || 0);
      }
    } else {
      setGenerationsToday(0);
      localStorage.setItem('app_usage', JSON.stringify({ lastResetTimestamp: nowTimestamp, count: 0 }));
    }
  }, []);

  /* chrome ext deep-link */
  useEffect(() => {
    const prefill = searchParams.get('script');
    if (prefill) {
      const decoded = decodeURIComponent(prefill).replace(/\+/g, ' ');
      setScript(decoded);
    }
  }, [searchParams]);

  const updateConfig = (newConfig: AppConfig) => setConfig(prev => ({ ...prev, ...newConfig }));

  const getStockMediaForScene = async (query: string, mediaType: 'image' | 'video', usedUrls: Set<string>): Promise<{ url: string | null; source: string }> => {
    if (config.manualMode) return { url: null, source: 'none' };
    const providers: Array<'pixabay' | 'pexels' | 'unsplash'> = [];
    if (config.pixabayApiKey) providers.push('pixabay');
    if (config.pexelsApiKey) providers.push('pexels');
    if (config.unsplashApiKey) providers.push('unsplash');
    const shuffled = providers.sort(() => 0.5 - Math.random());
    for (const provider of shuffled) {
      let url: string | null = null;
      if (provider === 'pixabay') url = await fetchPixabayMedia(query, mediaType, config.pixabayApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      if (provider === 'pexels') url = await fetchPexelsMedia(query, mediaType, config.pexelsApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      if (provider === 'unsplash') url = await fetchUnsplashMedia(query, mediaType, config.unsplashApiKey, config.orientation, usedUrls, config.visualSubject, config.negativePrompt);
      if (url) return { url, source: provider };
    }
    return { url: null, source: 'none' };
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newScenes: Scene[] = files.map((file, idx) => ({
      id: `upload-${Date.now()}-${idx}`,
      narration: `Scene ${idx + 1}`,
      visualSearchTerm: '',
      mediaType: file.type.startsWith('video') ? 'video' : 'image',
      mediaUrl: URL.createObjectURL(file),
    }));
    setScenes(prev => [...prev, ...newScenes]);
  };

  const handleFileUpload = async (sceneId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const mutedBlob = await muteVideo(file);
    const objectUrl = URL.createObjectURL(mutedBlob);
    const type = file.type.startsWith('video') ? 'video' : 'image';
    setScenes(prev => prev.map(s => (s.id === sceneId ? { ...s, mediaUrl: objectUrl, mediaType: type, isRegenerating: false } : s)));
  };

  /* ----------  SPLIT ON  ---  ---------- */
  const handleGenerate = async () => {
    if (!isPro && generationsToday >= 5) {
      alert("Daily limit reached (5/5). Please upgrade to Lifetime for unlimited videos!");
      return;
    }
    try {
      setScenes([]);
      setBackgroundMusicUrl(null);
      usedMediaUrlsRef.current = new Set();
      setStatus({ step: 'analyzing', message: 'Analyzing script...' });

      const segments = script.split('---').map(s => s.trim()).filter(Boolean);
      const rawScenes: Scene[] = [];
      for (const seg of segments) {
        const { scenes } = await analyzeScript(seg, config.visualSubject);
        rawScenes.push({ ...scenes[0], id: `scene-${Date.now()}-${Math.random().toString(36).slice(2)}` });
      }

      if (config.includeMusic) {
        if (musicFile) {
          setBackgroundMusicUrl(URL.createObjectURL(musicFile));
        } else {
          setStatus({ step: 'fetching_media', message: 'Searching for background music...' });
          const musicUrl = await fetchPixabayAudio(config.pixabayApiKey, config.visualSubject || 'cinematic ambient');
          setBackgroundMusicUrl(musicUrl || (await fetchPixabayAudio(config.pixabayApiKey, 'background music')));
        }
      }

      setStatus({ step: 'fetching_media', message: 'Building scenes...' });
      const scenesWithMedia: Scene[] = [];

      if (config.manualMode) {
        for (let i = 0; i < rawScenes.length; i++) {
          const scene = rawScenes[i];
          let mediaUrl = scene.mediaUrl;
          let mediaType = scene.mediaType || 'image';
          if (!mediaUrl) {
            const width = config.orientation === VideoOrientation.Landscape ? 1280 : 720;
            const height = config.orientation === VideoOrientation.Landscape ? 720 : 1280;
            mediaUrl = `https://placeholder.co/${width}x${height}/000/fff?text=Scene+${i + 1}`;
            mediaType = 'image';
          }
          scenesWithMedia.push({ ...scene, mediaUrl, mediaType });
        }
      } else {
        for (let i = 0; i < rawScenes.length; i++) {
          const scene = rawScenes[i];
          let mediaUrl: string | undefined;
          let mediaType = scene.mediaType;
          setStatus({ step: 'fetching_media', message: `Searching media for scene ${i + 1}/${rawScenes.length}...` });
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
          if (!mediaUrl && i > 0 && scenesWithMedia[i - 1].mediaUrl) {
            mediaUrl = scenesWithMedia[i - 1].mediaUrl;
            mediaType = scenesWithMedia[i - 1].mediaType;
          }
          if (!mediaUrl) {
            const width = config.orientation === VideoOrientation.Landscape ? 1280 : 720;
            const height = config.orientation === VideoOrientation.Landscape ? 720 : 1280;
            mediaUrl = `https://placeholder.co/${width}x${height}/000/fff?text=Scene+${i + 1}`;
            mediaType = 'image';
          } else {
            if (mediaUrl) usedMediaUrlsRef.current.add(mediaUrl);
          }
          scenesWithMedia.push({ ...scene, mediaUrl, mediaType });
        }
      }

      setStatus({ step: 'generating_audio', message: `Narrating scenes...` });
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
      const now = new Date();
      localStorage.setItem('app_usage', JSON.stringify({ lastResetTimestamp: now.getTime(), count: newCount }));
    } catch (error: any) {
      console.error("Generation Error:", error);
      let errorMessage = 'Something went wrong. Please check your API keys or try again.';
      if (typeof error === 'object' && error !== null) {
        const errString = JSON.stringify(error) + (error.message || '');
        if (errString.includes('429') || errString.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = 'System Busy: Please wait a minute and try again.';
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
      newScenes[sceneIndex] = { ...scene, mediaUrl: mediaUrl, mediaType: mediaType, isRegenerating: false };
    } else {
      newScenes[sceneIndex] = { ...scene, isRegenerating: false };
      alert("No more unique media found.");
    }
    setScenes(newScenes);
  };

  const isGenerating = status.step !== 'idle' && status.step !== 'ready' && status.step !== 'error';

  return (
    <div className="h-[calc(100vh-80px)] flex-1 w-full flex flex-col p-4 lg:p-6 overflow-hidden">
      <div className="mb-4 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Back to Home</button>
        {!isPro && (
          <div className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">Daily Limit: <span className={generationsToday >= 5 ? 'text-red-500' : 'text-cyan-500'}>{generationsToday}</span>/5</div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
        {/* Story Column */}
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
            <div className="flex items-center justify-end mb-2"><span className="text-xs text-zinc-500 font-mono">{script.length}/1000 chars</span></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#11141b]/95 backdrop-blur-md border-t border-zinc-800 z-10">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !script.trim()}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg py-3 rounded-xl transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Video'}
              </button>
            </div>
          </div>
        </div>

        {/* Config Column */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col h-full bg-[#11141b] border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">2</div>
            <h2 className="text-white font-semibold text-sm">Configuration</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
            <SettingsPanel config={config} onConfigChange={updateConfig} />
            {/* Bulk upload when manual */}
            {config.manualMode && (
              <div className="mt-4 flex justify-center">
                <label>
                  <input type="file" multiple accept="video/*,image/*" className="hidden" onChange={handleBulkUpload} />
                  <div className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer flex items-center gap-2">
                    <Upload className="w-5 h-5" /> Upload clips (1 file = 1 scene)
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Preview Column */}
        <div className="flex-1 min-w-0 flex flex-col h-full bg-[#11141b] border border-zinc-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">3</div>
              <h2 className="text-white font-semibold text-sm">Preview & Export</h2>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="h-[400px] shrink-0 bg-[#0b0e14] border-b border-zinc-800 overflow-hidden relative flex items-center justify-center">
              <VideoPlayer scenes={scenes} orientation={config.orientation} backgroundMusicUrl={backgroundMusicUrl} musicVolume={musicVolume} />
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-4 bg-[#0b0e14]/50">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                {scenes.map((scene, idx) => (
                  <div key={scene.id} className="relative group">
                    <div className={"w-full aspect-video bg-[#0b0e14] rounded-lg overflow-hidden border border-zinc-800 relative " + (scene.isRegenerating ? "opacity-50" : "")}>
                      {scene.mediaType === 'video' ? (
                        <video src={scene.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={scene.mediaUrl} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button onClick={() => handleRegenerateScene(scene.id)} className="p-1.5 bg-black/60 rounded-full text-white"><RefreshCw className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-500 truncate">Scene {idx + 1}</p>
                    {/* per-scene upload when manual */}
                    {config.manualMode && (
                      <label className="mt-2 cursor-pointer">
                        <input type="file" accept="video/*,image/*" className="hidden" onChange={(e) => handleFileUpload(scene.id, e)} />
                        <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 border border-zinc-700">
                          <Upload className="w-4 h-4" /> Upload clip
                        </div>
                      </label>
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
