// The wave director.
//
// Reads the survival timer against the wave table in WAVE_CONFIG and
// decides what spawns, how often, and how strong. On top of the wave
// stages, enemy health and speed keep creeping up every minute, so
// time itself is the real enemy.
//
// Enemies always spawn on a ring just outside the visible screen,
// centered on the player — never on top of them, never popping in.

import { Enemy } from '../entities/Enemy.js';
import { randomRange } from '../core/MathUtils.js';
import { GAME_WIDTH, GAME_HEIGHT, WAVE_CONFIG } from '../config/GameConfig.js';

// Half the screen diagonal (~1101px). Spawning beyond this distance
// from the player guarantees the spawn point is off screen.
const OFF_SCREEN_DISTANCE = Math.sqrt(GAME_WIDTH ** 2 + GAME_HEIGHT ** 2) / 2;

// How long to wait before retrying when the enemy cap is reached.
const CAP_RETRY_SECONDS = 0.25;

export class Spawner {
  constructor() {
    this.spawnTimer = 0;
    this.currentWaveIndex = -1; // no wave announced yet
    this.nextBossTime = WAVE_CONFIG.bossEverySeconds;

    // Set when a new wave begins; the UI shows it while timer > 0.
    this.announcement = null;
    this.announcementTimer = 0;
  }

  /** The wave the survival timer currently falls into. */
  waveIndexAt(time) {
    let index = 0;
    WAVE_CONFIG.waves.forEach((wave, i) => {
      if (time >= wave.startTime) index = i;
    });
    return index;
  }

  get currentWave() {
    return WAVE_CONFIG.waves[Math.max(0, this.currentWaveIndex)];
  }

  update(deltaTime, game) {
    this.announcementTimer = Math.max(0, this.announcementTimer - deltaTime);

    // Wave transitions: announce it and pour in a burst from all
    // directions so the change is felt immediately.
    const waveIndex = this.waveIndexAt(game.survivalTime);
    if (waveIndex !== this.currentWaveIndex) {
      this.currentWaveIndex = waveIndex;
      this.announcement = {
        title: `WAVE ${waveIndex + 1}`,
        subtitle: WAVE_CONFIG.waves[waveIndex].name,
      };
      this.announcementTimer = 3;

      for (let i = 0; i < WAVE_CONFIG.waveBurstCount; i++) {
        this.spawnEnemy(game, (i / WAVE_CONFIG.waveBurstCount) * Math.PI * 2);
      }
    }

    // A boss every two minutes, regardless of the enemy cap.
    if (game.survivalTime >= this.nextBossTime) {
      this.nextBossTime += WAVE_CONFIG.bossEverySeconds;
      this.spawnBoss(game);
    }

    // Regular spawning on the wave's interval.
    this.spawnTimer -= deltaTime;
    if (this.spawnTimer > 0) return;

    // At the cap, wait a moment and try again — never exceed it.
    if (game.enemies.length >= WAVE_CONFIG.maxEnemies) {
      this.spawnTimer = CAP_RETRY_SECONDS;
      return;
    }

    this.spawnEnemy(game);
    this.spawnTimer = this.currentInterval(game.survivalTime);
  }

  /**
   * Seconds until the next spawn. Within a wave this is fixed; after
   * the final wave it keeps shrinking so the pressure never stops.
   */
  currentInterval(time) {
    const wave = this.currentWave;
    const lastWave = WAVE_CONFIG.waves[WAVE_CONFIG.waves.length - 1];
    if (wave !== lastWave) {
      return wave.interval;
    }

    const minutesPast = (time - lastWave.startTime) / 60;
    const progress = Math.min(1, minutesPast / WAVE_CONFIG.finalWaveSqueezeMinutes);
    return lastWave.interval * (1 - (1 - WAVE_CONFIG.finalWaveSqueeze) * progress);
  }

  /** How much stronger/faster enemies are right now. */
  scalingAt(time) {
    const minutes = time / 60;
    return {
      healthMultiplier: 1 + minutes * WAVE_CONFIG.healthGrowthPerMinute,
      speedMultiplier: Math.min(
        WAVE_CONFIG.maxSpeedMultiplier,
        1 + minutes * WAVE_CONFIG.speedGrowthPerMinute
      ),
    };
  }

  spawnBoss(game) {
    const angle = randomRange(0, Math.PI * 2);
    const distance = OFF_SCREEN_DISTANCE + WAVE_CONFIG.spawnMarginMax;
    const x = game.player.x + Math.cos(angle) * distance;
    const y = game.player.y + Math.sin(angle) * distance;

    game.enemies.push(new Enemy(x, y, 'boss', this.scalingAt(game.survivalTime)));

    this.announcement = { title: 'WARNING!', subtitle: 'A BOSS APPROACHES' };
    this.announcementTimer = 3;
  }

  /** Spawn one enemy off screen; a fixed angle makes ring bursts. */
  spawnEnemy(game, forcedAngle = null) {
    const angle = forcedAngle ?? randomRange(0, Math.PI * 2);
    const distance =
      OFF_SCREEN_DISTANCE +
      randomRange(WAVE_CONFIG.spawnMarginMin, WAVE_CONFIG.spawnMarginMax);
    const x = game.player.x + Math.cos(angle) * distance;
    const y = game.player.y + Math.sin(angle) * distance;

    game.enemies.push(
      new Enemy(x, y, this.pickType(), this.scalingAt(game.survivalTime))
    );
  }

  /** Weighted random pick from the current wave's type mix. */
  pickType() {
    const types = this.currentWave.types;
    const totalWeight = Object.values(types).reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * totalWeight;

    for (const [typeName, weight] of Object.entries(types)) {
      roll -= weight;
      if (roll <= 0) return typeName;
    }
    return Object.keys(types)[0];
  }
}
