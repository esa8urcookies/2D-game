// A lightweight particle system for visual juice: death bursts,
// pickup sparkles, and the like.
//
// Particles live in one flat array with a HARD CAP, so no amount of
// on-screen chaos can blow up memory or frame time — once the pool is
// full, new emissions are simply skipped. Each particle is a small
// fading square, drawn with plain fillRect for a crisp pixel feel.

import { randomRange } from '../core/MathUtils.js';
import { EFFECTS_CONFIG } from '../config/GameConfig.js';

const MAX_PARTICLES = 600; // ceiling across the whole game

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  clear() {
    this.particles.length = 0;
  }

  /**
   * Emit a spray of particles from (x, y).
   *   count   how many (skipped past the cap)
   *   color   fill color
   *   speed   initial outward speed range [min, max]
   *   size    square size range [min, max]
   *   life    seconds range [min, max]
   *   gravity downward acceleration (0 for floaty sparkles)
   *   drag    velocity retained per second (0.9 = slows down)
   */
  burst(x, y, {
    count = 8,
    color = '#ffffff',
    speed = [60, 240],
    size = [4, 10],
    life = [0.3, 0.6],
    gravity = 0,
    drag = 3,
  } = {}) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) return; // hard cap
      const angle = Math.random() * Math.PI * 2;
      const spd = randomRange(speed[0], speed[1]);
      const maxLife = randomRange(life[0], life[1]);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: randomRange(size[0], size[1]),
        color,
        life: maxLife,
        maxLife,
        gravity,
        drag,
      });
    }
  }

  update(deltaTime) {
    const survivors = [];
    for (const p of this.particles) {
      p.life -= deltaTime;
      if (p.life <= 0) continue;

      // Drag slows the spread; gravity pulls floaty debris down.
      const fade = Math.max(0, 1 - p.drag * deltaTime);
      p.vx *= fade;
      p.vy = p.vy * fade + p.gravity * deltaTime;
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;

      survivors.push(p);
    }
    this.particles = survivors;
  }

  render(ctx, camera) {
    const margin = EFFECTS_CONFIG.offScreenMargin;

    for (const p of this.particles) {
      if (!camera.isVisible(p.x, p.y, margin)) continue;

      const screen = camera.worldToScreen(p.x, p.y);
      const t = p.life / p.maxLife; // 1 -> 0 as it dies
      const s = p.size * (0.4 + t * 0.6); // shrink slightly while fading

      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.fillRect(screen.x - s / 2, screen.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }
}
