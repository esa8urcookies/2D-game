// The chest-opening ceremony: shake, light burst, reward reveal.
// The game pauses in the 'chest' state while this plays out.
//
// Rewards (weighted in CHEST_CONFIG, boosted by Clover Coin luck):
//   - level up a random owned, non-maxed weapon
//   - level up a random owned, non-maxed passive
//   - coins
//   - a big heal
// Maxed-out gear never gets picked; if nothing can be upgraded, the
// chest falls back to coins or healing.

import { getChestSprite } from '../entities/Chest.js';
import { drawPixelText } from '../assets/PixelFont.js';
import { PASSIVE_DEFS } from '../config/Passives.js';
import { GAME_WIDTH, GAME_HEIGHT, CHEST_CONFIG } from '../config/GameConfig.js';

const GOLD = '#ffd54f';
const GOLD_DARK = '#c8891a';
const OUTLINE = '#16161f';
const TEXT_DIM = '#8a90a3';

const SHAKE_SECONDS = 1.2;
const BURST_SECONDS = 0.4;

export class ChestSystem {
  constructor() {
    this.phase = 'idle'; // 'shake' -> 'burst' -> 'reward'
    this.timer = 0;
    this.reward = null;
  }

  /** Called by the Game when the player touches a chest. */
  open(game) {
    this.phase = 'shake';
    this.timer = 0;
    this.reward = null;
    game.state = 'chest';
  }

  /** Decide and immediately apply what's inside. */
  rollReward(game) {
    const luckBonus = game.stats.luck * CHEST_CONFIG.luckBonusPerLevel;

    // Owned gear that can still level up.
    const weapons = game.weapons.owned.filter((weapon) => !weapon.isMaxLevel);
    const passives = Object.entries(game.passives).filter(
      ([id, level]) => level < PASSIVE_DEFS[id].maxLevel
    );

    // Weighted pick among the options that are actually possible.
    const options = [];
    if (weapons.length > 0) {
      options.push({ kind: 'weapon', weight: CHEST_CONFIG.weaponUpgradeWeight + luckBonus });
    }
    if (passives.length > 0) {
      options.push({ kind: 'passive', weight: CHEST_CONFIG.passiveUpgradeWeight + luckBonus });
    }
    options.push({ kind: 'coins', weight: CHEST_CONFIG.coinWeight });
    options.push({ kind: 'heal', weight: CHEST_CONFIG.healWeight });

    const total = options.reduce((sum, option) => sum + option.weight, 0);
    let roll = Math.random() * total;
    let kind = options[0].kind;
    for (const option of options) {
      roll -= option.weight;
      if (roll <= 0) {
        kind = option.kind;
        break;
      }
    }

    if (kind === 'weapon') {
      const weapon = weapons[Math.floor(Math.random() * weapons.length)];
      weapon.levelUp();
      return { title: weapon.def.name, subtitle: `NOW LEVEL ${weapon.level}!` };
    }

    if (kind === 'passive') {
      const [id, level] = passives[Math.floor(Math.random() * passives.length)];
      PASSIVE_DEFS[id].apply(game);
      game.passives[id] = level + 1;
      return { title: PASSIVE_DEFS[id].name, subtitle: `NOW LEVEL ${level + 1}!` };
    }

    if (kind === 'heal') {
      game.player.health = Math.min(
        game.player.maxHealth,
        game.player.health + CHEST_CONFIG.healAmount
      );
      return { title: 'HEALING LIGHT', subtitle: `+${CHEST_CONFIG.healAmount} HP` };
    }

    game.coins += CHEST_CONFIG.coinAmount;
    return { title: 'GOLD COINS', subtitle: `+${CHEST_CONFIG.coinAmount} COINS` };
  }

  update(deltaTime, game) {
    this.timer += deltaTime;

    if (this.phase === 'shake' && this.timer >= SHAKE_SECONDS) {
      this.reward = this.rollReward(game);
      this.phase = 'burst';
      this.timer = 0;
    } else if (this.phase === 'burst' && this.timer >= BURST_SECONDS) {
      this.phase = 'reward';
      this.timer = 0;
    } else if (this.phase === 'reward') {
      const input = game.input;
      if (
        input.wasPressed('Space') ||
        input.wasPressed('Enter') ||
        input.clickedThisFrame
      ) {
        this.phase = 'idle';
        game.state = 'playing';
      }
    }
  }

  render(game) {
    const ctx = game.ctx;
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    ctx.fillStyle = 'rgba(10, 12, 20, 0.78)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (this.phase === 'shake') {
      // Shaking harder and harder until it bursts.
      const intensity = 3 + (this.timer / SHAKE_SECONDS) * 14;
      const shakeX = (Math.random() * 2 - 1) * intensity;
      const shakeY = (Math.random() * 2 - 1) * intensity * 0.5;

      this.drawChest(ctx, centerX + shakeX, centerY + shakeY, false);
      return;
    }

    if (this.phase === 'burst') {
      // A flash of light rays exploding outward.
      const progress = this.timer / BURST_SECONDS;

      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = '#fff3c2';
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const length = 120 + progress * 700;
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        ctx.fillRect(0, -14, length, 28);
        ctx.restore();
      }
      ctx.restore();

      this.drawChest(ctx, centerX, centerY, true);
      return;
    }

    // Reward phase.
    this.drawChest(ctx, centerX, centerY + 130, true);

    drawPixelText(ctx, 'TREASURE!', centerX, 240, {
      scale: 12,
      color: GOLD,
      shadeColor: GOLD_DARK,
      outline: OUTLINE,
      align: 'center',
    });
    drawPixelText(ctx, this.reward.title, centerX, 430, {
      scale: 7,
      color: '#e8ecf4',
      shadeColor: '#9aa3b8',
      outline: OUTLINE,
      align: 'center',
    });
    drawPixelText(ctx, this.reward.subtitle, centerX, 530, {
      scale: 5,
      color: GOLD,
      outline: OUTLINE,
      align: 'center',
    });

    if (Math.floor(this.timer * 1.6) % 2 === 0) {
      drawPixelText(ctx, 'PRESS SPACE OR CLICK TO CONTINUE', centerX, 900, {
        scale: 4,
        color: TEXT_DIM,
        align: 'center',
      });
    }
  }

  /** The chest drawn double size, crisp. */
  drawChest(ctx, x, y, open) {
    const sprite = getChestSprite(open);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, x - sprite.width, y - sprite.height, sprite.width * 2, sprite.height * 2);
    ctx.restore();
  }
}
