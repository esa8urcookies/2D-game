// Lightning Mark: on a rhythm, bolts strike random enemies that are
// currently on screen. Unaimed but powerful — it thins out the horde
// wherever it is thickest.

import { Weapon } from './Weapon.js';

// How long a bolt stays visible after striking.
const BOLT_VISUAL_SECONDS = 0.25;

export class LightningMark extends Weapon {
  constructor(id) {
    super(id);
    this.activeBolts = [];
  }

  update(deltaTime, game) {
    super.update(deltaTime, game);

    for (const bolt of this.activeBolts) {
      bolt.age += deltaTime;
    }
    this.activeBolts = this.activeBolts.filter(
      (bolt) => bolt.age < BOLT_VISUAL_SECONDS
    );
  }

  fire(game) {
    // Only enemies the player can actually see may be struck.
    const visible = game.enemies.filter(
      (enemy) => !enemy.dead && game.camera.isVisible(enemy.x, enemy.y, 0)
    );
    if (visible.length === 0) {
      return false; // hold the charge until something shows up
    }

    // Pick up to `strikes` distinct random targets.
    const targets = [];
    const pool = [...visible];
    while (targets.length < this.stats.strikes && pool.length > 0) {
      const index = Math.floor(Math.random() * pool.length);
      targets.push(pool.splice(index, 1)[0]);
    }

    for (const enemy of targets) {
      game.damageEnemy(enemy, this.stats.damage);
      this.activeBolts.push({ x: enemy.x, y: enemy.y, age: 0, seed: Math.random() });
    }
    return true;
  }

  render(ctx, camera) {
    for (const bolt of this.activeBolts) {
      const screen = camera.worldToScreen(bolt.x, bolt.y);
      const alpha = 1 - bolt.age / BOLT_VISUAL_SECONDS;

      ctx.save();
      ctx.globalAlpha = alpha;

      // A jagged bolt from high above down to the target.
      const zigzag = 40;
      const segments = 4;
      const top = screen.y - 520;

      ctx.strokeStyle = '#9be7ff';
      ctx.lineWidth = 14;
      this.tracePath(ctx, screen, top, segments, zigzag, bolt.seed);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      this.tracePath(ctx, screen, top, segments, zigzag, bolt.seed);
      ctx.stroke();

      // Impact flash.
      ctx.fillStyle = '#e8f7ff';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 26 * alpha, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /** The zigzag line, deterministic per bolt so it doesn't wiggle. */
  tracePath(ctx, screen, top, segments, zigzag, seed) {
    ctx.beginPath();
    ctx.moveTo(screen.x + zigzag, top);
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const y = top + (screen.y - top) * t;
      // Alternate left/right, with a per-bolt offset from the seed.
      const sway = i === segments ? 0 : (i % 2 === 0 ? 1 : -1) * zigzag * (1 + seed);
      ctx.lineTo(screen.x + sway, y);
    }
    ctx.stroke();
  }
}
