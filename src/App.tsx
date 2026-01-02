import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, Outlet } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, SignInButton, UserButton } from '@clerk/clerk-react';
import { HelmetProvider } from 'react-helmet-async';

// Blog Imports
import BlogIndex from './pages/blog';
import PostA from './pages/blog/PostA';
import PostB from './pages/blog/PostB';
import PostC from './pages/blog/PostC';

// Component Imports
import LandingPage from './components/LandingPage';
import AitaPage from './components/AitaPage';
import Generator from './components/Generator';
import Pricing from './components/Pricing';
import Legal from './components/Legal';
import './index.css';

// Ensure this matches your Vercel Environment Variable name exactly
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

/* ----------  LAYOUT COMPONENT (Nav & Footer)  ---------- */
const Layout = () => {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-zinc-300 font-sans flex flex-col">
      <nav className="border-b border-zinc-800 bg-[#0b0e14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-white text-lg tracking-tight">AI Video Narrator</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Home</Link>
            <Link to="/pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link to="/blog" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Blog</Link>
            <Link to="/legal" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Terms & Privacy</Link>
          </div>

          {/* THE SIGN IN BUTTON AREA */}
          <div className="flex items-center gap-4">
            {clerkPubKey ? (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <div className="flex items-center gap-4">
                    <Link to="/generator" className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors">
                      Studio
                    </Link>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </SignedIn>
              </>
            ) : (
              // Fallback if Clerk key is missing (local dev)
              <Link to="/generator" className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200">
                Open App
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet /> 
      </main>

      <Analytics />
      
      <footer className="border-t border-zinc-800 bg-[#0b0e14] py-12 mt-auto text-center text-sm text-zinc-500">
        <p>© 2025 AI Video Narrator. All rights reserved.</p>
      </footer>
    </div>
  );
};

/* ----------  MAIN APP COMPONENT  ---------- */
export default function App() {
  const routerContent = (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/aita-video-maker" element={<AitaPage />} />
        <Route path="/legal" element={<Legal page="terms" />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/ai-script-to-video-narrated" element={<PostA />} />
        <Route path="/blog/pictory-vs-ai-video-narrator" element={<PostB />} />
        <Route path="/blog/ai-voice-over-generators-tiktok-reels" element={<PostC />} />
      </Route>

      {/* Generator is outside layout so it has its own custom header */}
      <Route path="/generator" element={<Generator onBack={() => window.history.back()} />} />
      
      <Route path="/sign-in/*" element={<RedirectToSignIn />} />
      <Route path="/sign-up/*" element={<RedirectToSignIn />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <HelmetProvider>
      <BrowserRouter>
        {clerkPubKey ? (
          <ClerkProvider publishableKey={clerkPubKey}>
            {routerContent}
          </ClerkProvider>
        ) : (
          routerContent
        )}
      </BrowserRouter>
    </HelmetProvider>
  );
}
