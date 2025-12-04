
import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Generator from './components/Generator';
import Pricing from './components/Pricing';
import Legal from './components/Legal';
import { Video, Shield, CreditCard, Home } from 'lucide-react';
import { Page } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <LandingPage onStart={() => setCurrentPage('generator')} onNavigate={setCurrentPage} />;
      case 'generator':
        return <Generator onBack={() => setCurrentPage('home')} />;
      case 'pricing':
        return <Pricing onBack={() => setCurrentPage('home')} onNavigate={setCurrentPage} />;
      case 'legal':
        return <Legal onBack={() => setCurrentPage('home')} />;
      default:
        return <LandingPage onStart={() => setCurrentPage('generator')} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-zinc-300 font-sans selection:bg-cyan-500/30 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-[#0b0e14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <button onClick={() => setCurrentPage('home')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Video className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">AI Narrator</span>
          </button>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setCurrentPage('home')} 
              className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentPage('pricing')} 
              className={`text-sm font-medium transition-colors ${currentPage === 'pricing' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Pricing
            </button>
            <button 
              onClick={() => setCurrentPage('legal')} 
              className={`text-sm font-medium transition-colors ${currentPage === 'legal' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Terms & Privacy
            </button>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentPage('generator')}
              className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              App Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#0b0e14] py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} AI Video Narrator. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button onClick={() => setCurrentPage('legal')} className="text-zinc-500 hover:text-zinc-300 text-sm">Privacy Policy</button>
            <button onClick={() => setCurrentPage('legal')} className="text-zinc-500 hover:text-zinc-300 text-sm">Terms of Service</button>
            <button onClick={() => setCurrentPage('legal')} className="text-zinc-500 hover:text-zinc-300 text-sm">Refund Policy</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
