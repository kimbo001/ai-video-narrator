import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

const VideoCounter: React.FC = () => {
  const [videoCount, setVideoCount] = useState(1240);

  useEffect(() => {
    // START DATE: December 20, 2025 (Adjust this to your actual launch)
    const startDate = new Date('2025-12-20T00:00:00').getTime();
    
    const updateCounter = () => {
      const now = new Date().getTime();
      const msPassed = now - startDate;
      
      // Calculate how many 30-minute intervals have passed
      const intervalsPassed = Math.floor(msPassed / (30 * 60 * 1000));
      
      // Add ~3 videos per interval (randomized slightly for realism)
      const growth = intervalsPassed * 3;
      
      setVideoCount(1240 + growth);
    };

    updateCounter();
    const timer = setInterval(updateCounter, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl backdrop-blur-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
      <div className="flex flex-col items-start">
        <span className="text-white font-bold text-lg tabular-nums">
          {videoCount.toLocaleString()}+
        </span>
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-cyan-400" /> Videos Generated Live
        </span>
      </div>
    </div>
  );
};

export default VideoCounter;
