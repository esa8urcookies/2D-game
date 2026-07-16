// Enemies chase the player in a straight line. All the numbers that
// make one enemy type different from another live in ENEMY_TYPES
// (see GameConfig.js), so adding a new type is just adding a new
// entry plus a sprite.

import { Entity } from './Entity.js';
import { getSprite } from '../assets/ProceduralSprites.js';
import { normalize } from '../core/MathUtils.js';
import { drawCenteredSprite, drawBar } from '../core/DrawUtils.js';
import { ENEMY_TYPES, ENEMY_CONFIG, SPRITE_SIZE } from '../config/GameConfig.js';

export class Enemy extends Entity {
  /**
   * `scaling` comes from the wave director: the longer the run, the
   * tougher and faster new enemies spawn.
   */
  constructor(x, y, typeName, scaling = {}) {
    const type = ENEMY_TYPES[typeName];
    super(x, y, type.collisionRadius);

    const healthMultiplier = scaling.healthMultiplier ?? 1;
    const speedMultiplier = scaling.speedMultiplier ?? 1;

    this.typeName = typeName;
    this.moveSpeed = type.moveSpeed * speedMultiplier;
    this.maxHealth = Math.round(type.maxHealth * healthMultiplier);
    this.health = this.maxHealth;
    this.contactDamage = type.contactDamage;
    this.scale = type.scale ?? 1;
    this.isBoss = type.isBoss ?? false;
    this.knockbackResistance = type.knockbackResistance ?? 1;
    this.sprite = getSprite(type.sprite);
    this.spriteSize = SPRITE_SIZE;

    // Velocity from being hit; fades out via friction.
    this.knockbackX = 0;
    this.knockbackY = 0;

    this.facing = 1;

    // Flashes white briefly when hit, so damage is easy to read.
    this.hitFlashTimer = 0;

    // Random start phase so a crowd of enemies doesn't wobble in sync.
    this.animationTimer = Math.random() * Math.PI * 2;
  }

  update(deltaTime, game) {
    // Chase the player, plus whatever knockback is still in effect.
    const direction = normalize(game.player.x - this.x, game.player.y - this.y);
    this.velocityX = direction.x * this.moveSpeed + this.knockbackX;
    this.velocityY = direction.y * this.moveSpeed + this.knockbackY;
    super.update(deltaTime, game);

    const fade = Math.max(0, 1 - ENEMY_CONFIG.knockbackFriction * deltaTime);
    this.knockbackX *= fade;
    this.knockbackY *= fade;

    if (direction.x !== 0) {
      this.facing = direction.x > 0 ? 1 : -1;
    }

    this.animationTimer += deltaTime;
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - deltaTime);
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.x, this.y);

    // A gentle idle cycle makes the horde feel alive: bats bob up
    // and down, everything else squishes.
    const wobble = Math.sin(this.animationTimer * 6);
    const isBat = this.typeName === 'bat';

    drawCenteredSprite(ctx, this.sprite, screen.x, screen.y + (isBat ? wobble * 10 : 0), {
      flipX: this.facing < 0,
      scaleY: isBat ? 1 : 1 + wobble * 0.05,
      scale: this.scale,
      brighten: this.hitFlashTimer > 0,
    });

    // Health bar, only once the enemy has actually been hurt.
    if (this.health < this.maxHealth) {
      const barY = screen.y - 80 * this.scale;
      drawBar(ctx, screen.x - 45, barY, 90, 10, this.health / this.maxHealth, '#e04040');
    }
  }

  /** Take damage, flashing white and getting shoved along (dirX, dirY). */
  takeDamage(amount, dirX = 0, dirY = 0, knockbackForce = 0) {
    this.health -= amount;
    this.hitFlashTimer = ENEMY_CONFIG.hitFlashSeconds;

    // Heavy enemies (bosses) barely budge.
    const force = knockbackForce * this.knockbackResistance;
    this.knockbackX += dirX * force;
    this.knockbackY += dirY * force;

    if (this.health <= 0) {
      this.dead = true;
    }
  }
}
