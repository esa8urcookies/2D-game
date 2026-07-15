// The player character. Movement is the only input in this game;
// the WeaponSystem fires automatically at nearby enemies.
//
// The player is drawn from a 4-direction walking sprite sheet:
// procedural pixel art by default, or a custom PNG if one exists
// (see CUSTOM_SHEET in PixelHeroSheet.js).

import {
  createHeroSheet,
  tryLoadCustomSheet,
  HERO_SHEET_META,
  CUSTOM_SHEET,
} from '../assets/PixelHeroSheet.js';
import { SPRITE_SIZE } from '../assets/ProceduralSprites.js';

export class Player {
  constructor(x, y) {
    // World position (center of the player).
    this.x = x;
    this.y = y;

    this.moveSpeed = 420; // pixels per second

    // The collision circle is much smaller than the 182x182 sprite
    // so near-misses feel fair instead of frustrating.
    this.collisionRadius = 45;

    this.spriteSize = SPRITE_SIZE;

    // Walking animation state.
    this.sheet = createHeroSheet();
    this.sheetMeta = HERO_SHEET_META;
    this.direction = 'down';
    this.isMoving = false;
    this.walkTimer = 0;

    // Swap in custom art if a sheet file exists (async, non-blocking).
    tryLoadCustomSheet().then((image) => {
      if (image) {
        this.sheet = image;
        this.sheetMeta = { ...HERO_SHEET_META, ...CUSTOM_SHEET };
      }
    });

    // Counts down after an enemy touches us. While above zero the
    // player blinks and cannot be "hit" again (no health yet, but
    // this keeps contact feedback from flickering every frame).
    this.hitTimer = 0;
  }

  update(deltaTime, input) {
    const move = input.getMovementDirection();

    this.x += move.x * this.moveSpeed * deltaTime;
    this.y += move.y * this.moveSpeed * deltaTime;

    this.isMoving = move.x !== 0 || move.y !== 0;

    if (this.isMoving) {
      this.walkTimer += deltaTime;

      // Face the dominant axis of movement (horizontal wins ties),
      // like classic top-down RPGs.
      if (Math.abs(move.x) >= Math.abs(move.y)) {
        this.direction = move.x > 0 ? 'right' : 'left';
      } else {
        this.direction = move.y > 0 ? 'down' : 'up';
      }
    } else {
      this.walkTimer = 0; // reset so walking always starts on frame 0
    }

    this.hitTimer = Math.max(0, this.hitTimer - deltaTime);
  }

  /** Which cell of the sprite sheet to draw this frame. */
  getFrame() {
    const { frameSize, framesPerRow, rows, walkFps } = this.sheetMeta;

    const column = this.isMoving
      ? Math.floor(this.walkTimer * walkFps) % framesPerRow
      : 0; // standing still shows the neutral pose

    return {
      image: this.sheet,
      sx: column * frameSize,
      sy: rows[this.direction] * frameSize,
      size: frameSize,
    };
  }

  /** Called by the CollisionSystem when an enemy touches the player. */
  onEnemyContact() {
    if (this.hitTimer <= 0) {
      this.hitTimer = 0.8; // brief grace period between hits
    }
  }
}
