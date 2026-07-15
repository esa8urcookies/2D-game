// The player character. Movement is the only input in this game;
// weapons will fire automatically in a later step.

import { createPlayerSprite, SPRITE_SIZE } from '../assets/ProceduralSprites.js';

export class Player {
  constructor(x, y) {
    // World position (center of the player).
    this.x = x;
    this.y = y;

    this.moveSpeed = 420; // pixels per second

    // The collision circle is much smaller than the 182x182 sprite
    // so near-misses feel fair instead of frustrating.
    this.collisionRadius = 45;

    this.sprite = createPlayerSprite();
    this.spriteSize = SPRITE_SIZE;

    // Remember which way we last moved, for flipping the sprite later.
    this.facing = 1; // 1 = right, -1 = left
  }

  update(deltaTime, input) {
    const direction = input.getMovementDirection();

    this.x += direction.x * this.moveSpeed * deltaTime;
    this.y += direction.y * this.moveSpeed * deltaTime;

    if (direction.x !== 0) {
      this.facing = direction.x > 0 ? 1 : -1;
    }
  }
}
