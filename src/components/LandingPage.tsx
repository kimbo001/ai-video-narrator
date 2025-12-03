
import React from 'react';
import { Play, Sparkles, Image as ImageIcon, Mic2, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onNavigate: (page: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onNavigate }) => {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#0b0e14] to-[#0b0e14]"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-8">
            <Sparkles className="w-3 h-3" />
            <span>Now with AI Voice Cloning</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Turn Text into <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Viral Videos</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create narrated videos for TikTok, Shorts, and Reels in seconds. No editing skills required. Just type your script and let AI do the rest.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              Create Video Free
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="w-full sm:w-auto px-8 py-4 bg-[#1a1e26] hover:bg-[#27272a] text-white font-semibold rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-[#0b0e14]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-2xl bg-[#11141b] border border-zinc-800 hover:border-cyan-500/30 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                <Mic2 className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Narration</h3>
              <p className="text-zinc-400 leading-relaxed">
                Choose from ultra-realistic AI voices that sound human. Emotional, engaging, and perfectly paced for social media.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-2xl bg-[#11141b] border border-zinc-800 hover:border-cyan-500/30 transition-colors">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6">
                <ImageIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Auto Visuals</h3>
              <p className="text-zinc-400 leading-relaxed">
                Our engine automatically searches millions of royalty-free clips from Pixabay, Pexels, and Unsplash to match your text perfectly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-2xl bg-[#11141b] border border-zinc-800 hover:border-cyan-500/30 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">One-Click Edit</h3>
              <p className="text-zinc-400 leading-relaxed">
                Don't like a clip? Swap it instantly. Need different music? Done. You are the director, AI is your production team.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
