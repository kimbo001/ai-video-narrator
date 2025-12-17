// src/components/FlappyNarrator.tsx

import React, { useRef, useEffect, useState } from 'react';

interface FlappyNarratorProps {
  userId?: string; // Optional – for future leaderboard integration
}

const GRAVITY = 0.5;
const FLAP_STRENGTH = -10;
const PIPE_GAP_BASE = 150; // Base gap size
const PIPE_SPEED = 3;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

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
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game state refs (avoid re-renders breaking animation)
  const birdY = useRef(250);
  const birdVelocity = useRef(0);
  const pipes = useRef<{ x: number; gapTop: number; gapSize: number; passed: boolean }[]>([]);
  const frameCount = useRef(0);

  // Speech synthesis utility
  const speakPhrase = (phrase: string, onEnd: () => void) => {
    if (!('speechSynthesis' in window)) {
      // Fallback for browsers without speech support
      onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);

    // Try to pick a nice voice
    const voices = speechSynthesis.getVoices();
    const goodVoice =
      voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Premium'))) ||
      voices.find((v) => v.default);

    if (goodVoice) utterance.voice = goodVoice;

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onend = onEnd;
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      onEnd(); // Still continue game flow
    };

    speechSynthesis.cancel(); // Cancel any ongoing speech
    speechSynthesis.speak(utterance);
  };

  // Ensure voices are loaded (they load asynchronously)
  useEffect(() => {
    if (speechSynthesis.getVoices().length === 0) {
      speechSynthesis.onvoiceschanged = () => {
        // Trigger re-render if needed (voices now available)
      };
    }
  }, []);

  const startGame = () => {
    birdY.current = CANVAS_HEIGHT / 2;
    birdVelocity.current = 0;
    pipes.current = [];
    frameCount.current = 0;
    setScore(0);
    setGameState('playing');
  };

  const flap = () => {
    if (gameState === 'playing') {
      birdVelocity.current = FLAP_STRENGTH;
    }
  };

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    let animationId: number;

    const gameLoop = () => {
      // === Physics & Logic ===
      birdVelocity.current += GRAVITY;
      birdY.current += birdVelocity.current;

      // Move pipes
      pipes.current.forEach((pipe) => (pipe.x -= PIPE_SPEED));

      // Spawn new pipe every ~3 seconds (180 frames @ 60fps)
      frameCount.current++;
      if (frameCount.current % 180 === 0) {
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        const wordCount = phrase.split(' ').length;
        const dynamicGap = Math.max(100, PIPE_GAP_BASE - wordCount * 10); // Longer phrase = harder

        speakPhrase(phrase, () => {
          // Pipe appears only after speech finishes
          pipes.current.push({
            x: CANVAS_WIDTH,
            gapTop: Math.random() * (CANVAS_HEIGHT - dynamicGap - 100) + 50,
            gapSize: dynamicGap,
            passed: false,
          });
        });
      }

      // Scoring
      pipes.current = pipes.current.filter((pipe) => {
        if (!pipe.passed && pipe.x + 100 < 100) {
          pipe.passed = true;
          setScore((s) => s + 1);
        }
        return pipe.x > -100; // Remove off-screen pipes
      });

      // Collision detection
      const birdHitPipe = pipes.current.some(
        (pipe) =>
          100 > pipe.x && // bird x position
          100 < pipe.x + 100 &&
          (birdY.current < pipe.gapTop || birdY.current > pipe.gapTop + pipe.gapSize)
      );

      if (
        birdY.current < 0 ||
        birdY.current > CANVAS_HEIGHT ||
        birdHitPipe
      ) {
        setGameState('gameover');
        setHighScore((prev) => Math.max(prev, score));
        speechSynthesis.cancel();
        return;
      }

      // === Rendering ===
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw pipes (sound wave style – green bars)
      ctx.fillStyle = '#4ade80';
      pipes.current.forEach((pipe) => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, 100, pipe.gapTop);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.gapTop + pipe.gapSize, 100, CANVAS_HEIGHT - pipe.gapTop - pipe.gapSize);
      });

      // Draw bird (yellow circle)
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(100, birdY.current, 20, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => cancelAnimationFrame(animationId);
  }, [gameState, score]);

  // Input handling (space / click / tap)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'menu' || gameState === 'gameover') {
          startGame();
        } else {
          flap();
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState]);

  return (
    <div className="relative max-w-4xl mx-auto">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-4 border-gray-800 rounded-lg shadow-2xl bg-sky-300"
        onClick={flap}
      />

      {/* Menu Screen */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">Narration Flap</h1>
            <p className="text-xl mb-8 max-w-md">
              Tap <kbd className="px-2 py-1 bg-gray-700 rounded">Space</kbd> or click to flap
              <br />
              Pass through gaps controlled by AI narration!
            </p>
            <button
              onClick={startGame}
              className="px-10 py-5 bg-green-500 text-3xl font-bold rounded-lg hover:bg-green-600 transition"
            >
              PLAY
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg">
          <div className="text-center text-white">
            <h2 className="text-5xl font-bold mb-6">Game Over</h2>
            <p className="text-4xl mb-4">Score: {score}</p>
            <p className="text-2xl mb-8">Best: {highScore}</p>
            <button
              onClick={startGame}
              className="px-10 py-5 bg-green-500 text-3xl font-bold rounded-lg hover:bg-green-600 transition"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Live Score */}
      {gameState === 'playing' && (
        <div className="absolute top-6 left-6 text-white text-5xl font-bold drop-shadow-lg">
          {score}
        </div>
      )}
    </div>
  );
}
