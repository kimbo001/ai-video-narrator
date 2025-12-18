// src/components/FlappyNarrator.tsx - FINAL: NO SPRITE BLEEDING + PERFECT 5-FRAME ANIMATION

import React, { useRef, useEffect, useState } from 'react';

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

// === CONFIGURE THESE FOR YOUR SPRITE SHEET ===
const FRAME_COUNT = 4;                    // Your 5 frames
const SPRITE_FRAME_WIDTH = 69;            // Exact width of ONE frame (change if different)
const FRAME_HEIGHT = 69;                  // Height of each frame (usually same as width)

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

  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload images
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

  // Speech synthesis
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

    birdY.current = CANVAS_HEIGHT / 2;
    birdVelocity.current = 0;
    birdFrame.current = 0;
    pipes.current = [];
    frameCount.current = 0;
    setScore(0);
    setGameState('playing');
  };

  const flap = () => {
    if (gameState === 'playing') {
      birdVelocity.current = FLAP_STRENGTH;
      birdFrame.current = 0;
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing' || !imagesLoaded) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    // CRITICAL FIX: Disable image smoothing to prevent bleeding
    ctx.imageSmoothingEnabled = false;

    let animationId: number;

    const gameLoop = () => {
      // Physics
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;

      // Frame animation
      frameCount.current++;
      if (frameCount.current % 8 === 0) {
        birdFrame.current = (birdFrame.current + 1) % FRAME_COUNT;
      }

      // Move pipes
      pipes.current.forEach((pipe) => (pipe.x -= PIPE_SPEED));

      // Spawn pipe
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

      // Scoring
      pipes.current = pipes.current.filter((pipe) => {
        if (!pipe.passed && pipe.x + PIPE_WIDTH < 120) {
          pipe.passed = true;
          setScore((s) => s + 1);
        }
        return pipe.x > -PIPE_WIDTH;
      });

      // Forgiving collision
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
        setGameState('gameover');
        setHighScore((prev) => Math.max(prev, score));
        speechSynthesis.cancel();
        return;
      }

      // Rendering
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background
      ctx.drawImage(images.current.background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Pipes
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

      // Winged Mic - CLEAN CROPPING + NO BLEEDING
      const sourceX = birdFrame.current * SPRITE_FRAME_WIDTH;

      ctx.save();
      ctx.shadowColor = 'rgba(255,215,0,0.6)';
      ctx.shadowBlur = 10;

      ctx.drawImage(
        images.current.micSprite,
        sourceX + 0.5,           // +0.5 offset to avoid sub-pixel sampling
        0.5,                     // +0.5 vertical too
        SPRITE_FRAME_WIDTH - 1,  // crop 1px from right to prevent edge bleed
        FRAME_HEIGHT - 1,        // crop 1px from bottom
        100,                     // x on canvas
        birdY.current - 40,      // y on canvas
        80,                      // display width
        80                       // display height
      );

      ctx.shadowBlur = 0;
      ctx.restore();

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animationId);
  }, [gameState, imagesLoaded, score]);

  // Input
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
    <div className="relative max-w-4xl mx-auto my-8">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="rounded-xl shadow-2xl border-4 border-gray-800"
        onClick={flap}
      />

      {gameState === 'menu' && !imagesLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-xl">
          <p className="text-white text-3xl font-bold">Loading assets...</p>
        </div>
      )}

      {gameState === 'menu' && imagesLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-xl">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-6">Narration Flap</h1>
            <p className="text-2xl mb-10 max-w-lg">
              Flap the flying microphone through AI-narrated gaps!
              <br />
              <span className="text-lg">Space or click to flap</span>
            </p>
            <button
              onClick={startGame}
              className="px-12 py-6 bg-green-500 text-4xl font-bold rounded-xl hover:bg-green-600 transition shadow-lg"
            >
              PLAY
            </button>
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-xl">
          <div className="text-center text-white">
            <h2 className="text-6xl font-bold mb-6">Game Over</h2>
            <p className="text-5xl mb-4">Score: {score}</p>
            <p className="text-3xl mb-10">Best: {highScore}</p>
            <button
              onClick={startGame}
              className="px-12 py-6 bg-green-500 text-4xl font-bold rounded-xl hover:bg-green-600 transition shadow-lg"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white text-6xl font-bold drop-shadow-2xl">
          {score}
        </div>
      )}
    </div>
  );
}
