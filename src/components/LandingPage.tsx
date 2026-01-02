import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Zap, Star, Clock, Users, TrendingUp, Video, X } from 'lucide-react';
import VideoCounter from './VideoCounter';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  return (
  <div className="flex flex-col min-h-full">
    {/* VIDEO MODAL */}
    {showDemo && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-4xl aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
          <button onClick={() => setShowDemo(false)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <video autoPlay controls className="w-full h-full object-contain">
            <source src="/demo.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    )}

    <header className="relative pt-20 pb-20 flex-1 flex flex-col justify-center text-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#0b0e14] to-[#0b0e14] pointer-events-none"></div>
      <div className="relative z-10 animate-fade-in-up">
        <div className="flex justify-center mb-8"><img src="/logo.png" alt="AI Video Narrator Logo" className="w-24 h-24 object-contain" /></div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 italic">AI Video Narrator</span> <br />For Faceless Channels</h1>
        <p className="text-xl text-zinc-400 mb-8 max-w-3xl mx-auto leading-relaxed">The all-in-one factory for AITA, Reddit, and Motivational creators. Turn any text into viral, narrated videos in 60 seconds.</p>

        {/* COUNTER AND BADGES */}
        <div className="mb-10 flex flex-col items-center gap-6">
          <VideoCounter />
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://www.producthunt.com/products/ai-video-narrator-2" target="_blank" rel="noopener noreferrer">
              <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1055573&theme=light" alt="Product Hunt" width="250" height="54" className="rounded-lg shadow-lg hover:scale-105 transition-transform" />
            </a>
            <a href="https://peerpush.net/p/ai-video-narrator-free-text-to-video" target="_blank" rel="noopener noreferrer">
              <img src="https://peerpush.net/p/ai-video-narrator-free-text-to-video/badge.png" alt="PeerPush" width="230" className="rounded-lg shadow-lg hover:scale-105 transition-transform" />
            </a>
          </div>
        </div>

        {/* BUTTONS REORDERED */}
        <div className="flex flex-col lg:flex-row gap-4 justify-center items-center">
          
          {/* 1. WATCH DEMO (Colored/Bordered) */}
          <button onClick={() => setShowDemo(true)} className="px-8 py-4 bg-transparent hover:bg-cyan-500/10 text-white font-semibold text-lg rounded-xl border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all flex items-center gap-2 transform hover:scale-105">
            <Video className="w-5 h-5 text-cyan-400" /> Watch Demo
          </button>

          {/* 2. VIEW PRICING (Dark) */}
          <button onClick={() => navigate('/pricing')} className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-lg rounded-xl border border-zinc-700 transition-all flex items-center gap-2 transform hover:scale-105">
            <Zap className="w-5 h-5 text-yellow-400" /> View Pricing
          </button>

          {/* 3. SIGN IN (Gradient Primary) */}
          <button onClick={() => navigate('/generator')} className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-lg rounded-xl shadow-xl shadow-cyan-500/40 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95">
            <Play className="w-5 h-5 fill-current" /> Sign in To Create For Free
          </button>

        </div>
      </div>
    </header>

    <section className="py-20 bg-[#0b0e14] border-t border-zinc-900/50 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Stop Spending Hours on Videos That Get 47 Views</h2><p className="text-zinc-400 max-w-3xl mx-auto text-lg">While your competitors post 3x per day and steal your audience</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">The Old Way (Don't Do This)</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><span className="text-red-500 text-sm">✗</span></div><div><h4 className="text-white font-semibold">Spend 3+ hours per video</h4><p className="text-zinc-400 text-sm">Recording, editing, voiceovers, stock footage hunting</p></div></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><span className="text-red-500 text-sm">✗</span></div><div><h4 className="text-white font-semibold">Buy expensive equipment</h4><p className="text-zinc-400 text-sm">Camera, microphone, lighting, editing software</p></div></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><span className="text-red-500 text-sm">✗</span></div><div><h4 className="text-white font-semibold">Show your face on camera</h4><p className="text-zinc-400 text-sm">Anxiety, privacy concerns, inconsistent appearance</p></div></div>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">The New Way (Do This Instead)</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><span className="text-green-500 text-sm">✓</span></div><div><h4 className="text-white font-semibold">Create in 30 seconds</h4><p className="text-zinc-400 text-sm">Paste text → AI generates everything → Done</p></div></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><span className="text-green-500 text-sm">✓</span></div><div><h4 className="text-white font-semibold">Zero equipment needed</h4><p className="text-zinc-400 text-sm">Just your computer and internet connection</p></div></div>
              <div className="flex items-start gap-3"><div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1"><span className="text-green-500 text-sm">✓</span></div><div><h4 className="text-white font-semibold">Stay completely anonymous</h4><p className="text-zinc-400 text-sm">Professional videos without showing your face</p></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer className="bg-[#080a0f] border-t border-zinc-900/50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div><h4 className="text-white font-semibold mb-4">Solutions</h4><ul className="space-y-2 text-sm text-zinc-400"><li><Link to="/aita-video-maker" className="hover:text-cyan-400 transition-colors font-medium">AITA Video Maker</Link></li><li><Link to="/generator" className="hover:text-white transition-colors">Video Generator</Link></li><li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li></ul></div>
          <div><h4 className="text-white font-semibold mb-4">Support</h4><ul className="space-y-2 text-sm text-zinc-400"><li><a href="mailto:contact@aivideonarrator.com" className="hover:text-white transition-colors">Contact Us</a></li><li><Link to="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li><li><a href="#features" className="hover:text-white transition-colors">Features</a></li></ul></div>
          <div><h4 className="text-white font-semibold mb-4">Legal</h4><ul className="space-y-2 text-sm text-zinc-400"><li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li><li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li></ul></div>
        </div>
        <div className="border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
          <p>© 2025 AI Video Narrator. The #1 Reddit Story to Video Tool.</p>
          <p className="mt-2 text-xs opacity-50 text-zinc-600 uppercase tracking-widest font-bold">Made with ❤️ for creators worldwide</p>
        </div>
      </div>
    </footer>
  </div>
  );
};

export default LandingPage;
