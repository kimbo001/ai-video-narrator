import React from 'react';
import { Play, Sparkles, Zap, Star, Monitor, Smartphone, Youtube, Video } from 'lucide-react';
import { Page } from '../types';

interface LandingPageProps {
  onStart: () => void;
  onNavigate: (page: Page) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onNavigate }) => {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <header className="relative pt-20 pb-32 flex-1 flex flex-col justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#0b0e14] to-[#0b0e14] pointer-events-none"></div>
        
        <div className="relative z-10 animate-fade-in-up">
          <div className="flex justify-center mb-8">
             <div className="relative">
                <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                <img src="/logo.png" alt="AI Video Narrator Logo" className="w-24 h-24 object-contain relative z-10" />
             </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
  Ultimate AI Short <br />
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Creator and Narrator</span>
</h1>
          
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create professional, narrated videos for <strong>TikTok, YouTube Shorts, and Reels</strong> in seconds. 
            Automate your faceless content channel today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
              aria-label="Start generating video for free"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Creating (Free)
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-lg rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
              aria-label="View pricing plans"
            >
              <Zap className="w-5 h-5 text-yellow-400" />
              Get Pro (Unlimited)
            </button>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-1"><Youtube className="w-4 h-4" /> YouTube Ready</span>
            <span className="flex items-center gap-1"><Smartphone className="w-4 h-4" /> TikTok Ready</span>
            <span>No credit card required</span>
          </div>
        </div>
      </header>

      {/* Features Section for SEO */}
      <section className="py-20 bg-[#0b0e14] border-t border-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose AI Video Narrator?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Our AI Director engine analyzes your text script, selects relevant royalty-free stock footage, and generates human-like voiceovers automatically.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Script Analysis</h3>
              <p className="text-zinc-400 leading-relaxed">
                Just paste your text. Our AI breaks it down into scenes and finds the perfect visual match for every sentence.
              </p>
            </article>

            <article className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                <Monitor className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Multi-Platform Support</h3>
              <p className="text-zinc-400 leading-relaxed">
                Export in Landscape (16:9) for YouTube or Portrait (9:16) for TikTok and Reels with one click.
              </p>
            </article>

            <article className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-l border-b border-yellow-500/20">PRO FEATURE</div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Unlimited Videos</h3>
              <p className="text-zinc-400 leading-relaxed">
                Upgrade to Pro to remove the daily limit. Generate as many videos as you need for your channels.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
