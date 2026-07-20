// Collision handling.
// All entities use collision circles that are smaller than their
// sprites, so the game feels fair.

import { normalize } from '../core/MathUtils.js';
import { audio } from '../core/Audio.js';
import { SpatialGrid } from '../core/SpatialGrid.js';
import { WEAPON_CONFIG, ENEMY_CONFIG, EFFECTS_CONFIG } from '../config/GameConfig.js';

/** True if two circles overlap (compares squared distances — no sqrt). */
export function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const reach = r1 + r2;
  return dx * dx + dy * dy < reach * reach;
}

// The cell size must be >= the largest collision reach we ever test.
// Biggest case: player radius 45 + boss radius 90 = 135, so 140 makes
// every 3x3 neighbor query exact.
const GRID_CELL_SIZE = 140;

export class CollisionSystem {
  constructor() {
    this.grid = new SpatialGrid(GRID_CELL_SIZE);
  }

  update(game) {
    // Build the enemy grid once; all three passes reuse it instead of
    // scanning every enemy against every other one.
    this.grid.build(game.enemies);

    this.projectilesVsEnemies(game);
    this.enemiesVsPlayer(game);
    this.separateEnemies(game.enemies);
  }

  /**
   * Each projectile damages enemies it touches. With pierce it can
   * pass through several, but never hits the same enemy twice. Only
   * enemies near the projectile are considered, via the grid.
   */
  projectilesVsEnemies(game) {
    for (const projectile of game.projectiles) {
      if (projectile.dead) continue;

      this.grid.forEachNeighbor(projectile.x, projectile.y, (enemy) => {
        if (projectile.dead || enemy.dead || projectile.alreadyHit.has(enemy)) return;

        if (
          circlesOverlap(
            projectile.x, projectile.y, projectile.collisionRadius,
            enemy.x, enemy.y, enemy.collisionRadius
          )
        ) {
          // Knock the enemy back along the projectile's flight path.
          const push = normalize(projectile.velocityX, projectile.velocityY);
          game.damageEnemy(
            enemy, projectile.damage, push.x, push.y, WEAPON_CONFIG.knockbackForce
          );

          projectile.alreadyHit.add(enemy);
          projectile.hitsLeft -= 1;
          if (projectile.hitsLeft <= 0) {
            projectile.dead = true;
          }
        }
      });
    }
  }

  /** Touching an enemy damages the player (unless invincible). */
  enemiesVsPlayer(game) {
    const player = game.player;

    this.grid.forEachNeighbor(player.x, player.y, (enemy) => {
      if (enemy.dead || player.hitTimer > 0) return;

      if (
        circlesOverlap(
          player.x, player.y, player.collisionRadius,
          enemy.x, enemy.y, enemy.collisionRadius
        )
      ) {
        if (player.takeDamage(enemy.contactDamage)) {
          const { intensity, duration } = EFFECTS_CONFIG.playerHitShake;
          game.camera.shake(intensity, duration);
          audio.play('playerDamage');
        }
      }
    });
  }

  /**
   * Push overlapping enemies apart so they spread into a horde instead
   * of stacking into one invisible super-enemy. Each enemy only tests
   * its grid neighbors; it pushes itself half the overlap away from
   * each, and the neighbor does the same on its own turn, so the
   * result matches the old full O(n²) pass.
   */
  separateEnemies(enemies) {
    const overlap = ENEMY_CONFIG.separationOverlap;

    for (const a of enemies) {
      this.grid.forEachNeighbor(a.x, a.y, (b) => {
        if (b === a) return;

        const minGap = (a.collisionRadius + b.collisionRadius) * overlap;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared > 0 && distanceSquared < minGap * minGap) {
          const d = Math.sqrt(distanceSquared);
          const push = (minGap - d) / 2;
          a.x += (dx / d) * push;
          a.y += (dy / d) * push;
        }
      });
    }
  }
}
