// The game menu: title screen, how-to-play screen, and pause menu.
// Everything is drawn in a chunky pixel style with the PixelFont —
// no smooth browser fonts anywhere.

import { drawPixelText, measurePixelText } from '../assets/PixelFont.js';
import { getSprite } from '../assets/ProceduralSprites.js';
import { randomRange, formatTime } from '../core/MathUtils.js';
import { drawCenteredSprite } from '../core/DrawUtils.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { SHOP_UPGRADES, upgradeCost } from '../config/ShopUpgrades.js';
import { persistSave, resetSave } from '../core/SaveData.js';

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
    if (game.state === 'gameover') {
      return [
        { label: 'RESTART', action: () => game.startRun() },
        {
          label: 'UPGRADE SHOP',
          action: () => {
            game.state = 'menu';
            this.screen = 'shop';
            this.selectedIndex = 0;
          },
        },
        {
          label: 'MAIN MENU',
          action: () => {
            game.state = 'menu';
            this.screen = 'title';
          },
        },
      ];
    }
    if (this.screen === 'howto') {
      return [{ label: 'BACK', action: () => (this.screen = 'title') }];
    }
    return [
      { label: 'START GAME', action: () => game.startRun() },
      { label: 'UPGRADE SHOP', action: () => { this.screen = 'shop'; this.selectedIndex = 0; } },
      { label: 'HOW TO PLAY', action: () => (this.screen = 'howto') },
    ];
  }

  update(deltaTime, game) {
    this.time += deltaTime;
    const input = game.input;

    // The shop has its own row-based input handling.
    if (this.screen === 'shop' && game.state === 'menu') {
      this.updateShop(input, game);
      return;
    }

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

    // Quick restart from the game-over screen.
    if (game.state === 'gameover' && input.wasPressed('KeyR')) {
      game.startRun();
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

  // --- Shop input + purchase logic ---------------------------------------

  /** Shop rows are the upgrades, then BACK and RESET SAVE. */
  updateShop(input, game) {
    const rowCount = SHOP_UPGRADES.length + 2;
    const backIndex = SHOP_UPGRADES.length;
    const resetIndex = SHOP_UPGRADES.length + 1;

    if (input.wasPressed('ArrowDown') || input.wasPressed('KeyS')) {
      this.selectedIndex = (this.selectedIndex + 1) % rowCount;
    }
    if (input.wasPressed('ArrowUp') || input.wasPressed('KeyW')) {
      this.selectedIndex = (this.selectedIndex + rowCount - 1) % rowCount;
    }

    // Mouse hover + click on any row.
    let hovering = false;
    this.buttonRects.forEach((rect, index) => {
      const over =
        input.mouseX >= rect.x && input.mouseX <= rect.x + rect.w &&
        input.mouseY >= rect.y && input.mouseY <= rect.y + rect.h;
      if (over) {
        hovering = true;
        this.selectedIndex = index;
      }
    });
    game.canvas.style.cursor = hovering ? 'pointer' : 'default';

    const activate =
      input.wasPressed('Enter') || input.wasPressed('Space') ||
      (hovering && input.clickedThisFrame);

    if (activate) {
      if (this.selectedIndex === backIndex) {
        this.screen = 'title';
        this.selectedIndex = 0;
      } else if (this.selectedIndex === resetIndex) {
        game.save = resetSave();
      } else {
        this.buyShopUpgrade(game, SHOP_UPGRADES[this.selectedIndex]);
      }
    }

    if (input.wasPressed('Escape')) {
      this.screen = 'title';
      this.selectedIndex = 0;
    }
  }

  buyShopUpgrade(game, def) {
    const level = game.save.shop[def.id] || 0;
    if (level >= def.maxLevel) return;

    const cost = upgradeCost(def, level);
    if (game.save.totalCoins < cost) return;

    game.save.totalCoins -= cost;
    game.save.shop[def.id] = level + 1;
    persistSave(game.save);
  }

  render(game) {
    const ctx = game.ctx;

    if (game.state === 'paused') {
      this.renderPauseOverlay(ctx, game);
      return;
    }

    if (game.state === 'gameover') {
      this.renderGameOver(ctx, game);
      return;
    }

    this.renderCritters(ctx);

    if (this.screen === 'howto') {
      this.renderHowTo(ctx, game);
    } else if (this.screen === 'shop') {
      this.renderShop(ctx, game);
    } else {
      this.renderTitle(ctx, game);
    }
  }

  // --- Shop rendering ------------------------------------------------------

  renderShop(ctx, game) {
    const panelW = 1400;
    const panelH = 800;
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = 100;

    // Panel with the same double border as the how-to screen.
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(panelX - U * 2, panelY - U * 2, panelW + U * 4, panelH + U * 4);
    ctx.fillStyle = GOLD_DARK;
    ctx.fillRect(panelX - U, panelY - U, panelW + U * 2, panelH + U * 2);
    ctx.fillStyle = '#1b1d28';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    drawPixelText(ctx, 'UPGRADE SHOP', GAME_WIDTH / 2, panelY + 34, {
      scale: 8,
      color: GOLD,
      shadeColor: GOLD_DARK,
      outline: OUTLINE,
      align: 'center',
    });
    const coinLabel = `CINDERS ${game.save.totalCoins}`;
    drawPixelText(
      ctx, coinLabel,
      panelX + panelW - 40 - measurePixelText(coinLabel, 4), panelY + 44,
      { scale: 4, color: GOLD, outline: OUTLINE }
    );

    this.buttonRects = [];

    // One row per permanent upgrade.
    SHOP_UPGRADES.forEach((def, index) => {
      const rowY = panelY + 140 + index * 82;
      const rowRect = { x: panelX + 30, y: rowY - 12, w: panelW - 60, h: 74 };
      this.buttonRects.push(rowRect);

      if (index === this.selectedIndex) {
        ctx.fillStyle = GOLD;
        ctx.fillRect(rowRect.x - U, rowRect.y - U, rowRect.w + U * 2, rowRect.h + U * 2);
        ctx.fillStyle = '#252838';
        ctx.fillRect(rowRect.x, rowRect.y, rowRect.w, rowRect.h);
      }

      const level = game.save.shop[def.id] || 0;
      drawPixelText(ctx, def.name, rowRect.x + 24, rowY, {
        scale: 4,
        color: '#e8ecf4',
        outline: OUTLINE,
      });
      drawPixelText(ctx, def.description, rowRect.x + 24, rowY + 40, {
        scale: 3,
        color: TEXT_DIM,
      });

      drawPixelText(ctx, `LV ${level}/${def.maxLevel}`, rowRect.x + 890, rowY + 12, {
        scale: 4,
        color: level > 0 ? GOLD : TEXT_DIM,
      });

      if (level >= def.maxLevel) {
        drawPixelText(ctx, 'MAX', rowRect.x + 1140, rowY + 12, { scale: 4, color: GOLD });
      } else {
        const cost = upgradeCost(def, level);
        const affordable = game.save.totalCoins >= cost;
        drawPixelText(ctx, `COST ${cost}`, rowRect.x + 1100, rowY + 12, {
          scale: 4,
          color: affordable ? '#5cd65c' : '#e04040',
        });
      }
    });

    // BACK and RESET SAVE at the bottom of the panel.
    const bottomY = panelY + panelH - 90;
    const backRect = { x: panelX + 220, y: bottomY, w: 360, h: 62 };
    const resetRect = { x: panelX + panelW - 580, y: bottomY, w: 360, h: 62 };
    this.buttonRects.push(backRect, resetRect);

    this.drawShopButton(ctx, backRect, 'BACK', this.selectedIndex === SHOP_UPGRADES.length, false);
    this.drawShopButton(
      ctx, resetRect, 'RESET SAVE',
      this.selectedIndex === SHOP_UPGRADES.length + 1, true
    );

    drawPixelText(ctx, 'ARROWS + ENTER, OR CLICK TO BUY', GAME_WIDTH / 2, panelY + panelH + 30, {
      scale: 3,
      color: TEXT_DIM,
      align: 'center',
    });
  }

  drawShopButton(ctx, rect, label, selected, danger) {
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(rect.x - U, rect.y - U, rect.w + U * 2, rect.h + U * 2);
    ctx.fillStyle = selected ? (danger ? '#e04040' : GOLD) : BUTTON_FACE;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    drawPixelText(ctx, label, rect.x + rect.w / 2, rect.y + 14, {
      scale: 4,
      color: selected ? OUTLINE : danger ? '#e04040' : '#e8ecf4',
      align: 'center',
    });
  }

  renderTitle(ctx, game) {
    // The logo floats gently, like an old arcade attract screen.
    const bob = Math.round(Math.sin(this.time * 1.6) * 3) * 4;

    drawPixelText(ctx, 'EMBER', GAME_WIDTH / 2, 150 + bob, {
      scale: 22,
      color: GOLD,
      shadeColor: GOLD_DARK,
      outline: OUTLINE,
      align: 'center',
    });
    drawPixelText(ctx, 'WAKE', GAME_WIDTH / 2, 330 + bob, {
      scale: 20,
      color: '#ff8a4c',
      shadeColor: '#b8531f',
      outline: OUTLINE,
      align: 'center',
    });

    // Tagline under the logo.
    drawPixelText(ctx, 'HOLD THE LAST LIGHT', GAME_WIDTH / 2, 500, {
      scale: 4,
      color: TEXT_DIM,
      align: 'center',
    });

    this.renderButtons(ctx, game, 580);

    // Blinking hint, arcade style.
    if (Math.floor(this.time * 1.4) % 2 === 0) {
      drawPixelText(ctx, 'PRESS ENTER OR CLICK A BUTTON', GAME_WIDTH / 2, 990, {
        scale: 4,
        color: TEXT_DIM,
        align: 'center',
      });
    }

    // Lifetime cinder purse, spendable in the shop.
    drawPixelText(ctx, `CINDERS ${game.save.totalCoins}`, 36, GAME_HEIGHT - 60, {
      scale: 4,
      color: GOLD,
      outline: OUTLINE,
    });
    drawPixelText(ctx, 'V0.5', GAME_WIDTH - 120, GAME_HEIGHT - 60, { scale: 4, color: TEXT_DIM });
  }

  renderHowTo(ctx, game) {
    // Panel with a double pixel border.
    const panelW = 1240;
    const panelH = 850;
    const panelX = (GAME_WIDTH - panelW) / 2;
    const panelY = 80;

    ctx.fillStyle = OUTLINE;
    ctx.fillRect(panelX - U * 2, panelY - U * 2, panelW + U * 4, panelH + U * 4);
    ctx.fillStyle = GOLD_DARK;
    ctx.fillRect(panelX - U, panelY - U, panelW + U * 2, panelH + U * 2);
    ctx.fillStyle = '#1b1d28';
    ctx.fillRect(panelX, panelY, panelW, panelH);

    drawPixelText(ctx, 'THE LAMPWRIGHT', GAME_WIDTH / 2, panelY + 34, {
      scale: 7,
      color: GOLD,
      shadeColor: GOLD_DARK,
      outline: OUTLINE,
      align: 'center',
    });

    // The story premise, then the rules.
    const story = [
      'THE WORLD RUNS ON LIGHT. THE LAST BEACON HAS GUTTERED,',
      'AND THE GLOAM POURS FROM THE DARK TO SNUFF WHAT REMAINS.',
      'YOU ARE THE FINAL LAMPWRIGHT. HOLD THE LIGHT.',
    ];
    story.forEach((line, i) => {
      drawPixelText(ctx, line, GAME_WIDTH / 2, panelY + 130 + i * 40, {
        scale: 2,
        color: TEXT_DIM,
        align: 'center',
      });
    });

    const lines = [
      'MOVE WITH WASD OR THE ARROW KEYS',
      'YOUR LIGHT FIGHTS FOR YOU - GATHER MOTES TO LEVEL UP',
      'THE NIGHTMAW COMES EVERY 2 MINUTES - IT DROPS A CHEST',
    ];
    lines.forEach((line, i) => {
      drawPixelText(ctx, line, GAME_WIDTH / 2, panelY + 280 + i * 50, {
        scale: 3,
        color: '#d8dce8',
        align: 'center',
      });
    });

    // Evolution recipes: max the weapon, own the item, open a chest.
    drawPixelText(ctx, 'LIGHT EVOLUTIONS', GAME_WIDTH / 2, panelY + 460, {
      scale: 5,
      color: '#ff8a4c',
      shadeColor: '#b8531f',
      outline: OUTLINE,
      align: 'center',
    });
    drawPixelText(ctx, 'MAX A WEAPON + OWN ITS ITEM, THEN OPEN A CHEST', GAME_WIDTH / 2, panelY + 528, {
      scale: 3,
      color: TEXT_DIM,
      align: 'center',
    });

    const recipes = [
      'EMBERSHOT   +  BELLOWS   = CINDERSTORM',
      'WARDBLADES  +  SUNSTONE  = DAWNBLADES',
      'SUNBURST    +  EVERFLAME = AURORA',
      'STARFALL    +  WISHING EMBER = STARSTORM',
    ];
    recipes.forEach((line, i) => {
      drawPixelText(ctx, line, GAME_WIDTH / 2, panelY + 578 + i * 46, {
        scale: 3,
        color: '#d8dce8',
        align: 'center',
      });
    });

    this.renderButtons(ctx, game, panelY + panelH - 100);
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

  renderGameOver(ctx, game) {
    // Dark red-tinted overlay above the frozen battlefield.
    ctx.fillStyle = 'rgba(24, 8, 12, 0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawPixelText(ctx, 'THE LIGHT FADES', GAME_WIDTH / 2, 70, {
      scale: 9,
      color: '#e04040',
      shadeColor: '#7e2020',
      outline: OUTLINE,
      align: 'center',
    });

    // The run summary.
    const evolutions = game.weapons.owned.filter((w) => w.def.evolved).length;
    const stats = [
      ['TIME SURVIVED', formatTime(game.survivalTime)],
      ['LIGHT LEVEL', String(game.player.level)],
      ['GLOAM SLAIN', String(game.killCount)],
      ['NIGHTMAWS FELLED', String(game.bossesKilled)],
      ['EVOLUTIONS', String(evolutions)],
      ['CINDERS EARNED', String(game.coins)],
      ['TOTAL CINDERS', String(game.save.totalCoins)],
    ];
    stats.forEach(([label, value], i) => {
      const y = 195 + i * 45;
      drawPixelText(ctx, label, GAME_WIDTH / 2 - 60 - measurePixelText(label, 4), y, {
        scale: 4,
        color: TEXT_DIM,
      });
      drawPixelText(ctx, value, GAME_WIDTH / 2 + 60, y, {
        scale: 4,
        color: i >= 5 ? GOLD : '#e8ecf4', // coin rows glow gold
        outline: OUTLINE,
      });
    });

    // Weapons carried, evolved ones marked.
    const loadout = game.weapons.owned
      .map((w) => (w.def.evolved ? `${w.def.short} EVO` : `${w.def.short} ${w.level}`))
      .join('  ');
    drawPixelText(ctx, `WEAPONS  ${loadout}`, GAME_WIDTH / 2, 530, {
      scale: 3,
      color: '#c9cede',
      align: 'center',
    });

    this.renderButtons(ctx, game, 600);

    if (Math.floor(this.time * 1.4) % 2 === 0) {
      drawPixelText(ctx, 'PRESS R TO RESTART', GAME_WIDTH / 2, 1000, {
        scale: 3,
        color: TEXT_DIM,
        align: 'center',
      });
    }
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
      const isBat = critter.type === 'bat';
      const bob = isBat ? Math.sin(critter.phase * 6) * 12 : 0;

      drawCenteredSprite(ctx, getSprite(critter.type), critter.x, critter.y + bob, {
        flipX: critter.speed < 0,
        scaleY: isBat ? 1 : 1 + Math.sin(critter.phase * 6) * 0.05,
      });
    }
  }
}
