// Arcane Bolt: fires a projectile at the nearest enemy.
// The starting weapon — reliable single-target damage. Higher levels
// add pierce, letting one bolt pass through several enemies.

import { Weapon } from './Weapon.js';
import { Projectile } from '../entities/Projectile.js';
import { normalize, distance } from '../core/MathUtils.js';

export class ArcaneBolt extends Weapon {
  fire(game) {
    const target = this.findNearestEnemy(game.player, game.enemies);
    if (!target) {
      return false; // stay ready; fire the moment an enemy appears
    }

    const player = game.player;
    const direction = normalize(target.x - player.x, target.y - player.y);

    game.projectiles.push(
      new Projectile(player.x, player.y, direction.x, direction.y, {
        speed: this.stats.speed,
        damage: this.stats.damage,
        pierce: this.stats.pierce,
      })
    );
    return true;
  }

  findNearestEnemy(player, enemies) {
    let nearest = null;
    let nearestDistance = Infinity;

    for (const enemy of enemies) {
      const d = distance(player.x, player.y, enemy.x, enemy.y);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = enemy;
      }
    }

    return nearest;
  }
}
