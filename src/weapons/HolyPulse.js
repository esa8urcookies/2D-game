// Holy Pulse: every few seconds, a ring of light bursts out of the
// player and damages every enemy inside its radius, pushing them
// back slightly. Great for crowds pressing in.
//
// Its evolution, Divine Nova, uses this same class: `healPerHit` in
// its stats restores HP for every enemy struck (up to `healCap`),
// and `visualSeconds` makes the ring linger longer.

import { Weapon } from './Weapon.js';

// Default ring animation length (stats.visualSeconds overrides).
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
      (pulse) => pulse.age < pulse.duration
    );
  }

  fire(game) {
    const player = game.player;
    const radius = this.stats.radius;
    let hits = 0;

    for (const enemy of game.enemies) {
      if (enemy.dead) continue;

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const reach = radius + enemy.collisionRadius;

      if (dx * dx + dy * dy < reach * reach) {
        const length = Math.sqrt(dx * dx + dy * dy) || 1;
        game.damageEnemy(enemy, this.stats.damage, dx / length, dy / length, 260);
        hits += 1;
      }
    }

    // Divine Nova: the light restores HP for every enemy struck.
    if (this.stats.healPerHit && hits > 0) {
      const heal = Math.min(this.stats.healCap, hits * this.stats.healPerHit);
      const before = player.health;
      player.health = Math.min(player.maxHealth, player.health + heal);
      if (player.health > before) {
        game.addDamageText(`+${Math.round(player.health - before)}`, player.x, player.y - 120, '#5cd65c');
      }
    }

    // Pulse on rhythm even when nothing is nearby — the ring doubles
    // as a "weapon is ready" heartbeat.
    this.activePulses.push({
      age: 0,
      x: player.x,
      y: player.y,
      radius,
      duration: this.stats.visualSeconds ?? PULSE_VISUAL_SECONDS,
    });
    return true;
  }

  render(ctx, camera) {
    for (const pulse of this.activePulses) {
      const progress = pulse.age / pulse.duration;
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
