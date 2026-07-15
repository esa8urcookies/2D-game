// Enemy spawner.
// Enemies appear on a ring just outside the visible screen, centered
// on the player — never on top of them, and never visibly popping in.

import { Enemy } from '../entities/Enemy.js';
import { randomRange } from '../core/MathUtils.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';

// Half the screen diagonal (~1101px). Spawning beyond this distance
// from the player guarantees the spawn point is off screen.
const OFF_SCREEN_DISTANCE = Math.sqrt(GAME_WIDTH ** 2 + GAME_HEIGHT ** 2) / 2;
const SPAWN_MARGIN = 100;

// Difficulty pacing for the prototype. A proper wave system with
// scaling health comes later.
const START_INTERVAL = 1.4; // seconds between spawns at time 0
const MIN_INTERVAL = 0.35; // fastest spawn rate
const RAMP_DURATION = 120; // seconds to go from start to fastest
const MAX_ENEMIES = 200; // safety cap so the game stays smooth

export class Spawner {
  constructor() {
    this.elapsedTime = 0;
    this.spawnTimer = 0;
  }

  update(deltaTime, game) {
    this.elapsedTime += deltaTime;
    this.spawnTimer -= deltaTime;

    if (this.spawnTimer <= 0 && game.enemies.length < MAX_ENEMIES) {
      this.spawnEnemy(game);
      this.spawnTimer = this.currentInterval();
    }
  }

  /** Spawn interval shrinks over time, so pressure keeps building. */
  currentInterval() {
    const progress = Math.min(1, this.elapsedTime / RAMP_DURATION);
    return START_INTERVAL + (MIN_INTERVAL - START_INTERVAL) * progress;
  }

  spawnEnemy(game) {
    // Random point on a ring around the player, just off screen.
    const angle = randomRange(0, Math.PI * 2);
    const distance = OFF_SCREEN_DISTANCE + randomRange(SPAWN_MARGIN, SPAWN_MARGIN * 3);
    const x = game.player.x + Math.cos(angle) * distance;
    const y = game.player.y + Math.sin(angle) * distance;

    game.enemies.push(new Enemy(x, y, this.pickType()));
  }

  /** Bats appear after 15 seconds and become gradually more common. */
  pickType() {
    if (this.elapsedTime < 15) {
      return 'slime';
    }
    const batChance = Math.min(0.45, (this.elapsedTime - 15) / 90);
    return Math.random() < batChance ? 'bat' : 'slime';
  }
}
