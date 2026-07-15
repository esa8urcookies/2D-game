// Procedural pixel-art walking sprite sheet for the player.
//
// The sheet has 4 rows (down, left, up, right) and 4 frames per row:
//   [stand, step A, stand, step B]
// Each frame is authored on a 26x26 pixel grid, outlined, then scaled
// up 7x with no smoothing to exactly 182x182 — the game's sprite size.
//
// To use your own art instead, see CUSTOM_SHEET at the bottom: drop a
// PNG with the same 4-row layout into src/assets/images/ and the game
// will load it automatically, falling back to this procedural sheet
// if the file is missing.

import { SPRITE_SIZE } from '../config/GameConfig.js';

export const HERO_SHEET_META = {
  frameSize: SPRITE_SIZE, // 182, matching every other sprite
  framesPerRow: 4,
  rows: { down: 0, left: 1, up: 2, right: 3 },
  walkFps: 8,
};

const UNIT = 26; // pixel-art grid size
const SCALE = SPRITE_SIZE / UNIT; // 7: scales 26 up to exactly 182

// Palette, loosely matching a tiny armored hero.
const OUTLINE = '#23232e';
const STEEL_LIGHT = '#c6cdd8';
const STEEL_MID = '#97a1b1';
const STEEL_DARK = '#5f6878';
const SKIN = '#e8b088';
const EYE = '#23232e';
const RED = '#b83232';
const RED_DARK = '#7e2020';
const PANTS = '#3c414d';
const BOOT = '#6b4a2f';

/** Fill one or more grid pixels. */
function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/**
 * Facing the camera. `step` is -1, 0 or 1 and picks which leg is
 * mid-stride; arms swing the opposite way.
 */
function drawDown(ctx, step) {
  // Helmet.
  px(ctx, 10, 3, 6, 1, STEEL_MID);
  px(ctx, 9, 4, 8, 3, STEEL_LIGHT);
  px(ctx, 15, 4, 2, 3, STEEL_MID); // shading on the right
  px(ctx, 9, 7, 8, 1, STEEL_DARK); // rim

  // Face.
  px(ctx, 10, 8, 6, 3, SKIN);
  px(ctx, 11, 9, 1, 1, EYE);
  px(ctx, 14, 9, 1, 1, EYE);

  // Torso.
  px(ctx, 9, 11, 8, 5, STEEL_MID);
  px(ctx, 9, 11, 3, 2, STEEL_LIGHT); // chest highlight
  px(ctx, 9, 16, 8, 1, RED_DARK); // belt
  px(ctx, 12, 16, 2, 1, RED); // buckle

  // Pauldrons.
  px(ctx, 7, 11, 2, 2, STEEL_DARK);
  px(ctx, 17, 11, 2, 2, STEEL_DARK);

  // Arms swing opposite to the legs. Darker than the torso so they
  // read as separate shapes instead of one wide slab.
  px(ctx, 7, 13 + step, 2, 3, STEEL_DARK);
  px(ctx, 7, 16 + step, 2, 1, SKIN);
  px(ctx, 17, 13 - step, 2, 3, STEEL_DARK);
  px(ctx, 17, 16 - step, 2, 1, SKIN);

  // Legs and boots, with a gap between them. A stepping leg is
  // lifted one pixel.
  const leftLift = step === 1 ? 1 : 0;
  const rightLift = step === -1 ? 1 : 0;
  px(ctx, 10, 17, 2, 3 - leftLift, PANTS);
  px(ctx, 14, 17, 2, 3 - rightLift, PANTS);
  px(ctx, 10, 20 - leftLift, 2, 2, BOOT);
  px(ctx, 14, 20 - rightLift, 2, 2, BOOT);
}

/** Facing away from the camera: helmet back and a red cape. */
function drawUp(ctx, step) {
  // Helmet (no face from behind).
  px(ctx, 10, 3, 6, 1, STEEL_MID);
  px(ctx, 9, 4, 8, 4, STEEL_LIGHT);
  px(ctx, 15, 4, 2, 4, STEEL_MID);
  px(ctx, 9, 8, 8, 3, STEEL_MID); // back of the helmet

  // Pauldrons.
  px(ctx, 7, 11, 2, 2, STEEL_DARK);
  px(ctx, 17, 11, 2, 2, STEEL_DARK);

  // Cape covers the torso, swaying slightly with the stride.
  px(ctx, 9, 11, 8, 6, RED);
  px(ctx, 9, 11, 8, 1, RED_DARK); // collar
  px(ctx, 9 + step, 17, 8, 1, RED_DARK); // hem sways

  // Arms.
  px(ctx, 7, 13 + step, 2, 3, STEEL_DARK);
  px(ctx, 17, 13 - step, 2, 3, STEEL_DARK);

  // Legs and boots, matching the front view's gap.
  const leftLift = step === 1 ? 1 : 0;
  const rightLift = step === -1 ? 1 : 0;
  px(ctx, 10, 18, 2, 2 - leftLift, PANTS);
  px(ctx, 14, 18, 2, 2 - rightLift, PANTS);
  px(ctx, 10, 20 - leftLift, 2, 2, BOOT);
  px(ctx, 14, 20 - rightLift, 2, 2, BOOT);
}

/**
 * Facing right, carrying the sword forward. The left-facing row is
 * this drawing mirrored, so it only exists once.
 */
function drawSide(ctx, step) {
  // Helmet profile with nose guard.
  px(ctx, 10, 3, 6, 1, STEEL_MID);
  px(ctx, 9, 4, 8, 3, STEEL_LIGHT);
  px(ctx, 9, 7, 7, 1, STEEL_DARK);
  px(ctx, 16, 7, 1, 3, STEEL_MID); // nose guard

  // Face profile with one visible eye.
  px(ctx, 11, 8, 5, 3, SKIN);
  px(ctx, 14, 9, 1, 1, EYE);

  // Torso.
  px(ctx, 10, 11, 6, 5, STEEL_MID);
  px(ctx, 10, 11, 2, 2, STEEL_LIGHT);
  px(ctx, 10, 16, 6, 1, RED_DARK); // belt

  // Arm swings with the stride; hand holds the sword.
  px(ctx, 12 + step, 12, 2, 4, STEEL_DARK);
  px(ctx, 12 + step, 16, 2, 1, SKIN);

  // Sword pointing forward: guard, then blade with a bright edge.
  px(ctx, 15 + step, 14, 1, 3, RED_DARK); // grip
  px(ctx, 16 + step, 13, 1, 5, STEEL_DARK); // guard
  px(ctx, 17 + step, 14, 6, 2, STEEL_MID); // blade
  px(ctx, 17 + step, 14, 5, 1, STEEL_LIGHT); // edge highlight
  px(ctx, 23 + step, 15, 1, 1, STEEL_LIGHT); // tip

  // Legs scissor while walking: one forward, one back.
  const front = step; // -1, 0 or 1
  px(ctx, 12 + front * 2, 17, 3, 3, PANTS);
  px(ctx, 11 - front * 2, 17, 3, 3, PANTS);
  px(ctx, 12 + front * 2, 20, 3, 2, BOOT);
  px(ctx, 11 - front * 2, 20, 3, 2, BOOT);
}

/**
 * Draw a 1px dark outline around everything opaque, the classic
 * pixel-art trick that makes a sprite pop against any background.
 */
function addOutline(ctx) {
  const image = ctx.getImageData(0, 0, UNIT, UNIT);
  const alphaAt = (x, y) => {
    if (x < 0 || y < 0 || x >= UNIT || y >= UNIT) return 0;
    return image.data[(y * UNIT + x) * 4 + 3];
  };

  ctx.fillStyle = OUTLINE;
  for (let y = 0; y < UNIT; y++) {
    for (let x = 0; x < UNIT; x++) {
      if (alphaAt(x, y) > 0) continue;
      const touchesBody =
        alphaAt(x - 1, y) || alphaAt(x + 1, y) || alphaAt(x, y - 1) || alphaAt(x, y + 1);
      if (touchesBody) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

/** Render one 26x26 frame and scale it up to 182x182. */
function buildFrame(drawFunction, step) {
  const small = document.createElement('canvas');
  small.width = UNIT;
  small.height = UNIT;
  const smallCtx = small.getContext('2d');

  drawFunction(smallCtx, step);
  addOutline(smallCtx);

  const frame = document.createElement('canvas');
  frame.width = UNIT * SCALE;
  frame.height = UNIT * SCALE;
  const frameCtx = frame.getContext('2d');
  frameCtx.imageSmoothingEnabled = false; // keep pixels crisp
  frameCtx.drawImage(small, 0, 0, UNIT * SCALE, UNIT * SCALE);

  return frame;
}

/** Build the full 4x4 sheet (rows: down, left, up, right). */
export function createHeroSheet() {
  const { frameSize, framesPerRow, rows } = HERO_SHEET_META;
  const sheet = document.createElement('canvas');
  sheet.width = frameSize * framesPerRow;
  sheet.height = frameSize * 4;
  const ctx = sheet.getContext('2d');

  // The walk cycle: stand, step one way, stand, step the other way.
  const steps = [0, 1, 0, -1];

  steps.forEach((step, column) => {
    const x = column * frameSize;

    ctx.drawImage(buildFrame(drawDown, step), x, rows.down * frameSize);
    ctx.drawImage(buildFrame(drawUp, step), x, rows.up * frameSize);

    const side = buildFrame(drawSide, step);
    ctx.drawImage(side, x, rows.right * frameSize);

    // Left row = right row mirrored.
    ctx.save();
    ctx.translate(x + frameSize, rows.left * frameSize);
    ctx.scale(-1, 1);
    ctx.drawImage(side, 0, 0);
    ctx.restore();
  });

  return sheet;
}

// ---------------------------------------------------------------------------
// Optional custom art override.
//
// To use your own sprite sheet: save a PNG at `imagePath` with the same
// layout — 4 rows in the order down, left, up, right and `framesPerRow`
// frames per row (frame 0 = standing). Set `frameSize` to your cell
// size in pixels; the game scales it to 182x182 when drawing.
// If the file does not exist, the procedural sheet above is used.
// ---------------------------------------------------------------------------

export const CUSTOM_SHEET = {
  enabled: false, // set to true once your PNG exists at imagePath
  imagePath: 'src/assets/images/player-sheet.png',
  frameSize: 182,
  framesPerRow: 4,
  walkFps: 8,
};

/** Try to load the custom sheet; resolves to null if unavailable. */
export async function tryLoadCustomSheet() {
  if (!CUSTOM_SHEET.enabled) {
    return null;
  }
  try {
    const response = await fetch(CUSTOM_SHEET.imagePath);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await createImageBitmap(blob);
  } catch {
    return null;
  }
}
