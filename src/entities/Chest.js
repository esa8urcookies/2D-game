// A treasure chest dropped by a boss. It sits on the ground glowing
// until the player walks into it, which starts the chest-opening
// ceremony (see systems/ChestSystem.js).

import { Entity } from './Entity.js';
import { CHEST_CONFIG } from '../config/GameConfig.js';

// --- Chest sprites (closed + open), built once ---------------------------

const SIZE = 128;
let closedSprite = null;
let openSprite = null;

/** Shared drawing for the chest box; `lidAngle` opens the top. */
function buildChestSprite(open) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  const cx = SIZE / 2;

  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, 112, 46, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (open) {
    // Light bursting out of the open box.
    const glow = ctx.createRadialGradient(cx, 62, 4, cx, 62, 52);
    glow.addColorStop(0, 'rgba(255, 243, 194, 0.95)');
    glow.addColorStop(1, 'rgba(255, 243, 194, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Lid tipped back behind the box.
    ctx.fillStyle = '#6d4520';
    ctx.strokeStyle = '#3d2510';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(cx - 44, 26, 88, 22, 8);
    ctx.fill();
    ctx.stroke();
  }

  // Box body.
  ctx.fillStyle = '#8d5a2b';
  ctx.strokeStyle = '#3d2510';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(cx - 44, 58, 88, 52, 6);
  ctx.fill();
  ctx.stroke();

  if (!open) {
    // Closed lid on top.
    ctx.fillStyle = '#a06a34';
    ctx.beginPath();
    ctx.roundRect(cx - 48, 40, 96, 26, 10);
    ctx.fill();
    ctx.stroke();
  }

  // Gold bands.
  ctx.fillStyle = '#ffd54f';
  ctx.strokeStyle = '#a06e12';
  ctx.lineWidth = 3;
  for (const offset of [-26, 26]) {
    ctx.beginPath();
    ctx.rect(cx + offset - 5, open ? 58 : 42, 10, open ? 52 : 68);
    ctx.fill();
    ctx.stroke();
  }

  // Lock plate.
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(cx, open ? 70 : 62, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  return canvas;
}

export function getChestSprite(open = false) {
  if (open) {
    if (!openSprite) openSprite = buildChestSprite(true);
    return openSprite;
  }
  if (!closedSprite) closedSprite = buildChestSprite(false);
  return closedSprite;
}

// --- The entity -----------------------------------------------------------

export class Chest extends Entity {
  constructor(x, y) {
    super(x, y, CHEST_CONFIG.pickupRadius);
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  update(deltaTime, game) {
    this.bobPhase += deltaTime;

    const dx = game.player.x - this.x;
    const dy = game.player.y - this.y;
    const reach = this.collisionRadius + game.player.collisionRadius;

    if (dx * dx + dy * dy < reach * reach) {
      this.dead = true;
      game.openChest();
    }
  }

  render(ctx, camera) {
    const screen = camera.worldToScreen(this.x, this.y);
    const sprite = getChestSprite(false);

    // A pulsing glow so the chest is impossible to miss.
    const pulse = 0.5 + Math.sin(this.bobPhase * 3) * 0.2;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(screen.x, screen.y + 10, 78, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const bob = Math.sin(this.bobPhase * 2) * 4;
    ctx.drawImage(sprite, screen.x - SIZE / 2, screen.y - SIZE / 2 + bob);
  }
}
