export interface Point {
  x: number;
  y: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  decay: number;
}

export interface FireworkConfig {
  particleCount: number;
  gravity: number;
  friction: number;
  spread: number;
  decayRate: number;
  hueVariance: number;
  baseSize: number;
  trailEffect: boolean;
}