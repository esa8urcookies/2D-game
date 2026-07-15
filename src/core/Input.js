// Keyboard input handling.
// Tracks which keys are held down and converts WASD / arrow keys
// into a movement direction the rest of the game can use.

import { normalize } from './MathUtils.js';

export class Input {
  constructor() {
    this.keys = new Set();

    window.addEventListener('keydown', (event) => {
      this.keys.add(event.code);

      // Stop arrow keys from scrolling the page.
      if (event.code.startsWith('Arrow')) {
        event.preventDefault();
      }
    });

    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });

    // If the window loses focus, release all keys so the player
    // does not keep walking forever.
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  /**
   * Returns the current movement direction as a normalized vector,
   * so diagonal movement is not faster than straight movement.
   */
  getMovementDirection() {
    let x = 0;
    let y = 0;

    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;

    return normalize(x, y);
  }
}
