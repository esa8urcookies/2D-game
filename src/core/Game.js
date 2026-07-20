// The Game class owns all game state and runs the main loop.
//
// States: 'menu' (title screen), 'playing', 'paused', 'gameover'.
// Each frame: update entities and systems, then render everything.

import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { FloatingText } from '../entities/FloatingText.js';
import { XPGem, rollGemTier, tierForValue } from '../entities/XPGem.js';
import { Renderer } from '../systems/Renderer.js';
import { UISystem } from '../systems/UISystem.js';
import { Spawner } from '../systems/Spawner.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { MenuSystem } from '../systems/MenuSystem.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { ChestSystem } from '../systems/ChestSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { Chest } from '../entities/Chest.js';
import { Coin } from '../entities/Coin.js';
import { loadSave, persistSave } from './SaveData.js';
import { audio } from './Audio.js';
import { drawPixelText } from '../assets/PixelFont.js';
import { SHOP_UPGRADES } from '../config/ShopUpgrades.js';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_CONFIG,
  XP_CONFIG,
  ENEMY_TYPES,
  COIN_CONFIG,
  EFFECTS_CONFIG,
} from '../config/GameConfig.js';

// The mute toggle lives at a fixed screen spot on every screen.
const MUTE_RECT = { x: GAME_WIDTH - 84, y: 24, w: 56, h: 56 };

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
    this.chestSystem = new ChestSystem();
    this.particles = new ParticleSystem();

    // 'menu', 'playing', 'paused', 'levelup', 'chest', 'gameover'
    this.state = 'menu';

    // Persistent progress: total coins + permanent shop upgrades.
    this.save = loadSave();

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
    this.chests = [];
    this.coinPickups = [];
    this.coins = 0; // coins earned THIS run; banked on death
    this.particles.clear();
    this.spawner = new Spawner();
    this.weapons = new WeaponSystem();
    this.weapons.addWeapon('arcaneBolt'); // the starting weapon
    this.killCount = 0;
    this.bossesKilled = 0;
    this.survivalTime = 0;
    this.coinsBanked = false; // guards against double-banking

    // Live run stats — passives change these, a new run resets them.
    // (Per-weapon stats live on the weapons themselves.)
    this.stats = {
      magnetRadius: PLAYER_CONFIG.magnetRadius,
      cooldownMultiplier: 1, // Spellbook lowers this
      damageMultiplier: 1, // Power Stone raises this
      moveSpeedMultiplier: 1, // Wind Boots raise this
      xpMultiplier: 1, // Old Wisdom (shop) raises this
      luck: 0, // Clover Coin; boosts chest upgrades
    };
    this.passives = {}; // passive id -> level owned
    this.pendingLevelUps = 0;

    // Permanent shop upgrades kick in at the start of every run.
    if (this.save) {
      for (const def of SHOP_UPGRADES) {
        const level = this.save.shop[def.id] || 0;
        if (level > 0) def.apply(this, level);
      }
    }

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

  /** Spawn floating text in the world (damage gold, healing green). */
  addDamageText(text, x, y, color) {
    this.damageTexts.push(new FloatingText(text, x, y, color));
  }

  /**
   * Damage an enemy with full feedback: floating number, hit flash,
   * and optional knockback. Every weapon deals damage through this,
   * so the Power Stone's global multiplier applies in one place.
   */
  damageEnemy(enemy, amount, dirX = 0, dirY = 0, knockbackForce = 0) {
    const total = Math.round(amount * this.stats.damageMultiplier);
    const wasAlive = !enemy.dead;
    enemy.takeDamage(total, dirX, dirY, knockbackForce);
    this.addDamageText(total, enemy.x, enemy.y - 60);
    // Death is handled (with its bigger burst) in removeDeadEntities;
    // only play the light hit tick for survivors.
    if (wasAlive && !enemy.dead) audio.play('enemyHit');
  }

  /** Called by a gem when the player picks it up. */
  collectGem(gem) {
    gem.dead = true;
    this.gainXP(gem.value);
    // A small sparkle in the gem's color, plus a soft blip.
    this.particles.burst(gem.x, gem.y, {
      count: 5,
      color: gem.color,
      speed: [40, 140],
      size: [3, 6],
      life: [0.2, 0.4],
    });
    audio.play('xpPickup');
  }

  /** Add XP (boosted by Old Wisdom) and bank any level-ups. */
  gainXP(amount) {
    this.player.xp += amount * this.stats.xpMultiplier;

    // Handle several level-ups at once (a big gem can do that):
    // bank them, then show one upgrade screen per level.
    while (this.player.xp >= XP_CONFIG.xpForLevel(this.player.level)) {
      this.player.xp -= XP_CONFIG.xpForLevel(this.player.level);
      this.player.level += 1;
      this.pendingLevelUps += 1;
    }
  }

  /** Called by a chest when the player touches it. */
  openChest() {
    this.chestSystem.open(this);
  }

  /** Called by the UpgradeSystem after a card is picked. */
  onUpgradeChosen() {
    if (this.pendingLevelUps > 0) {
      // More banked level-ups: roll a fresh set of cards.
      this.pendingLevelUps -= 1;
      this.upgrades.rollChoices(this);
      if (!this.upgrades.isEmpty()) {
        audio.play('levelUp');
        return;
      }
    }
    this.state = 'playing';
  }

  /**
   * Toggle mute if the mute button was clicked or M was pressed.
   * Runs before every screen's own input so the click is consumed
   * and never doubles as a game action.
   */
  handleMuteButton() {
    if (this.input.wasPressed('KeyM')) {
      audio.toggleMute();
    }
    if (this.input.clickedThisFrame) {
      const { x, y, w, h } = MUTE_RECT;
      if (
        this.input.mouseX >= x && this.input.mouseX <= x + w &&
        this.input.mouseY >= y && this.input.mouseY <= y + h
      ) {
        audio.toggleMute();
        this.input.clickedThisFrame = false; // don't let it click through
      }
    }
  }

  update(deltaTime) {
    this.camera.update(deltaTime);
    this.handleMuteButton();

    if (this.state === 'playing') {
      this.updateGameplay(deltaTime);

      if (this.input.wasPressed('Escape')) {
        this.state = 'paused';
        this.menu.selectedIndex = 0;
      }
    } else if (this.state === 'levelup') {
      this.upgrades.update(deltaTime, this);
    } else if (this.state === 'chest') {
      this.chestSystem.update(deltaTime, this);
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
    for (const coin of this.coinPickups) coin.update(deltaTime, this);
    for (const chest of this.chests) chest.update(deltaTime, this);
    for (const text of this.damageTexts) text.update(deltaTime, this);
    this.particles.update(deltaTime);

    this.collisions.update(this);
    this.removeDeadEntities();

    this.camera.follow(this.player);

    // Death wins over leveling: no upgrade cards on a game over.
    if (this.player.health <= 0) {
      this.state = 'gameover';
      this.pendingLevelUps = 0;
      this.menu.selectedIndex = 0;
      audio.play('gameOver');

      // Bank this run's coins into the permanent save, exactly once.
      if (!this.coinsBanked) {
        this.coinsBanked = true;
        this.save.totalCoins += this.coins;
        persistSave(this.save);
      }
      return;
    }

    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
      this.upgrades.rollChoices(this);
      if (!this.upgrades.isEmpty()) {
        this.state = 'levelup';
        audio.play('levelUp');
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
        const type = ENEMY_TYPES[enemy.typeName];

        // Death burst: chunks in the enemy's color. Bigger enemies
        // spray more; the particle cap keeps this cheap in a swarm.
        this.particles.burst(enemy.x, enemy.y, {
          count: Math.round(8 * enemy.scale),
          color: type.color || '#ffffff',
          speed: [80, 260 * enemy.scale],
          size: [4, 10 * enemy.scale],
          life: [0.3, 0.6],
          gravity: 300,
        });
        audio.play('enemyDeath');

        if (enemy.isBoss) {
          this.bossesKilled += 1;
          // A boss going down earns a real (still bounded) shake and
          // a much bigger burst.
          const { intensity, duration } = EFFECTS_CONFIG.bossDeathShake;
          this.camera.shake(intensity, duration);
          this.particles.burst(enemy.x, enemy.y, {
            count: 40,
            color: type.color || '#ffffff',
            speed: [120, 520],
            size: [6, 16],
            life: [0.4, 0.9],
            gravity: 260,
          });
        }

        // Big enemies guarantee a big gem; the rest roll for one.
        const tier = type.xpValue ? tierForValue(type.xpValue) : rollGemTier();
        this.gems.push(new XPGem(enemy.x, enemy.y, tier));

        // Bosses leave a treasure chest behind; normal enemies have
        // a small chance to drop a coin.
        if (type.dropsChest) {
          this.chests.push(new Chest(enemy.x, enemy.y));
        } else if (Math.random() < COIN_CONFIG.dropChance) {
          this.coinPickups.push(new Coin(enemy.x, enemy.y));
        }
      } else {
        survivors.push(enemy);
      }
    }
    this.enemies = survivors;

    this.projectiles = this.projectiles.filter((projectile) => !projectile.dead);
    this.gems = this.gems.filter((gem) => !gem.dead);
    this.coinPickups = this.coinPickups.filter((coin) => !coin.dead);
    this.chests = this.chests.filter((chest) => !chest.dead);
    this.damageTexts = this.damageTexts.filter((text) => !text.dead);
  }

  render() {
    if (this.state === 'menu') {
      // The drifting world behind the menu, dimmed a little so the
      // menu artwork stays easy to read.
      this.renderer.drawBackground(this.camera);
      this.renderer.drawVignette();
      this.ctx.fillStyle = 'rgba(12, 14, 20, 0.4)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.menu.render(this);
      this.drawMuteButton();
      return;
    }

    this.renderer.render(this);
    this.ui.render(this);

    if (this.state === 'levelup') {
      this.upgrades.render(this);
    } else if (this.state === 'chest') {
      this.chestSystem.render(this);
    } else if (this.state === 'paused' || this.state === 'gameover') {
      this.menu.render(this);
    }

    this.drawMuteButton();
  }

  /** A small speaker icon that shows, and toggles, the mute state. */
  drawMuteButton() {
    const ctx = this.ctx;
    const { x, y, w, h } = MUTE_RECT;

    ctx.save();
    ctx.fillStyle = 'rgba(22, 22, 31, 0.6)';
    ctx.fillRect(x, y, w, h);

    // Speaker body + cone.
    ctx.fillStyle = audio.muted ? '#8a90a3' : '#ffd54f';
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 22);
    ctx.lineTo(x + 22, y + 22);
    ctx.lineTo(x + 32, y + 12);
    ctx.lineTo(x + 32, y + 44);
    ctx.lineTo(x + 22, y + 34);
    ctx.lineTo(x + 14, y + 34);
    ctx.closePath();
    ctx.fill();

    if (audio.muted) {
      // A red slash when muted.
      ctx.strokeStyle = '#e04040';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(x + 36, y + 16);
      ctx.lineTo(x + 46, y + 40);
      ctx.stroke();
    } else {
      // Sound waves when audible.
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x + 34, y + 28, 8, -0.7, 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 34, y + 28, 15, -0.7, 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }
}
