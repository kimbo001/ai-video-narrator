import React, { useState, useEffect } from 'react'; // Added hooks
import { useNavigate } from 'react-router-dom';
import { Play, Zap, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onNavigate?: (page: any) => void;
}

const LandingPage: React.FC<LandingPageProps> = () => {
  const navigate = useNavigate();

  // --- THE FIX: LIVE COUNTER LOGIC ---
  const [videoCount, setVideoCount] = useState("4,018+");

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.totalVideos) {
          // Formats numbers nicely (e.g., 4,025+)
          setVideoCount(data.totalVideos.toLocaleString() + "+");
        }
      })
      .catch((err) => console.error("Stats fetch failed", err));
  }, []);
  // -----------------------------------

  return (
    <div className="flex-1 bg-[#0b0e14] text-zinc-300 font-sans min-h-screen selection:bg-cyan-500/30">
      
      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-12 md:pt-32 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* LEFT COLUMN: THE ORIGINAL LAYOUT */}
        <div className="text-left flex flex-col items-start">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
            The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 italic">AI Video Narrator</span><br /> 
            For Faceless Channels
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-xl mb-6 leading-relaxed">
            The all-in-one factory for AITA, Reddit, and Motivational creators. Turn any text into viral, narrated videos in 60 seconds.
          </p>

          {/* 1. COUNTER DIRECTLY UNDER TEXT */}
          <div className="bg-zinc-900/50 border border-zinc-800 px-5 py-3 rounded-2xl flex items-center gap-4 mb-6 shadow-xl shadow-black/50">
             <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
               {/* UPDATED: Now uses the live videoCount state */}
               <span className="text-white font-black text-2xl tracking-tighter">{videoCount}</span>
             </div>
             <div className="h-8 w-px bg-zinc-800"></div>
             <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black leading-tight">
               Videos Generated<br/>Live
             </span>
          </div>

          {/* 2. BADGE ROW (PH, PEERPUSH, SAASHUB) */}
          <div className="flex flex-wrap gap-4 items-center mb-10">
            {/* PRODUCT HUNT */}
            <a 
              href="https://www.producthunt.com/products/ai-video-narrator-2?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-ai-video-narrator-2" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                alt="AI Video Narrator - Product Hunt" 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1055573&theme=light&t=1767851342266" 
                className="h-[44px] w-auto rounded-lg"
              />
            </a>

            {/* PEERPUSH */}
            <a 
              href="https://peerpush.net/p/ai-video-narrator-free-text-to-video"
              target="_blank"
              rel="noopener"
              className="hover:opacity-80 transition-opacity"
            >
              <img
                src="https://peerpush.net/p/ai-video-narrator-free-text-to-video/badge.png"
                alt="AI Video Narrator badge"
                className="h-[44px] w-auto rounded-lg"
              />
            </a>

            {/* SAASHUB */}
            <a 
              href='https://www.saashub.com/ai-video-narrator?utm_source=badge&utm_campaign=badge&utm_content=ai-video-narrator&badge_variant=color&badge_kind=approved' 
              target='_blank'
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img 
                src="https://cdn-b.saashub.com/img/badges/approved-color.png?v=1" 
                alt="AI Video Narrator badge" 
                className="h-[44px] w-auto"
              />
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN: SLOGAN + VIDEO + CTA */}
        <div className="flex flex-col items-center">
          
          <div className="mb-6 flex flex-col items-center gap-2">
             <span className="text-[11px] uppercase tracking-[0.4em] text-cyan-400 font-black">
               Simplicity that works
             </span>
             <div className="w-12 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          </div>

          <div className="relative w-full group mb-10">
            <div className="absolute -inset-4 bg-cyan-500/10 rounded-[3rem] blur-3xl opacity-50"></div>
            <div className="relative p-1.5 rounded-[2.5rem] bg-zinc-800/40 border border-zinc-800 shadow-2xl overflow-hidden">
              <div className="rounded-[2.2rem] overflow-hidden bg-black aspect-video shadow-inner">
                <video 
                  src="/how-it-works.webm" 
                  className="w-full h-full object-cover"
                  controls autoPlay muted loop playsInline
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <button 
              onClick={() => navigate('/pricing')}
              className="w-full px-8 py-4 bg-[#1a1c23] border border-zinc-800 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              View Pricing
            </button>
            <button 
              onClick={() => navigate('/generator')}
              className="w-full px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 group"
            >
              <Play className="w-4 h-4 fill-current" />
              Sign In To Create For Free
            </button>
          </div>

          <p className="mt-6 text-[10px] text-zinc-600 uppercase tracking-widest font-black">
             5,000 Free characters waiting for you
          </p>
        </div>

      </section>

      <footer className="py-12 border-t border-zinc-900/50 text-center">
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.3em] font-bold">
          © 2026 AI Video Narrator. Built for the high-volume creator.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
