// The Game class owns all game state and runs the main loop.

import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { Renderer } from '../systems/Renderer.js';
import { UISystem } from '../systems/UISystem.js';
import { Spawner } from '../systems/Spawner.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { GAME_WIDTH, GAME_HEIGHT } from './Constants.js';

// If the browser tab lags or is backgrounded, a single frame could
// report a huge delta time. Capping it prevents physics jumps.
const MAX_DELTA_TIME = 1 / 30;

// Projectiles are removed once they are this far outside the screen.
const PROJECTILE_CLEANUP_MARGIN = 200;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.input = new Input();
    this.camera = new Camera();
    this.renderer = new Renderer(this.ctx);
    this.ui = new UISystem(this.ctx);
    this.spawner = new Spawner();
    this.weapons = new WeaponSystem();
    this.collisions = new CollisionSystem();

    // The player starts at the world origin, which the camera
    // centers on screen.
    this.player = new Player(0, 0);
    this.enemies = [];
    this.projectiles = [];

    // Run stats shown in the HUD.
    this.killCount = 0;
    this.survivalTime = 0;

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
    this.survivalTime += deltaTime;

    this.player.update(deltaTime, this.input);
    this.spawner.update(deltaTime, this);

    for (const enemy of this.enemies) {
      enemy.update(deltaTime, this.player);
    }

    this.weapons.update(deltaTime, this);

    for (const projectile of this.projectiles) {
      projectile.update(deltaTime);
    }

    this.collisions.update(this);
    this.removeDeadEntities();

    this.camera.follow(this.player);
    this.ui.update(deltaTime);
  }

  removeDeadEntities() {
    // Every enemy that died this frame counts as a kill.
    const enemiesBefore = this.enemies.length;
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    this.killCount += enemiesBefore - this.enemies.length;

    // Projectiles disappear when spent or far off screen.
    this.projectiles = this.projectiles.filter(
      (projectile) => !projectile.dead && !this.isOffScreen(projectile)
    );
  }

  isOffScreen(entity) {
    const screen = this.camera.worldToScreen(entity.x, entity.y);
    return (
      screen.x < -PROJECTILE_CLEANUP_MARGIN ||
      screen.x > GAME_WIDTH + PROJECTILE_CLEANUP_MARGIN ||
      screen.y < -PROJECTILE_CLEANUP_MARGIN ||
      screen.y > GAME_HEIGHT + PROJECTILE_CLEANUP_MARGIN
    );
  }

  render() {
    this.renderer.render(this);
    this.ui.render(this);
  }
}
