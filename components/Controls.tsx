import React, { useState } from 'react';
import { FireworkConfig } from '../types';
import { Settings2, X, RotateCcw } from 'lucide-react';

interface ControlsProps {
  config: FireworkConfig;
  onConfigChange: (newConfig: FireworkConfig) => void;
}

const Controls: React.FC<ControlsProps> = ({ config, onConfigChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof FireworkConfig, value: number | boolean) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleReset = () => {
     onConfigChange({
        particleCount: 150,
        gravity: 0.15,
        friction: 0.96,
        spread: 8,
        decayRate: 0.015,
        hueVariance: 30,
        baseSize: 2,
        trailEffect: true,
        starfield: true,
     });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-6 right-6 z-20 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all shadow-lg border border-white/10 group"
        aria-label="Open Settings"
      >
        <Settings2 className="w-6 h-6 group-hover:rotate-45 transition-transform duration-300" />
      </button>
    );
  }

  return (
    <div className="absolute top-6 right-6 z-20 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 text-white animate-in fade-in slide-in-from-top-5 duration-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-indigo-400" />
          Simulation Config
        </h2>
        <div className="flex gap-2">
            <button 
                onClick={handleReset}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                title="Reset to defaults"
            >
                <RotateCcw className="w-4 h-4 text-white/50" />
            </button>
            <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
            <X className="w-5 h-5 text-white/70" />
            </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Particle Count */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/70 uppercase tracking-wide">
            <label>Particles</label>
            <span>{config.particleCount}</span>
          </div>
          <input
            type="range"
            min="50"
            max="400"
            step="10"
            value={config.particleCount}
            onChange={(e) => handleChange('particleCount', parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
        </div>

        {/* Spread */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/70 uppercase tracking-wide">
            <label>Explosion Force</label>
            <span>{config.spread}</span>
          </div>
          <input
            type="range"
            min="2"
            max="20"
            step="1"
            value={config.spread}
            onChange={(e) => handleChange('spread', parseInt(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
          />
        </div>

        {/* Gravity */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/70 uppercase tracking-wide">
            <label>Gravity</label>
            <span>{config.gravity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            value={config.gravity}
            onChange={(e) => handleChange('gravity', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
          />
        </div>

        {/* Decay */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/70 uppercase tracking-wide">
            <label>Fade Speed</label>
            <span>{config.decayRate.toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.005"
            max="0.05"
            step="0.001"
            value={config.decayRate}
            onChange={(e) => handleChange('decayRate', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400 transition-all"
          />
        </div>
        
         {/* Base Size */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-white/70 uppercase tracking-wide">
            <label>Particle Size</label>
            <span>{config.baseSize}px</span>
          </div>
          <input
            type="range"
            min="1"
            max="8"
            step="0.5"
            value={config.baseSize}
            onChange={(e) => handleChange('baseSize', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
            {/* Toggle Trails */}
            <div className="flex flex-col gap-2">
                <label className="text-xs text-white/70 uppercase tracking-wide">Motion Trails</label>
                <button 
                    onClick={() => handleChange('trailEffect', !config.trailEffect)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${config.trailEffect ? 'bg-indigo-600' : 'bg-white/20'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${config.trailEffect ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Toggle Starfield */}
             <div className="flex flex-col gap-2">
                <label className="text-xs text-white/70 uppercase tracking-wide">Starfield</label>
                <button 
                    onClick={() => handleChange('starfield', !config.starfield)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative ${config.starfield ? 'bg-indigo-600' : 'bg-white/20'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${config.starfield ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;