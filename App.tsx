import React, { useState } from 'react';
import FireworkCanvas from './components/FireworkCanvas';
import Controls from './components/Controls';
import { FireworkConfig } from './types';

// Lucide icons
import { Sparkles } from 'lucide-react';

const INITIAL_CONFIG: FireworkConfig = {
  particleCount: 150,
  gravity: 0.15,
  friction: 0.96,
  spread: 8,
  decayRate: 0.015,
  hueVariance: 30,
  baseSize: 2,
  trailEffect: true,
};

const App: React.FC = () => {
  const [config, setConfig] = useState<FireworkConfig>(INITIAL_CONFIG);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* Background Canvas */}
      <FireworkCanvas config={config} />

      {/* Header / Title Overlay */}
      <div className="absolute top-6 left-6 pointer-events-none z-10 select-none">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 flex items-center gap-3 drop-shadow-lg">
          <Sparkles className="w-8 h-8 text-pink-400" />
          Lumière
        </h1>
        <p className="text-white/60 text-sm mt-1 ml-1 tracking-wider">
          Interactive Particle Symphony
        </p>
      </div>

      {/* Helper Text */}
      <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none select-none animate-pulse">
        <p className="text-white/30 text-sm uppercase tracking-[0.2em]">
          Click anywhere to ignite
        </p>
      </div>

      {/* Control Panel */}
      <Controls config={config} onConfigChange={setConfig} />
    </div>
  );
};

export default App;