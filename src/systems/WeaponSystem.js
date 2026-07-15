// The player's automatic weapon.
// Every fireInterval seconds it shoots one projectile at the nearest
// enemy. If there are no enemies, it stays ready and fires the moment
// one appears. Stats live in WEAPON_CONFIG (GameConfig.js).

import { Projectile } from '../entities/Projectile.js';
import { normalize, distance } from '../core/MathUtils.js';
import { WEAPON_CONFIG } from '../config/GameConfig.js';

export class WeaponSystem {
  constructor() {
    this.cooldown = 0;
  }

  update(deltaTime, game) {
    this.cooldown = Math.max(0, this.cooldown - deltaTime);

    if (this.cooldown > 0) {
      return;
    }

    const target = this.findNearestEnemy(game.player, game.enemies);
    if (!target) {
      return; // stay ready; cooldown only starts after an actual shot
    }

    this.fireAt(game, target);
    this.cooldown = WEAPON_CONFIG.fireInterval;
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

  fireAt(game, target) {
    const player = game.player;
    const direction = normalize(target.x - player.x, target.y - player.y);

    game.projectiles.push(new Projectile(player.x, player.y, direction.x, direction.y));
  }
}
