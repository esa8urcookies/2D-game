// The Game class owns all game state and runs the main loop.

import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { Renderer } from '../systems/Renderer.js';
import { UISystem } from '../systems/UISystem.js';

// Internal resolution. All game logic and drawing uses these
// coordinates; the canvas is scaled to the window afterwards.
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

// If the browser tab lags or is backgrounded, a single frame could
// report a huge delta time. Capping it prevents physics jumps.
const MAX_DELTA_TIME = 1 / 30;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.input = new Input();
    this.camera = new Camera();
    this.renderer = new Renderer(this.ctx);
    this.ui = new UISystem(this.ctx);

    // The player starts at the world origin, which the camera
    // centers on screen.
    this.player = new Player(0, 0);

    this.lastTime = 0;

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Scale the canvas element to fit the window while preserving 16:9.
   * The internal resolution stays 1920x1080; only the CSS size changes.
   */
  handleResize() {
    const windowRatio = window.innerWidth / window.innerHeight;
    const gameRatio = GAME_WIDTH / GAME_HEIGHT;

    let displayWidth;
    let displayHeight;

    if (windowRatio > gameRatio) {
      // Window is wider than 16:9 -> fit to height (pillarbox).
      displayHeight = window.innerHeight;
      displayWidth = displayHeight * gameRatio;
    } else {
      // Window is taller than 16:9 -> fit to width (letterbox).
      displayWidth = window.innerWidth;
      displayHeight = displayWidth / gameRatio;
    }

    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;
  }

  start() {
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(currentTime) {
    // Delta time in seconds since the last frame.
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    deltaTime = Math.min(deltaTime, MAX_DELTA_TIME);

    this.update(deltaTime);
    this.render();

    requestAnimationFrame((time) => this.loop(time));
  }

  update(deltaTime) {
    this.player.update(deltaTime, this.input);
    this.camera.follow(this.player);
    this.ui.update(deltaTime);
  }

  render() {
    this.renderer.render(this);
    this.ui.render(this);
  }
}
