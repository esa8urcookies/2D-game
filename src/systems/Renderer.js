// Renderer: draws the world and every entity onto the canvas.
// All drawing happens in the internal 1920x1080 resolution;
// the canvas element itself is scaled to fit the window with CSS.

import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';

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
    }
  }

  drawPlayer(player, camera) {
    const ctx = this.ctx;
    const screen = camera.worldToScreen(player.x, player.y);
    const half = player.spriteSize / 2;

    ctx.save();
    ctx.translate(screen.x, screen.y);

    // Flip horizontally when facing left.
    ctx.scale(player.facing, 1);

    // Blink while the post-hit grace period is active.
    if (player.hitTimer > 0 && Math.floor(player.hitTimer * 12) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    ctx.drawImage(player.sprite, -half, -half);
    ctx.restore();
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
}
