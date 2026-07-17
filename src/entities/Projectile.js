// A projectile fired by a weapon. It flies in a straight line;
// the CollisionSystem handles hits, and it removes itself once it
// is far off screen.
//
// Pierce: a projectile can pass through `pierce` extra enemies
// before it is spent, never hitting the same enemy twice.

import { Entity } from './Entity.js';
import { EFFECTS_CONFIG } from '../config/GameConfig.js';

const PROJECTILE_RADIUS = 12;

// Visual styles, keyed by the weapon's `style` stat.
const STYLES = {
  default: {
    core: '#ffd54f',
    shine: '#fff8dc',
    tail: '#c8891a',
    glow: 'rgba(255, 213, 79, 0.35)',
    radius: PROJECTILE_RADIUS,
  },
  arcane: {
    core: '#b388ff',
    shine: '#e6d9ff',
    tail: '#6a3ab2',
    glow: 'rgba(179, 136, 255, 0.45)',
    radius: 16,
  },
};

// A pixel comet: diamond head with a tapering tail, drawn once per
// style and rotated to the flight direction at render time.
const spriteCache = new Map();

function getBoltSprite(look) {
  if (spriteCache.has(look)) return spriteCache.get(look);

  const GRID_W = 9;
  const GRID_H = 15;
  const SCALE = 4;

  const small = document.createElement('canvas');
  small.width = GRID_W;
  small.height = GRID_H;
  const s = small.getContext('2d');

  // Head: a chunky diamond (rows of widths 1-3-5-7-5-3).
  const widths = [1, 3, 5, 7, 5, 3];
  s.fillStyle = look.core;
  widths.forEach((w, row) => s.fillRect((GRID_W - w) / 2, row, w, 1));

  // Shine on the leading edge.
  s.fillStyle = look.shine;
  s.fillRect(4, 0, 1, 2);
  s.fillRect(3, 2, 1, 1);

  // Tapering tail behind the head.
  s.fillStyle = look.core;
  s.fillRect(3, 6, 3, 3);
  s.fillStyle = look.tail;
  s.fillRect(3, 9, 3, 2);
  s.fillRect(4, 11, 1, 3);

  const sprite = document.createElement('canvas');
  sprite.width = GRID_W * SCALE;
  sprite.height = GRID_H * SCALE;
  const ctx = sprite.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, sprite.width, sprite.height);

  spriteCache.set(look, sprite);
  return sprite;
}

export class Projectile extends Entity {
  constructor(x, y, directionX, directionY, { speed, damage, pierce = 0, style }) {
    const look = STYLES[style] || STYLES.default;
    super(x, y, look.radius);

    this.look = look;
    this.velocityX = directionX * speed;
    this.velocityY = directionY * speed;
    this.damage = damage;

    this.hitsLeft = 1 + pierce;
    this.alreadyHit = new Set(); // enemies this bolt passed through
  }

  update(deltaTime, game) {
    super.update(deltaTime, game);

    // Clean up once far off screen so the array never grows forever.
    if (!game.camera.isVisible(this.x, this.y, EFFECTS_CONFIG.offScreenMargin)) {
      this.dead = true;
    }
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.x, this.y);

    // Outer glow.
    ctx.fillStyle = this.look.glow;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, this.collisionRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // The comet sprite, nose pointed along the flight direction.
    const sprite = getBoltSprite(this.look);
    const angle = Math.atan2(this.velocityY, this.velocityX) + Math.PI / 2;
    const scale = this.collisionRadius / PROJECTILE_RADIUS;

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    ctx.restore();
  }
}
