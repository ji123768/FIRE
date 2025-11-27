import React, { useRef, useEffect, useCallback } from 'react';
import { Particle, FireworkConfig } from '../types';

interface FireworkCanvasProps {
  config: FireworkConfig;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxOpacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface Constellation {
  stars: { x: number; y: number }[];
  vx: number;
  vy: number;
  alpha: number;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  hue: number;
  trailTimer: number;
}

// Predefined constellation patterns (normalized coordinates 0-1)
const CONSTELLATION_PATTERNS = [
  // Big Dipper (Ursa Major)
  [
    { x: 0.0, y: 0.3 }, { x: 0.15, y: 0.2 }, { x: 0.3, y: 0.25 }, // Handle
    { x: 0.45, y: 0.35 }, { x: 0.45, y: 0.55 }, { x: 0.7, y: 0.55 }, { x: 0.7, y: 0.35 }, { x: 0.45, y: 0.35 } // Bowl
  ],
  // Cassiopeia (W shape)
  [
    { x: 0.0, y: 0.8 }, { x: 0.25, y: 0.2 }, { x: 0.5, y: 0.6 }, { x: 0.75, y: 0.2 }, { x: 1.0, y: 0.8 }
  ],
  // Orion (simplified)
  [
    { x: 0.2, y: 0.0 }, { x: 0.8, y: 0.0 }, // Shoulders
    { x: 0.35, y: 0.45 }, { x: 0.5, y: 0.45 }, { x: 0.65, y: 0.45 }, // Belt
    { x: 0.2, y: 0.9 }, { x: 0.8, y: 0.9 } // Knees
  ],
   // Scorpius (Hook shape)
  [
     { x: 0.8, y: 0.1}, { x: 0.7, y: 0.15}, { x: 0.6, y: 0.2}, // Head
     { x: 0.6, y: 0.4}, { x: 0.65, y: 0.6}, { x: 0.8, y: 0.75}, // Body
     { x: 0.9, y: 0.7}, { x: 0.95, y: 0.6} // Stinger
  ],
  // Leo (Sickle + Triangle)
  [
     { x: 0.6, y: 0.4 }, { x: 0.75, y: 0.5 }, { x: 0.9, y: 0.4 }, // Body triangle
     { x: 0.6, y: 0.4 }, { x: 0.5, y: 0.25 }, { x: 0.5, y: 0.1 }, { x: 0.35, y: 0.05 }, { x: 0.25, y: 0.15 } // Head hook
  ]
];

const FireworkCanvas: React.FC<FireworkCanvasProps> = ({ config }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const rocketsRef = useRef<Rocket[]>([]);
  const constellationsRef = useRef<Constellation[]>([]);
  const animationFrameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction state
  const isInteractionActive = useRef(false);
  const lastLaunchTime = useRef(0);

  // Helper to generate random number
  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  const initStars = useCallback((width: number, height: number) => {
    // Generate star density based on area
    const area = width * height;
    const starCount = Math.floor(area / 3000); // 1 star per 3000px^2
    const stars: Star[] = [];

    for (let i = 0; i < starCount; i++) {
      // Depth factor: 0.2 (far) to 1.0 (close)
      const depth = random(0.2, 1);
      
      // Size depends on depth (closer = bigger)
      const size = random(0.5, 2.5) * depth;

      stars.push({
        x: random(0, width),
        y: random(0, height),
        // Regular motion: All stars drift left (West)
        // Speed is proportional to depth (Parallax effect)
        vx: -0.2 * depth, 
        // Very slight uniform vertical drift to add organic feel
        vy: 0.02 * depth,
        size: size,
        // Opacity largely random but biased by depth (closer = brighter)
        maxOpacity: Math.min(1, random(0.4, 0.8) + (0.2 * depth)),
        twinklePhase: random(0, Math.PI * 2),
        twinkleSpeed: random(0.5, 2),
      });
    }
    starsRef.current = stars;
  }, []);

  const initConstellations = useCallback((width: number, height: number) => {
    const constellations: Constellation[] = [];
    const count = 4; // Number of constellations floating around

    for (let i = 0; i < count; i++) {
      const pattern = CONSTELLATION_PATTERNS[Math.floor(Math.random() * CONSTELLATION_PATTERNS.length)];
      // Scale pattern to a reasonable size
      const scale = random(100, 200);
      const startX = random(0, width);
      const startY = random(0, height);
      
      // Deep background movement (slower than stars)
      const depth = random(0.1, 0.15); 

      const stars = pattern.map(p => ({
        x: startX + p.x * scale,
        y: startY + p.y * scale
      }));

      constellations.push({
        stars,
        vx: -0.15 * depth, // Very slow drift
        vy: 0.01 * depth,
        alpha: random(0.1, 0.3) // Faint
      });
    }
    constellationsRef.current = constellations;
  }, []);

  // Helper to generate random color (HSL)
  const getRandomColor = useCallback(() => {
    const hue = Math.floor(Math.random() * 360);
    const variance = config.hueVariance;
    const h = Math.floor(random(hue - variance, hue + variance));
    const s = 100;
    const l = 60;
    return `hsl(${h}, ${s}%, ${l}%)`;
  }, [config.hueVariance]);

  // Launch a rocket from bottom to target
  const launchRocket = useCallback((targetX: number, targetY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const startX = targetX;
    const startY = canvas.height;
    
    // Random hue for this firework
    const hue = Math.floor(Math.random() * 360);

    // Calculate velocity needed? 
    // We'll use a constant speed approach for consistency, simpler than ballistic physics for this effect
    const speed = random(12, 15);

    rocketsRef.current.push({
      x: startX,
      y: startY,
      targetY: targetY,
      vx: random(-0.5, 0.5), // Slight wobble
      vy: -speed,
      hue: hue,
      trailTimer: 0
    });
  }, []);

  // Create explosion
  const createFirework = useCallback(
    (x: number, y: number, overrideHue?: number) => {
      const particleCount = config.particleCount;
      const baseColorHue = overrideHue !== undefined ? overrideHue : Math.floor(Math.random() * 360);

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

    const dpr = window.devicePixelRatio || 1;

    // Trail effect: draw semi-transparent black rect instead of clearing
    if (config.trailEffect) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Adjust trail length via opacity
      // Note: We use canvas.width/height directly but context is scaled, so we must cover logical dims
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Render Starfield
    if (config.starfield) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#ffffff';
        
        const time = Date.now() * 0.001;
        const logicalWidth = canvas.width / dpr;
        const logicalHeight = canvas.height / dpr;
        
        starsRef.current.forEach(star => {
            // Update position (Parallax Drift)
            star.x += star.vx;
            star.y += star.vy;

            // Wrap around screen
            if (star.x < 0) star.x = logicalWidth;
            if (star.x > logicalWidth) star.x = 0;
            if (star.y < 0) star.y = logicalHeight;
            if (star.y > logicalHeight) star.y = 0;

            // Calculate opacity based on sine wave for twinkling
            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
            const opacity = (star.maxOpacity * 0.7) + (twinkle * star.maxOpacity * 0.3);
            
            ctx.globalAlpha = Math.max(0, opacity);
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Render Constellations
        if (config.showConstellations) {
             constellationsRef.current.forEach(constellation => {
                // Update position
                constellation.stars.forEach(star => {
                    star.x += constellation.vx;
                    star.y += constellation.vy;
                });

                // Check bounds (if whole constellation is off screen, wrap it)
                // Use the first star as reference
                const refStar = constellation.stars[0];
                const width = 200; // Approx max width
                if (refStar.x < -width) {
                    const diff = logicalWidth + width + width;
                    constellation.stars.forEach(s => s.x += diff);
                }

                // Draw lines
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                // Set dash style for constellation lines
                ctx.setLineDash([4, 6]);
                
                constellation.stars.forEach((star, index) => {
                    if (index === 0) ctx.moveTo(star.x, star.y);
                    else ctx.lineTo(star.x, star.y);
                });
                ctx.stroke();
                
                // Reset dash
                ctx.setLineDash([]);

                // Draw constellation stars
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                constellation.stars.forEach(star => {
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                });
             });
        }
        
        ctx.globalAlpha = 1; // Reset alpha
    }

    ctx.globalCompositeOperation = 'lighter'; // Additive blending for glow effect

    // Update and draw Rockets
    for (let i = rocketsRef.current.length - 1; i >= 0; i--) {
        const rocket = rocketsRef.current[i];
        
        rocket.x += rocket.vx;
        rocket.y += rocket.vy;

        // Draw Rocket Head
        ctx.fillStyle = `hsl(${rocket.hue}, 100%, 75%)`;
        ctx.beginPath();
        // Rocket head looks elongated due to speed
        ctx.ellipse(rocket.x, rocket.y, 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trail emission (frequent but random)
        if (Math.random() < 0.5) {
             particlesRef.current.push({
                x: rocket.x,
                y: rocket.y,
                vx: (Math.random() - 0.5) * 0.5, // Slight spread
                vy: random(1, 3), // Falls down relative to rocket
                alpha: random(0.5, 1),
                color: `hsl(${rocket.hue}, 80%, 50%)`,
                size: random(0.5, 1.5),
                decay: random(0.03, 0.06), // Fast decay for trail
            });
        }

        // Check if reached target
        if (rocket.y <= rocket.targetY) {
            createFirework(rocket.x, rocket.targetY, rocket.hue);
            rocketsRef.current.splice(i, 1);
        }
    }

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
  }, [config, createFirework]);

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

        // Re-initialize stars on resize
        initStars(width, height);
        initConstellations(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [initStars, initConstellations]);

  // Start Animation Loop
  useEffect(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [render]);

  // Interaction Handlers
  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    launchRocket(x, y);
  }, [launchRocket]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isInteractionActive.current = true;
    handleInteraction(e.clientX, e.clientY);
    lastLaunchTime.current = Date.now();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isInteractionActive.current) return;
    
    const now = Date.now();
    // Throttle density: spawn every ~40ms while dragging
    if (now - lastLaunchTime.current > 40) { 
        handleInteraction(e.clientX, e.clientY);
        lastLaunchTime.current = now;
    }
  };

  const handleMouseUp = () => {
    isInteractionActive.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isInteractionActive.current = true;
    const touch = e.touches[0];
    handleInteraction(touch.clientX, touch.clientY);
    lastLaunchTime.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isInteractionActive.current) return;
    
    const now = Date.now();
    if (now - lastLaunchTime.current > 40) { 
        const touch = e.touches[0];
        handleInteraction(touch.clientX, touch.clientY);
        lastLaunchTime.current = now;
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full cursor-pointer z-0 touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default FireworkCanvas;