// The player's arsenal: every owned weapon attacks automatically on
// its own rhythm. Weapon numbers live in config/Weapons.js; weapon
// behaviors live in src/weapons/.

import { ArcaneBolt } from '../weapons/ArcaneBolt.js';
import { OrbitingBlade } from '../weapons/OrbitingBlade.js';
import { HolyPulse } from '../weapons/HolyPulse.js';
import { LightningMark } from '../weapons/LightningMark.js';

// Which class implements each weapon id from config/Weapons.js.
// Evolved forms reuse their base weapon's class — only stats differ.
const WEAPON_CLASSES = {
  arcaneBolt: ArcaneBolt,
  arcaneStorm: ArcaneBolt,
  orbitingBlade: OrbitingBlade,
  celestialBlades: OrbitingBlade,
  holyPulse: HolyPulse,
  divineNova: HolyPulse,
  lightningMark: LightningMark,
  thunderCrown: LightningMark,
};

export class WeaponSystem {
  constructor() {
    this.owned = [];
  }

  addWeapon(id) {
    this.owned.push(new WEAPON_CLASSES[id](id));
  }

  /** The owned instance of a weapon, or undefined. */
  getWeapon(id) {
    return this.owned.find((weapon) => weapon.id === id);
  }

  /**
   * Replace a base weapon with its evolved form, keeping its slot in
   * the list. Returns the new weapon.
   */
  evolveWeapon(weapon) {
    const evolvedId = weapon.def.evolvesInto;
    const evolved = new WEAPON_CLASSES[evolvedId](evolvedId);
    this.owned[this.owned.indexOf(weapon)] = evolved;
    return evolved;
  }

  update(deltaTime, game) {
    for (const weapon of this.owned) {
      weapon.update(deltaTime, game);
    }
  }

  render(ctx, camera, game) {
    for (const weapon of this.owned) {
      weapon.render(ctx, camera, game);
    }
  }
}
