// Enemy spawner.
// Enemies appear on a ring just outside the visible screen, centered
// on the player — never on top of them, and never visibly popping in.
// All pacing numbers live in SPAWN_CONFIG (GameConfig.js).

import { Enemy } from '../entities/Enemy.js';
import { randomRange } from '../core/MathUtils.js';
import { GAME_WIDTH, GAME_HEIGHT, SPAWN_CONFIG } from '../config/GameConfig.js';

// Half the screen diagonal (~1101px). Spawning beyond this distance
// from the player guarantees the spawn point is off screen.
const OFF_SCREEN_DISTANCE = Math.sqrt(GAME_WIDTH ** 2 + GAME_HEIGHT ** 2) / 2;

export class Spawner {
  constructor() {
    this.elapsedTime = 0;
    this.spawnTimer = 0;
  }

  update(deltaTime, game) {
    this.elapsedTime += deltaTime;
    this.spawnTimer -= deltaTime;

    if (this.spawnTimer <= 0 && game.enemies.length < SPAWN_CONFIG.maxEnemies) {
      this.spawnEnemy(game);
      this.spawnTimer = this.currentInterval();
    }
  }

  /** Spawn interval shrinks over time, so pressure keeps building. */
  currentInterval() {
    const { startInterval, minInterval, rampDuration } = SPAWN_CONFIG;
    const progress = Math.min(1, this.elapsedTime / rampDuration);
    return startInterval + (minInterval - startInterval) * progress;
  }

  spawnEnemy(game) {
    // Random point on a ring around the player, just off screen.
    const angle = randomRange(0, Math.PI * 2);
    const distance =
      OFF_SCREEN_DISTANCE +
      randomRange(SPAWN_CONFIG.spawnMarginMin, SPAWN_CONFIG.spawnMarginMax);
    const x = game.player.x + Math.cos(angle) * distance;
    const y = game.player.y + Math.sin(angle) * distance;

    game.enemies.push(new Enemy(x, y, this.pickType()));
  }

  /** Bats appear after a while and become gradually more common. */
  pickType() {
    const { batStartTime, batRampDuration, batMaxChance } = SPAWN_CONFIG;

    if (this.elapsedTime < batStartTime) {
      return 'slime';
    }
    const batChance = Math.min(
      batMaxChance,
      (this.elapsedTime - batStartTime) / batRampDuration
    );
    return Math.random() < batChance ? 'bat' : 'slime';
  }
}
