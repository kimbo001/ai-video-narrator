import React from 'react';
import { AppConfig, VideoOrientation } from '../types';
import { Settings, Focus, Monitor, Smartphone, Mic, Ban } from 'lucide-react';

interface SettingsPanelProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

const GEMINI_VOICES = [
  { id: 'Kore', label: 'Kore (Female, Calm)' },
  { id: 'Puck', label: 'Puck (Male, Playful)' },
  { id: 'Charon', label: 'Charon (Male, Deep)' },
  { id: 'Fenrir', label: 'Fenrir (Male, Intense)' },
  { id: 'Aoede', label: 'Aoede (Female, Elegant)' },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ config, onConfigChange }) => {
  const handleChange = (field: keyof AppConfig, value: string | boolean) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-6 text-zinc-100 font-semibold border-b border-zinc-800 pb-4">
        <Settings className="w-5 h-5 text-indigo-400" />
        <h2>Configuration</h2>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Manual Mode Toggle */}
        <div className="flex items-center justify-between bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
          <span className="text-sm font-medium text-zinc-200">Manual Mode (upload own clips)</span>
          <button
            onClick={() => handleChange('manualMode', !config.manualMode)}
            className={`relative w-11 h-6 rounded-full transition-colors ${config.manualMode ? 'bg-cyan-500' : 'bg-zinc-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${config.manualMode ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Visual Subject Override */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Main Visual Subject</label>
          <div className="relative">
            <Focus className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={config.visualSubject || ''}
              onChange={(e) => handleChange('visualSubject', e.target.value)}
              placeholder="e.g. Rottweiler, Cyberpunk City"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600"
            />
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">Forces all generated media to match this specific subject.</p>
        </div>

        {/* Negative Prompt */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Negative Prompts <span className="text-zinc-500 font-normal">(Exclude)</span></label>
          <div className="relative">
            <Ban className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={config.negativePrompt || ''}
              onChange={(e) => handleChange('negativePrompt', e.target.value)}
              placeholder="e.g. people, text, blur, cat"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Narrator Voice</label>
          <div className="relative">
            <Mic className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <select
              value={config.voiceName}
              onChange={(e) => handleChange('voiceName', e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              {GEMINI_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none">
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Orientation */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Video Orientation</label>
          <div className="flex gap-3">
            <button
              onClick={() => handleChange('orientation', VideoOrientation.Landscape)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                config.orientation === VideoOrientation.Landscape
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Landscape
            </button>
            <button
              onClick={() => handleChange('orientation', VideoOrientation.Portrait)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                config.orientation === VideoOrientation.Portrait
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Portrait
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
