// The player character. Movement is the only input in this game;
// the WeaponSystem fires automatically at nearby enemies.

import { getSprite, SPRITE_SIZE } from '../assets/ProceduralSprites.js';

export class Player {
  constructor(x, y) {
    // World position (center of the player).
    this.x = x;
    this.y = y;

    this.moveSpeed = 420; // pixels per second

    // The collision circle is much smaller than the 182x182 sprite
    // so near-misses feel fair instead of frustrating.
    this.collisionRadius = 45;

    this.sprite = getSprite('player');
    this.spriteSize = SPRITE_SIZE;

    // Remember which way we last moved, for flipping the sprite.
    this.facing = 1; // 1 = right, -1 = left

    // Counts down after an enemy touches us. While above zero the
    // player blinks and cannot be "hit" again (no health yet, but
    // this keeps contact feedback from flickering every frame).
    this.hitTimer = 0;
  }

  update(deltaTime, input) {
    const direction = input.getMovementDirection();

    this.x += direction.x * this.moveSpeed * deltaTime;
    this.y += direction.y * this.moveSpeed * deltaTime;

    if (direction.x !== 0) {
      this.facing = direction.x > 0 ? 1 : -1;
    }

    this.hitTimer = Math.max(0, this.hitTimer - deltaTime);
  }

  /** Called by the CollisionSystem when an enemy touches the player. */
  onEnemyContact() {
    if (this.hitTimer <= 0) {
      this.hitTimer = 0.8; // brief grace period between hits
    }
  }
}
