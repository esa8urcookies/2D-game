// A coin dropped by an enemy. Behaves like an XP gem — sits on the
// ground, flies to the player inside the magnet radius — but feeds
// the coin purse instead of the XP bar.

import { Entity } from './Entity.js';
import { normalize } from '../core/MathUtils.js';
import { XP_CONFIG, COIN_CONFIG } from '../config/GameConfig.js';

// --- Coin sprite, built once ---------------------------------------------

const GRID = 9;
const SCALE = 4; // 36px on screen — a bit smaller than gems

let coinSprite = null;

function getCoinSprite() {
  if (coinSprite) return coinSprite;

  const small = document.createElement('canvas');
  small.width = GRID;
  small.height = GRID;
  const s = small.getContext('2d');

  // Round coin: dark rim, gold face, bright shine.
  const widths = [3, 5, 7, 7, 7, 5, 3];
  s.fillStyle = '#a06e12';
  widths.forEach((w, row) => s.fillRect((GRID - w) / 2, row + 1, w, 1));
  const inner = [1, 3, 5, 5, 5, 3, 1];
  s.fillStyle = '#ffd54f';
  inner.forEach((w, row) => s.fillRect((GRID - w) / 2, row + 1, w, 1));
  s.fillStyle = '#fff8dc';
  s.fillRect(3, 2, 1, 1);
  s.fillRect(2, 3, 1, 2);

  coinSprite = document.createElement('canvas');
  coinSprite.width = GRID * SCALE;
  coinSprite.height = GRID * SCALE;
  const ctx = coinSprite.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, coinSprite.width, coinSprite.height);
  return coinSprite;
}

// --- The entity ------------------------------------------------------------

export class Coin extends Entity {
  constructor(x, y) {
    super(x, y, 18);

    this.sprite = getCoinSprite();

    // Scatter pop, like gems.
    const angle = Math.random() * Math.PI * 2;
    this.velocityX = Math.cos(angle) * 160;
    this.velocityY = Math.sin(angle) * 160;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(deltaTime, game) {
    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const distanceSquared = dx * dx + dy * dy;

    const pickup = XP_CONFIG.pickupRadius;
    const magnet = game.stats.magnetRadius;

    if (distanceSquared < pickup * pickup) {
      this.dead = true;
      game.coins += COIN_CONFIG.value;
      return;
    }

    if (distanceSquared < magnet * magnet) {
      const direction = normalize(dx, dy);
      this.velocityX = direction.x * XP_CONFIG.magnetSpeed;
      this.velocityY = direction.y * XP_CONFIG.magnetSpeed;
    } else {
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
