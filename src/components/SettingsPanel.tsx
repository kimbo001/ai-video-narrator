import React from 'react';
import { AppConfig, VideoOrientation } from '../types';
import { Settings, Monitor, Smartphone, Mic } from 'lucide-react';

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
  const handleChange = (field: keyof AppConfig, value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-5 pb-4 border-b border-zinc-800">
        <Settings className="w-5 h-5 text-indigo-400" />
        <h2>Global Settings</h2>
      </div>

      <div className="flex flex-col gap-5">
        {/* Voice Selection */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Narrator Voice
          </label>
          <div className="relative">
            <Mic className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
            <select
              value={config.voiceName}
              onChange={(e) => handleChange('voiceName', e.target.value)}
              className="w-full bg-[#0b0e14] border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:ring-1 focus:ring-cyan-500 outline-none appearance-none cursor-pointer"
            >
              {GEMINI_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {/* Orientation */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            Video Orientation
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => handleChange('orientation', VideoOrientation.Landscape)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                config.orientation === VideoOrientation.Landscape
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                  : 'bg-[#0b0e14] border-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Monitor className="w-4 h-4" />
              Landscape
            </button>
            <button
              onClick={() => handleChange('orientation', VideoOrientation.Portrait)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${
                config.orientation === VideoOrientation.Portrait
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                  : 'bg-[#0b0e14] border-zinc-800 text-zinc-400 hover:text-zinc-300'
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
