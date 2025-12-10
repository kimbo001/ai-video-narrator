// src/hooks/useBeatmap.ts
import { useState } from 'react';

export default function useBeatmap() {
  const [beatmap, setBeatmap] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generate = async (script: string) => {
    setLoading(true);
    const res = await fetch('/api/beatmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    });
    const data = await res.json();
    setBeatmap(data);
    setLoading(false);
  };

  return { beatmap, loading, generate };
}
