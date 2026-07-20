// Arcane Bolt: fires a projectile at the nearest enemy.
// The starting weapon — reliable single-target damage. Higher levels
// add pierce, letting one bolt pass through several enemies.
//
// Its evolution, Arcane Storm, uses this same class: `shots: 2` in
// its stats makes it fire at the two nearest enemies at once, with
// purple projectiles (`style: 'arcane'`).

import { Weapon } from './Weapon.js';
import { Projectile } from '../entities/Projectile.js';
import { normalize, distance } from '../core/MathUtils.js';
import { audio } from '../core/Audio.js';

export class ArcaneBolt extends Weapon {
  fire(game) {
    const targets = this.findNearestEnemies(game.player, game.enemies, this.stats.shots ?? 1);
    if (targets.length === 0) {
      return false; // stay ready; fire the moment an enemy appears
    }

    const player = game.player;
    for (const target of targets) {
      const direction = normalize(target.x - player.x, target.y - player.y);
      game.projectiles.push(
        new Projectile(player.x, player.y, direction.x, direction.y, {
          speed: this.stats.speed,
          damage: this.stats.damage,
          pierce: this.stats.pierce,
          style: this.stats.style,
        })
      );
    }
    audio.play('shoot');
    return true;
  }

  /** The `count` closest enemies, nearest first. */
  findNearestEnemies(player, enemies, count) {
    return enemies
      .map((enemy) => ({ enemy, d: distance(player.x, player.y, enemy.x, enemy.y) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, count)
      .map((entry) => entry.enemy);
  }
}
