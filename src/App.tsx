
import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Generator from './components/Generator';
import Pricing from './components/Pricing';
import Legal from './components/Legal';
import { Page } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  // Handle initial deep linking from URL (e.g. ?page=legal)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageParam = params.get('page');
    if (pageParam && ['home', 'generator', 'pricing', 'legal'].includes(pageParam)) {
        setCurrentPage(pageParam as Page);
    }
  }, []);

  // Helper to handle type-safe navigation and update URL
  const handleNavigate = (page: string) => {
      if (['home', 'generator', 'pricing', 'legal'].includes(page)) {
          const target = page as Page;
          setCurrentPage(target);
          // Optional: Update URL without reloading so users can copy/paste links
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('page', target);
          window.history.pushState({}, '', newUrl);
      } else {
          console.warn(`Attempted to navigate to unknown page: ${page}`);
          setCurrentPage('home');
      }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <LandingPage onStart={() => handleNavigate('generator')} onNavigate={handleNavigate} />;
      case 'generator':
        return <Generator onBack={() => handleNavigate('home')} />;
      case 'pricing':
        return <Pricing onBack={() => handleNavigate('home')} onNavigate={handleNavigate} />;
      case 'legal':
        return <Legal onBack={() => handleNavigate('home')} />;
      default:
        return <LandingPage onStart={() => handleNavigate('generator')} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-zinc-300 font-sans selection:bg-cyan-500/30 flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-[#0b0e14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <button onClick={() => handleNavigate('home')} className="flex items-center gap-2 group">
            <img src="/logo.png" alt="AI Video Narrator" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
            <span className="font-bold text-white text-lg tracking-tight">AI Video Narrator</span>
          </button>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => handleNavigate('home')} 
              className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Home
            </button>
            <button 
              onClick={() => handleNavigate('pricing')} 
              className={`text-sm font-medium transition-colors ${currentPage === 'pricing' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Pricing
            </button>
            <button 
              onClick={() => handleNavigate('legal')} 
              className={`text-sm font-medium transition-colors ${currentPage === 'legal' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Terms & Privacy
            </button>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleNavigate('generator')}
              className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              App Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full h-full">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#0b0e14] py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} AI Video Narrator. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button onClick={() => handleNavigate('legal')} className="text-zinc-500 hover:text-zinc-300 text-sm">Privacy Policy</button>
            <button onClick={() => handleNavigate('legal')} className="text-zinc-500 hover:text-zinc-300 text-sm">Terms of Service</button>
            <button onClick={() => handleNavigate('legal')} className="text-zinc-500 hover:text-zinc-300 text-sm">Refund Policy</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
