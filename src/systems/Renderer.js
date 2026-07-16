// Renderer: draws the background and asks every entity to draw
// itself, in back-to-front order. Entities that are far off screen
// are skipped entirely.
//
// All drawing happens in the internal 1920x1080 resolution; the
// canvas element itself is scaled to fit the window with CSS.

import { GAME_WIDTH, GAME_HEIGHT, EFFECTS_CONFIG } from '../config/GameConfig.js';
import { getGrassTile, grassVariantAt, GRASS_TILE_SIZE } from '../assets/GrassTiles.js';

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(game) {
    this.drawBackground(game.camera);

    // Back-to-front: gems and chests on the ground, then enemies,
    // the player, weapon effects, projectiles, and damage numbers.
    this.drawAll(game.gems, game.camera);
    this.drawAll(game.chests, game.camera);
    this.drawAll(game.enemies, game.camera);
    game.player.render(this.ctx, game.camera);
    game.weapons.render(this.ctx, game.camera, game);
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

  /**
   * Endless pixel-art grass. The world is covered in 128px tiles;
   * we only draw the ones the camera can currently see, and each
   * position always hashes to the same tile variant.
   */
  drawBackground(camera) {
    const ctx = this.ctx;
    const size = GRASS_TILE_SIZE;

    const firstTileX = Math.floor(camera.x / size);
    const firstTileY = Math.floor(camera.y / size);
    const tilesAcross = Math.ceil(GAME_WIDTH / size) + 1;
    const tilesDown = Math.ceil(GAME_HEIGHT / size) + 1;

    ctx.imageSmoothingEnabled = false; // keep the pixels chunky

    for (let ty = firstTileY; ty < firstTileY + tilesDown; ty++) {
      for (let tx = firstTileX; tx < firstTileX + tilesAcross; tx++) {
        const tile = getGrassTile(grassVariantAt(tx, ty));
        // Round to whole pixels so tile seams never shimmer.
        ctx.drawImage(tile, Math.round(tx * size - camera.x), Math.round(ty * size - camera.y));
      }
    }
  }
}
