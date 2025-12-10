import { useState } from 'react';

export default function useBeatMap() {
  const [beatMap, setBeatMap] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (script) => {
    setLoading(true);
    const res = await fetch('/api/beatMap', {   // ← Vercel route
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({script})
    });
    const json = await res.json();
    setBeatMap(json);
    setLoading(false);
  };
  return { beatMap, loading, generate };
}
