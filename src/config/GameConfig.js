// GameConfig: every gameplay number in one place.
//
// Want the game easier, harder, faster, or bouncier? Change values
// here — no need to hunt through entity and system files. Anything
// visual-only (menu colors, sprite pixel art) stays with its owner.

// --- Screen -----------------------------------------------------------

// Internal resolution. All game logic and drawing uses these
// coordinates; the canvas is scaled to fit the window afterwards.
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

// Source size of character and monster sprites, in pixels.
export const SPRITE_SIZE = 182;

// --- Player -----------------------------------------------------------

export const PLAYER_CONFIG = {
  moveSpeed: 420, // pixels per second
  maxHealth: 100,
  // Collision circles are much smaller than the 182x182 sprite so
  // near-misses feel fair instead of frustrating.
  collisionRadius: 45,
  invincibilitySeconds: 1.0, // grace period after taking a hit
  magnetRadius: 170, // XP gems fly to the player inside this range
};

// --- XP and leveling ----------------------------------------------------

export const XP_CONFIG = {
  pickupRadius: 60, // gems this close are collected instantly
  magnetSpeed: 780, // how fast attracted gems fly to the player
  // Gem tiers, checked in order: rare first. Every enemy death rolls
  // once; if no rare tier hits, the common 1-XP gem drops.
  gemTiers: [
    { value: 10, color: '#e04040', shine: '#ff9c9c', chance: 0.02 }, // red
    { value: 5, color: '#3ecf5e', shine: '#a8f0b4', chance: 0.1 }, // green
    { value: 1, color: '#4fc3f7', shine: '#c2ecff', chance: 1 }, // blue
  ],
  // XP needed to go from `level` to the next one. Linear growth keeps
  // early levels fast and later ones steadily slower.
  xpForLevel(level) {
    return 5 + (level - 1) * 4;
  },
};

// --- Enemies ----------------------------------------------------------

// Each entry fully describes one enemy type. Adding a new monster is
// one new entry here plus a sprite in ProceduralSprites.js.
//   scale    draws the sprite bigger (collision radius is separate)
//   xpValue  guaranteed gem value on death (otherwise random roll)
export const ENEMY_TYPES = {
  slime: {
    sprite: 'slime',
    moveSpeed: 110, // slow...
    maxHealth: 30, // ...but takes a few hits
    collisionRadius: 52,
    contactDamage: 12, // HP the player loses on touch
    color: '#66bb6a', // tint of the death-burst particles
  },
  bat: {
    sprite: 'bat',
    spriteB: 'batB', // second frame: wings raised (flap animation)
    moveSpeed: 250, // fast...
    maxHealth: 10, // ...but dies quickly
    collisionRadius: 40,
    contactDamage: 7,
    color: '#7e57c2',
  },
  crawler: {
    sprite: 'crawler',
    spriteB: 'crawlerB', // second frame: alternate leg pose
    moveSpeed: 170, // middle of the pack...
    maxHealth: 25,
    collisionRadius: 42, // ...and slightly harder to hit
    contactDamage: 10,
    color: '#26a69a',
  },
  brute: {
    sprite: 'brute',
    moveSpeed: 70, // a slow wall...
    maxHealth: 120, // ...that soaks up damage
    collisionRadius: 60,
    contactDamage: 20,
    xpValue: 5, // always drops a green gem
    color: '#8d6e63',
  },
  elite: {
    sprite: 'elite',
    moveSpeed: 90,
    maxHealth: 400, // a mini-boss
    collisionRadius: 72,
    contactDamage: 25,
    scale: 1.3, // visibly bigger than everything else
    xpValue: 10, // always drops a red gem
    color: '#ab47bc',
  },
  boss: {
    sprite: 'boss',
    displayName: 'THE DEVOURER',
    moveSpeed: 165, // relentless: can actually pursue a kiting player
    maxHealth: 900,
    collisionRadius: 90,
    contactDamage: 30,
    scale: 1.6, // towers over the horde
    xpValue: 10,
    isBoss: true, // gets the big health bar
    dropsChest: true, // treasure on death
    knockbackResistance: 0.15, // barely budges when hit
    color: '#b71c1c',
  },
};

export const ENEMY_CONFIG = {
  knockbackFriction: 9, // how quickly knockback fades (higher = snappier)
  hitFlashSeconds: 0.1, // white flash duration when hit
  // Enemies may overlap up to ~30% before being pushed apart — a
  // loose crowd looks better than perfectly spaced circles.
  separationOverlap: 0.7,
};

// --- Weapons ----------------------------------------------------------

// Per-weapon stats live in config/Weapons.js. This only holds
// weapon behavior shared by all projectiles.
export const WEAPON_CONFIG = {
  knockbackForce: 420, // how hard projectile hits shove enemies back
};

// --- Enemy waves --------------------------------------------------------

// The wave director reads this table against the survival timer.
// Each wave sets the spawn interval and the mix of enemy types
// (weights don't need to add up to 1 — they're relative).
export const WAVE_CONFIG = {
  maxEnemies: 250, // hard cap: spawning waits instead of exceeding it

  bossEverySeconds: 120, // a boss arrives every two minutes

  // Enemies appear this far past the screen edge (min..max extra).
  spawnMarginMin: 100,
  spawnMarginMax: 300,

  // How many enemies pour in from all directions when a wave starts.
  waveBurstCount: 6,

  waves: [
    { startTime: 0, name: 'THE FIRST SLIMES', interval: 1.4, types: { slime: 1 } },
    { startTime: 60, name: 'WINGS IN THE DARK', interval: 1.0, types: { slime: 0.7, bat: 0.3 } },
    { startTime: 120, name: 'THE CRAWLERS COME', interval: 0.8, types: { slime: 0.45, bat: 0.25, crawler: 0.3 } },
    { startTime: 180, name: 'THE SWARM GROWS', interval: 0.5, types: { slime: 0.4, bat: 0.3, crawler: 0.3 } },
    { startTime: 240, name: 'HEAVY FOOTSTEPS', interval: 0.45, types: { slime: 0.3, bat: 0.25, crawler: 0.25, brute: 0.18, elite: 0.02 } },
    { startTime: 300, name: 'ENDLESS NIGHT', interval: 0.4, types: { slime: 0.25, bat: 0.25, crawler: 0.25, brute: 0.2, elite: 0.05 } },
  ],

  // Continuous scaling so time always hurts:
  healthGrowthPerMinute: 0.15, // enemies gain +15% max HP per minute
  speedGrowthPerMinute: 0.04, // and +4% speed per minute...
  maxSpeedMultiplier: 1.5, // ...up to +50%
  // After the final wave the spawn interval keeps shrinking, down to
  // half the final wave's interval over the next ten minutes.
  finalWaveSqueeze: 0.5,
  finalWaveSqueezeMinutes: 10,
};

// --- Coins ----------------------------------------------------------------

export const COIN_CONFIG = {
  dropChance: 0.05, // chance any normal enemy drops a coin
  value: 1,
};

// --- Treasure chests ----------------------------------------------------

export const CHEST_CONFIG = {
  pickupRadius: 70, // walk this close to open a chest
  // Relative weights for what a chest contains.
  weaponUpgradeWeight: 40,
  passiveUpgradeWeight: 30,
  coinWeight: 15,
  healWeight: 15,
  // Clover Coin: each luck level makes upgrades this much likelier.
  luckBonusPerLevel: 8,
  coinAmount: 50,
  healAmount: 75,
};

// --- Feedback effects -------------------------------------------------

export const EFFECTS_CONFIG = {
  // Screen-shake presets. Intensities are kept small on purpose so
  // feedback never turns into a nauseating earthquake; the camera
  // also clamps every shake to maxShakeIntensity.
  playerHitShake: { intensity: 7, duration: 0.25 },
  bossDeathShake: { intensity: 14, duration: 0.6 },
  chestShake: { intensity: 6, duration: 0.3 },
  evolveShake: { intensity: 12, duration: 0.5 },
  maxShakeIntensity: 16, // absolute cap, no matter what asks for a shake

  damageText: { riseSpeed: 90, lifeSeconds: 0.7 },
  lowHealthThreshold: 0.25, // red warning pulse below this HP fraction

  // Entities are culled/cleaned up this far outside the screen.
  offScreenMargin: 200,
};
