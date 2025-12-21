// src/components/Generator.tsx - FULL CODE WITH EXPORT FIX ONLY

import React, { useState, useRef, useEffect } from 'react';
import { useSafeUser } from '../lib/useSafeUser';
import { AppConfig, VideoOrientation, Scene, GenerationStatus } from '../types';
import VideoPlayer from './VideoPlayer';
import { analyzeScript, generateNarration } from '../services/gemini';
import { fetchPixabayMedia, fetchPixabayAudio } from '../services/pixabay';
import { fetchPexelsMedia } from '../services/pexels';
import { fetchUnsplashMedia } from '../services/unsplash';
import { Loader2, Wand2, RefreshCw, Upload, ArrowLeft, Trash2, FileVideo, ImageIcon, Plus, Music, Volume2, Focus, Ban } from 'lucide-react';
import SettingsPanel from './SettingsPanel';

const DEFAULT_SCRIPT = "In the heart of an ancient forest, sunlight filters through the dense canopy. A gentle stream winds its way over mossy rocks, singing a quiet song. Suddenly, a majestic deer steps into the clearing, ears twitching at the sound of the wind. Nature pauses, holding its breath in a moment of perfect tranquility.";
const DEFAULT_PIXABAY_KEY = "21014376-3347c14254556d44ac7acb25e";
const DEFAULT_PEXELS_KEY = "2BbnKbFvEGwKENV4lhRTrQwu3txrXFsisvTjNlrqYYytWjACy9PmwkoM";
const DEFAULT_UNSPLASH_KEY = "inICXEimMWagCfHA86bD4k9MprjkgEFmG0bW9UREkOo";

interface GeneratorProps {
  onBack: () => void;
}

interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
}

const Generator: React.FC<GeneratorProps> = ({ onBack }) => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [config, setConfig] = useState<AppConfig>({
    pixabayApiKey: DEFAULT_PIXABAY_KEY,
    pexelsApiKey: DEFAULT_PEXELS_KEY,
    unsplashApiKey: DEFAULT_UNSPLASH_KEY,
    orientation: VideoOrientation.Portrait,
    visualSubject: '',
    voiceName: 'Kore',
    negativePrompt: '',
  });
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [generationStatus, setGenerationStatus] = useState('idle');
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const { user } = useSafeUser();
  const userId = user?.id || `anon-${Math.random().toString(36).slice(2, 11)}`;

  const videoRef = useRef<HTMLVideoElement>(null);

  // ... (all your existing useEffect, handle functions, etc. unchanged)

  const handleExport = async () => {
    if (!finalVideoUrl) return;

    try {
      setExportStatus('downloading');

      // Fetch the video as a blob to ensure full, valid bytes
      const response = await fetch(finalVideoUrl);
      if (!response.ok) throw new Error('Failed to fetch video');

      const blob = await response.blob();

      // Create a proper downloadable URL
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-narrated-video-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 5000);
    }
  };

  // ... (rest of your component unchanged)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e14] to-black text-white">
      {/* Your full existing JSX – unchanged */}
      {/* ... all your UI code ... */}

      {/* Export button section – only this part changed slightly for status */}
      {finalVideoUrl && (
        <div className="mt-8 text-center">
          <button
            onClick={handleExport}
            disabled={exportStatus === 'downloading'}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold text-lg shadow-xl hover:from-cyan-400 hover:to-blue-400 transition transform hover:scale-105 disabled:opacity-70"
          >
            {exportStatus === 'downloading' ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Downloading...
              </>
            ) : exportStatus === 'success' ? (
              'Downloaded!'
            ) : exportStatus === 'error' ? (
              'Download Failed – Try Again'
            ) : (
              <>
                <FileVideo className="w-6 h-6" />
                Export Video
              </>
            )}
          </button>
        </div>
      )}

      {/* ... rest of JSX unchanged ... */}
    </div>
  );
};

export default Generator;
