// A projectile fired by the player's weapon. It flies in a straight
// line; the CollisionSystem handles hits, and it removes itself once
// it is far off screen.

import { Entity } from './Entity.js';
import { WEAPON_CONFIG, EFFECTS_CONFIG } from '../config/GameConfig.js';

export class Projectile extends Entity {
  constructor(x, y, directionX, directionY, { speed, damage }) {
    super(x, y, WEAPON_CONFIG.projectileRadius);

    this.velocityX = directionX * speed;
    this.velocityY = directionY * speed;
    this.damage = damage;
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
