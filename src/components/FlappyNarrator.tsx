// src/components/FlappyNarrator.tsx - WITH NAVIGATION BAR (matches site exactly)

import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface FlappyNarratorProps {
  userId?: string;
}

const CANVAS_WIDTH = 850;
const CANVAS_HEIGHT = 500;

const GRAVITY = 0.4;
const FLAP_STRENGTH = -4.5;
const PIPE_SPEED = 2.2;
const PIPE_GAP_BASE = 180;
const PIPE_WIDTH = 90;

const FRAME_COUNT = 4;
const SPRITE_FRAME_WIDTH = 69;
const FRAME_HEIGHT = 69;

const phrases = [
  "Welcome to the future of content",
  "Artificial intelligence is amazing",
  "Create videos in seconds",
  "The quick brown fox jumps over the lazy dog",
  "Narration drives the difficulty",
  "How high can you score?",
  "Upgrade for unlimited videos",
  "This gap is controlled by my voice",
  "Speak and the obstacles change",
  "Flap through the sound waves",
];

export default function FlappyNarrator({ userId }: FlappyNarratorProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'loading' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const birdY = useRef(CANVAS_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const birdFrame = useRef(0);
  const pipes = useRef<{ x: number; gapTop: number; gapSize: number; passed: boolean }[]>([]);
  const frameCount = useRef(0);

  const images = useRef({
    background: new Image(),
    micSprite: new Image(),
    pipeTop: new Image(),
    pipeBottom: new Image(),
  });

  // Audio refs
  const bgMusic = useRef<HTMLAudioElement | null>(null);
  const sfxWing = useRef<HTMLAudioElement | null>(null);
  const sfxPoint = useRef<HTMLAudioElement | null>(null);
  const sfxHit = useRef<HTMLAudioElement | null>(null);
  const sfxDie = useRef<HTMLAudioElement | null>(null);

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload images (same as before)
  useEffect(() => {
    const imgPaths = {
      background: '/assets/flappy/background-day.png',
      micSprite: '/assets/flappy/mic-wings-sprite.png',
      pipeTop: '/assets/flappy/pipe-green-top.png',
      pipeBottom: '/assets/flappy/pipe-green-bottom.png',
    };

    let loadedCount = 0;
    const totalImages = Object.keys(imgPaths).length;

    Object.entries(imgPaths).forEach(([key, src]) => {
      const img = images.current[key as keyof typeof images.current];
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalImages) setImagesLoaded(true);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        loadedCount++;
        if (loadedCount === totalImages) setImagesLoaded(true);
      };
    });
  }, []);

  // Preload audio (your .ogg files)
  useEffect(() => {
    bgMusic.current = new Audio('/assets/flappy/audio/bg-music.ogg');
    bgMusic.current.loop = true;
    bgMusic.current.volume = 0.5;

    sfxWing.current = new Audio('/assets/flappy/audio/wing.ogg');
    sfxWing.current.volume = 0.5;

    sfxPoint.current = new Audio('/assets/flappy/audio/point.ogg');
    sfxPoint.current.volume = 0.5;

    sfxHit.current = new Audio('/assets/flappy/audio/hit.ogg');
    sfxHit.current.volume = 0.5;

    sfxDie.current = new Audio('/assets/flappy/audio/die.ogg');
    sfxDie.current.volume = 0.5;
  }, []);

  const unlockAudio = () => {
    if (!audioUnlocked) {
      setAudioUnlocked(true);
      if (bgMusic.current) bgMusic.current.play().catch(() => {});
    }
  };

  const speakPhrase = (phrase: string, onEnd: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEnd();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(phrase);
    const voices = speechSynthesis.getVoices();
    const goodVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium'))) ||
      voices.find((v) => v.default);
    if (goodVoice) utterance.voice = goodVoice;

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    utterance.onend = onEnd;
    utterance.onerror = () => onEnd();

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.onvoiceschanged = () => {};
    }
  }, []);

  const startGame = () => {
    if (!imagesLoaded) return;
    unlockAudio();
    birdY.current = CANVAS_HEIGHT / 2;
    birdVelocity.current = 0;
    birdFrame.current = 0;
    pipes.current = [];
    frameCount.current = 0;
    setScore(0);
    setGameState('playing');

    if (bgMusic.current && audioUnlocked) {
      bgMusic.current.currentTime = 0;
      bgMusic.current.play().catch(() => {});
    }
  };

  const flap = () => {
    unlockAudio();
    if (gameState === 'playing') {
      birdVelocity.current = FLAP_STRENGTH;
      birdFrame.current = 0;
      if (sfxWing.current) {
        sfxWing.current.currentTime = 0;
        sfxWing.current.play().catch(() => {});
      }
    }
  };

  // Game loop (unchanged - all your gameplay logic)
  useEffect(() => {
    if (gameState !== 'playing' || !imagesLoaded) {
      if (bgMusic.current) bgMusic.current.pause();
      return;
    }

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    let animationId: number;

    const gameLoop = () => {
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;

      frameCount.current++;
      if (frameCount.current % 8 === 0) {
        birdFrame.current = (birdFrame.current + 1) % FRAME_COUNT;
      }

      pipes.current.forEach((pipe) => (pipe.x -= PIPE_SPEED));

      if (frameCount.current % 180 === 0) {
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        const wordCount = phrase.split(' ').length;
        const dynamicGap = Math.max(120, PIPE_GAP_BASE - wordCount * 8);

        speakPhrase(phrase, () => {
          pipes.current.push({
            x: CANVAS_WIDTH,
            gapTop: Math.random() * (CANVAS_HEIGHT - dynamicGap - 150) + 70,
            gapSize: dynamicGap,
            passed: false,
          });
        });
      }

      let justScored = false;
      pipes.current = pipes.current.filter((pipe) => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < 120) {
          pipe.passed = true;
          setScore((s) => s + 1);
          justScored = true;
        }
        return pipe.x > -PIPE_WIDTH;
      });

      if (justScored && sfxPoint.current) {
        sfxPoint.current.currentTime = 0;
        sfxPoint.current.play().catch(() => {});
      }

      const MIC_LEFT = 100;
      const MIC_WIDTH = 60;
      const MIC_TOP = birdY.current - 30;
      const MIC_HEIGHT = 60;
      const GRACE = 8;

      const hitPipe = pipes.current.some(
        (pipe) =>
          MIC_LEFT < pipe.x + PIPE_WIDTH + GRACE &&
          MIC_LEFT + MIC_WIDTH > pipe.x - GRACE &&
          (MIC_TOP < pipe.gapTop - GRACE || MIC_TOP + MIC_HEIGHT > pipe.gapTop + pipe.gapSize + GRACE)
      );

      if (birdY.current < 40 || birdY.current > CANVAS_HEIGHT - 40 || hitPipe) {
        if (sfxHit.current) {
          sfxHit.current.currentTime = 0;
          sfxHit.current.play().catch(() => {});
        }
        setTimeout(() => {
          if (sfxDie.current) {
            sfxDie.current.currentTime = 0;
            sfxDie.current.play().catch(() => {});
          }
        }, 100);

        setGameState('gameover');
        setHighScore((prev) => Math.max(prev, score));
        speechSynthesis.cancel();
        if (bgMusic.current) bgMusic.current.pause();
        return;
      }

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(images.current.background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      pipes.current.forEach((pipe) => {
        ctx.save();
        ctx.translate(pipe.x + PIPE_WIDTH / 2, pipe.gapTop);
        ctx.scale(1, -1);
        ctx.drawImage(images.current.pipeTop, -PIPE_WIDTH / 2, 0, PIPE_WIDTH, pipe.gapTop + 100);
        ctx.restore();

        ctx.drawImage(
          images.current.pipeBottom,
          pipe.x,
          pipe.gapTop + pipe.gapSize,
          PIPE_WIDTH,
          CANVAS_HEIGHT - (pipe.gapTop + pipe.gapSize) + 50
        );
      });

      const sourceX = birdFrame.current * SPRITE_FRAME_WIDTH;
      ctx.save();
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 12;

      ctx.drawImage(
        images.current.micSprite,
        sourceX + 0.5,
        0.5,
        SPRITE_FRAME_WIDTH - 1,
        FRAME_HEIGHT - 1,
        100,
        birdY.current - 34.5,
        69,
        69
      );

      ctx.shadowBlur = 0;
      ctx.restore();

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationId);
  }, [gameState, imagesLoaded, score, audioUnlocked]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'menu' || gameState === 'gameover') startGame();
        else flap();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0e14]">
      {/* NAVIGATION BAR - IDENTICAL TO SITE */}
      <nav className="border-b border-zinc-800 bg-[#0b0e14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="AI Video Narrator" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
            <span className="font-bold text-white text-lg tracking-tight">AI Video Narrator</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-zinc-400 hover:text-white">Home</Link>
            <Link to="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white">Pricing</Link>
            <Link to="/play" className="text-sm font-medium text-zinc-400 hover:text-white">Play</Link>
            <Link to="/legal" className="text-sm font-medium text-zinc-400 hover:text-white">Terms & Privacy</Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Add your Clerk buttons here if needed */}
            <Link to="/generator" className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors">
              App Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Game content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-2xl shadow-2xl border-4 border-gray-900"
            onClick={flap}
          />

          {/* Loading */}
          {gameState === 'menu' && !imagesLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl">
              <p className="text-white text-4xl font-semibold">Loading...</p>
            </div>
          )}

          {/* Menu */}
          {gameState === 'menu' && imagesLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl">
              <div className="text-center text-white px-8">
                <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-lg">
                  Narration Flap
                </h1>
                <p className="text-xl md:text-2xl mb-12 max-w-2xl leading-relaxed opacity-90">
                  Flap the flying microphone through gaps shaped by AI narration
                  <br />
                  <span className="text-lg opacity-75">Tap or press Space to flap</span>
                </p>
                <button
                  onClick={startGame}
                  className="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-3xl font-bold rounded-xl shadow-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200"
                >
                  PLAY
                </button>
              </div>
            </div>
          )}

          {/* Game Over */}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl">
              <div className="text-center text-white px-8">
                <h2 className="text-6xl md:text-7xl font-bold mb-8 tracking-tight drop-shadow-lg">
                  Game Over
                </h2>
                <p className="text-5xl md:text-6xl mb-4 font-bold">Score: {score}</p>
                <p className="text-3xl mb-12 opacity-80">Best: {highScore}</p>
                <button
                  onClick={startGame}
                  className="px-12 py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-3xl font-bold rounded-xl shadow-xl hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* Score */}
          {gameState === 'playing' && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2">
              <div className="text-6xl md:text-7xl font-bold text-white drop-shadow-2xl tracking-wide">
                {score}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
