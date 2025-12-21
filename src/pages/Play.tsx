// src/pages/Play.tsx
import React from 'react';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import FlappyNarrator from '@/components/FlappyNarrator';
import ErrorBoundary from '@/components/ErrorBoundary';

const PlayPage: React.FC = () => {
  const { user, isLoaded } = useUser();

  // Generate temporary guest ID
  const guestId = `anon-${Math.random().toString(36).slice(2)}`;
  const userId = user?.id || guestId;

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0b0e14] to-black">
        <p className="text-3xl text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#0b0e14] to-black">
      {/* Title */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <h1 className="mb-8 text-center text-5xl font-bold tracking-tight md:text-7xl">
          <span className="bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
            Narration Flap
          </span>
        </h1>
        <p className="mb-12 max-w-2xl text-center text-xl text-zinc-400">
          Flap the flying microphone through gaps shaped by AI narration
        </p>

        <ErrorBoundary>
          <FlappyNarrator userId={userId} />
        </ErrorBoundary>

        {/* Guest notice */}
        <SignedOut>
          <div className="mt-12 text-center">
            <p className="text-zinc-400">
              Playing as guest – 5 videos per day free
            </p>
            <p className="mt-4 text-cyan-400">
              <a href="/pricing" className="underline hover:text-cyan-300">
                Sign in to upgrade → New Tuber (10/day), Creator (25/day), Pro (50/day)
              </a>
            </p>
          </div>
        </SignedOut>

        {/* Signed in user – show upgrade link */}
        <SignedIn>
          <div className="mt-12 text-center">
            <a href="/pricing" className="text-cyan-400 underline hover:text-cyan-300">
              Upgrade for more videos per day
            </a>
          </div>
        </SignedIn>
      </div>
    </div>
  );
};

export default PlayPage;
