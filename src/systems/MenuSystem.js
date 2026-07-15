// The game menu: title screen, how-to-play screen, and pause menu.
// Everything is drawn in a chunky pixel style with the PixelFont —
// no smooth browser fonts anywhere.

import { drawPixelText, measurePixelText } from '../assets/PixelFont.js';
import { getSprite, SPRITE_SIZE } from '../assets/ProceduralSprites.js';
import { randomRange } from '../core/MathUtils.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/Constants.js';

// Palette for the menu artwork.
const GOLD = '#ffd54f';
const GOLD_DARK = '#c8891a';
const OUTLINE = '#16161f';
const BUTTON_FACE = '#3a3f4e';
const BUTTON_LIGHT = '#5c6478';
const BUTTON_DARK = '#23262f';
const TEXT_DIM = '#8a90a3';

// One pixel "unit" for button borders and bevels.
const U = 6;

export class MenuSystem {
  constructor() {
    this.screen = 'title'; // 'title' | 'howto' (pause uses its own set)
    this.selectedIndex = 0;
    this.time = 0;

    // Decorative monsters strolling across the bottom of the title.
    this.critters = [];
    this.critterTimer = 0;

    // Filled during render so clicks can be tested against them.
    this.buttonRects = [];
  }

  /** Which buttons are visible right now. */
  getButtons(game) {
    if (game.state === 'paused') {
      return [
        { label: 'RESUME', action: () => (game.state = 'playing') },
        { label: 'RESTART', action: () => game.startRun() },
      ];
    }
    if (this.screen === 'howto') {
      return [{ label: 'BACK', action: () => (this.screen = 'title') }];
    }
    return [
      { label: 'START GAME', action: () => game.startRun() },
      { label: 'HOW TO PLAY', action: () => (this.screen = 'howto') },
    ];
  }

  update(deltaTime, game) {
    this.time += deltaTime;
    const input = game.input;
    const buttons = this.getButtons(game);

    // Keyboard navigation.
    if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
      this.selectedIndex = (this.selectedIndex + 1) % buttons.length;
    }
    if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
      this.selectedIndex = (this.selectedIndex + buttons.length - 1) % buttons.length;
    }

    // Mouse hover moves the selection; click activates.
    let hovering = false;
    this.buttonRects.forEach((rect, index) => {
      const over =
        input.mouseX >= rect.x && input.mouseX <= rect.x + rect.w &&
        input.mouseY >= rect.y && input.mouseY <= rect.y + rect.h;
      if (over) {
        hovering = true;
        this.selectedIndex = index;
        if (input.clickedThisFrame) {
          buttons[index].action();
        }
      }
    });
    game.canvas.style.cursor = hovering ? 'pointer' : 'default';

    if (input.wasPressed('Enter') || input.wasPressed('Space')) {
      buttons[this.selectedIndex].action();
    }

    // Escape backs out: how-to -> title, pause -> resume.
    if (input.wasPressed('Escape')) {
      if (game.state === 'paused') {
        game.state = 'playing';
      } else if (this.screen === 'howto') {
        this.screen = 'title';
      }
    }

    if (this.selectedIndex >= buttons.length) {
      this.selectedIndex = 0;
    }

    // Only the title screen has the monster parade.
    if (game.state === 'menu') {
      this.updateCritters(deltaTime);
    }
  }

  updateCritters(deltaTime) {
    this.critterTimer -= deltaTime;
    if (this.critterTimer <= 0 && this.critters.length < 6) {
      const goingRight = Math.random() < 0.5;
      this.critters.push({
        type: Math.random() < 0.6 ? 'slime' : 'bat',
        x: goingRight ? -150 : GAME_WIDTH + 150,
        y: randomRange(GAME_HEIGHT - 260, GAME_HEIGHT - 140),
        speed: randomRange(60, 150) * (goingRight ? 1 : -1),
        phase: randomRange(0, Math.PI * 2),
      });
      this.critterTimer = randomRange(1.5, 3.5);
    }

    for (const critter of this.critters) {
      critter.x += critter.speed * deltaTime;
      critter.phase += deltaTime;
    }
    this.critters = this.critters.filter(
      (c) => c.x > -300 && c.x < GAME_WIDTH + 300
    );
  }

  render(game) {
    const ctx = game.ctx;

    if (game.state === 'paused') {
      this.renderPauseOverlay(ctx, game);
      return;
    }

    this.renderCritters(ctx);

    if (this.screen === 'howto') {
      this.renderHowTo(ctx, game);
    } else {
      this.renderTitle(ctx, game);
    }
  }

  renderTitle(ctx, game) {
    // The logo floats gently, like an old arcade attract screen.
    const bob = Math.round(Math.sin(this.time * 1.6) * 3) * 4;

    drawPixelText(ctx, 'SWARM', GAME_WIDTH / 2, 150 + bob, {
      scale: 22,
      color: GOLD,
      shadeColor: GOLD_DARK,
      outline: OUTLINE,
      align: 'center',
    });
    drawPixelText(ctx, 'SURVIVORS', GAME_WIDTH / 2, 330 + bob, {
      scale: 16,
      color: '#e8ecf4',
      shadeColor: '#9aa3b8',
      outline: OUTLINE,
      align: 'center',
    });

    this.renderButtons(ctx, game, 600);

    // Blinking hint, arcade style.
    if (Math.floor(this.time * 1.4) % 2 === 0) {
      drawPixelText(ctx, 'PRESS ENTER OR CLICK A BUTTON', GAME_WIDTH / 2, 930, {
        scale: 4,
        color: TEXT_DIM,
        align: 'center',
      });
    }

    drawPixelText(ctx, 'V0.3', GAME_WIDTH - 120, GAME_HEIGHT - 60, { scale: 4, color: TEXT_DIM });
  }

  renderHowTo(ctx, game) {
    // Panel with a double pixel border.
    const panelW = 1240;
    const panelH = 690;
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = 140;

    ctx.fillStyle = OUTLINE;
    ctx.fillRect(panelX - U * 2, panelY - U * 2, panelW + U * 4, panelH + U * 4);
    ctx.fillStyle = GOLD_DARK;
    ctx.fillRect(panelX - U, panelY - U, panelW + U * 2, panelH + U * 2);
    ctx.fillStyle = '#1b1d28';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    drawPixelText(ctx, 'HOW TO PLAY', GAME_WIDTH / 2, panelY + 50, {
      scale: 8,
      color: GOLD,
      shadeColor: GOLD_DARK,
      outline: OUTLINE,
      align: 'center',
    });

    const lines = [
      'MOVE WITH WASD OR THE ARROW KEYS',
      'YOUR WEAPON FIRES BY ITSELF',
      'IT ALWAYS AIMS AT THE NEAREST ENEMY',
      'DODGE THE MONSTERS AND SURVIVE',
      'PRESS ESC TO PAUSE',
    ];
    lines.forEach((line, i) => {
      drawPixelText(ctx, line, GAME_WIDTH / 2, panelY + 170 + i * 70, {
        scale: 4,
        color: '#d8dce8',
        align: 'center',
      });
    });

    this.renderButtons(ctx, game, panelY + panelH - 130);
  }

  renderPauseOverlay(ctx, game) {
    ctx.fillStyle = 'rgba(10, 10, 16, 0.72)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawPixelText(ctx, 'PAUSED', GAME_WIDTH / 2, 240, {
      scale: 16,
      color: GOLD,
      shadeColor: GOLD_DARK,
      outline: OUTLINE,
      align: 'center',
    });

    this.renderButtons(ctx, game, 520);

    drawPixelText(ctx, 'ESC TO RESUME', GAME_WIDTH / 2, 900, {
      scale: 4,
      color: TEXT_DIM,
      align: 'center',
    });
  }

  /** Draw the current button list, stacked and centered. */
  renderButtons(ctx, game, startY) {
    const buttons = this.getButtons(game);
    const scale = 6;
    const padX = U * 8;
    const padY = U * 4;

    // All buttons share the widest label's size.
    const textW = Math.max(...buttons.map((b) => measurePixelText(b.label, scale)));
    const w = textW + padX * 2;
    const h = 7 * scale + padY * 2;
    const x = (GAME_WIDTH - w) / 2;

    this.buttonRects = [];

    buttons.forEach((button, index) => {
      const y = startY + index * (h + U * 6);
      const selected = index === this.selectedIndex;
      this.buttonRects.push({ x, y, w, h });

      // Chunky bevel: outline, light top-left edge, dark bottom-right.
      ctx.fillStyle = OUTLINE;
      ctx.fillRect(x - U, y - U, w + U * 2, h + U * 2);
      ctx.fillStyle = selected ? GOLD : BUTTON_LIGHT;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = selected ? GOLD_DARK : BUTTON_DARK;
      ctx.fillRect(x + U, y + U, w - U, h - U);
      ctx.fillStyle = selected ? '#e0a832' : BUTTON_FACE;
      ctx.fillRect(x + U, y + U, w - U * 2, h - U * 2);

      drawPixelText(ctx, button.label, GAME_WIDTH / 2, y + padY, {
        scale,
        color: selected ? OUTLINE : '#e8ecf4',
        align: 'center',
      });

      // A little pixel arrow bounces beside the selected button.
      if (selected) {
        const nudge = Math.round(Math.sin(this.time * 8)) * U;
        drawPixelText(ctx, '>', x - U * 10 + nudge, y + padY, {
          scale,
          color: GOLD,
          outline: OUTLINE,
        });
      }
    });
  }

  renderCritters(ctx) {
    for (const critter of this.critters) {
      const sprite = getSprite(critter.type);
      const facing = critter.speed > 0 ? 1 : -1;
      const bob = critter.type === 'bat' ? Math.sin(critter.phase * 6) * 12 : 0;
      const squish = critter.type === 'slime' ? 1 + Math.sin(critter.phase * 6) * 0.05 : 1;

      ctx.save();
      ctx.translate(critter.x, critter.y + bob);
      ctx.scale(facing, squish);
      ctx.drawImage(sprite, -SPRITE_SIZE / 2, -SPRITE_SIZE / 2);
      ctx.restore();
    }
  }
}
