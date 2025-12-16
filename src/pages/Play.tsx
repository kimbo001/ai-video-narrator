// src/pages/Play.tsx
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import FlappyNarrator from '@/components/FlappyNarrator';

const PlayPage: React.FC = () => {
  const { user } = useUser();
  // signed-in → real id, signed-out → anon random id
  const userId = user?.id ?? 'anon-' + Math.random().toString(36).slice(2, 11);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-center mb-2">Narration Flap</h1>
        <p className="text-center text-zinc-400 mb-8">Beat the AI narrator’s timing and win a free month of Pro.</p>

        <FlappyNarrator userId={userId} />

        <div className="mt-8 text-center text-xs text-zinc-500">
          {user
            ? `Playing as ${user.emailAddresses[0]?.emailAddress}`
            : 'Playing as guest – sign in to keep your name on the leaderboard.'}
        </div>
      </div>
    </div>
  );
};

export default PlayPage;
