// Collision detection.
// All entities use collision circles that are smaller than their
// sprites, so the game feels fair.

import { distance } from '../core/MathUtils.js';

/** True if two circles overlap. */
export function circlesOverlap(x1, y1, r1, x2, y2, r2) {
  return distance(x1, y1, x2, y2) < r1 + r2;
}

export class CollisionSystem {
  update(game) {
    // Projectile <-> enemy and enemy <-> player checks arrive in the
    // next step, once those entities exist.
  }
}
