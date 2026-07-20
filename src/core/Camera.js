// The camera decides which part of the world is visible on screen.
// It follows a target (the player), converts world coordinates into
// screen coordinates, and can shake briefly for impact feedback.

import { GAME_WIDTH, GAME_HEIGHT, EFFECTS_CONFIG } from '../config/GameConfig.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;

    this.shakeTime = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  /**
   * Kick off a small shake, e.g. when the player is hit. Intensity is
   * clamped so nothing can ever request a screen-wrecking earthquake.
   * A weaker, still-running shake never overrides a stronger one.
   */
  shake(intensity = 8, duration = 0.25) {
    const clamped = Math.min(intensity, EFFECTS_CONFIG.maxShakeIntensity);
    // If a currently stronger shake is still playing, let it finish
    // rather than replacing it with a weaker one.
    const currentStrength =
      this.shakeTime > 0 ? this.shakeIntensity * (this.shakeTime / this.shakeDuration) : 0;
    if (currentStrength > clamped) return;

    this.shakeIntensity = clamped;
    this.shakeDuration = duration;
    this.shakeTime = duration;
  }

  /** Advance the shake; call once per frame. */
  update(deltaTime) {
    this.shakeTime = Math.max(0, this.shakeTime - deltaTime);

    if (this.shakeTime > 0) {
      // Random jitter that gets weaker as the shake runs out.
      const falloff = this.shakeTime / this.shakeDuration;
      const strength = this.shakeIntensity * falloff;
      this.shakeOffsetX = (Math.random() * 2 - 1) * strength;
      this.shakeOffsetY = (Math.random() * 2 - 1) * strength;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  /** Center the camera on a target (usually the player). */
  follow(target) {
    this.x = target.x - GAME_WIDTH / 2 + this.shakeOffsetX;
    this.y = target.y - GAME_HEIGHT / 2 + this.shakeOffsetY;
  }

  /** Convert a world position to a screen position. */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y,
    };
  }

  /**
   * Is this world position on screen (or within `margin` px of it)?
   * Used both for skipping off-screen drawing and for cleanup.
   */
  isVisible(worldX, worldY, margin = 0) {
    const x = worldX - this.x;
    const y = worldY - this.y;
    return (
      x > -margin &&
      x < GAME_WIDTH + margin &&
      y > -margin &&
      y < GAME_HEIGHT + margin
    );
  }
}
