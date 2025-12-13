import React, { useState } from 'react';
import { AppConfig, VideoOrientation } from '../types';
import { Settings, Focus, Monitor, Smartphone, Mic, Ban, Sliders } from 'lucide-react';

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
  const [showAdvanced, setShowAdvanced] = useState(true);

  const handleChange = (field: keyof AppConfig, value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <div className="bg-[#11141b] border border-zinc-800 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2>Configuration</h2>
        </div>
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

        {/* Advanced Toggle */}
        <div className="flex items-center justify-between pt-2">
             <span className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                 <Sliders className="w-3.5 h-3.5" />
                 Advanced Visual Controls
             </span>
             <label className="relative inline-flex items-center cursor-pointer">
                <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={showAdvanced}
                    onChange={(e) => setShowAdvanced(e.target.checked)}
                />
                <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
        </div>

        {/* Advanced Fields */}
        {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Main Visual Subject
                </label>
                <div className="relative">
                    <Focus className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                    type="text"
                    value={config.visualSubject || ''}
                    onChange={(e) => handleChange('visualSubject', e.target.value)}
                    placeholder="e.g. Cyberpunk City"
                    className="w-full bg-[#0b0e14] border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:ring-1 focus:ring-cyan-500 outline-none placeholder:text-zinc-600"
                    />
                </div>
                </div>

                <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">
                    Negative Prompts <span className="text-zinc-600">(Exclude)</span>
                </label>
                <div className="relative">
                    <Ban className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                    type="text"
                    value={config.negativePrompt || ''}
                    onChange={(e) => handleChange('negativePrompt', e.target.value)}
                    placeholder="e.g. text, blurry"
                    className="w-full bg-[#0b0e14] border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:ring-1 focus:ring-cyan-500 outline-none placeholder:text-zinc-600"
                    />
                </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
