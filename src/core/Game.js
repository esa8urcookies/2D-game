// The Game class owns all game state and runs the main loop.
//
// States: 'menu' (title screen), 'playing', 'paused', 'gameover'.
// Each frame: update entities and systems, then render everything.

import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { FloatingText } from '../entities/FloatingText.js';
import { Renderer } from '../systems/Renderer.js';
import { UISystem } from '../systems/UISystem.js';
import { Spawner } from '../systems/Spawner.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { MenuSystem } from '../systems/MenuSystem.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

// If the browser tab lags or is backgrounded, a single frame could
// report a huge delta time. Capping it prevents physics jumps.
const MAX_DELTA_TIME = 1 / 30;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.input = new Input();
    this.input.attachMouse(canvas);
    this.camera = new Camera();
    this.renderer = new Renderer(this.ctx);
    this.ui = new UISystem(this.ctx);
    this.menu = new MenuSystem();
    this.collisions = new CollisionSystem();

    this.state = 'menu';

    // startRun() fills these in; they exist here so the menu's
    // drifting background has a world to point the camera at.
    this.player = new Player(0, 0);
    this.enemies = [];
    this.projectiles = [];
    this.damageTexts = [];
    this.spawner = new Spawner();
    this.weapons = new WeaponSystem();
    this.killCount = 0;
    this.survivalTime = 0;

    this.lastTime = 0;

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  /** Reset everything and start a fresh run. */
  startRun() {
    this.player = new Player(0, 0);
    this.enemies = [];
    this.projectiles = [];
    this.damageTexts = [];
    this.spawner = new Spawner();
    this.weapons = new WeaponSystem();
    this.killCount = 0;
    this.survivalTime = 0;
    this.camera.follow(this.player);
    this.menu.screen = 'title';
    this.menu.selectedIndex = 0;
    this.state = 'playing';
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

  /** Spawn a floating damage number in the world. */
  addDamageText(amount, x, y) {
    this.damageTexts.push(new FloatingText(amount, x, y));
  }

  update(deltaTime) {
    this.camera.update(deltaTime);

    if (this.state === 'playing') {
      this.updateGameplay(deltaTime);

      if (this.input.wasPressed('Escape')) {
        this.state = 'paused';
        this.menu.selectedIndex = 0;
      }
    } else {
      // Title screen, pause menu, or game-over screen.
      this.menu.update(deltaTime, this);

      // The title screen background drifts slowly, like an
      // attract mode.
      if (this.state === 'menu') {
        this.camera.x += 40 * deltaTime;
      }
    }

    this.ui.update(deltaTime);
    this.input.endFrame();
  }

  updateGameplay(deltaTime) {
    this.survivalTime += deltaTime;

    this.player.update(deltaTime, this);
    this.spawner.update(deltaTime, this);

    for (const enemy of this.enemies) enemy.update(deltaTime, this);
    this.weapons.update(deltaTime, this);
    for (const projectile of this.projectiles) projectile.update(deltaTime, this);
    for (const text of this.damageTexts) text.update(deltaTime, this);

    this.collisions.update(this);
    this.removeDeadEntities();

    this.camera.follow(this.player);

    if (this.player.health <= 0) {
      this.state = 'gameover';
      this.menu.selectedIndex = 0;
    }
  }

  removeDeadEntities() {
    // Every enemy that died this frame counts as a kill.
    const enemiesBefore = this.enemies.length;
    this.enemies = this.enemies.filter((enemy) => !enemy.dead);
    this.killCount += enemiesBefore - this.enemies.length;

    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);
    this.damageTexts = this.damageTexts.filter((text) => !text.dead);
  }

  render() {
    if (this.state === 'menu') {
      // The drifting grass behind the menu, dimmed a little so the
      // menu artwork stays easy to read.
      this.renderer.drawBackground(this.camera);
      this.ctx.fillStyle = 'rgba(12, 14, 20, 0.45)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.menu.render(this);
      return;
    }

    this.renderer.render(this);
    this.ui.render(this);

    if (this.state === 'paused' || this.state === 'gameover') {
      this.menu.render(this);
    }
  }
}
