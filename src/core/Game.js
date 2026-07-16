// The Game class owns all game state and runs the main loop.
//
// States: 'menu' (title screen), 'playing', 'paused', 'gameover'.
// Each frame: update entities and systems, then render everything.

import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { FloatingText } from '../entities/FloatingText.js';
import { XPGem, rollGemTier } from '../entities/XPGem.js';
import { Renderer } from '../systems/Renderer.js';
import { UISystem } from '../systems/UISystem.js';
import { Spawner } from '../systems/Spawner.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { MenuSystem } from '../systems/MenuSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_CONFIG,
  WEAPON_CONFIG,
  XP_CONFIG,
} from '../config/GameConfig.js';

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
    this.upgrades = new UpgradeSystem();

    // 'menu', 'playing', 'paused', 'levelup', 'gameover'
    this.state = 'menu';

    // startRun() fills everything in properly; calling it here gives
    // the menu's drifting background a world to point the camera at.
    this.startRun();
    this.state = 'menu';

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
    this.gems = [];
    this.spawner = new Spawner();
    this.weapons = new WeaponSystem();
    this.killCount = 0;
    this.survivalTime = 0;

    // Live run stats — upgrades change these, a new run resets them.
    this.stats = {
      damage: WEAPON_CONFIG.projectileDamage,
      fireInterval: WEAPON_CONFIG.fireInterval,
      projectileSpeed: WEAPON_CONFIG.projectileSpeed,
      magnetRadius: PLAYER_CONFIG.magnetRadius,
    };
    this.upgradeLevels = {}; // upgrade id -> times taken
    this.pendingLevelUps = 0;

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

  /** Called by a gem when the player picks it up. */
  collectGem(gem) {
    gem.dead = true;
    this.player.xp += gem.value;

    // Handle several level-ups at once (a big gem can do that):
    // bank them, then show one upgrade screen per level.
    while (this.player.xp >= XP_CONFIG.xpForLevel(this.player.level)) {
      this.player.xp -= XP_CONFIG.xpForLevel(this.player.level);
      this.player.level += 1;
      this.pendingLevelUps += 1;
    }
  }

  /** Called by the UpgradeSystem after a card is picked. */
  onUpgradeChosen() {
    if (this.pendingLevelUps > 0) {
      // More banked level-ups: roll a fresh set of cards.
      this.pendingLevelUps -= 1;
      this.upgrades.rollChoices(this);
      if (!this.upgrades.isEmpty()) return;
    }
    this.state = 'playing';
  }

  update(deltaTime) {
    this.camera.update(deltaTime);

    if (this.state === 'playing') {
      this.updateGameplay(deltaTime);

      if (this.input.wasPressed('Escape')) {
        this.state = 'paused';
        this.menu.selectedIndex = 0;
      }
    } else if (this.state === 'levelup') {
      this.upgrades.update(deltaTime, this);
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
    for (const gem of this.gems) gem.update(deltaTime, this);
    for (const text of this.damageTexts) text.update(deltaTime, this);

    this.collisions.update(this);
    this.removeDeadEntities();

    this.camera.follow(this.player);

    // Death wins over leveling: no upgrade cards on a game over.
    if (this.player.health <= 0) {
      this.state = 'gameover';
      this.pendingLevelUps = 0;
      this.menu.selectedIndex = 0;
      return;
    }

    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
      this.upgrades.rollChoices(this);
      if (!this.upgrades.isEmpty()) {
        this.state = 'levelup';
      }
    }
  }

  removeDeadEntities() {
    // Every enemy that died this frame counts as a kill and drops
    // an XP gem where it fell.
    const survivors = [];
    for (const enemy of this.enemies) {
      if (enemy.dead) {
        this.killCount += 1;
        this.gems.push(new XPGem(enemy.x, enemy.y, rollGemTier()));
      } else {
        survivors.push(enemy);
      }
    }
    this.enemies = survivors;

    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);
    this.gems = this.gems.filter((gem) => !gem.dead);
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

    if (this.state === 'levelup') {
      this.upgrades.render(this);
    } else if (this.state === 'paused' || this.state === 'gameover') {
      this.menu.render(this);
    }
  }
}
