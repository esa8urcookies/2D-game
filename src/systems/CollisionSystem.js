// Collision handling.
// All entities use collision circles that are smaller than their
// sprites, so the game feels fair.

import { normalize } from '../core/MathUtils.js';
import { WEAPON_CONFIG, ENEMY_CONFIG, EFFECTS_CONFIG } from '../config/GameConfig.js';

/** True if two circles overlap (compares squared distances — no sqrt). */
export function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const reach = r1 + r2;
  return dx * dx + dy * dy < reach * reach;
}

export class CollisionSystem {
  update(game) {
    this.projectilesVsEnemies(game);
    this.enemiesVsPlayer(game);
    this.separateEnemies(game.enemies);
  }

  /**
   * Each projectile damages enemies it touches. With pierce it can
   * pass through several, but never hits the same enemy twice.
   */
  projectilesVsEnemies(game) {
    for (const projectile of game.projectiles) {
      if (projectile.dead) continue;

      for (const enemy of game.enemies) {
        if (enemy.dead || projectile.alreadyHit.has(enemy)) continue;

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
            break; // this projectile is spent
          }
        }
      }
    }
  }

  /** Touching an enemy damages the player (unless invincible). */
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
        if (player.takeDamage(enemy.contactDamage)) {
          const { intensity, duration } = EFFECTS_CONFIG.playerHitShake;
          game.camera.shake(intensity, duration);
        }
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

        const minGap =
          (a.collisionRadius + b.collisionRadius) * ENEMY_CONFIG.separationOverlap;

        // Compare squared distances first: with hundreds of enemies
        // this loop runs tens of thousands of times per frame, and
        // skipping the square root for far-apart pairs keeps it fast.
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared > 0 && distanceSquared < minGap * minGap) {
          const d = Math.sqrt(distanceSquared);
          const push = (minGap - d) / 2;
          const nx = dx / d;
          const ny = dy / d;

          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }
  }
}
