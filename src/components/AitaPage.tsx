import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Sparkles, Zap, Star, Monitor, Smartphone, Youtube, Video, Clock, Users, TrendingUp, Award, CheckCircle, HelpCircle } from 'lucide-react';

const AitaPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full font-sans">
      {/* HERO SECTION */}
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
            The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 italic text-6xl md:text-8xl">AITA Video Maker</span> <br />
            for TikTok & Reels
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Turn dramatic AITA stories into viral "Brainrot" videos in seconds. 
            Paste your story, choose an emotional voice, and let AI handle the rest.
          </p>
          
          {/* Social Proof Bar */}
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-400 mb-8">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 500+ AITA Channels</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> Drama Approved</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> 100% Faceless</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/generator')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-lg rounded-xl shadow-xl shadow-cyan-500/40 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              Create AITA Video Free
            </button>
            <button 
              onClick={() => navigate('/pricing')}
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-lg rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
            >
              <Zap className="w-5 h-5 text-yellow-400" />
              View Pricing
            </button>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-zinc-500">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> No Credit Card</span>
            <span className="flex items-center gap-1"><Video className="w-4 h-4" /> Minecraft Parkour</span>
            <span className="flex items-center gap-1"><Smartphone className="w-4 h-4" /> Mobile Optimized</span>
          </div>
        </div>
      </header>

      {/* PROBLEM/SOLUTION SECTION */}
      <section className="py-20 bg-[#0b0e14] border-t border-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 italic text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
              Stop Editing AITA Stories Manually
            </h2>
            <p className="text-zinc-400 max-w-3xl mx-auto text-lg">
              Manual editing is slow. While you spend hours on one video, your competitors post 5x daily using AI.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-zinc-900/30 p-8 rounded-3xl border border-zinc-800">
              <h3 className="text-2xl font-bold text-white mb-6">The Old Manual Way</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-500 text-sm font-bold">✗</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Hunting for Drama</h4>
                    <p className="text-zinc-400 text-sm">Spending 2 hours scrolling r/AITA for a "good" story.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-500 text-sm font-bold">✗</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Recording Stunt Clips</h4>
                    <p className="text-zinc-400 text-sm">Having to find or record 9:16 Minecraft parkour gameplay.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-500 text-sm font-bold">✗</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Syncing Each Word</h4>
                    <p className="text-zinc-400 text-sm">Manually adding captions in CapCut for 3 hours.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-cyan-500/5 p-8 rounded-3xl border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <h3 className="text-2xl font-bold text-cyan-400 mb-6">The AI Narrator Way</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-500 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Instant Text-to-Video</h4>
                    <p className="text-zinc-400 text-sm">Just paste the text and let AI handle the storytelling.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-500 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Built-in Game Library</h4>
                    <p className="text-zinc-400 text-sm">Direct access to satisfying Minecraft and GTA stunts.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-500 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Retention Focused Captions</h4>
                    <p className="text-zinc-400 text-sm">Big, colorful captions that keep people watching.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Scale Your AITA Channel
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Built by creators, for creators. Post daily without the burnout.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-cyan-400 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 italic">Paste Story</h3>
              <p className="text-zinc-400">Copy any dramatic script or AITA thread into the generator.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-cyan-400 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 italic">Pick a Voice</h3>
              <p className="text-zinc-400">Choose deep, mysterious, or energetic AI voices that fit the story tone.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-cyan-400 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3 italic">Export 9:16</h3>
              <p className="text-zinc-400">Download your high-res video and upload directly to TikTok or Reels.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 bg-[#0b0e14] border-t border-zinc-900/50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center italic">
            AITA Video Maker FAQ
          </h2>
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Which voices are best for AITA stories?
              </h4>
              <p className="text-zinc-400 text-sm font-medium">Most viral creators use the 'Charon' (Deep Male) or 'Kore' (Smooth Female) voices for dramatic Reddit stories to keep listeners engaged.</p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Are these videos monetizable?
              </h4>
              <p className="text-zinc-400 text-sm font-medium">Yes. By using original scripts and our high-quality AI narration paired with gameplay footage, your videos are eligible for TikTok and YouTube monetization programs.</p>
            </div>
          </div>
        </div>
      </section>

     {/* FOOTER */}
      <footer className="bg-[#080a0f] border-t border-zinc-900/50 py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center mb-8">
                 <img src="/logo.png" alt="AI Video Narrator Logo" className="w-12 h-12 opacity-80" />
            </div>

            <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed font-medium">
              © 2025 AI Video Narrator. The #1 AITA Video Maker for Reddit creators. 
              Built for the next generation of faceless channels.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-bold uppercase tracking-widest text-zinc-600">
                <Link to="/aita-video-maker" className="text-cyan-500/80 hover:text-cyan-400 transition-colors">AITA Video Maker</Link>
                <Link to="/generator" className="hover:text-white transition-colors">Generator</Link>
                <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                <a href="mailto:contact@aivideonarrator.com" className="hover:text-white transition-colors">Support</a>
            </div>

            <div className="mt-6 flex justify-center gap-6 text-[10px] text-zinc-700 uppercase tracking-tighter font-bold">
                <Link to="/terms" className="hover:text-zinc-400 transition-colors">Terms of Service</Link>
                <Link to="/privacy" className="hover:text-zinc-400 transition-colors">Privacy Policy</Link>
                <Link to="/refund" className="hover:text-zinc-400 transition-colors">Refund Policy</Link>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default AitaPage;
