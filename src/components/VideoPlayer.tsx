// src/components/VideoPlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Scene, VideoOrientation } from '../types';

interface VideoPlayerProps {
  scenes: Scene[];
  orientation: VideoOrientation;
  backgroundMusicUrl?: string | null;
  musicVolume?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  scenes,
  orientation,
  backgroundMusicUrl,
  musicVolume = 0.3,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const narrationSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const isPortrait = orientation === VideoOrientation.Portrait;
  const canvasWidth = isPortrait ? 720 : 1280;
  const canvasHeight = isPortrait ? 1280 : 720;

  // Initialise audio context on first play
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  // Play narration + sync visuals
  const play = async () => {
    if (scenes.length === 0) return;
    initAudio();
    if (!audioContextRef.current) return;

    setIsPlaying(true);
    setCurrentSceneIndex(0);

    let timeOffset = 0;

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (!scene.audioData || !scene.duration || scene.duration <= 0) continue;

      // base64 -> ArrayBuffer
      const binary = atob(scene.audioData);
      const buffer = new ArrayBuffer(binary.length);
      const view = new Uint8Array(buffer);
      for (let j = 0; j < binary.length; j++) view[j] = binary.charCodeAt(j);

      const audioBuffer = await audioContextRef.current.decodeAudioData(buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 1.0;
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      source.start(audioContextRef.current.currentTime + timeOffset);

      setCurrentSceneIndex(i);

      if (scene.mediaType === 'video' && scene.mediaUrl) {
        const videoEl = document.createElement('video');
        videoEl.src = scene.mediaUrl;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoElsRef.current.set(scene.id, videoEl);
        videoEl.load();
      }

      timeOffset += scene.duration;
      await new Promise(r => setTimeout(r, (scene.duration || 6) * 1000));
    }

    setIsPlaying(false);
  };

  // Draw current scene on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentScene = scenes[currentSceneIndex];
    if (!currentScene) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentScene.mediaType === 'video' && currentScene.mediaUrl) {
        let videoEl = videoElsRef.current.get(currentScene.id);
        if (!videoEl) {
          videoEl = document.createElement('video');
          videoEl.src = currentScene.mediaUrl;
          videoEl.muted = true;
          videoEl.playsInline = true;
          videoEl.currentTime = 0;
          videoEl.play().catch(() => {});
          videoElsRef.current.set(currentScene.id, videoEl);
        }
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      } else if (currentScene.mediaUrl) {
        const img = new Image();
        img.src = currentScene.mediaUrl;
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (img.complete) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#0b0e14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#444';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Scene ${currentSceneIndex + 1}`, canvas.width / 2, canvas.height / 2);
      }

      if (isPlaying) requestAnimationFrame(draw);
    };

    draw();

    return () => {
      videoElsRef.current.forEach(v => {
        v.pause();
        v.src = '';
      });
    };
  }, [currentSceneIndex, scenes, isPlaying]);

  // Auto-play when scenes are ready
  useEffect(() => {
    if (scenes.length > 0 && !isPlaying) {
      play();
    }
  }, [scenes]);

  // Background music volume
  useEffect(() => {
    if (bgMusicRef.current) bgMusicRef.current.volume = musicVolume;
  }, [musicVolume]);

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="w-full h-full object-contain"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />

      {/* Background music */}
      {backgroundMusicUrl && (
        <audio
          ref={bgMusicRef}
          src={backgroundMusicUrl}
          loop
          autoPlay
        />
      )}

      {/* Play button overlay if not playing */}
      {!isPlaying && scenes.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <button
            onClick={play}
            className="w-20 h-20 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-2xl"
          >
            <svg className="w-10 h-10 text-black ml-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
