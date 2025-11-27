import React, { useRef, useEffect, useCallback } from 'react';
import { Particle, FireworkConfig } from '../types';

interface FireworkCanvasProps {
  config: FireworkConfig;
}

const FireworkCanvas: React.FC<FireworkCanvasProps> = ({ config }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to generate random number
  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  // Helper to generate random color (HSL)
  const getRandomColor = useCallback(() => {
    const hue = Math.floor(Math.random() * 360);
    const variance = config.hueVariance;
    const h = Math.floor(random(hue - variance, hue + variance));
    const s = 100;
    const l = 60;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }, [config.hueVariance]);

  // Create explosion
  const createFirework = useCallback(
    (x: number, y: number) => {
      const particleCount = config.particleCount;
      const baseColorHue = Math.floor(Math.random() * 360);

      for (let i = 0; i < particleCount; i++) {
        const angle = random(0, Math.PI * 2);
        const velocity = random(0, config.spread); // Use spread from config
        
        // Randomize hue slightly per particle based on base color
        const hue = Math.floor(random(baseColorHue - 20, baseColorHue + 20));
        const color = `hsl(${hue}, 100%, 65%)`;

        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          alpha: 1,
          color: color,
          size: random(1, config.baseSize), // Use baseSize from config
          decay: random(config.decayRate * 0.5, config.decayRate * 1.5),
        });
      }
    },
    [config]
  );

  // Animation Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trail effect: draw semi-transparent black rect instead of clearing
    if (config.trailEffect) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Adjust trail length via opacity
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.globalCompositeOperation = 'lighter'; // Additive blending for glow effect

    // Update and draw particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];

      // Physics
      p.vx *= config.friction;
      p.vy *= config.friction;
      p.vy += config.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      // Remove dead particles
      if (p.alpha <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      // Draw
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    animationFrameRef.current = requestAnimationFrame(render);
  }, [config]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Handle High DPI
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = width * dpr;
        canvasRef.current.height = height * dpr;
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.scale(dpr, dpr);
        
        canvasRef.current.style.width = `${width}px`;
        canvasRef.current.style.height = `${height}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Start Animation Loop
  useEffect(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [render]);

  // Click Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    createFirework(x, y);
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full cursor-pointer z-0"
      onClick={handleCanvasClick}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default FireworkCanvas;