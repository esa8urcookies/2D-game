// XP gem entity.
// Placeholder for a later step: defeated enemies will drop gems that
// the player collects to level up.

export class XPGem {
  constructor(x, y, value = 1) {
    this.x = x;
    this.y = y;
    this.value = value;
  }

  update(deltaTime, player) {
    // Implemented in a later step.
  }
}
