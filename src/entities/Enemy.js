// Enemies chase the player in a straight line. All the numbers that
// make one enemy type different from another live in ENEMY_TYPES,
// so adding a new type is just adding a new entry (plus a sprite).

import { getSprite, SPRITE_SIZE } from '../assets/ProceduralSprites.js';
import { normalize } from '../core/MathUtils.js';

export const ENEMY_TYPES = {
  slime: {
    sprite: 'slime',
    moveSpeed: 110, // slow...
    maxHealth: 30, // ...but takes a few hits
    collisionRadius: 52,
    contactDamage: 12, // HP the player loses on touch
  },
  bat: {
    sprite: 'bat',
    moveSpeed: 250, // fast...
    maxHealth: 10, // ...but dies quickly
    collisionRadius: 40,
    contactDamage: 7,
  },
};

// How quickly knockback fades (higher = snappier stop).
const KNOCKBACK_FRICTION = 9;

export class Enemy {
  constructor(x, y, typeName) {
    const type = ENEMY_TYPES[typeName];

    this.typeName = typeName;
    this.x = x;
    this.y = y;
    this.moveSpeed = type.moveSpeed;
    this.maxHealth = type.maxHealth;
    this.health = type.maxHealth;
    this.collisionRadius = type.collisionRadius;
    this.contactDamage = type.contactDamage;
    this.sprite = getSprite(type.sprite);
    this.spriteSize = SPRITE_SIZE;

    // Velocity from being hit; fades out via friction.
    this.knockbackX = 0;
    this.knockbackY = 0;

    this.facing = 1;
    this.dead = false;

    // Flashes white briefly when hit, so damage is easy to read.
    this.hitFlashTimer = 0;

    // Random start phase so a crowd of enemies doesn't wobble in sync.
    this.animationTimer = Math.random() * Math.PI * 2;
  }

  update(deltaTime, player) {
    const direction = normalize(player.x - this.x, player.y - this.y);

    this.x += direction.x * this.moveSpeed * deltaTime;
    this.y += direction.y * this.moveSpeed * deltaTime;

    // Apply knockback on top of normal movement, then let it fade.
    this.x += this.knockbackX * deltaTime;
    this.y += this.knockbackY * deltaTime;
    const fade = Math.max(0, 1 - KNOCKBACK_FRICTION * deltaTime);
    this.knockbackX *= fade;
    this.knockbackY *= fade;

    if (direction.x !== 0) {
      this.facing = direction.x > 0 ? 1 : -1;
    }

    this.animationTimer += deltaTime;
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - deltaTime);
  }

  /** Take damage, flashing white and getting shoved along (dirX, dirY). */
  takeDamage(amount, dirX = 0, dirY = 0, knockbackForce = 420) {
    this.health -= amount;
    this.hitFlashTimer = 0.1;
    this.knockbackX += dirX * knockbackForce;
    this.knockbackY += dirY * knockbackForce;

    if (this.health <= 0) {
      this.dead = true;
    }
  }
}
