import React from 'react';
import { Play, Sparkles, Zap, Clock, Star, Image as ImageIcon, Mic2, Video } from 'lucide-react';
import { Page } from '../types';

interface LandingPageProps {
  onStart: () => void;
  onNavigate: (page: Page) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onNavigate }) => {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 flex-1 flex flex-col justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#0b0e14] to-[#0b0e14] pointer-events-none"></div>
        
        <div className="relative z-10 animate-fade-in-up">
          <div className="flex justify-center mb-8">
             <div className="relative">
                <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                <img src="/logo.png" alt="AVAI Logo" className="w-24 h-24 object-contain relative z-10" />
             </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            Turn Text into <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Viral Videos</span> Instantly
          </h1>
          
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create narrated videos for TikTok, Shorts, and Reels in seconds. 
            No editing skills required. Just write, click, and watch.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              Create Video Free
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-lg rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
            >
              <Star className="w-5 h-5 text-yellow-400" />
              Get Pro (Instant Speed)
            </button>
          </div>
          
          <p className="mt-6 text-sm text-zinc-500">No credit card required · 5 Free videos/day</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-[#0b0e14] border-t border-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why Creators Love AI Narrator</h2>
            <p className="text-zinc-400">Everything you need to automate your content channel.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Director</h3>
              <p className="text-zinc-400 leading-relaxed">
                Our AI analyzes your script to find the perfect stock footage and generates a storyboard automatically.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                <Mic2 className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Hyper-Realistic Voice</h3>
              <p className="text-zinc-400 leading-relaxed">
                Choose from multiple professional AI narrators (Male & Female) to bring your story to life.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-l border-b border-yellow-500/20">PRO FEATURE</div>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Generation</h3>
              <p className="text-zinc-400 leading-relaxed">
                Pro users get priority processing. Generate videos in seconds instead of waiting in the queue.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
