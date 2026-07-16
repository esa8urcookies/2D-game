// The world's ground and decorations — original dark-fantasy pixel
// art, all drawn in code (no image files).
//
// Three layers, all deterministic from world coordinates, so the
// endless map is stable and seamless as the camera scrolls:
//   1. Ground tiles (128px): dark mossy grass, with occasional
//      cobblestone "ruin plaza" clusters.
//   2. Decorations (one per ~256px cell, sparse): rocks, bones,
//      skulls, grass clumps, broken pillars, candles, glow-moss.
//   3. Candle glows, which flicker (drawn by the Renderer).
//
// Decorations are scenery only — they never block movement.

export const TILE_SIZE = 128; // world pixels per ground tile
export const DECOR_CELL = 256; // world pixels per decoration cell

const SOURCE = 32; // tile authoring grid (scaled 4x)
const SCALE = TILE_SIZE / SOURCE;

// --- Palette: deep moss and old stone ------------------------------------

const GRASS = '#3f5638';
const GRASS_PATCH = '#374d30';
const GRASS_DARK = '#2b3d25';
const GRASS_LIGHT = '#56744a';
const STONE = '#4b505c';
const STONE_LIGHT = '#5c6270';
const STONE_DARK = '#343945';
const BONE = '#e8e2d0';
const BONE_SHADE = '#b8b2a0';
const OUTLINE = '#1c2018';

// --- Small deterministic hash ---------------------------------------------

function hash2(x, y, seed = 0) {
  let h = (x * 73856093) ^ (y * 19349663) ^ (seed * 83492791);
  h = (h ^ (h >> 13)) * 1274126177;
  return (h ^ (h >> 16)) >>> 0;
}

/** Fill one or more grid pixels. */
function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// --- Ground tiles -----------------------------------------------------------

function drawGrassBase(ctx) {
  px(ctx, 0, 0, SOURCE, SOURCE, GRASS);

  // Uneven darker patches keep the ground from looking flat.
  px(ctx, 2, 4, 8, 5, GRASS_PATCH);
  px(ctx, 19, 13, 9, 6, GRASS_PATCH);
  px(ctx, 8, 23, 7, 5, GRASS_PATCH);

  // Freckles.
  px(ctx, 14, 3, 1, 1, GRASS_DARK);
  px(ctx, 26, 8, 1, 1, GRASS_DARK);
  px(ctx, 5, 16, 1, 1, GRASS_DARK);
  px(ctx, 23, 26, 1, 1, GRASS_DARK);
}

/** A short 3-blade tuft. */
function tuft(ctx, x, y, light = false) {
  const color = light ? GRASS_LIGHT : GRASS_DARK;
  px(ctx, x, y - 2, 1, 2, color);
  px(ctx, x + 2, y - 3, 1, 3, color);
  px(ctx, x + 4, y - 2, 1, 2, color);
}

const GRASS_VARIANTS = [
  (ctx) => {
    tuft(ctx, 8, 10);
    tuft(ctx, 21, 24, true);
  },
  (ctx) => {
    tuft(ctx, 20, 9, true);
    tuft(ctx, 6, 26);
  },
  (ctx) => {
    tuft(ctx, 5, 9);
    tuft(ctx, 16, 16, true);
    tuft(ctx, 24, 7);
    tuft(ctx, 11, 27);
  },
  // Pebbles.
  (ctx) => {
    px(ctx, 9, 12, 3, 2, STONE);
    px(ctx, 9, 11, 2, 1, STONE_LIGHT);
    px(ctx, 22, 22, 2, 2, STONE);
    tuft(ctx, 16, 28);
  },
  // Rare glow-moss: a faint cool speckle, a touch of magic.
  (ctx) => {
    tuft(ctx, 22, 12);
    px(ctx, 10, 20, 2, 2, '#5d9484');
    px(ctx, 11, 21, 1, 1, '#7fb6a4');
  },
];

function drawCobbles(ctx, seed) {
  px(ctx, 0, 0, SOURCE, SOURCE, STONE_DARK);

  // A 4x4 grid of worn cobblestones with dark seams. Sizes and
  // tones vary per stone so plazas don't look machine-made.
  const TONES = ['#464b57', STONE, '#515764'];
  for (let cy = 0; cy < 4; cy++) {
    for (let cx = 0; cx < 4; cx++) {
      const h = hash2(cx, cy, seed);
      const inset = h % 3 === 0 ? 2 : 1;
      px(ctx, cx * 8 + inset, cy * 8 + inset, 8 - inset * 2, 8 - inset * 2, TONES[h % 3]);
      px(ctx, cx * 8 + inset, cy * 8 + inset, 8 - inset * 2, 2, STONE_LIGHT);
      // Some stones are cracked or missing a corner.
      if (h % 5 === 0) px(ctx, cx * 8 + 3, cy * 8 + 3, 2, 3, STONE_DARK);
      if (h % 7 === 0) px(ctx, cx * 8 + 5, cy * 8 + 5, 2, 2, STONE_DARK);
      // Moss creeps in from the grass.
      if (h % 4 === 0) px(ctx, cx * 8 + 1, cy * 8 + 5, 2, 2, GRASS_PATCH);
    }
  }
}

// Build each tile once and reuse forever.
const tileCache = new Map();

function buildTile(kind, variant) {
  const small = document.createElement('canvas');
  small.width = SOURCE;
  small.height = SOURCE;
  const smallCtx = small.getContext('2d');

  if (kind === 'stone') {
    drawCobbles(smallCtx, variant);
  } else {
    drawGrassBase(smallCtx);
    GRASS_VARIANTS[variant](smallCtx);
  }

  const tile = document.createElement('canvas');
  tile.width = TILE_SIZE;
  tile.height = TILE_SIZE;
  const ctx = tile.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, TILE_SIZE, TILE_SIZE);
  return tile;
}

function getTile(kind, variant) {
  const key = `${kind}${variant}`;
  if (!tileCache.has(key)) {
    tileCache.set(key, buildTile(kind, variant));
  }
  return tileCache.get(key);
}

/** Is this tile part of a cobblestone ruin cluster? */
function isStoneAt(tileX, tileY) {
  // Low-frequency: whole 3x3 blocks of tiles become stone plazas.
  return hash2(Math.floor(tileX / 3), Math.floor(tileY / 3), 7) % 100 < 14;
}

/** The ground tile for a map position (stable forever). */
export function getGroundTile(tileX, tileY) {
  if (isStoneAt(tileX, tileY)) {
    return getTile('stone', hash2(tileX, tileY, 11) % 3);
  }

  const roll = hash2(tileX, tileY, 3) % 100;
  let variant = 0;
  if (roll >= 35 && roll < 65) variant = 1;
  else if (roll >= 65 && roll < 80) variant = 2;
  else if (roll >= 80 && roll < 92) variant = 3;
  else if (roll >= 92 && roll < 96) variant = 4;
  return getTile('grass', variant);
}

// --- Decorations -------------------------------------------------------------

const DECO_SOURCE = 16; // decoration authoring grid (scaled 4x -> 64px)

const DECO_PAINTERS = {
  rock(ctx) {
    px(ctx, 3, 8, 10, 5, OUTLINE);
    px(ctx, 4, 6, 8, 6, OUTLINE);
    px(ctx, 4, 7, 8, 5, STONE);
    px(ctx, 5, 9, 8, 3, STONE);
    px(ctx, 5, 7, 4, 2, STONE_LIGHT);
  },
  pebbles(ctx) {
    px(ctx, 2, 9, 4, 3, STONE);
    px(ctx, 2, 8, 3, 1, STONE_LIGHT);
    px(ctx, 9, 11, 3, 2, STONE);
    px(ctx, 12, 7, 2, 2, STONE);
  },
  bones(ctx) {
    // Two crossed bones with knobbed ends.
    px(ctx, 3, 4, 10, 2, BONE);
    px(ctx, 2, 3, 2, 2, BONE);
    px(ctx, 12, 5, 2, 2, BONE);
    px(ctx, 4, 10, 9, 2, BONE_SHADE);
    px(ctx, 3, 11, 2, 2, BONE_SHADE);
    px(ctx, 12, 9, 2, 2, BONE_SHADE);
  },
  skull(ctx) {
    px(ctx, 4, 3, 8, 6, BONE);
    px(ctx, 5, 9, 6, 3, BONE);
    px(ctx, 5, 12, 6, 1, BONE_SHADE);
    px(ctx, 5, 5, 2, 2, OUTLINE); // eye
    px(ctx, 9, 5, 2, 2, OUTLINE); // eye
    px(ctx, 7, 8, 2, 1, OUTLINE); // nose
  },
  grassClump(ctx) {
    px(ctx, 3, 6, 1, 7, GRASS_DARK);
    px(ctx, 6, 3, 1, 10, GRASS_DARK);
    px(ctx, 9, 5, 1, 8, GRASS_DARK);
    px(ctx, 12, 7, 1, 6, GRASS_DARK);
    px(ctx, 6, 3, 1, 2, GRASS_LIGHT);
    px(ctx, 9, 5, 1, 2, GRASS_LIGHT);
  },
  pillar(ctx) {
    // A broken column stump, mossy at the base.
    px(ctx, 4, 2, 8, 12, OUTLINE);
    px(ctx, 5, 3, 6, 10, STONE);
    px(ctx, 5, 3, 2, 10, STONE_LIGHT);
    px(ctx, 5, 3, 6, 1, STONE_LIGHT);
    // Jagged broken top.
    px(ctx, 5, 2, 2, 1, STONE);
    px(ctx, 9, 1, 2, 2, STONE);
    px(ctx, 4, 13, 8, 2, STONE_DARK);
    px(ctx, 4, 12, 3, 1, GRASS_PATCH);
  },
  candle(ctx) {
    px(ctx, 6, 7, 4, 7, BONE); // wax body
    px(ctx, 6, 7, 1, 7, '#fdf8ea');
    px(ctx, 5, 13, 6, 2, STONE_DARK); // holder
    px(ctx, 7, 4, 2, 3, '#ff9d3c'); // flame
    px(ctx, 7, 5, 1, 1, '#ffe268'); // flame core
  },
};

// Weighted decoration types (candles rare so they stay special).
const DECO_TYPES = [
  ['rock', 22],
  ['pebbles', 18],
  ['grassClump', 20],
  ['bones', 12],
  ['skull', 6],
  ['pillar', 12],
  ['candle', 10],
];
const DECO_TOTAL = DECO_TYPES.reduce((sum, [, w]) => sum + w, 0);

const decoCache = new Map();

function getDecoSprite(type) {
  if (!decoCache.has(type)) {
    const small = document.createElement('canvas');
    small.width = DECO_SOURCE;
    small.height = DECO_SOURCE;
    DECO_PAINTERS[type](small.getContext('2d'));

    const sprite = document.createElement('canvas');
    sprite.width = DECO_SOURCE * 4;
    sprite.height = DECO_SOURCE * 4;
    const ctx = sprite.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, sprite.width, sprite.height);
    decoCache.set(type, sprite);
  }
  return decoCache.get(type);
}

/**
 * The decoration in a 256px cell, or null. About a quarter of cells
 * have one, at a stable position within the cell.
 */
export function getDecorationAt(cellX, cellY) {
  const h = hash2(cellX, cellY, 23);
  if (h % 100 >= 26) return null;

  // Weighted type pick.
  let roll = (h >> 7) % DECO_TOTAL;
  let type = DECO_TYPES[0][0];
  for (const [name, weight] of DECO_TYPES) {
    roll -= weight;
    if (roll < 0) {
      type = name;
      break;
    }
  }

  return {
    type,
    sprite: getDecoSprite(type),
    // Offset within the cell, away from the edges.
    offsetX: 48 + ((h >> 12) % (DECOR_CELL - 128)),
    offsetY: 48 + ((h >> 18) % (DECOR_CELL - 128)),
    flicker: (h % 628) / 100, // phase for candle glow
  };
}
