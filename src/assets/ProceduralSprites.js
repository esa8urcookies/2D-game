// Procedural placeholder sprites.
// Every sprite is drawn once onto an offscreen 182x182 canvas,
// then reused every frame like a normal image. When real art is
// ready, these can be swapped for PNG files of the same size.

import { SPRITE_SIZE } from '../config/GameConfig.js';

// Each sprite is only built once, then shared by every entity that
// uses it. Drawing 200 slimes still means only one slime canvas.
const spriteCache = new Map();

export function getSprite(name) {
  if (!spriteCache.has(name)) {
    spriteCache.set(name, SPRITE_BUILDERS[name]());
  }
  return spriteCache.get(name);
}

/** Create an offscreen canvas to draw a sprite on. */
function createSpriteCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  return canvas;
}

/**
 * The player: a rounded capsule body with a visor.
 * Drawn facing up; the game can rotate or flip it later if needed.
 */
export function createPlayerSprite() {
  const canvas = createSpriteCanvas();
  const ctx = canvas.getContext('2d');
  const center = SPRITE_SIZE / 2;

  // Soft shadow under the body.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(center, 152, 52, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body: a capsule shape.
  ctx.fillStyle = '#4fc3f7';
  ctx.strokeStyle = '#1a6fa3';
  ctx.lineWidth = 6;
  roundedRect(ctx, center - 40, 30, 80, 120, 38);
  ctx.fill();
  ctx.stroke();

  // Visor.
  ctx.fillStyle = '#0d2b3d';
  roundedRect(ctx, center - 26, 52, 52, 26, 12);
  ctx.fill();

  // Visor shine.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  roundedRect(ctx, center - 18, 57, 18, 8, 4);
  ctx.fill();

  // Belt stripe.
  ctx.fillStyle = '#ffd54f';
  ctx.fillRect(center - 40, 108, 80, 10);

  return canvas;
}

/**
 * Slime: a squishy green dome with big eyes.
 * Slow but sturdy — the basic crowd enemy.
 */
export function createSlimeSprite() {
  const canvas = createSpriteCanvas();
  const ctx = canvas.getContext('2d');
  const center = SPRITE_SIZE / 2;

  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(center, 156, 58, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body: a dome sitting on the ground.
  ctx.fillStyle = '#66bb6a';
  ctx.strokeStyle = '#2e7d32';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(center - 62, 150);
  ctx.quadraticCurveTo(center - 70, 60, center, 52);
  ctx.quadraticCurveTo(center + 70, 60, center + 62, 150);
  ctx.quadraticCurveTo(center, 162, center - 62, 150);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Darker base where the body meets the ground.
  ctx.fillStyle = 'rgba(27, 58, 29, 0.35)';
  ctx.beginPath();
  ctx.ellipse(center, 146, 56, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glossy highlight, plus a small second glint.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(center - 24, 82, 16, 10, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(center + 30, 72, 6, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Eyes.
  ctx.fillStyle = '#1b3a1d';
  ctx.beginPath();
  ctx.arc(center - 20, 108, 9, 0, Math.PI * 2);
  ctx.arc(center + 20, 108, 9, 0, Math.PI * 2);
  ctx.fill();

  // Mouth.
  ctx.strokeStyle = '#1b3a1d';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(center, 122, 14, 0.3, Math.PI - 0.3);
  ctx.stroke();

  return canvas;
}

/**
 * Bat: a small dark flyer with pointed wings.
 * Fast but fragile. Two poses (wings down / wings raised) make a
 * real flap; the Enemy picks a pose from its animation timer.
 */
export function createBatSprite(raised = false) {
  const canvas = createSpriteCanvas();
  const ctx = canvas.getContext('2d');
  const center = SPRITE_SIZE / 2;

  // Raised wings pivot up and inward.
  const tipY = raised ? 56 : 92;
  const curlY = raised ? 34 : 50;
  const sagY = raised ? 78 : 104;

  ctx.fillStyle = '#7e57c2';
  ctx.strokeStyle = '#4527a0';
  ctx.lineWidth = 6;

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(center + side * 18, 90);
    ctx.quadraticCurveTo(center + side * 70, curlY, center + side * 84, tipY);
    ctx.quadraticCurveTo(center + side * 62, tipY - 4, center + side * 54, sagY);
    ctx.quadraticCurveTo(center + side * 40, sagY - 8, center + side * 18, 108);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing membrane rib.
    ctx.strokeStyle = '#4527a0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(center + side * 22, 94);
    ctx.quadraticCurveTo(center + side * 52, (curlY + tipY) / 2 + 8, center + side * 74, tipY + 6);
    ctx.stroke();
    ctx.lineWidth = 6;
  }

  // Body.
  ctx.fillStyle = '#5e35b1';
  ctx.beginPath();
  ctx.arc(center, 96, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ears.
  ctx.fillStyle = '#5e35b1';
  ctx.beginPath();
  ctx.moveTo(center - 18, 78);
  ctx.lineTo(center - 12, 58);
  ctx.lineTo(center - 4, 76);
  ctx.moveTo(center + 18, 78);
  ctx.lineTo(center + 12, 58);
  ctx.lineTo(center + 4, 76);
  ctx.fill();

  // Eyes.
  ctx.fillStyle = '#ffeb3b';
  ctx.beginPath();
  ctx.arc(center - 9, 92, 5, 0, Math.PI * 2);
  ctx.arc(center + 9, 92, 5, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

/**
 * Crawler: a low, wide teal beetle scuttling on six legs.
 * Medium speed, slightly smaller hitbox — annoying to hit.
 * Two leg poses (alternating tripods) make it visibly scuttle.
 */
export function createCrawlerSprite(step = false) {
  const canvas = createSpriteCanvas();
  const ctx = canvas.getContext('2d');
  const center = SPRITE_SIZE / 2;

  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(center, 150, 62, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs: three per side. Alternate legs reach forward or trail
  // back depending on the pose, like a real insect's tripod gait.
  ctx.strokeStyle = '#0e5048';
  ctx.lineWidth = 8;
  ctx.beginPath();
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y = 108 + i * 16;
      // Which legs reach depends on pose + leg index + body side.
      const reaching = (i % 2 === 0) === (side > 0) ? step : !step;
      const stretch = reaching ? 14 : -6;
      ctx.moveTo(center + side * 40, y);
      ctx.lineTo(center + side * (70 + stretch), y + 22 - (reaching ? 6 : 0));
    }
  }
  ctx.stroke();

  // Body: a wide oval shell.
  ctx.fillStyle = '#26a69a';
  ctx.strokeStyle = '#0e5048';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(center, 118, 52, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Shell stripe.
  ctx.strokeStyle = '#0e5048';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(center, 86);
  ctx.lineTo(center, 150);
  ctx.stroke();

  // Eyes at the front edge.
  ctx.fillStyle = '#ffe268';
  ctx.beginPath();
  ctx.arc(center - 18, 132, 7, 0, Math.PI * 2);
  ctx.arc(center + 18, 132, 7, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

/**
 * Brute: a slow slab of angry rock with heavy fists.
 * High health — a walking wall.
 */
export function createBruteSprite() {
  const canvas = createSpriteCanvas();
  const ctx = canvas.getContext('2d');
  const center = SPRITE_SIZE / 2;

  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(center, 158, 60, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8d6e63';
  ctx.strokeStyle = '#3e2c26';
  ctx.lineWidth = 6;

  // Body: a broad slab, wider at the shoulders.
  ctx.beginPath();
  ctx.moveTo(center - 56, 60);
  ctx.lineTo(center + 56, 60);
  ctx.lineTo(center + 46, 152);
  ctx.lineTo(center - 46, 152);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cracks in the rock.
  ctx.strokeStyle = '#3e2c26';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(center - 20, 96);
  ctx.lineTo(center - 6, 112);
  ctx.lineTo(center - 16, 128);
  ctx.moveTo(center + 28, 74);
  ctx.lineTo(center + 20, 92);
  ctx.stroke();

  // Fists hanging low at the sides.
  ctx.fillStyle = '#6d4c41';
  ctx.strokeStyle = '#3e2c26';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(center - 58, 136, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(center + 58, 136, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Deep-set glowing eyes under a heavy brow.
  ctx.fillStyle = '#3e2c26';
  ctx.fillRect(center - 32, 70, 26, 20);
  ctx.fillRect(center + 6, 70, 26, 20);
  ctx.fillStyle = '#ff7043';
  ctx.fillRect(center - 27, 76, 16, 10);
  ctx.fillRect(center + 11, 76, 16, 10);

  // Grim mouth with teeth.
  ctx.fillStyle = '#3e2c26';
  ctx.fillRect(center - 20, 104, 40, 12);
  ctx.fillStyle = '#d7ccc8';
  ctx.fillRect(center - 14, 104, 8, 6);
  ctx.fillRect(center + 6, 104, 8, 6);

  return canvas;
}

/**
 * Elite: a towering crowned slime — a rare mini-boss.
 * Drawn like the slime but taller, purple, and wearing a gold crown.
 */
export function createEliteSprite() {
  const canvas = createSpriteCanvas();
  const ctx = canvas.getContext('2d');
  const center = SPRITE_SIZE / 2;

  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(center, 160, 64, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body: a tall dome.
  ctx.fillStyle = '#ab47bc';
  ctx.strokeStyle = '#5e2069';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(center - 66, 152);
  ctx.quadraticCurveTo(center - 76, 40, center, 32);
  ctx.quadraticCurveTo(center + 76, 40, center + 66, 152);
  ctx.quadraticCurveTo(center, 166, center - 66, 152);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Glossy highlight.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(center - 26, 68, 18, 11, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Crown.
  ctx.fillStyle = '#ffd54f';
  ctx.strokeStyle = '#a06e12';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(center - 34, 40);
  ctx.lineTo(center - 34, 14);
  ctx.lineTo(center - 17, 30);
  ctx.lineTo(center, 10);
  ctx.lineTo(center + 17, 30);
  ctx.lineTo(center + 34, 14);
  ctx.lineTo(center + 34, 40);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Menacing eyes.
  ctx.fillStyle = '#2d0f33';
  ctx.beginPath();
  ctx.arc(center - 24, 104, 11, 0, Math.PI * 2);
  ctx.arc(center + 24, 104, 11, 0, Math.PI * 2);
  ctx.fill();

  // Angry brows.
  ctx.strokeStyle = '#2d0f33';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(center - 36, 88);
  ctx.lineTo(center - 12, 96);
  ctx.moveTo(center + 36, 88);
  ctx.lineTo(center + 12, 96);
  ctx.stroke();

  // Grin.
  ctx.strokeStyle = '#2d0f33';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(center, 122, 18, 0.2, Math.PI - 0.2);
  ctx.stroke();

  return canvas;
}

/**
 * Boss: a horned crimson devourer. Drawn at 182x182 like everything
 * else, then scaled up 1.6x at render time so it towers over the mob.
 */
export function createBossSprite() {
  const canvas = createSpriteCanvas();
  const ctx = canvas.getContext('2d');
  const center = SPRITE_SIZE / 2;

  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(center, 162, 66, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Horns first, so the head overlaps their bases.
  ctx.fillStyle = '#3d1210';
  ctx.strokeStyle = '#1d0605';
  ctx.lineWidth = 5;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(center + side * 34, 52);
    ctx.quadraticCurveTo(center + side * 66, 30, center + side * 56, 4);
    ctx.quadraticCurveTo(center + side * 74, 28, center + side * 56, 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Body: one big hulking round mass.
  ctx.fillStyle = '#b71c1c';
  ctx.strokeStyle = '#4a0b0b';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(center, 104, 64, 58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Belly shading.
  ctx.fillStyle = '#8e1414';
  ctx.beginPath();
  ctx.ellipse(center, 132, 44, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Furious glowing eyes under heavy brows.
  ctx.fillStyle = '#ffe268';
  ctx.beginPath();
  ctx.arc(center - 26, 88, 11, 0, Math.PI * 2);
  ctx.arc(center + 26, 88, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a0b0b';
  ctx.beginPath();
  ctx.arc(center - 24, 90, 4, 0, Math.PI * 2);
  ctx.arc(center + 28, 90, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a0b0b';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(center - 40, 72);
  ctx.lineTo(center - 12, 80);
  ctx.moveTo(center + 40, 72);
  ctx.lineTo(center + 12, 80);
  ctx.stroke();

  // Gaping mouth with fangs.
  ctx.fillStyle = '#2b0505';
  ctx.beginPath();
  ctx.ellipse(center, 122, 30, 16, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#f3f6f0';
  ctx.beginPath();
  ctx.moveTo(center - 22, 122);
  ctx.lineTo(center - 14, 136);
  ctx.lineTo(center - 6, 122);
  ctx.moveTo(center + 22, 122);
  ctx.lineTo(center + 14, 136);
  ctx.lineTo(center + 6, 122);
  ctx.fill();

  return canvas;
}

// Registered builders for the sprite cache above. The "B" entries
// are second animation frames (wing flap, leg scuttle).
const SPRITE_BUILDERS = {
  player: createPlayerSprite,
  slime: createSlimeSprite,
  bat: () => createBatSprite(false),
  batB: () => createBatSprite(true),
  crawler: () => createCrawlerSprite(false),
  crawlerB: () => createCrawlerSprite(true),
  brute: createBruteSprite,
  elite: createEliteSprite,
  boss: createBossSprite,
};

/** Helper: rounded rectangle path. */
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}
