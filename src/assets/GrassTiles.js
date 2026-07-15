// Procedural pixel-art grass tiles for the endless background.
//
// Each tile is authored on a 32x32 pixel grid and scaled up 4x to
// 128x128 world pixels with no smoothing, matching the chunky pixel
// look of the rest of the game.
//
// Which variant appears at each map position is decided by a hash of
// the tile coordinates, so the world looks hand-scattered but is
// perfectly stable as the camera moves — the same spot always shows
// the same tile.

export const GRASS_TILE_SIZE = 128; // world pixels per tile

const SOURCE = 32; // authoring grid
const SCALE = GRASS_TILE_SIZE / SOURCE; // 4

// Grass palette: a mid green so green slimes (with their dark
// outlines) still read clearly on top.
const BASE = '#57a03f';
const PATCH = '#4d9236'; // subtle darker ground patches
const BLADE = '#37792c'; // grass tuft strokes
const BLADE_LIGHT = '#79bf55';
const SPARKLE = '#e9f6da';
const FLOWER_WHITE = '#f3f6f0';
const FLOWER_CENTER = '#f2c94c';
const SHROOM_CAP = '#d0453e';
const SHROOM_SPOT = '#f3f6f0';
const SHROOM_STEM = '#e8ddc8';

/** Draw one pixel-grid rect. */
function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** A little 3-blade grass tuft with its feet at (x, y). */
function tuft(ctx, x, y, light = false) {
  const color = light ? BLADE_LIGHT : BLADE;
  px(ctx, x, y - 2, 1, 2, color);
  px(ctx, x + 2, y - 3, 1, 3, color);
  px(ctx, x + 4, y - 2, 1, 2, color);
}

/** A 4-point sparkle centered on (x, y). */
function sparkle(ctx, x, y) {
  px(ctx, x, y - 1, 1, 3, SPARKLE);
  px(ctx, x - 1, y, 3, 1, SPARKLE);
}

/** A small white daisy with a yellow center at (x, y). */
function daisy(ctx, x, y) {
  px(ctx, x, y - 2, 2, 2, FLOWER_WHITE);
  px(ctx, x, y + 2, 2, 2, FLOWER_WHITE);
  px(ctx, x - 2, y, 2, 2, FLOWER_WHITE);
  px(ctx, x + 2, y, 2, 2, FLOWER_WHITE);
  px(ctx, x, y, 2, 2, FLOWER_CENTER);
}

/** A tiny red-capped mushroom with its base at (x, y). */
function mushroom(ctx, x, y) {
  px(ctx, x + 1, y - 2, 2, 2, SHROOM_STEM);
  px(ctx, x, y - 4, 4, 2, SHROOM_CAP);
  px(ctx, x + 1, y - 5, 2, 1, SHROOM_CAP);
  px(ctx, x + 1, y - 4, 1, 1, SHROOM_SPOT);
}

// Every variant starts from the same base: grass with a few darker
// patches and scattered blades, so tiles blend seamlessly.
function drawBase(ctx) {
  px(ctx, 0, 0, SOURCE, SOURCE, BASE);

  // Soft darker patches break up the flat color.
  px(ctx, 3, 5, 7, 4, PATCH);
  px(ctx, 20, 14, 8, 5, PATCH);
  px(ctx, 9, 24, 6, 4, PATCH);

  // A few single-pixel freckles.
  px(ctx, 15, 3, 1, 1, BLADE);
  px(ctx, 27, 7, 1, 1, BLADE);
  px(ctx, 5, 17, 1, 1, BLADE);
  px(ctx, 24, 27, 1, 1, BLADE);
  px(ctx, 12, 12, 1, 1, BLADE_LIGHT);
}

// The tile variants, from most common to rare decorations.
const VARIANTS = [
  // 0: plain
  (ctx) => {
    tuft(ctx, 8, 10);
    tuft(ctx, 22, 24, true);
  },
  // 1: plain, mirrored layout so tiling is less obvious
  (ctx) => {
    tuft(ctx, 20, 8, true);
    tuft(ctx, 6, 26);
  },
  // 2: extra tufty
  (ctx) => {
    tuft(ctx, 5, 9);
    tuft(ctx, 16, 15, true);
    tuft(ctx, 24, 6);
    tuft(ctx, 10, 27);
  },
  // 3: sparkles (the little white glints from the reference look)
  (ctx) => {
    tuft(ctx, 6, 22);
    sparkle(ctx, 12, 8);
    sparkle(ctx, 24, 18);
    sparkle(ctx, 18, 28);
  },
  // 4: daisy
  (ctx) => {
    tuft(ctx, 24, 10, true);
    daisy(ctx, 10, 18);
  },
  // 5: mushroom
  (ctx) => {
    tuft(ctx, 8, 12);
    mushroom(ctx, 20, 24);
  },
];

// Build each variant once, at full world size, and reuse forever.
const tileCache = [];

function buildTile(variantIndex) {
  const small = document.createElement('canvas');
  small.width = SOURCE;
  small.height = SOURCE;
  const smallCtx = small.getContext('2d');
  drawBase(smallCtx);
  VARIANTS[variantIndex](smallCtx);

  const tile = document.createElement('canvas');
  tile.width = GRASS_TILE_SIZE;
  tile.height = GRASS_TILE_SIZE;
  const tileCtx = tile.getContext('2d');
  tileCtx.imageSmoothingEnabled = false;
  tileCtx.drawImage(small, 0, 0, GRASS_TILE_SIZE, GRASS_TILE_SIZE);
  return tile;
}

export function getGrassTile(variantIndex) {
  if (!tileCache[variantIndex]) {
    tileCache[variantIndex] = buildTile(variantIndex);
  }
  return tileCache[variantIndex];
}

/**
 * Deterministic variant for a tile coordinate: hash the position into
 * 0..99, then map ranges to variants (plain common, mushrooms rare).
 */
export function grassVariantAt(tileX, tileY) {
  // A simple integer hash — the exact numbers don't matter, only
  // that the result is stable and looks random.
  let h = (tileX * 73856093) ^ (tileY * 19349663);
  h = (h ^ (h >> 13)) * 1274126177;
  const roll = ((h ^ (h >> 16)) >>> 0) % 100;

  if (roll < 40) return 0; // plain
  if (roll < 70) return 1; // plain, mirrored
  if (roll < 82) return 2; // tufty
  if (roll < 92) return 3; // sparkles
  if (roll < 97) return 4; // daisy
  return 5; // mushroom
}
