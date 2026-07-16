// A projectile fired by a weapon. It flies in a straight line;
// the CollisionSystem handles hits, and it removes itself once it
// is far off screen.
//
// Pierce: a projectile can pass through `pierce` extra enemies
// before it is spent, never hitting the same enemy twice.

import { Entity } from './Entity.js';
import { EFFECTS_CONFIG } from '../config/GameConfig.js';

const PROJECTILE_RADIUS = 12;

export class Projectile extends Entity {
  constructor(x, y, directionX, directionY, { speed, damage, pierce = 0 }) {
    super(x, y, PROJECTILE_RADIUS);

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
    ctx.fillStyle = 'rgba(255, 213, 79, 0.35)';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, this.collisionRadius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Core.
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, this.collisionRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
