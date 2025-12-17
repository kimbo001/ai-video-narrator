// src/components/FlappyNarrator.tsx - UPDATED: NO GROUND (clean floating feel)

import React, { useRef, useEffect, useState } from 'react';

interface FlappyNarratorProps {
  userId?: string;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const GRAVITY = 0.45;
const FLAP_STRENGTH = -9.5;
const PIPE_SPEED = 3;
const PIPE_GAP_BASE = 150;
const PIPE_WIDTH = 104;

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

  // Game refs
  const birdY = useRef(CANVAS_HEIGHT / 2);
  const birdVelocity = useRef(0);
  const birdFrame = useRef(0);
  const pipes = useRef<{ x: number; gapTop: number; gapSize: number; passed: boolean }[]>([]);
  const frameCount = useRef(0);

  // Images (removed ground)
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
    let animationId: number;

    const gameLoop = () => {
      // Physics
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;

      frameCount.current++;
      if (frameCount.current % 8 === 0) {
        birdFrame.current = (birdFrame.current + 1) % 3;
      }

      // Move pipes
      pipes.current.forEach((pipe) => (pipe.x -= PIPE_SPEED));

      // Spawn pipe
      if (frameCount.current % 180 === 0) {
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        const wordCount = phrase.split(' ').length;
        const dynamicGap = Math.max(100, PIPE_GAP_BASE - wordCount * 10);

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

      // Collision (now only pipes + top/bottom of sky)
      const hitPipe = pipes.current.some(
        (pipe) =>
          120 > pipe.x &&
          120 < pipe.x + PIPE_WIDTH &&
          (birdY.current - 30 < pipe.gapTop || birdY.current + 30 > pipe.gapTop + pipe.gapSize)
      );

      if (birdY.current < 40 || birdY.current > CANVAS_HEIGHT - 40 || hitPipe) {
        setGameState('gameover');
        setHighScore((prev) => Math.max(prev, score));
        speechSynthesis.cancel();
        return;
      }

      // Rendering
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Background only
      ctx.drawImage(images.current.background, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Pipes
      pipes.current.forEach((pipe) => {
        // Top pipe
        ctx.save();
        ctx.translate(pipe.x + PIPE_WIDTH / 2, pipe.gapTop);
        ctx.scale(1, -1);
        ctx.drawImage(images.current.pipeTop, -PIPE_WIDTH / 2, 0, PIPE_WIDTH, pipe.gapTop + 100);
        ctx.restore();

        // Bottom pipe
        ctx.drawImage(
          images.current.pipeBottom,
          pipe.x,
          pipe.gapTop + pipe.gapSize,
          PIPE_WIDTH,
          CANVAS_HEIGHT - (pipe.gapTop + pipe.gapSize) + 50
        );
      });

      // Flying mic sprite
      const spriteWidth = 80; // Adjust if your sprite frames are different width
      ctx.drawImage(
        images.current.micSprite,
        birdFrame.current * spriteWidth,
        0,
        spriteWidth,
        80,
        100,
        birdY.current - 40,
        80,
        80
      );

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

      {/* Loading */}
      {(gameState === 'menu' && !imagesLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-xl">
          <p className="text-white text-3xl">Loading assets...</p>
        </div>
      )}

      {/* Menu */}
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

      {/* Game Over */}
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

      {/* Score */}
      {gameState === 'playing' && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-white text-6xl font-bold drop-shadow-2xl">
          {score}
        </div>
      )}
    </div>
  );
}
