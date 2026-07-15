// Small drawing helpers shared by entities and UI, so sprite and
// bar drawing logic exists only once.

/**
 * Draw an image centered on (x, y) with common effects.
 *
 * Options:
 *   flipX    mirror horizontally (facing left)
 *   scaleY   vertical squash/stretch (slime wobble)
 *   alpha    transparency (blinking)
 *   brighten white-out flash (taking damage)
 */
export function drawCenteredSprite(ctx, image, x, y, options = {}) {
  const { flipX = false, scaleY = 1, alpha = 1, brighten = false } = options;
  const halfW = image.width / 2;
  const halfH = image.height / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX ? -1 : 1, scaleY);
  if (alpha !== 1) ctx.globalAlpha = alpha;
  if (brighten) ctx.filter = 'brightness(2.5) saturate(0.3)';
  ctx.drawImage(image, -halfW, -halfH);
  ctx.restore();
}

/**
 * A filled bar with a dark border — used for every health bar in the
 * game, from the tiny ones over enemies to the big HUD bar.
 */
export function drawBar(ctx, x, y, width, height, percent, fillColor, border = 2) {
  ctx.fillStyle = 'rgba(10, 10, 16, 0.8)';
  ctx.fillRect(x - border, y - border, width + border * 2, height + border * 2);
  ctx.fillStyle = '#2a2d38';
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, width * Math.max(0, Math.min(1, percent)), height);
}

/** Health bar color: green when safe, yellow when low, red when dire. */
export function healthColor(percent) {
  if (percent > 0.5) return '#5cd65c';
  if (percent > 0.25) return '#ffd54f';
  return '#e04040';
}
