// Keyboard and mouse input handling.
// Tracks held keys, keys pressed this frame, and the mouse position
// in internal game coordinates (the canvas is scaled by CSS, so the
// mouse position must be converted back to 1920x1080 space).

import { normalize } from './MathUtils.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

export class Input {
  constructor() {
    this.keys = new Set();
    this.pressedThisFrame = new Set();

    this.mouseX = 0;
    this.mouseY = 0;
    this.clickedThisFrame = false;

    window.addEventListener('keydown', (event) => {
      if (!event.repeat) {
        this.pressedThisFrame.add(event.code);
      }
      this.keys.add(event.code);

      // Stop arrow keys and space from scrolling the page.
      if (event.code.startsWith('Arrow') || event.code === 'Space') {
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

  /** Start listening to the mouse, mapped into game coordinates. */
  attachMouse(canvas) {
    const toGameCoords = (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * GAME_WIDTH;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * GAME_HEIGHT;
    };

    canvas.addEventListener('mousemove', toGameCoords);
    canvas.addEventListener('mousedown', (event) => {
      toGameCoords(event);
      this.clickedThisFrame = true;
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }

  /** True only on the frame the key first went down. */
  wasPressed(code) {
    return this.pressedThisFrame.has(code);
  }

  /** Called by the game at the end of every frame. */
  endFrame() {
    this.pressedThisFrame.clear();
    this.clickedThisFrame = false;
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
