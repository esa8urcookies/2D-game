// Small math helpers used across the game.

/** Keep a value between min and max. */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Linear interpolation from a to b by t (0..1). */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Distance between two points. */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Normalize a vector so its length is 1.
 * Returns { x: 0, y: 0 } for a zero-length vector.
 */
export function normalize(x, y) {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return { x: x / length, y: y / length };
}

/** Random number between min (inclusive) and max (exclusive). */
export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

/** Format seconds as M:SS, e.g. for the survival timer. */
export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
