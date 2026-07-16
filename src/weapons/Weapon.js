// Base class for all weapons.
//
// A weapon owns its level and cooldown. Its numbers come from the
// stats table in config/Weapons.js — `this.stats` always reflects
// the current level, so leveling up changes behavior instantly.

import { WEAPON_DEFS } from '../config/Weapons.js';

export class Weapon {
  constructor(id) {
    this.id = id;
    this.def = WEAPON_DEFS[id];
    this.level = 1;
    this.cooldown = 0;
  }

  /** Stats for the current level. */
  get stats() {
    return this.def.levels[this.level - 1];
  }

  get isMaxLevel() {
    return this.level >= this.def.maxLevel;
  }

  levelUp() {
    this.level = Math.min(this.def.maxLevel, this.level + 1);
  }

  /**
   * Default behavior: count the cooldown down and call fire() when
   * ready. Weapons without a cooldown rhythm (like Orbiting Blade)
   * override update() entirely.
   */
  update(deltaTime, game) {
    this.cooldown = Math.max(0, this.cooldown - deltaTime);
    if (this.cooldown > 0) return;

    if (this.fire(game)) {
      // The Spellbook passive shortens every weapon's cooldown.
      this.cooldown = this.stats.cooldown * game.stats.cooldownMultiplier;
    }
  }

  /** Try to attack. Return true if the attack happened. */
  fire(game) {
    return false;
  }

  /** Draw weapon visuals (blades, pulses, bolts). */
  render(ctx, camera, game) {}
}
