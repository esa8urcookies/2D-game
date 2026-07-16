// The player's arsenal: every owned weapon attacks automatically on
// its own rhythm. Weapon numbers live in config/Weapons.js; weapon
// behaviors live in src/weapons/.

import { ArcaneBolt } from '../weapons/ArcaneBolt.js';
import { OrbitingBlade } from '../weapons/OrbitingBlade.js';
import { HolyPulse } from '../weapons/HolyPulse.js';
import { LightningMark } from '../weapons/LightningMark.js';

// Which class implements each weapon id from config/Weapons.js.
const WEAPON_CLASSES = {
  arcaneBolt: ArcaneBolt,
  orbitingBlade: OrbitingBlade,
  holyPulse: HolyPulse,
  lightningMark: LightningMark,
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
