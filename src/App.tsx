import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';

import LandingPage from './components/LandingPage';
import Generator from './components/Generator';
import Pricing from './components/Pricing';
import Legal from './components/Legal';

/* ==========  ROOT LAYOUT  ========== */
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#0b0e14] text-zinc-300 font-sans selection:bg-cyan-500/30 flex flex-col">
    <nav className="border-b border-zinc-800 bg-[#0b0e14]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="AI Video Narrator" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
          <span className="font-bold text-white text-lg tracking-tight">AI Video Narrator</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-zinc-400 hover:text-white">Home</Link>
          <Link to="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white">Pricing</Link>
          <Link to="/legal" className="text-sm font-medium text-zinc-400 hover:text-white">Terms & Privacy</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/generator" className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors">
            App Dashboard
          </Link>
        </div>
      </div>
    </nav>

    <main className="flex-1 flex flex-col w-full h-full">{children}</main>

    <Analytics />

    <footer className="border-t border-zinc-800 bg-[#0b0e14] py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} AI Video Narrator. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link to="/legal" className="text-zinc-500 hover:text-zinc-300 text-sm">Privacy Policy</Link>
          <Link to="/legal" className="text-zinc-500 hover:text-zinc-300 text-sm">Terms of Service</Link>
          <Link to="/legal" className="text-zinc-500 hover:text-zinc-300 text-sm">Refund Policy</Link>
          <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 text-sm">Robots.txt</a>
          <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300 text-sm">Sitemap</a>
        </div>
      </div>
    </footer>
  </div>
);

/* ==========  ROUTER  ========== */
const App: React.FC = () => (
  <BrowserRouter>
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/generator" element={<Generator onBack={() => window.history.back()} />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/legal" element={<Legal onBack={() => window.history.back()} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  </BrowserRouter>
);

export default App;
