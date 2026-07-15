// XP gem entity.
// Placeholder for a later step: defeated enemies will drop gems that
// the player collects to level up.

import { Entity } from './Entity.js';

export class XPGem extends Entity {
  constructor(x, y, value = 1) {
    super(x, y, 30);
    this.value = value;
  }
}
