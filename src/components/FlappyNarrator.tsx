// src/components/FlappyNarrator.tsx
import { useEffect, useRef, useState } from 'react';

export default function FlappyNarrator({ userId }: { userId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seed = useRef(0);

  /* ----------  ERROR BOUNDARY  ---------- */
  useEffect(() => {
    const handle = (e: ErrorEvent) => setError(e.error?.stack || e.message);
    window.addEventListener('error', handle);
    return () => window.removeEventListener('error', handle);
  }, []);

  /* ----------  BOOTSTRAP  ---------- */
  useEffect(() => {
    if (error) return;
    (async () => {
      try {
        const r = await fetch(`/api/game/flappy?userId=${userId}`);
        if (!r.ok) throw new Error('fetch failed');
        const j = await r.json();
        seed.current = j.seed;
        setBest(j.best);
        startGame();
      } catch (e: any) {
        setError(e.message);
      }
    })();
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
        // speech blocked / no voices → fake timing
        const mock = { onend: (cb: any) => setTimeout(() => cb({ elapsedTime: 2.2 }), 500) } as any;
        return mock;
      }
    };

    const loop = () => {
      if (gameOver) return;
      frame++;
      vel += 0.4;
      micY += vel;

      // spawn bars
      if (frame % 90 === 0) {
        const phrase = ['AI', 'Video', 'Narrator', 'Beats', 'Humans', 'Again'][nextPhrase % 6];
        const utter = speak(phrase);
        utter.onend = (e: any) => {
          const dur = (e.elapsedTime || 2.2) * 1000;
          bars.push({ x: 400, gap: Math.max(100, 220 - dur / 10) });
          nextPhrase++;
        };
      }

      bars = bars.map(b => ({ ...b, x: b.x - 3 })).filter(b => b.x > -60);

      // collision
      for (const b of bars) {
        if (b.x < 80 && b.x > 20 && (micY < 256 - b.gap / 2 || micY > 256 + b.gap / 2)) {
          endGame(Math.floor(passed / 2));
          return;
        }
      }

      // draw
      ctx.clearRect(0, 0, 320, 512);
      ctx.fillStyle = '#0ea5e9';
      bars.forEach(b => {
        ctx.fillRect(b.x, 0, 40, 256 - b.gap / 2);
        ctx.fillRect(b.x, 256 + b.gap / 2, 40, 256 - b.gap / 2);
      });
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
      fetch('/api/game/flappy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, score: final, seed: seed.current }),
      });
    };

    loop();
  }

  if (error)
    return (
      <div className="mx-auto w-80 text-red-400 text-sm">
        <pre>{error}</pre>
        <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-red-600 text-white rounded">Retry</button>
      </div>
    );

  return (
    <div className="mx-auto w-80">
      <canvas ref={canvasRef} width={320} height={512} className="border rounded" />
      <div className="text-center mt-2">
        <p className="text-lg">Score: {score} &nbsp; Best: {best}</p>
        {gameOver && <button onClick={() => window.location.reload()} className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded">Try again</button>}
      </div>
      <p className="text-xs text-gray-500 mt-2">Top 3 today win a free month. Tap/Space to flap.</p>
    </div>
  );
}
