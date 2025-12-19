// src/pages/Play.tsx - MINIMAL WRAPPER
import React from 'react';
import { useSafeUser } from '../lib/useSafeUser';
import FlappyNarrator from '@/components/FlappyNarrator';
import ErrorBoundary from '@/components/ErrorBoundary';

const PlayPage: React.FC = () => {
  const { user } = useSafeUser();
  const userId = user?.id ?? 'anon-' + Math.random().toString(36).slice(2, 11);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e14] to-black">
      <ErrorBoundary>
        <FlappyNarrator userId={userId} />
      </ErrorBoundary>
    </div>
  );
};

export default PlayPage;
