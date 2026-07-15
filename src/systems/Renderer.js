// Renderer: draws the background and asks every entity to draw
// itself, in back-to-front order. Entities that are far off screen
// are skipped entirely.
//
// All drawing happens in the internal 1920x1080 resolution; the
// canvas element itself is scaled to fit the window with CSS.

import { GAME_WIDTH, GAME_HEIGHT, EFFECTS_CONFIG } from '../config/GameConfig.js';

// The background is an endless grid so the player can see that
// they are moving even though the camera follows them.
const GRID_SIZE = 128;

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(game) {
    this.drawBackground(game.camera);

    // Back-to-front: enemies under the player, projectiles and
    // damage numbers on top.
    this.drawAll(game.enemies, game.camera);
    game.player.render(this.ctx, game.camera);
    this.drawAll(game.projectiles, game.camera);
    this.drawAll(game.damageTexts, game.camera);
  }

  /** Render a list of entities, culling anything far off screen. */
  drawAll(entities, camera) {
    const margin = EFFECTS_CONFIG.offScreenMargin;

    for (const entity of entities) {
      if (camera.isVisible(entity.x, entity.y, margin)) {
        entity.render(this.ctx, camera);
      }
    }
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
}
