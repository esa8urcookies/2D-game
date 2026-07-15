// The camera decides which part of the world is visible on screen.
// It follows a target (the player) and converts world coordinates
// into screen coordinates for rendering.

import { GAME_WIDTH, GAME_HEIGHT } from './Constants.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
  }

  /** Center the camera on a target (usually the player). */
  follow(target) {
    this.x = target.x - GAME_WIDTH / 2;
    this.y = target.y - GAME_HEIGHT / 2;
  }

  /** Convert a world position to a screen position. */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y,
    };
  }
}
