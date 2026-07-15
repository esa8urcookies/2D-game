// Renderer: draws the world and every entity onto the canvas.
// All drawing happens in the internal 1920x1080 resolution;
// the canvas element itself is scaled to fit the window with CSS.

import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';
import { drawPixelText } from '../assets/PixelFont.js';

// The background is an endless grid so the player can see that
// they are moving even though the camera follows them.
const GRID_SIZE = 128;

// Entities are not drawn if they are this far outside the screen.
const CULL_MARGIN = 200;

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(game) {
    this.drawBackground(game.camera);
    this.drawEnemies(game.enemies, game.camera);
    this.drawPlayer(game.player, game.camera);
    this.drawProjectiles(game.projectiles, game.camera);
    this.drawDamageTexts(game.damageTexts, game.camera);
  }

  /**
   * A small bar centered above an entity. Only a thin outline plus
   * two rects, so it stays cheap even with hundreds on screen.
   */
  drawHealthBar(screenX, screenY, healthPercent, fillColor) {
    const ctx = this.ctx;
    const width = 90;
    const height = 10;
    const x = screenX - width / 2;

    ctx.fillStyle = 'rgba(10, 10, 16, 0.8)';
    ctx.fillRect(x - 2, screenY - 2, width + 4, height + 4);
    ctx.fillStyle = '#2a2d38';
    ctx.fillRect(x, screenY, width, height);
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, screenY, width * Math.max(0, healthPercent), height);
  }

  /** Skip drawing anything that is comfortably off screen. */
  isVisible(screen) {
    return (
      screen.x > -CULL_MARGIN &&
      screen.x < GAME_WIDTH + CULL_MARGIN &&
      screen.y > -CULL_MARGIN &&
      screen.y < GAME_HEIGHT + CULL_MARGIN
    );
  }

  drawBackground(camera) {
    const ctx = this.ctx;

    // Base color.
    ctx.fillStyle = '#14141c';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Grid lines, offset by the camera so they scroll with the world.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;

    const startX = -(camera.x % GRID_SIZE);
    const startY = -(camera.y % GRID_SIZE);

    ctx.beginPath();
    for (let x = startX; x <= GAME_WIDTH; x += GRID_SIZE) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
    }
    for (let y = startY; y <= GAME_HEIGHT; y += GRID_SIZE) {
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
    }
    ctx.stroke();
  }

  drawEnemies(enemies, camera) {
    const ctx = this.ctx;

    for (const enemy of enemies) {
      const screen = camera.worldToScreen(enemy.x, enemy.y);
      if (!this.isVisible(screen)) continue;

      const half = enemy.spriteSize / 2;

      // A gentle squish cycle makes the horde feel alive. Bats bob
      // up and down instead of squishing.
      const wobble = Math.sin(enemy.animationTimer * 6);
      let squishY = 1;
      let bobOffset = 0;

      if (enemy.typeName === 'bat') {
        bobOffset = wobble * 10;
      } else {
        squishY = 1 + wobble * 0.05;
      }

      ctx.save();
      ctx.translate(screen.x, screen.y + bobOffset);
      ctx.scale(enemy.facing, squishY);

      // Flash white for a moment when hit.
      if (enemy.hitFlashTimer > 0) {
        ctx.filter = 'brightness(2.5) saturate(0.3)';
      }

      ctx.drawImage(enemy.sprite, -half, -half);
      ctx.restore();

      // Health bar, only once the enemy has actually been hurt.
      if (enemy.health < enemy.maxHealth) {
        this.drawHealthBar(
          screen.x,
          screen.y - 80,
          enemy.health / enemy.maxHealth,
          '#e04040'
        );
      }
    }
  }

  drawPlayer(player, camera) {
    const ctx = this.ctx;
    const screen = camera.worldToScreen(player.x, player.y);
    const half = player.spriteSize / 2;
    const frame = player.getFrame();

    ctx.save();

    // Blink while the post-hit grace period is active.
    if (player.hitTimer > 0 && Math.floor(player.hitTimer * 12) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    // Keep pixel art crisp when the frame is scaled to sprite size.
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      frame.image,
      frame.sx, frame.sy, frame.size, frame.size,
      screen.x - half, screen.y - half, player.spriteSize, player.spriteSize
    );

    ctx.restore();

    // The player's own bar floats above their head; the color shifts
    // as health drops.
    const percent = player.health / player.maxHealth;
    const color = percent > 0.5 ? '#5cd65c' : percent > 0.25 ? '#ffd54f' : '#e04040';
    this.drawHealthBar(screen.x, screen.y - 110, percent, color);
  }

  drawProjectiles(projectiles, camera) {
    const ctx = this.ctx;

    for (const projectile of projectiles) {
      const screen = camera.worldToScreen(projectile.x, projectile.y);
      if (!this.isVisible(screen)) continue;

      // Outer glow.
      ctx.fillStyle = 'rgba(255, 213, 79, 0.35)';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, projectile.collisionRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Core.
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, projectile.collisionRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Floating damage numbers that rise and fade out. */
  drawDamageTexts(damageTexts, camera) {
    const ctx = this.ctx;

    for (const text of damageTexts) {
      const screen = camera.worldToScreen(text.x, text.y);
      if (!this.isVisible(screen)) continue;

      ctx.save();
      ctx.globalAlpha = Math.min(1, text.life / (text.maxLife * 0.5));
      drawPixelText(ctx, text.text, screen.x, screen.y, {
        scale: 4,
        color: '#ffd54f',
        outline: '#16161f',
        align: 'center',
      });
      ctx.restore();
    }
  }
}
