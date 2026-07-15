// UI system: draws the in-game HUD on top of the game world, using
// the same pixel font as the menu so everything matches.
// Everything is positioned in the internal 1920x1080 space.

import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';
import { formatTime } from '../core/MathUtils.js';
import { drawPixelText } from '../assets/PixelFont.js';

export class UISystem {
  constructor(ctx) {
    this.ctx = ctx;

    // Smoothed FPS so the number is readable instead of flickering.
    this.fps = 0;
    this.fpsTimer = 0;
    this.frameCount = 0;
  }

  update(deltaTime) {
    this.frameCount += 1;
    this.fpsTimer += deltaTime;

    // Refresh the displayed FPS twice per second.
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }
  }

  render(game) {
    const ctx = this.ctx;

    this.drawHealthBar(ctx, game.player);

    // Survival timer, top center.
    drawPixelText(ctx, formatTime(game.survivalTime), GAME_WIDTH / 2, 28, {
      scale: 7,
      color: '#e8ecf4',
      shadeColor: '#9aa3b8',
      outline: '#16161f',
      align: 'center',
    });

    // Kill counter, top right.
    drawPixelText(ctx, `KILLS ${game.killCount}`, GAME_WIDTH - 340, 36, {
      scale: 5,
      color: '#ffd54f',
      shadeColor: '#c8891a',
      outline: '#16161f',
    });

    // Debug info, bottom left (small, quiet).
    ctx.save();
    ctx.textBaseline = 'top';
    ctx.font = '24px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText(`FPS: ${this.fps}  Enemies: ${game.enemies.length}`, 24, GAME_HEIGHT - 48);
    ctx.restore();
  }

  /** The big HP bar, top left, in the same chunky pixel style. */
  drawHealthBar(ctx, player) {
    const x = 24;
    const y = 28;
    const width = 440;
    const height = 40;
    const border = 6;
    const percent = Math.max(0, player.health / player.maxHealth);
    const color = percent > 0.5 ? '#5cd65c' : percent > 0.25 ? '#ffd54f' : '#e04040';

    // Outline, background, then fill.
    ctx.fillStyle = '#16161f';
    ctx.fillRect(x - border, y - border, width + border * 2, height + border * 2);
    ctx.fillStyle = '#2a2d38';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width * percent, height);

    drawPixelText(ctx, `HP ${Math.ceil(player.health)}/${player.maxHealth}`, x + 14, y + 6, {
      scale: 4,
      color: '#ffffff',
      outline: '#16161f',
    });
  }
}
