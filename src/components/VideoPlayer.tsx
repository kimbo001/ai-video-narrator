import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Scene, VideoOrientation } from '../types';
import { Play, Pause, SkipBack, SkipForward, Loader2, Download, AlertCircle, Captions, CaptionsOff, RefreshCw } from 'lucide-react';
import { pcm16ToWav } from '../utils/audio';

interface VideoPlayerProps {
  scenes: Scene[];
  orientation: VideoOrientation;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ scenes, orientation }) => {
  // --- STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);

  // --- REFS ---
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  // Narration Source
  const narrationSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const requestRef = useRef<number>();
  
  // Mutable state refs for the Loop
  const stateRef = useRef({
    currentSceneIndex: 0,
    sceneStartTimestamp: 0,
    isPlaying: false,
    isExporting: false,
    scenesLength: 0,
    orientation: orientation,
    showCaptions: true
  });

  // Keep stateRef synced
  useEffect(() => {
    stateRef.current.currentSceneIndex = currentSceneIndex;
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.isExporting = isExporting;
    stateRef.current.scenesLength = scenes.length;
    stateRef.current.orientation = orientation;
    stateRef.current.showCaptions = showCaptions;
  }, [currentSceneIndex, isPlaying, isExporting, scenes.length, orientation, showCaptions]);

  // Assets
  const assetsRef = useRef<{
    images: Record<string, HTMLImageElement>;
    videos: Record<string, HTMLVideoElement>;
    audioBuffers: Record<string, AudioBuffer>;
  }>({ images: {}, videos: {}, audioBuffers: {} });

  const isLandscape = orientation === VideoOrientation.Landscape;
  const width = isLandscape ? 1280 : 720;
  const height = isLandscape ? 720 : 1280;

  // --- INITIALIZATION & LOADING ---
  useEffect(() => {
    // Cleanup
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (narrationSourceRef.current) { try { narrationSourceRef.current.stop(); } catch(e){} }
    
    // Clear video container
    if (videoContainerRef.current) {
        videoContainerRef.current.innerHTML = '';
    }

    // Reset state
    setIsPlaying(false);
    if (currentSceneIndex >= scenes.length) {
        setCurrentSceneIndex(0);
        stateRef.current.sceneStartTimestamp = 0;
    } else {
        stateRef.current.isPlaying = false;
        stateRef.current.sceneStartTimestamp = 0; 
    }

    if (scenes.length === 0) {
      setIsReady(false);
      return;
    }

    const init = async () => {
      setIsReady(false);
      setLoadingProgress(0);
      setError(null);
      
      if (audioContextRef.current) {
        try { await audioContextRef.current.close(); } catch(e) {}
        audioContextRef.current = null;
      }

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        
        // --- LOAD SCENE ASSETS ---
        const images: Record<string, HTMLImageElement> = {};
        const videos: Record<string, HTMLVideoElement> = {};
        const audioBuffers: Record<string, AudioBuffer> = {};

        let loadedCount = 0;
        const total = scenes.length * 2; 

        for (const scene of scenes) {
          // 1. Load Audio
          if (scene.audioData) {
            try {
              // Gemini: Raw PCM 16-bit to WAV
              const wavBlob = pcm16ToWav(scene.audioData);
              const arrayBuffer = await wavBlob.arrayBuffer();

              if (audioContextRef.current) {
                const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
                audioBuffers[scene.id] = audioBuffer;
                scene.duration = audioBuffer.duration;
              }
            } catch (e) {
              console.warn(`Audio decode failed for scene ${scene.id}`, e);
              scene.duration = Math.max(3, scene.narration.length / 15);
            }
          } else {
             scene.duration = Math.max(3, scene.narration.length / 15);
          }
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / total) * 100));

          // 2. Load Visual
          if (scene.mediaUrl) {
            if (scene.mediaType === 'video') {
                const vid = document.createElement('video');
                vid.src = scene.mediaUrl;
                vid.crossOrigin = "anonymous";
                vid.muted = true;
                vid.loop = true;
                vid.playsInline = true;
                vid.preload = 'auto'; 
                
                // Mount to DOM hidden to prevent browser throttling
                vid.style.display = 'none';
                if (videoContainerRef.current) {
                    videoContainerRef.current.appendChild(vid);
                }

                await new Promise((resolve) => {
                    vid.onloadeddata = resolve;
                    vid.onerror = () => {
                        console.warn(`Video load failed: ${scene.mediaUrl}`);
                        resolve(null); 
                    };
                });
                videos[scene.id] = vid;
            } else {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = scene.mediaUrl;
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = () => {
                        console.warn(`Image load failed: ${scene.mediaUrl}`);
                        resolve(null);
                    };
                });
                images[scene.id] = img;
            }
          }
          loadedCount++;
          setLoadingProgress(Math.round((loadedCount / total) * 100));
        }

        assetsRef.current = { images, videos, audioBuffers };
        setIsReady(true);
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load media assets.");
      }
    };

    init();

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (narrationSourceRef.current) try { narrationSourceRef.current.stop(); } catch(e) {}
        if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, [scenes]);

  // --- SCENE MEDIA CONTROL ---
  const stopSceneMedia = useCallback(() => {
     // Stop all videos
     Object.values(assetsRef.current.videos).forEach((v) => {
         const videoEl = v as HTMLVideoElement;
         if (!videoEl.paused) videoEl.pause();
     });
     // Stop narration
     if (narrationSourceRef.current) {
        try { narrationSourceRef.current.stop(); } catch(e) {}
        narrationSourceRef.current = null;
    }
  }, []);

  const playSceneMedia = useCallback((index: number, destination?: MediaStreamAudioDestinationNode) => {
    if (!audioContextRef.current) return;
    
    stopSceneMedia();

    const scene = scenes[index];
    if (!scene) return;

    // 1. Play Video (if applicable)
    if (scene.mediaType === 'video' && assetsRef.current.videos[scene.id]) {
        const vid = assetsRef.current.videos[scene.id];
        vid.currentTime = 0;
        vid.play().catch(e => console.warn("Video play failed:", e));
    }

    // 2. Play Narration
    if (assetsRef.current.audioBuffers[scene.id]) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = assetsRef.current.audioBuffers[scene.id];
        
        if (destination) {
            source.connect(destination);
        } else {
            source.connect(audioContextRef.current.destination);
        }
        
        source.start(0);
        narrationSourceRef.current = source;
    }
  }, [scenes, stopSceneMedia]);

  // --- RENDER LOOP ---
  const drawScene = useCallback((timestamp: number, exportDest?: MediaStreamAudioDestinationNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { currentSceneIndex, isPlaying, isExporting, sceneStartTimestamp, showCaptions } = stateRef.current;
    const scene = scenes[currentSceneIndex];

    if (!scene) {
        setIsPlaying(false);
        return;
    }

    // Initialize timestamp for this scene
    if (sceneStartTimestamp === 0) {
        stateRef.current.sceneStartTimestamp = timestamp;
        // KICKSTART MEDIA PLAYBACK ONCE PER SCENE
        playSceneMedia(currentSceneIndex, exportDest);
    }
    
    const elapsedTime = (timestamp - stateRef.current.sceneStartTimestamp) / 1000;
    const duration = scene.duration || 3;
    const progress = Math.min(elapsedTime / duration, 1);

    // --- DRAWING ---
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Visual
    if (scene.mediaType === 'video' && assetsRef.current.videos[scene.id]) {
        const vid = assetsRef.current.videos[scene.id];
        if (vid.readyState >= 2) {
             const scale = Math.max(canvas.width / vid.videoWidth, canvas.height / vid.videoHeight);
             const x = (canvas.width - vid.videoWidth * scale) / 2;
             const y = (canvas.height - vid.videoHeight * scale) / 2;
             ctx.drawImage(vid, x, y, vid.videoWidth * scale, vid.videoHeight * scale);
        }
    } else if (assetsRef.current.images[scene.id]) {
        const img = assetsRef.current.images[scene.id];
        // Ken Burns
        const scaleBase = Math.max(canvas.width / img.width, canvas.height / img.height);
        const scale = scaleBase * (1 + 0.08 * progress); // 8% zoom
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    }

    // Text Overlay
    if (showCaptions) {
        const overlayHeight = isLandscape ? 120 : 200;
        const gradient = ctx.createLinearGradient(0, canvas.height - overlayHeight, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.3, 'rgba(0,0,0,0.7)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

        ctx.font = isLandscape ? 'bold 30px Inter, sans-serif' : 'bold 38px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        
        const words = scene.narration.split(' ');
        let line = '';
        const lines = [];
        const maxWidth = canvas.width - (isLandscape ? 100 : 80);
        
        for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
        }
        lines.push(line);

        const lineHeight = isLandscape ? 40 : 50;
        const textBottomMargin = isLandscape ? 40 : 80;
        
        lines.reverse().forEach((l, i) => {
           ctx.fillText(l, canvas.width / 2, canvas.height - textBottomMargin - (i * lineHeight));
        });
    }

    // --- TRANSITION ---
    if (elapsedTime >= duration) {
        // Explicitly pause old video
        if (scene.mediaType === 'video' && assetsRef.current.videos[scene.id]) {
             assetsRef.current.videos[scene.id].pause();
        }

        if (currentSceneIndex < scenes.length - 1) {
            // Advance
            const nextIndex = currentSceneIndex + 1;
            setCurrentSceneIndex(nextIndex); 
            stateRef.current.currentSceneIndex = nextIndex;
            stateRef.current.sceneStartTimestamp = 0; 
        } else {
            // End
            stopSceneMedia();
            setIsPlaying(false);
            setCurrentSceneIndex(0); 
            stateRef.current.isPlaying = false;
            stateRef.current.sceneStartTimestamp = 0; 
            
            if (isExporting && (window as any).mediaRecorder?.state === 'recording') {
                (window as any).mediaRecorder.stop();
            }
            return; 
        }
    }

    if (stateRef.current.isPlaying || stateRef.current.isExporting) {
        requestRef.current = requestAnimationFrame((t) => drawScene(t, exportDest));
    }
  }, [scenes, isLandscape, playSceneMedia, stopSceneMedia, showCaptions]);


  // --- CONTROLS ---
  const togglePlay = async () => {
    if (isPlaying) {
      // PAUSE
      setIsPlaying(false);
      stateRef.current.isPlaying = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      stopSceneMedia();

    } else {
      // PLAY
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
      }
      
      setIsPlaying(true);
      stateRef.current.isPlaying = true;
      // If we are resuming from 0, reset timestamp
      if (!requestRef.current) {
          stateRef.current.sceneStartTimestamp = 0;
      }
      
      requestRef.current = requestAnimationFrame((t) => drawScene(t));
    }
  };

  const handleExport = async () => {
     if (!canvasRef.current || !audioContextRef.current) return;
     
     // Stop any current playback
     stopSceneMedia();
     
     setIsExporting(true);
     setIsPlaying(true); 
     setCurrentSceneIndex(0);
     
     // Reset loop state
     stateRef.current.currentSceneIndex = 0;
     stateRef.current.isPlaying = true;
     stateRef.current.isExporting = true;
     stateRef.current.sceneStartTimestamp = 0;
     
     if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
     }

     const stream = canvasRef.current.captureStream(30);
     const dest = audioContextRef.current.createMediaStreamDestination();
     
     // Ensure Audio Tracks exist before recording
     if (dest.stream.getAudioTracks().length > 0) {
        stream.addTrack(dest.stream.getAudioTracks()[0]);
     } else {
         console.warn("No audio tracks found on destination stream yet.");
     }

     const recorder = new MediaRecorder(stream, { 
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 8000000 
     });
     
     const chunks: Blob[] = [];
     recorder.ondataavailable = (e) => { if(e.data.size > 0) chunks.push(e.data); };
     recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-story-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        
        setIsExporting(false);
        setIsPlaying(false);
        stopSceneMedia();
        (window as any).mediaRecorder = null;
     };

     (window as any).mediaRecorder = recorder;
     
     // Start recording immediately
     recorder.start();
     
     // Start loop
     requestRef.current = requestAnimationFrame((t) => drawScene(t, dest));
  };
  
  const skip = (direction: 'next' | 'prev') => {
     stopSceneMedia();
     const newIndex = direction === 'next' 
        ? Math.min(currentSceneIndex + 1, scenes.length - 1)
        : Math.max(currentSceneIndex - 1, 0);
        
     setCurrentSceneIndex(newIndex);
     stateRef.current.currentSceneIndex = newIndex;
     stateRef.current.sceneStartTimestamp = 0;
     
     if (isPlaying) {
         stateRef.current.sceneStartTimestamp = 0;
     }
  };

  if (scenes.length === 0) {
    return (
      <div className={`w-full h-full bg-[#0b0e14] rounded-xl flex items-center justify-center text-zinc-500`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Waiting for story...</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className={`w-full h-full bg-[#0b0e14] rounded-xl flex items-center justify-center`}>
         <div className="text-center text-zinc-400">
           <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-cyan-500" />
           <p className="font-medium">Loading Assets... {loadingProgress}%</p>
         </div>
      </div>
    );
  }

  if (error) {
     return (
        <div className="w-full h-full bg-red-950/20 border border-red-900/50 rounded-xl flex items-center justify-center text-red-400">
            <div className="text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>{error}</p>
            </div>
        </div>
     );
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Hidden Container for mounted videos */}
      <div ref={videoContainerRef} hidden></div>

      {/* Viewport */}
      <div className={`relative rounded-xl overflow-hidden shadow-2xl bg-black mx-auto transition-all duration-500 flex-1 w-full flex items-center justify-center bg-[#000] border border-zinc-900`}>
        <canvas 
          ref={canvasRef}
          width={width}
          height={height}
          className="max-w-full max-h-full object-contain shadow-2xl"
        />
        
        {isExporting && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
             <div className="text-center text-white p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl">
               <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-cyan-500" />
               <h3 className="text-xl font-bold mb-2">Creating Video...</h3>
               <p className="text-zinc-400 text-sm">Please keep this tab open.</p>
             </div>
          </div>
        )}
      </div>

      {/* Progress & Controls */}
      <div className="flex flex-col gap-3 w-full">
         
         <div className="flex items-center gap-1 h-1 w-full mb-1">
             {scenes.map((_, idx) => (
                 <div key={idx} className={`h-full rounded-full transition-colors flex-1 ${idx < currentSceneIndex ? 'bg-cyan-500' : idx === currentSceneIndex ? 'bg-white' : 'bg-zinc-800'}`} />
             ))}
         </div>

         {/* Button Bar */}
         <div className="flex items-center justify-between bg-[#11141b] border border-zinc-800 rounded-xl p-2 shadow-lg">
            <div className="flex items-center gap-1">
                <button onClick={() => skip('prev')} disabled={isExporting} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50">
                   <SkipBack className="w-4 h-4" />
                </button>
                <button 
                  onClick={togglePlay} 
                  disabled={isExporting}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all active:scale-95 disabled:opacity-50 ${isPlaying ? 'bg-zinc-800 text-white' : 'bg-cyan-600 text-black shadow-lg shadow-cyan-900/20 hover:bg-cyan-500'}`}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button onClick={() => skip('next')} disabled={isExporting} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50">
                   <SkipForward className="w-4 h-4" />
                </button>

                <div className="h-6 w-px bg-zinc-800 mx-2"></div>

                <button 
                   onClick={() => setShowCaptions(!showCaptions)} 
                   disabled={isExporting}
                   title="Toggle Captions"
                   className={`p-2 rounded-lg transition-all disabled:opacity-50 ${showCaptions ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
                >
                   {showCaptions ? <Captions className="w-4 h-4" /> : <CaptionsOff className="w-4 h-4" />}
                </button>
            </div>
            
            <button 
              onClick={handleExport}
              disabled={isExporting || scenes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;