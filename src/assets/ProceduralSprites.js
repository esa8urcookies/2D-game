// Procedural placeholder sprites.
// Every sprite is drawn once onto an offscreen 182x182 canvas,
// then reused every frame like a normal image. When real art is
// ready, these can be swapped for PNG files of the same size.

export const SPRITE_SIZE = 182;

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
