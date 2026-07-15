// UI system: draws HUD text on top of the game world.
// Everything is positioned in the internal 1920x1080 space.

import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';

/** Format seconds as M:SS for the survival timer. */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

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

    ctx.save();
    ctx.textBaseline = 'top';

    // Title, top center.
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('SWARM SURVIVORS', GAME_WIDTH / 2, 24);

    // Survival timer, under the title.
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(formatTime(game.survivalTime), GAME_WIDTH / 2, 84);

    // Kill counter, top right.
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 213, 79, 0.9)';
    ctx.fillText(`Kills: ${game.killCount}`, GAME_WIDTH - 24, 24);

    // Debug info, top left.
    ctx.font = '28px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`FPS: ${this.fps}`, 24, 24);
    ctx.fillText(
      `Player: ${Math.round(game.player.x)}, ${Math.round(game.player.y)}`,
      24,
      60
    );
    ctx.fillText(`Enemies: ${game.enemies.length}`, 24, 96);

    // Controls hint, bottom left.
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillText('Move: WASD / Arrow Keys', 24, GAME_HEIGHT - 48);

    ctx.restore();
  }
}
