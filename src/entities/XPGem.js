// XP gems dropped by defeated enemies.
//
// A gem sits on the ground forever (gems never expire). When the
// player comes within the magnet radius it flies toward them, and
// within the pickup radius it is collected.

import { Entity } from './Entity.js';
import { normalize } from '../core/MathUtils.js';
import { XP_CONFIG } from '../config/GameConfig.js';

// --- Pixel gem sprites, one per tier, built once ------------------------

const GEM_GRID = 9; // authoring grid
const GEM_SCALE = 5; // 9 * 5 = 45px on screen

const spriteCache = new Map();

function getGemSprite(tier) {
  if (!spriteCache.has(tier.value)) {
    spriteCache.set(tier.value, buildGemSprite(tier));
  }
  return spriteCache.get(tier.value);
}

/** A chunky pixel diamond with an outline and a shine. */
function buildGemSprite(tier) {
  const canvas = document.createElement('canvas');
  canvas.width = GEM_GRID * GEM_SCALE;
  canvas.height = GEM_GRID * GEM_SCALE;
  const ctx = canvas.getContext('2d');

  const small = document.createElement('canvas');
  small.width = GEM_GRID;
  small.height = GEM_GRID;
  const s = small.getContext('2d');

  // Diamond body, row by row (widths: 1, 3, 5, 7, 5, 3, 1).
  s.fillStyle = tier.color;
  const widths = [1, 3, 5, 7, 5, 3, 1];
  widths.forEach((width, row) => {
    s.fillRect((GEM_GRID - width) / 2, row + 1, width, 1);
  });

  // Outline.
  s.fillStyle = '#16161f';
  s.fillRect(4, 0, 1, 1);
  s.fillRect(2, 1, 1, 1);
  s.fillRect(6, 1, 1, 1);
  s.fillRect(1, 2, 1, 1);
  s.fillRect(7, 2, 1, 1);
  s.fillRect(0, 3, 1, 1);
  s.fillRect(8, 3, 1, 1);
  s.fillRect(1, 4, 1, 1);
  s.fillRect(7, 4, 1, 1);
  s.fillRect(2, 5, 1, 1);
  s.fillRect(6, 5, 1, 1);
  s.fillRect(3, 6, 1, 1);
  s.fillRect(5, 6, 1, 1);
  s.fillRect(4, 7, 1, 1);

  // Shine in the upper left.
  s.fillStyle = tier.shine;
  s.fillRect(3, 2, 1, 1);
  s.fillRect(4, 2, 1, 1);
  s.fillRect(3, 3, 1, 1);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** The gem tier matching an exact value (for guaranteed drops). */
export function tierForValue(value) {
  return (
    XP_CONFIG.gemTiers.find((tier) => tier.value === value) ||
    XP_CONFIG.gemTiers[XP_CONFIG.gemTiers.length - 1]
  );
}

/** Roll which gem tier an enemy drops (rare tiers checked first). */
export function rollGemTier() {
  const roll = Math.random();
  let cumulative = 0;

  for (const tier of XP_CONFIG.gemTiers) {
    cumulative += tier.chance;
    if (roll < cumulative) {
      return tier;
    }
  }
  return XP_CONFIG.gemTiers[XP_CONFIG.gemTiers.length - 1];
}

// --- The entity ---------------------------------------------------------

export class XPGem extends Entity {
  constructor(x, y, tier) {
    super(x, y, 20);

    this.value = tier.value;
    this.color = tier.color; // used for the pickup sparkle
    this.sprite = getGemSprite(tier);

    // A little scatter pop when dropped, so gems don't stack into a
    // single invisible pile on the corpse.
    const angle = Math.random() * Math.PI * 2;
    this.velocityX = Math.cos(angle) * 160;
    this.velocityY = Math.sin(angle) * 160;

    // Random phase so a field of gems doesn't bob in sync.
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(deltaTime, game) {
    const player = game.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distanceSquared = dx * dx + dy * dy;

    const pickup = XP_CONFIG.pickupRadius;
    const magnet = game.stats.magnetRadius;

    if (distanceSquared < pickup * pickup) {
      game.collectGem(this);
      return;
    }

    if (distanceSquared < magnet * magnet) {
      // Fly toward the player.
      const direction = normalize(dx, dy);
      this.velocityX = direction.x * XP_CONFIG.magnetSpeed;
      this.velocityY = direction.y * XP_CONFIG.magnetSpeed;
    } else {
      // Friction kills the initial scatter pop, then the gem rests.
      this.velocityX *= 1 - Math.min(1, 8 * deltaTime);
      this.velocityY *= 1 - Math.min(1, 8 * deltaTime);
    }

    super.update(deltaTime, game);
    this.bobPhase += deltaTime;
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.x, this.y);
    const bob = Math.sin(this.bobPhase * 3) * 4;
    const half = this.sprite.width / 2;

    ctx.drawImage(this.sprite, screen.x - half, screen.y - half + bob);
  }
}
