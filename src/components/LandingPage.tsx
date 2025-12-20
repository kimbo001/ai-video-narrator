import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Play, Sparkles, Zap, Star, Monitor, Smartphone, Youtube, Video, Clock, Users, TrendingUp, Award, CheckCircle } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-full">
      {/* HERO SECTION - COMPLETELY NEW */}
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
            Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Viral Videos</span> <br />
            In Seconds
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Turn any text into professional, narrated videos for TikTok, YouTube Shorts, and Reels. 
            No camera. No microphone. No editing skills required.
          </p>
          
          {/* NEW: Social Proof Bar */}
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-400 mb-8">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> 1000+ Creators</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> Reddit Loved</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> 5 Front Pages</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/generator')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-lg rounded-xl shadow-xl shadow-cyan-500/40 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
              aria-label="Start generating video for free"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Creating Free
            </button>
            <button 
              onClick={() => navigate('/pricing')}
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-lg rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
              aria-label="View pricing plans"
            >
              <Zap className="w-5 h-5 text-yellow-400" />
              View Pricing
            </button>
          </div>

          {/* NEW: Trust Indicators */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-zinc-500">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> No Credit Card</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 30 Seconds Setup</span>
            <span className="flex items-center gap-1"><Youtube className="w-4 h-4" /> All Platforms</span>
          </div>
        </div>
      </header>

      {/* NEW: Problem/Solution Section */}
      <section className="py-20 bg-[#0b0e14] border-t border-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Stop Spending Hours on Videos That Get 47 Views
            </h2>
            <p className="text-zinc-400 max-w-3xl mx-auto text-lg">
              While your competitors post 3x per day and steal your audience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">The Old Way (Don't Do This)</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-500 text-sm">✗</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Spend 3+ hours per video</h4>
                    <p className="text-zinc-400 text-sm">Recording, editing, voiceovers, stock footage hunting</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-500 text-sm">✗</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Buy expensive equipment</h4>
                    <p className="text-zinc-400 text-sm">Camera, microphone, lighting, editing software</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-500 text-sm">✗</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Show your face on camera</h4>
                    <p className="text-zinc-400 text-sm">Anxiety, privacy concerns, inconsistent appearance</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">The New Way (Do This Instead)</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-500 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Create in 30 seconds</h4>
                    <p className="text-zinc-400 text-sm">Paste text → AI generates everything → Done</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-500 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Zero equipment needed</h4>
                    <p className="text-zinc-400 text-sm">Just your computer and internet connection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-500 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Stay completely anonymous</h4>
                    <p className="text-zinc-400 text-sm">Professional videos without showing your face</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: How It Works */}
      <section className="py-20 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Actually Works
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Literally just paste your text and get videos. That's it.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-cyan-400 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Paste Your Text</h3>
              <p className="text-zinc-400">Copy any text - script, idea, or random thoughts. Our AI analyzes it and breaks it into scenes.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-cyan-400 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI Creates Everything</h3>
              <p className="text-zinc-400">AI generates human-like voiceover, finds perfect stock footage, and matches everything to your text.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <span className="text-cyan-400 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Export & Post</h3>
              <p className="text-zinc-400">Download your video in any format. Post to TikTok, YouTube, Instagram - whatever platform you want.</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => navigate('/generator')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-lg rounded-xl shadow-xl shadow-cyan-500/40 transition-all flex items-center gap-2 transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-current" />
              Try It Now (Takes 30 Seconds)
            </button>
          </div>
        </div>
      </section>

      {/* NEW: Features Grid */}
      <section className="py-20 bg-[#0b0e14] border-t border-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Why Creators Switch to AI Video Narrator</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Features that actually matter for growing your channel
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Save 10+ Hours Per Week</h3>
              <p className="text-zinc-400 leading-relaxed">
                What took you 3 hours now takes 30 seconds. Create more content in less time.
              </p>
            </article>

            <article className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Stay Anonymous</h3>
              <p className="text-zinc-400 leading-relaxed">
                Build your brand without showing your face. Perfect for privacy-conscious creators.
              </p>
            </article>

            <article className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Post Daily Consistently</h3>
              <p className="text-zinc-400 leading-relaxed">
                Remove the friction that stops you from posting. Create content daily without burnout.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* NEW: Social Proof & Testimonials */}
      <section className="py-20 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">What Creators Are Saying</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Real feedback from real users
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-800 p-8 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-zinc-300 mb-4">"I really loved your app. It was bit addicting to try different stories."</p>
              <p className="text-zinc-500 text-sm">- Guilty_Tear_4477, Reddit user</p>
            </div>
            
            <div className="bg-zinc-800 p-8 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-zinc-300 mb-4">"Finally, an AI tool that does what it promises without requiring my credit card first."</p>
              <p className="text-zinc-500 text-sm">- Reddit user</p>
            </div>
            
            <div className="bg-zinc-800 p-8 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                ))}
              </div>
              <p className="text-zinc-300 mb-4">"Perfect for faceless channels. I've been posting daily for 2 months straight."</p>
              <p className="text-zinc-500 text-sm">- Creator from r/SideProject</p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: CTA Section */}
      <section className="py-20 bg-gradient-to-b from-zinc-900 to-[#0b0e14] border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Create Videos That Actually Get Views?
          </h2>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Join 1000+ creators who've already made the switch. Start creating in 30 seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => navigate('/generator')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-lg rounded-xl shadow-xl shadow-cyan-500/40 transition-all flex items-center gap-2 transform hover:scale-105"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Creating Free
            </button>
            <button 
              onClick={() => navigate('/pricing')}
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-lg rounded-xl border border-zinc-700 transition-all flex items-center gap-2"
            >
              <Zap className="w-5 h-5 text-yellow-400" />
              View Pricing
            </button>
          </div>
          
          <p className="text-zinc-500 text-sm mt-6">No credit card required • 5 videos daily • Instant access</p>
        </div>
      </section>

      {/* FOOTER - UPDATED */}
      <footer className="bg-[#080a0f] border-t border-zinc-900/50 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link to="/generator" className="hover:text-white transition-colors">Video Generator</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="mailto:contact@aivideonarrator.com" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><Link to="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="https://kimbosaurus.gumroad.com/l/AIVideoNarrator" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Get Lifetime License</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-zinc-800 pt-8 text-center text-sm text-zinc-500">
            <p>© 2025 AI Video Narrator. All rights reserved.</p>
            <p className="mt-2">Made with ❤️ for creators worldwide</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
