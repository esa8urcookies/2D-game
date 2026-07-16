// UI system: draws the in-game HUD on top of the game world, using
// the same pixel font as the menu so everything matches.
// Everything is positioned in the internal 1920x1080 space.

import { GAME_WIDTH, GAME_HEIGHT, XP_CONFIG } from '../config/GameConfig.js';
import { PASSIVE_DEFS } from '../config/Passives.js';
import { formatTime } from '../core/MathUtils.js';
import { drawPixelText } from '../assets/PixelFont.js';
import { drawBar, healthColor } from '../core/DrawUtils.js';

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
    this.drawXPBar(ctx, game.player);
    this.drawEquipment(ctx, game);

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

    // Debug info, bottom left (small, quiet), above the XP bar.
    ctx.save();
    ctx.textBaseline = 'top';
    ctx.font = '24px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText(`FPS: ${this.fps}  Enemies: ${game.enemies.length}`, 24, GAME_HEIGHT - 100);
    ctx.restore();
  }

  /**
   * Owned weapons and passives under the HP bar: a colored chip and
   * "SHORT LVn" per item ("MAX" at the cap). Weapons get square
   * chips, passives get diamond chips so the groups read apart.
   */
  drawEquipment(ctx, game) {
    let row = 0;

    for (const weapon of game.weapons.owned) {
      const y = 92 + row * 42;
      const label = weapon.isMaxLevel ? 'MAX' : `LV${weapon.level}`;

      ctx.fillStyle = '#16161f';
      ctx.fillRect(24, y, 26, 26);
      ctx.fillStyle = weapon.def.color;
      ctx.fillRect(28, y + 4, 18, 18);

      drawPixelText(ctx, `${weapon.def.short} ${label}`, 64, y + 2, {
        scale: 3,
        color: '#e8ecf4',
        outline: '#16161f',
      });
      row += 1;
    }

    for (const [id, level] of Object.entries(game.passives)) {
      const def = PASSIVE_DEFS[id];
      const y = 92 + row * 42;
      const label = level >= def.maxLevel ? 'MAX' : `LV${level}`;

      // Diamond chip: a square rotated 45 degrees.
      ctx.save();
      ctx.translate(37, y + 13);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#16161f';
      ctx.fillRect(-11, -11, 22, 22);
      ctx.fillStyle = def.color;
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();

      drawPixelText(ctx, `${def.short} ${label}`, 64, y + 2, {
        scale: 3,
        color: '#c9cede',
        outline: '#16161f',
      });
      row += 1;
    }
  }

  /** Full-width XP progress bar along the bottom, with the level. */
  drawXPBar(ctx, player) {
    const needed = XP_CONFIG.xpForLevel(player.level);
    const barX = 200;
    const barY = GAME_HEIGHT - 52;
    const barWidth = GAME_WIDTH - barX - 48;

    drawPixelText(ctx, `LV ${player.level}`, 36, barY - 2, {
      scale: 5,
      color: '#4fc3f7',
      shadeColor: '#2a7fb0',
      outline: '#16161f',
    });
    drawBar(ctx, barX, barY, barWidth, 28, player.xp / needed, '#4fc3f7', 4);
  }

  /** The big HP bar, top left, in the same chunky pixel style. */
  drawHealthBar(ctx, player) {
    const percent = player.health / player.maxHealth;

    drawBar(ctx, 24, 28, 440, 40, percent, healthColor(percent), 6);
    drawPixelText(ctx, `HP ${Math.ceil(player.health)}/${player.maxHealth}`, 38, 34, {
      scale: 4,
      color: '#ffffff',
      outline: '#16161f',
    });
  }
}
