// src/components/FlappyNarrator.tsx
import { useEffect, useRef, useState } from 'react';

export default function FlappyNarrator({ userId }: { userId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(12); // Fake best score — change if you want
  const [gameOver, setGameOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seed = useRef(0);

  /* ----------  GLOBAL ERROR CATCH (just in case) ---------- */
  useEffect(() => {
    const handle = (e: ErrorEvent) => setError(e.error?.stack || e.message);
    window.addEventListener('error', handle);
    return () => window.removeEventListener('error', handle);
  }, []);

  /* ----------  BOOTSTRAP — MOCKED FOR LOCAL TESTING ---------- */
  useEffect(() => {
    if (error) return;

    // === MOCK DATA (since backend route doesn't exist yet) ===
    seed.current = Math.floor(Math.random() * 1000000); // Random seed
    setBest(12); // You can set this to 0 or any number you like
    startGame();

    // === Original backend code (commented out) ===
    // (async () => {
    //   try {
    //     const r = await fetch(`/api/game/flappy?userId=${userId}`);
    //     if (!r.ok) throw new Error('fetch failed');
    //     const j = await r.json();
    //     seed.current = j.seed;
    //     setBest(j.best);
    //     startGame();
    //   } catch (e: any) {
    //     setError(e.message);
    //   }
    // })();
  }, [error]);

  function startGame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let micY = 256;
    let vel = 0;
    let bars: { x: number; gap: number }[] = [];
    let frame = 0;
    let passed = 0;
    let nextPhrase = 0;

    const flap = () => (vel = -6);

    const keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', keyHandler);
    canvas.addEventListener('touchstart', flap);

    const speak = (text: string) => {
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.1;
        speechSynthesis.speak(utter);
        return utter;
      } catch {
        // Fallback if speech is blocked or no voices available
        const mock = {
          onend: (cb: any) => setTimeout(() => cb({ elapsedTime: 2.2 }), 500),
        } as any;
        return mock;
      }
    };

    const loop = () => {
      if (gameOver) return;

      frame++;
      vel += 0.4;
      micY += vel;

      // Spawn new bar every 90 frames
      if (frame % 90 === 0) {
        const phrases = ['AI', 'Video', 'Narrator', 'Beats', 'Humans', 'Again'];
        const phrase = phrases[nextPhrase % 6];
        const utter = speak(phrase);

        utter.onend = (e: any) => {
          const dur = (e.elapsedTime || 2.2) * 1000; // duration in ms
          const gap = Math.max(100, 220 - dur / 10);
          bars.push({ x: 400, gap });
          nextPhrase++;
        };
      }

      // Move bars
      bars = bars.map(b => ({ ...b, x: b.x - 3 })).filter(b => b.x > -60);

      // Collision detection
      for (const b of bars) {
        if (b.x < 80 && b.x > 20 && (micY < 256 - b.gap / 2 || micY > 256 + b.gap / 2)) {
          endGame(Math.floor(passed / 2));
          return;
        }
      }

      // Draw everything
      ctx.clearRect(0, 0, 320, 512);

      // Pipes (sky blue)
      ctx.fillStyle = '#0ea5e9';
      bars.forEach(b => {
        ctx.fillRect(b.x, 0, 40, 256 - b.gap / 2);
        ctx.fillRect(b.x, 256 + b.gap / 2, 40, 256 - b.gap / 2);
      });

      // Bird (orange mic)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(50, micY, 14, 0, Math.PI * 2);
      ctx.fill();

      passed++;
      setScore(Math.floor(passed / 120));

      requestAnimationFrame(loop);
    };

    const endGame = (final: number) => {
      setGameOver(true);
      window.removeEventListener('keydown', keyHandler);

      // Mock score submission (real POST commented out)
      console.log('🎉 Game Over!', {
        userId,
        score: final,
        seed: seed.current,
        bestSoFar: best,
      });

      // === Original POST (uncomment when backend is ready) ===
      // fetch('/api/game/flappy', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ userId, score: final, seed: seed.current }),
      // });
    };

    loop();
  }

  if (error) {
    return (
      <div className="mx-auto w-80 text-red-400 text-sm">
        <pre>{error}</pre>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-80">
      <canvas ref={canvasRef} width={320} height={512} className="border rounded shadow-lg" />
      <div className="text-center mt-4">
        <p className="text-lg font-semibold">
          Score: <span className="text-cyan-400">{score}</span> &nbsp; Best:{' '}
          <span className="text-yellow-400">{best}</span>
        </p>
        {gameOver && (
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
          >
            Play Again
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        Top 3 today win a free month. <br />
        Tap screen or press <kbd className="px-2 py-1 bg-zinc-800 rounded">Space</kbd> to flap.
      </p>
    </div>
  );
}
