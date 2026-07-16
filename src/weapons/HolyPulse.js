// Holy Pulse: every few seconds, a ring of light bursts out of the
// player and damages every enemy inside its radius, pushing them
// back slightly. Great for crowds pressing in.

import { Weapon } from './Weapon.js';

// How long the visual ring takes to expand and fade.
const PULSE_VISUAL_SECONDS = 0.4;

export class HolyPulse extends Weapon {
  constructor(id) {
    super(id);
    this.activePulses = []; // ages of rings still animating
    this.origin = { x: 0, y: 0 };
  }

  update(deltaTime, game) {
    super.update(deltaTime, game);

    // Advance the ring animations.
    for (const pulse of this.activePulses) {
      pulse.age += deltaTime;
    }
    this.activePulses = this.activePulses.filter(
      (pulse) => pulse.age < PULSE_VISUAL_SECONDS
    );
  }

  fire(game) {
    const player = game.player;
    const radius = this.stats.radius;
    let hitSomething = false;

    for (const enemy of game.enemies) {
      if (enemy.dead) continue;

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const reach = radius + enemy.collisionRadius;

      if (dx * dx + dy * dy < reach * reach) {
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        game.damageEnemy(enemy, this.stats.damage, dx / length, dy / length, 260);
        hitSomething = true;
      }
    }

    // Pulse on rhythm even when nothing is nearby — the ring doubles
    // as a "weapon is ready" heartbeat.
    this.activePulses.push({ age: 0, x: player.x, y: player.y, radius });
    return true;
  }

  render(ctx, camera) {
    for (const pulse of this.activePulses) {
      const progress = pulse.age / PULSE_VISUAL_SECONDS;
      const screen = camera.worldToScreen(pulse.x, pulse.y);
      const radius = pulse.radius * Math.sqrt(progress); // fast start, soft end
      const alpha = 1 - progress;

      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = '#fff3c2';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
