// Orbiting Blade: blades circle the player and slice anything they
// touch. No cooldown — the blades are always out; each enemy can
// only be hit again after a short grace period so the damage ticks
// instead of melting.

import { Weapon } from './Weapon.js';
import { circlesOverlap } from '../systems/CollisionSystem.js';

// Seconds before the same enemy can be hit by the blades again.
const HIT_INTERVAL = 0.5;

export class OrbitingBlade extends Weapon {
  constructor(id) {
    super(id);
    this.angle = 0;

    // Per-enemy grace timers (enemy -> seconds remaining).
    this.hitTimers = new Map();

    // The blade image, built once. Celestial Blades get gold steel.
    this.sprite = buildBladeSprite(this.def.evolved);
  }

  /** World position of blade number `index` right now. */
  bladePosition(game, index) {
    const spread = (Math.PI * 2) / this.stats.blades;
    const angle = this.angle + index * spread;
    return {
      x: game.player.x + Math.cos(angle) * this.stats.orbitRadius,
      y: game.player.y + Math.sin(angle) * this.stats.orbitRadius,
      angle,
    };
  }

  update(deltaTime, game) {
    this.angle += this.stats.orbitSpeed * deltaTime;

    // Tick down the per-enemy grace timers.
    for (const [enemy, time] of this.hitTimers) {
      if (time <= deltaTime || enemy.dead) {
        this.hitTimers.delete(enemy);
      } else {
        this.hitTimers.set(enemy, time - deltaTime);
      }
    }

    // Slice enemies touching any blade.
    for (let i = 0; i < this.stats.blades; i++) {
      const blade = this.bladePosition(game, i);

      for (const enemy of game.enemies) {
        if (enemy.dead || this.hitTimers.has(enemy)) continue;

        if (
          circlesOverlap(
            blade.x, blade.y, this.stats.size,
            enemy.x, enemy.y, enemy.collisionRadius
          )
        ) {
          // Shove outward from the player, like being batted away.
          const dx = enemy.x - game.player.x;
          const dy = enemy.y - game.player.y;
          const length = Math.sqrt(dx * dx + dy * dy) || 1;
          game.damageEnemy(enemy, this.stats.damage, dx / length, dy / length, 300);
          this.hitTimers.set(enemy, HIT_INTERVAL);
        }
      }
    }
  }

  render(ctx, camera, game) {
    const glow = this.def.evolved ? getBladeGlow() : null;

    for (let i = 0; i < this.stats.blades; i++) {
      const blade = this.bladePosition(game, i);
      const screen = camera.worldToScreen(blade.x, blade.y);

      // Evolved blades trail a soft golden glow.
      if (glow) {
        const g = this.stats.size * 2.4;
        ctx.drawImage(glow, screen.x - g / 2, screen.y - g / 2, g, g);
      }

      ctx.save();
      ctx.translate(screen.x, screen.y);
      // Point the blade along its direction of travel (the tangent).
      ctx.rotate(blade.angle + Math.PI / 2);
      const scale = this.stats.size / 30; // grows with blade size
      ctx.scale(scale, scale);
      ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);
      ctx.restore();
    }
  }
}

// Soft golden glow for the evolved blades, built once.
let bladeGlow = null;
function getBladeGlow() {
  if (bladeGlow) return bladeGlow;
  bladeGlow = document.createElement('canvas');
  bladeGlow.width = 96;
  bladeGlow.height = 96;
  const ctx = bladeGlow.getContext('2d');
  const grad = ctx.createRadialGradient(48, 48, 4, 48, 48, 48);
  grad.addColorStop(0, 'rgba(255, 224, 130, 0.55)');
  grad.addColorStop(1, 'rgba(255, 224, 130, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 96, 96);
  return bladeGlow;
}

/** A small pixel sword, drawn once. Gold for the evolved form. */
function buildBladeSprite(golden = false) {
  const small = document.createElement('canvas');
  small.width = 9;
  small.height = 21;
  const s = small.getContext('2d');

  // Blade.
  s.fillStyle = golden ? '#ffd54f' : '#c6cdd8';
  s.fillRect(3, 1, 3, 13);
  s.fillStyle = golden ? '#fff8dc' : '#eef2f8'; // edge highlight
  s.fillRect(3, 1, 1, 13);
  s.fillRect(4, 0, 1, 1); // tip

  // Guard and grip.
  s.fillStyle = golden ? '#a06e12' : '#8a6d3b';
  s.fillRect(1, 14, 7, 2);
  s.fillStyle = golden ? '#7e2020' : '#5f4a28';
  s.fillRect(3, 16, 3, 4);

  const canvas = document.createElement('canvas');
  canvas.width = 9 * 4;
  canvas.height = 21 * 4;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
  return canvas;
}
