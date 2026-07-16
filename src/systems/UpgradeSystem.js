// The level-up screen: freezes the action and offers 3 random
// upgrade cards. Pick with the mouse, the 1/2/3 keys, or arrows +
// Enter. The upgrade pool itself lives in config/Upgrades.js.

import { UPGRADES } from '../config/Upgrades.js';
import { drawPixelText } from '../assets/PixelFont.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

const GOLD = '#ffd54f';
const GOLD_DARK = '#c8891a';
const OUTLINE = '#16161f';
const CARD_FACE = '#232633';
const CARD_EDGE = '#3a3f4e';
const TEXT_DIM = '#8a90a3';

const CARD_W = 460;
const CARD_H = 380;
const CARD_GAP = 60;

export class UpgradeSystem {
  constructor() {
    this.choices = [];
    this.selectedIndex = 0;
    this.time = 0;

    // Filled during render so mouse clicks can be tested.
    this.cardRects = [];
  }

  /** How many times an upgrade has been taken this run. */
  levelOf(game, upgrade) {
    return game.upgradeLevels[upgrade.id] || 0;
  }

  /** Pick up to 3 random, currently-useful upgrades. */
  rollChoices(game) {
    const available = UPGRADES.filter((upgrade) => {
      if (this.levelOf(game, upgrade) >= upgrade.maxLevel) return false;
      if (upgrade.isUseful && !upgrade.isUseful(game)) return false;
      return true;
    });

    // Shuffle a copy and take the first 3.
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    this.choices = shuffled.slice(0, 3);
    this.selectedIndex = 0;
    this.time = 0;
  }

  /** True if there was nothing to offer (everything maxed out). */
  isEmpty() {
    return this.choices.length === 0;
  }

  choose(game, index) {
    const upgrade = this.choices[index];
    if (!upgrade) return;

    upgrade.apply(game);
    game.upgradeLevels[upgrade.id] = this.levelOf(game, upgrade) + 1;
    game.onUpgradeChosen();
  }

  update(deltaTime, game) {
    this.time += deltaTime;
    const input = game.input;

    // Direct picks: 1 / 2 / 3.
    if (input.wasPressed('Digit1')) return this.choose(game, 0);
    if (input.wasPressed('Digit2')) return this.choose(game, 1);
    if (input.wasPressed('Digit3')) return this.choose(game, 2);

    // Arrow / WASD navigation + Enter or Space.
    if (input.wasPressed('ArrowRight') || input.wasPressed('KeyD')) {
      this.selectedIndex = (this.selectedIndex + 1) % this.choices.length;
    }
    if (input.wasPressed('ArrowLeft') || input.wasPressed('KeyA')) {
      this.selectedIndex =
        (this.selectedIndex + this.choices.length - 1) % this.choices.length;
    }
    if (input.wasPressed('Enter') || input.wasPressed('Space')) {
      return this.choose(game, this.selectedIndex);
    }

    // Mouse hover + click.
    let hovering = false;
    this.cardRects.forEach((rect, index) => {
      const over =
        input.mouseX >= rect.x && input.mouseX <= rect.x + rect.w &&
        input.mouseY >= rect.y && input.mouseY <= rect.y + rect.h;
      if (over) {
        hovering = true;
        this.selectedIndex = index;
        if (input.clickedThisFrame) {
          this.choose(game, index);
        }
      }
    });
    game.canvas.style.cursor = hovering ? 'pointer' : 'default';
  }

  render(game) {
    const ctx = game.ctx;

    // Dim the frozen battlefield.
    ctx.fillStyle = 'rgba(10, 12, 20, 0.78)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Header with a gentle bounce.
    const bob = Math.round(Math.sin(this.time * 3) * 2) * 4;
    drawPixelText(ctx, 'LEVEL UP!', GAME_WIDTH / 2, 130 + bob, {
      scale: 14,
      color: GOLD,
      shadeColor: GOLD_DARK,
      outline: OUTLINE,
      align: 'center',
    });
    drawPixelText(ctx, `YOU REACHED LEVEL ${game.player.level}`, GAME_WIDTH / 2, 290, {
      scale: 4,
      color: TEXT_DIM,
      align: 'center',
    });

    // Cards, centered as a row.
    const count = this.choices.length;
    const totalWidth = count * CARD_W + (count - 1) * CARD_GAP;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const y = 380;

    this.cardRects = [];

    this.choices.forEach((upgrade, index) => {
      const x = startX + index * (CARD_W + CARD_GAP);
      this.cardRects.push({ x, y, w: CARD_W, h: CARD_H });
      this.renderCard(ctx, game, upgrade, index, x, y);
    });

    drawPixelText(ctx, 'CLICK A CARD OR PRESS 1 2 3', GAME_WIDTH / 2, y + CARD_H + 70, {
      scale: 4,
      color: TEXT_DIM,
      align: 'center',
    });
  }

  renderCard(ctx, game, upgrade, index, x, y) {
    const selected = index === this.selectedIndex;
    const U = 6; // pixel unit for borders

    // Border glows gold when selected.
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(x - U * 2, y - U * 2, CARD_W + U * 4, CARD_H + U * 4);
    ctx.fillStyle = selected ? GOLD : CARD_EDGE;
    ctx.fillRect(x - U, y - U, CARD_W + U * 2, CARD_H + U * 2);
    ctx.fillStyle = CARD_FACE;
    ctx.fillRect(x, y, CARD_W, CARD_H);

    const centerX = x + CARD_W / 2;

    // Number key hint in the top corner.
    drawPixelText(ctx, String(index + 1), x + 24, y + 22, {
      scale: 5,
      color: selected ? GOLD : TEXT_DIM,
      outline: OUTLINE,
    });

    // Name (title), description, and current level.
    drawPixelText(ctx, upgrade.name, centerX, y + 90, {
      scale: 6,
      color: GOLD,
      shadeColor: GOLD_DARK,
      outline: OUTLINE,
      align: 'center',
    });
    drawPixelText(ctx, upgrade.description, centerX, y + 190, {
      scale: 4,
      color: '#e8ecf4',
      align: 'center',
    });

    const level = this.levelOf(game, upgrade);
    const levelLabel =
      level === 0
        ? 'NEW!'
        : upgrade.maxLevel === Infinity
          ? `TAKEN ${level}X`
          : `LV ${level} > ${level + 1}`;
    drawPixelText(ctx, levelLabel, centerX, y + 290, {
      scale: 4,
      color: level === 0 ? '#5cd65c' : TEXT_DIM,
      align: 'center',
    });
  }
}
