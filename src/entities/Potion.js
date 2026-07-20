// A health potion dropped by an enemy.
//
// Unlike coins and gems, a potion is NOT pulled in by the magnet —
// it rests where it fell until the player chooses to walk over it, so
// you can leave it on the ground and grab it later when you're hurt.
// Drinking it restores HP (capped at the max).
//
// The sprite is an original pixel flask, drawn in the same chunky
// style as the game's other pickups — no external art.

import { Entity } from './Entity.js';
import { audio } from '../core/Audio.js';
import { POTION_CONFIG } from '../config/GameConfig.js';

// --- Potion sprite, built once -------------------------------------------

const GRID_W = 12;
const GRID_H = 14;
const SCALE = 5; // 60px-ish on screen

const OUTLINE = '#16161f';
const GLASS = '#cfe9f2';
const LIQUID = '#e0402f';
const LIQUID_TOP = '#ff7a63';
const CORK = '#8a6d3b';
const CORK_DARK = '#5f4a28';

// The flask silhouette: [xStart, width] per row, top to bottom.
const SILHOUETTE = [
  [5, 2], // 0  cork top
  [4, 4], // 1  cork
  [5, 2], // 2  neck
  [5, 2], // 3  neck
  [3, 6], // 4  shoulder (empty glass)
  [2, 8], // 5  (empty glass)
  [1, 10], // 6  liquid surface
  [1, 10], // 7
  [1, 10], // 8
  [1, 10], // 9
  [2, 8], // 10
  [2, 8], // 11
  [3, 6], // 12
  [4, 4], // 13 base
];

let potionSprite = null;

function getPotionSprite() {
  if (potionSprite) return potionSprite;

  const small = document.createElement('canvas');
  small.width = GRID_W;
  small.height = GRID_H;
  const s = small.getContext('2d');

  // 1. Dark silhouette (gives a 1px outline once we inset the fill).
  s.fillStyle = OUTLINE;
  SILHOUETTE.forEach(([x, w], y) => s.fillRect(x, y, w, 1));

  // 2. Glass fill, inset one pixel on each side (skip the cork rows).
  s.fillStyle = GLASS;
  SILHOUETTE.forEach(([x, w], y) => {
    if (y < 2) return;
    s.fillRect(x + 1, y, w - 2, 1);
  });

  // 3. Red liquid fills the lower body; the top row is a lighter
  //    "surface" line.
  SILHOUETTE.forEach(([x, w], y) => {
    if (y < 6 || y > 12) return;
    s.fillStyle = y === 6 ? LIQUID_TOP : LIQUID;
    s.fillRect(x + 1, y, w - 2, 1);
  });

  // 4. Cork on top.
  s.fillStyle = CORK;
  s.fillRect(4, 0, 4, 2);
  s.fillStyle = CORK_DARK;
  s.fillRect(4, 1, 4, 1);
  s.fillStyle = CORK;
  s.fillRect(5, 0, 2, 1);

  // 5. A glass shine down the left side.
  s.fillStyle = '#ffffff';
  s.fillRect(2, 7, 1, 3);

  potionSprite = document.createElement('canvas');
  potionSprite.width = GRID_W * SCALE;
  potionSprite.height = GRID_H * SCALE;
  const ctx = potionSprite.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, potionSprite.width, potionSprite.height);
  return potionSprite;
}

// --- The entity -----------------------------------------------------------

export class Potion extends Entity {
  constructor(x, y) {
    super(x, y, POTION_CONFIG.pickupRadius);

    this.sprite = getPotionSprite();

    // A little scatter pop when it drops, then it settles and rests.
    const angle = Math.random() * Math.PI * 2;
    this.velocityX = Math.cos(angle) * 150;
    this.velocityY = Math.sin(angle) * 150;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(deltaTime, game) {
    // Friction only — potions are never pulled by the magnet.
    this.velocityX *= 1 - Math.min(1, 8 * deltaTime);
    this.velocityY *= 1 - Math.min(1, 8 * deltaTime);
    super.update(deltaTime, game);
    this.bobPhase += deltaTime;

    const player = game.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const reach = POTION_CONFIG.pickupRadius + player.collisionRadius;

    if (dx * dx + dy * dy < reach * reach) {
      this.dead = true;

      const before = player.health;
      player.health = Math.min(player.maxHealth, player.health + POTION_CONFIG.healAmount);
      const healed = Math.round(player.health - before);

      game.addDamageText(`+${healed}`, player.x, player.y - 120, '#5cd65c');
      game.particles.burst(this.x, this.y, {
        count: 8,
        color: '#ff7a63',
        speed: [50, 170],
        size: [3, 7],
        life: [0.3, 0.5],
      });
      audio.play('heal');
    }
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.x, this.y);
    const bob = Math.sin(this.bobPhase * 3) * 4;
    const half = this.sprite.width / 2;

    // A soft red glow so a health drop is easy to spot in a fight.
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(this.bobPhase * 3) * 0.1;
    ctx.fillStyle = '#e0402f';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y + bob, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.drawImage(this.sprite, screen.x - half, screen.y - half + bob);
  }
}
