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
  },
  bat: {
    sprite: 'bat',
    moveSpeed: 250, // fast...
    maxHealth: 10, // ...but dies quickly
    collisionRadius: 40,
  },
};

export class Enemy {
  constructor(x, y, typeName) {
    const type = ENEMY_TYPES[typeName];

    this.typeName = typeName;
    this.x = x;
    this.y = y;
    this.moveSpeed = type.moveSpeed;
    this.health = type.maxHealth;
    this.collisionRadius = type.collisionRadius;
    this.sprite = getSprite(type.sprite);
    this.spriteSize = SPRITE_SIZE;

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

    if (direction.x !== 0) {
      this.facing = direction.x > 0 ? 1 : -1;
    }

    this.animationTimer += deltaTime;
    this.hitFlashTimer = Math.max(0, this.hitFlashTimer - deltaTime);
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitFlashTimer = 0.1;

    if (this.health <= 0) {
      this.dead = true;
    }
  }
}
