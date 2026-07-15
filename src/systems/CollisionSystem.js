// Collision handling.
// All entities use collision circles that are smaller than their
// sprites, so the game feels fair.

import { distance } from '../core/MathUtils.js';

/** True if two circles overlap. */
export function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  return distance(x1, y1, x2, y2) < r1 + r2;
}

export class CollisionSystem {
  update(game) {
    this.projectilesVsEnemies(game);
    this.enemiesVsPlayer(game);
    this.separateEnemies(game.enemies);
  }

  /** Each projectile damages the first enemy it touches, then dies. */
  projectilesVsEnemies(game) {
    for (const projectile of game.projectiles) {
      if (projectile.dead) continue;

      for (const enemy of game.enemies) {
        if (enemy.dead) continue;

        if (
          circlesOverlap(
            projectile.x, projectile.y, projectile.collisionRadius,
            enemy.x, enemy.y, enemy.collisionRadius
          )
        ) {
          enemy.takeDamage(projectile.damage);
          projectile.dead = true;
          break; // this projectile is spent
        }
      }
    }
  }

  /** Touching an enemy triggers the player's contact feedback. */
  enemiesVsPlayer(game) {
    const player = game.player;

    for (const enemy of game.enemies) {
      if (enemy.dead) continue;

      if (
        circlesOverlap(
          player.x, player.y, player.collisionRadius,
          enemy.x, enemy.y, enemy.collisionRadius
        )
      ) {
        player.onEnemyContact();
      }
    }
  }

  /**
   * Push overlapping enemies apart a little so they spread into a
   * horde instead of stacking into one invisible super-enemy.
   */
  separateEnemies(enemies) {
    for (let i = 0; i < enemies.length; i++) {
      for (let j = i + 1; j < enemies.length; j++) {
        const a = enemies[i];
        const b = enemies[j];

        // They may overlap up to ~30% before being pushed apart —
        // a loose crowd looks better than perfectly spaced circles.
        const minGap = (a.collisionRadius + b.collisionRadius) * 0.7;
        const d = distance(a.x, a.y, b.x, b.y);

        if (d > 0 && d < minGap) {
          const push = (minGap - d) / 2;
          const nx = (b.x - a.x) / d;
          const ny = (b.y - a.y) / d;

          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }
}
