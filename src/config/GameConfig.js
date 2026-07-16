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
export const ENEMY_TYPES = {
  slime: {
    sprite: 'slime',
    moveSpeed: 110, // slow...
    maxHealth: 30, // ...but takes a few hits
    collisionRadius: 52,
    contactDamage: 12, // HP the player loses on touch
  },
  bat: {
    sprite: 'bat',
    moveSpeed: 250, // fast...
    maxHealth: 10, // ...but dies quickly
    collisionRadius: 40,
    contactDamage: 7,
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

// --- Enemy spawning ---------------------------------------------------

export const SPAWN_CONFIG = {
  startInterval: 1.4, // seconds between spawns at time 0
  minInterval: 0.35, // fastest spawn rate
  rampDuration: 120, // seconds to go from start to fastest
  maxEnemies: 200, // safety cap so the game stays smooth
  // Enemies appear this far past the screen edge (min..max extra).
  spawnMarginMin: 100,
  spawnMarginMax: 300,
  batStartTime: 15, // seconds before bats can appear
  batRampDuration: 90, // seconds for bats to reach their max share
  batMaxChance: 0.45,
};

// --- Feedback effects -------------------------------------------------

export const EFFECTS_CONFIG = {
  playerHitShake: { intensity: 7, duration: 0.25 },
  damageText: { riseSpeed: 90, lifeSeconds: 0.7 },
  // Entities are culled/cleaned up this far outside the screen.
  offScreenMargin: 200,
};
