// Renderer: draws the background and asks every entity to draw
// itself, in back-to-front order. Entities that are far off screen
// are skipped entirely.
//
// All drawing happens in the internal 1920x1080 resolution; the
// canvas element itself is scaled to fit the window with CSS.

import { GAME_WIDTH, GAME_HEIGHT, EFFECTS_CONFIG } from '../config/GameConfig.js';
import {
  getGroundTile,
  getDecorationAt,
  TILE_SIZE,
  DECOR_CELL,
} from '../assets/WorldTiles.js';

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.vignette = buildVignette();
    this.candleGlow = buildCandleGlow();
  }

  render(game) {
    this.drawBackground(game.camera);

    // Back-to-front: gems and chests on the ground, then enemies,
    // the player, weapon effects, projectiles, and damage numbers.
    this.drawAll(game.gems, game.camera);
    this.drawAll(game.coinPickups, game.camera);
    this.drawAll(game.chests, game.camera);
    this.drawAll(game.enemies, game.camera);
    game.player.render(this.ctx, game.camera);
    game.weapons.render(this.ctx, game.camera, game);
    this.drawAll(game.projectiles, game.camera);
    game.particles.render(this.ctx, game.camera);
    this.drawAll(game.damageTexts, game.camera);

    this.drawVignette();
  }

  /** Soft dark edges over everything — the dark-fantasy mood light. */
  drawVignette() {
    this.ctx.drawImage(this.vignette, 0, 0);
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

  /**
   * The endless world: dark mossy ground with stone ruin patches,
   * scattered with decorations. Only what the camera can see is
   * drawn, and every position always hashes to the same art, so
   * the map is stable and seamless as it scrolls.
   */
  drawBackground(camera) {
    const ctx = this.ctx;

    ctx.imageSmoothingEnabled = false; // keep the pixels chunky

    // Layer 1: ground tiles.
    const firstTileX = Math.floor(camera.x / TILE_SIZE);
    const firstTileY = Math.floor(camera.y / TILE_SIZE);
    const tilesAcross = Math.ceil(GAME_WIDTH / TILE_SIZE) + 1;
    const tilesDown = Math.ceil(GAME_HEIGHT / TILE_SIZE) + 1;

    for (let ty = firstTileY; ty < firstTileY + tilesDown; ty++) {
      for (let tx = firstTileX; tx < firstTileX + tilesAcross; tx++) {
        // Round to whole pixels so tile seams never shimmer.
        ctx.drawImage(
          getGroundTile(tx, ty),
          Math.round(tx * TILE_SIZE - camera.x),
          Math.round(ty * TILE_SIZE - camera.y)
        );
      }
    }

    // Layer 2: sparse decorations (plus flickering candle light).
    const time = performance.now() / 1000;
    const firstCellX = Math.floor(camera.x / DECOR_CELL);
    const firstCellY = Math.floor(camera.y / DECOR_CELL);
    const cellsAcross = Math.ceil(GAME_WIDTH / DECOR_CELL) + 1;
    const cellsDown = Math.ceil(GAME_HEIGHT / DECOR_CELL) + 1;

    for (let cy = firstCellY; cy < firstCellY + cellsDown; cy++) {
      for (let cx = firstCellX; cx < firstCellX + cellsAcross; cx++) {
        const deco = getDecorationAt(cx, cy);
        if (!deco) continue;

        const x = Math.round(cx * DECOR_CELL + deco.offsetX - camera.x);
        const y = Math.round(cy * DECOR_CELL + deco.offsetY - camera.y);

        if (deco.type === 'candle') {
          // Warm flickering pool of light under the flame.
          ctx.save();
          ctx.globalAlpha = 0.5 + Math.sin(time * 7 + deco.flicker) * 0.15;
          ctx.drawImage(this.candleGlow, x - 80 + 32, y - 80 + 20);
          ctx.restore();
        }

        ctx.drawImage(deco.sprite, x, y);
      }
    }
  }
}

/** Full-screen darkened edges, built once at startup. */
function buildVignette() {
  const canvas = document.createElement('canvas');
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(
    GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 0.42,
    GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_HEIGHT * 1.05
  );
  gradient.addColorStop(0, 'rgba(8, 8, 16, 0)');
  gradient.addColorStop(1, 'rgba(8, 8, 16, 0.55)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  return canvas;
}

/** Warm pool of candlelight, built once at startup. */
function buildCandleGlow() {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(80, 80, 6, 80, 80, 80);
  gradient.addColorStop(0, 'rgba(255, 190, 90, 0.55)');
  gradient.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 160, 160);
  return canvas;
}
