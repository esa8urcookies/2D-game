// The player character. Movement is the only input in this game;
// the WeaponSystem fires automatically at nearby enemies.
//
// The player is drawn from a 4-direction walking sprite sheet:
// procedural pixel art by default, or a custom PNG if one exists
// (see CUSTOM_SHEET in PixelHeroSheet.js).

import { Entity } from './Entity.js';
import {
  createHeroSheet,
  tryLoadCustomSheet,
  HERO_SHEET_META,
  CUSTOM_SHEET,
} from '../assets/PixelHeroSheet.js';
import { PLAYER_CONFIG, SPRITE_SIZE } from '../config/GameConfig.js';
import { drawBar, healthColor } from '../core/DrawUtils.js';

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, PLAYER_CONFIG.collisionRadius);

    this.moveSpeed = PLAYER_CONFIG.moveSpeed;
    this.maxHealth = PLAYER_CONFIG.maxHealth;
    this.health = PLAYER_CONFIG.maxHealth;

    // Experience and level. XP counts progress toward the NEXT
    // level only; the Game resets it on each level-up.
    this.level = 1;
    this.xp = 0;

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

    // Invincibility window: counts down after taking a hit. While
    // above zero the player blinks and cannot be damaged again.
    this.hitTimer = 0;
  }

  update(deltaTime, game) {
    const move = game.input.getMovementDirection();
    // Wind Boots raise the multiplier; base speed stays in config.
    const speed = this.moveSpeed * game.stats.moveSpeedMultiplier;
    this.velocityX = move.x * speed;
    this.velocityY = move.y * speed;
    super.update(deltaTime, game);

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
      sx: column * frameSize,
      sy: rows[this.direction] * frameSize,
      size: frameSize,
    };
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.x, this.y);
    const half = this.spriteSize / 2;
    const frame = this.getFrame();

    // The Lampwright's aura: a warm pool of light that follows you.
    // In a world of smothering dark, you are the only warm light —
    // it also gently lights up whatever creeps close.
    const glow = getPlayerGlow();
    const g = glow.width;
    const flicker = 1 + Math.sin(this.walkTimer * 20 + this.x * 0.01) * 0.03;
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(glow, screen.x - (g * flicker) / 2, screen.y - (g * flicker) / 2, g * flicker, g * flicker);
    ctx.restore();

    ctx.save();

    // Blink while the invincibility window is active.
    if (this.hitTimer > 0 && Math.floor(this.hitTimer * 12) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    // Keep pixel art crisp when the frame is scaled to sprite size.
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.sheet,
      frame.sx, frame.sy, frame.size, frame.size,
      screen.x - half, screen.y - half, this.spriteSize, this.spriteSize
    );

    ctx.restore();

    // Health bar above the head; the color shifts as health drops.
    const percent = this.health / this.maxHealth;
    drawBar(ctx, screen.x - 45, screen.y - 110, 90, 10, percent, healthColor(percent));
  }

  /**
   * Called by the CollisionSystem when an enemy touches the player.
   * Returns true if the hit landed (false while invincible).
   */
  takeDamage(amount) {
    if (this.hitTimer > 0) {
      return false;
    }

    this.health = Math.max(0, this.health - amount);
    this.hitTimer = PLAYER_CONFIG.invincibilitySeconds;
    return true;
  }
}

// The Lampwright's warm light pool, built once and reused every frame.
let playerGlow = null;
function getPlayerGlow() {
  if (playerGlow) return playerGlow;
  const size = 460;
  playerGlow = document.createElement('canvas');
  playerGlow.width = size;
  playerGlow.height = size;
  const ctx = playerGlow.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 214, 150, 0.42)');
  grad.addColorStop(0.5, 'rgba(255, 180, 90, 0.16)');
  grad.addColorStop(1, 'rgba(255, 170, 80, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return playerGlow;
}
