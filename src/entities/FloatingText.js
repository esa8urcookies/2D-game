// A floating damage number: rises, fades, then removes itself.

import { Entity } from './Entity.js';
import { drawPixelText } from '../assets/PixelFont.js';
import { EFFECTS_CONFIG } from '../config/GameConfig.js';

export class FloatingText extends Entity {
  constructor(text, x, y) {
    super(x, y, 0); // no collision

    this.text = String(text);
    this.velocityY = -EFFECTS_CONFIG.damageText.riseSpeed;
    this.maxLife = EFFECTS_CONFIG.damageText.lifeSeconds;
    this.life = this.maxLife;
  }

  update(deltaTime, game) {
    super.update(deltaTime, game);

    this.life -= deltaTime;
    if (this.life <= 0) {
      this.dead = true;
    }
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.x, this.y);

    ctx.save();
    // Fully visible for the first half of its life, then fades out.
    ctx.globalAlpha = Math.min(1, this.life / (this.maxLife * 0.5));
    drawPixelText(ctx, this.text, screen.x, screen.y, {
      scale: 4,
      color: '#ffd54f',
      outline: '#16161f',
      align: 'center',
    });
    ctx.restore();
  }
}
