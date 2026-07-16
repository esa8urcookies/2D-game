// The level-up screen: freezes the action and offers 3 random cards.
// Cards come from two pools:
//   - weapons (config/Weapons.js): new ones, or next levels of owned
//   - passive items (config/Passives.js): new ones, or next levels
// If everything is maxed, fallback cards (heal / XP) appear instead,
// so a level-up is never wasted.
// Pick with the mouse, the 1/2/3 keys, or arrows + Enter.

import { WEAPON_DEFS } from '../config/Weapons.js';
import { PASSIVE_DEFS, FALLBACK_CHOICES } from '../config/Passives.js';
import { drawPixelText } from '../assets/PixelFont.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

const GOLD = '#ffd54f';
const GOLD_DARK = '#c8891a';
const OUTLINE = '#16161f';
const CARD_FACE = '#232633';
const CARD_EDGE = '#3a3f4e';
const TEXT_DIM = '#8a90a3';
const NEW_GREEN = '#5cd65c';

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

  /**
   * Every card the player could be offered right now. Each choice is
   * a plain object: { name, description, tag, tagColor, apply }.
   */
  buildChoicePool(game) {
    const pool = [];

    // Weapons: unlock new, or level up owned (maxed ones drop out).
    for (const id of Object.keys(WEAPON_DEFS)) {
      const def = WEAPON_DEFS[id];
      const owned = game.weapons.getWeapon(id);

      // Evolved forms only come from chests, and a base weapon that
      // has already evolved must not be offered again.
      if (def.evolved) continue;
      if (def.evolvesInto && game.weapons.getWeapon(def.evolvesInto)) continue;

      if (!owned) {
        pool.push({
          name: def.name,
          description: def.description,
          tag: 'NEW WEAPON!',
          tagColor: NEW_GREEN,
          apply() {
            game.weapons.addWeapon(id);
          },
        });
      } else if (!owned.isMaxLevel) {
        // levels[] is 0-indexed, so the entry for the NEXT level is
        // levels[owned.level]; its upgradeText says what improves.
        pool.push({
          name: def.name,
          description: def.levels[owned.level].upgradeText,
          tag: `LV ${owned.level} > ${owned.level + 1}`,
          tagColor: TEXT_DIM,
          apply() {
            owned.levelUp();
          },
        });
      }
    }

    // Passive items: same pattern, tracked in game.passives.
    for (const id of Object.keys(PASSIVE_DEFS)) {
      const def = PASSIVE_DEFS[id];
      const level = game.passives[id] || 0;
      if (level >= def.maxLevel) continue;

      pool.push({
        name: def.name,
        description: def.description,
        tag: level === 0 ? 'NEW PASSIVE!' : `LV ${level} > ${level + 1}`,
        tagColor: level === 0 ? NEW_GREEN : TEXT_DIM,
        apply() {
          def.apply(game);
          game.passives[id] = level + 1;
        },
      });
    }

    return pool;
  }

  /** Pick up to 3 random cards; fall back to heal/XP if all maxed. */
  rollChoices(game) {
    let pool = this.buildChoicePool(game);

    if (pool.length === 0) {
      pool = FALLBACK_CHOICES.map((choice) => ({
        name: choice.name,
        description: choice.description,
        tag: 'BONUS',
        tagColor: TEXT_DIM,
        apply: () => choice.apply(game),
      }));
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    this.choices = shuffled.slice(0, 3);
    this.selectedIndex = 0;
    this.time = 0;
  }

  /** True if there was nothing to offer at all. */
  isEmpty() {
    return this.choices.length === 0;
  }

  choose(game, index) {
    const choice = this.choices[index];
    if (!choice) return;

    choice.apply();
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

    this.choices.forEach((choice, index) => {
      const x = startX + index * (CARD_W + CARD_GAP);
      this.cardRects.push({ x, y, w: CARD_W, h: CARD_H });
      this.renderCard(ctx, choice, index, x, y);
    });

    drawPixelText(ctx, 'CLICK A CARD OR PRESS 1 2 3', GAME_WIDTH / 2, y + CARD_H + 70, {
      scale: 4,
      color: TEXT_DIM,
      align: 'center',
    });
  }

  renderCard(ctx, choice, index, x, y) {
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

    // Name, effect, and progress tag.
    drawPixelText(ctx, choice.name, centerX, y + 90, {
      scale: 5,
      color: GOLD,
      shadeColor: GOLD_DARK,
      outline: OUTLINE,
      align: 'center',
    });
    drawPixelText(ctx, choice.description, centerX, y + 190, {
      scale: 4,
      color: '#e8ecf4',
      align: 'center',
    });
    drawPixelText(ctx, choice.tag, centerX, y + 290, {
      scale: 4,
      color: choice.tagColor,
      align: 'center',
    });
  }
}
