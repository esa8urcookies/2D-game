// Renderer: draws the world and every entity onto the canvas.
// All drawing happens in the internal 1920x1080 resolution;
// the canvas element itself is scaled to fit the window with CSS.

import { GAME_WIDTH, GAME_HEIGHT } from '../core/Game.js';

// The background is an endless grid so the player can see that
// they are moving even though the camera follows them.
const GRID_SIZE = 128;

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(game) {
    const ctx = this.ctx;

    this.drawBackground(game.camera);
    this.drawPlayer(game.player, game.camera);
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

  drawPlayer(player, camera) {
    const ctx = this.ctx;
    const screen = camera.worldToScreen(player.x, player.y);
    const half = player.spriteSize / 2;

    ctx.save();
    ctx.translate(screen.x, screen.y);

    // Flip horizontally when facing left.
    ctx.scale(player.facing, 1);

    ctx.drawImage(player.sprite, -half, -half);
    ctx.restore();
  }
}
