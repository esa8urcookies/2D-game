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
import { audio } from '../core/Audio.js';
import { PASSIVE_DEFS } from '../config/Passives.js';
import { GAME_WIDTH, GAME_HEIGHT, CHEST_CONFIG, EFFECTS_CONFIG } from '../config/GameConfig.js';

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

  /**
   * A weapon is ready to evolve if it is max level, hasn't evolved
   * yet, and the player owns its required passive.
   */
  findEvolutionCandidates(game) {
    return game.weapons.owned.filter(
      (weapon) =>
        weapon.def.evolvesInto &&
        weapon.isMaxLevel &&
        (game.passives[weapon.def.evolutionRequires] || 0) > 0
    );
  }

  /** Decide and immediately apply what's inside. */
  rollReward(game) {
    // Evolutions trump everything — one per chest, random if several
    // weapons are ready at once.
    const ready = this.findEvolutionCandidates(game);
    if (ready.length > 0) {
      const weapon = ready[Math.floor(Math.random() * ready.length)];
      const evolved = game.weapons.evolveWeapon(weapon);
      return {
        title: evolved.def.name,
        subtitle: 'A NEW POWER AWAKENS',
        isEvolution: true,
      };
    }

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
      return { title: 'MENDING LIGHT', subtitle: `+${CHEST_CONFIG.healAmount} HP` };
    }

    game.coins += CHEST_CONFIG.coinAmount;
    return { title: 'CINDER HOARD', subtitle: `+${CHEST_CONFIG.coinAmount} CINDERS` };
  }

  update(deltaTime, game) {
    this.timer += deltaTime;

    if (this.phase === 'shake' && this.timer >= SHAKE_SECONDS) {
      this.reward = this.rollReward(game);
      this.phase = 'burst';
      this.timer = 0;

      // The payoff moment: sound + a bounded screen shake, bigger for
      // an evolution.
      if (this.reward.isEvolution) {
        audio.play('evolve');
        const { intensity, duration } = EFFECTS_CONFIG.evolveShake;
        game.camera.shake(intensity, duration);
      } else {
        audio.play('chestOpen');
        const { intensity, duration } = EFFECTS_CONFIG.chestShake;
        game.camera.shake(intensity, duration);
      }
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

    const isEvolution = this.reward?.isEvolution;

    if (this.phase === 'burst') {
      // A flash of light rays exploding outward — bigger and purple
      // when a weapon is evolving. The dark overlay hides the world's
      // camera shake, so the burst shakes itself for the same punch.
      const progress = this.timer / BURST_SECONDS;
      const rayCount = isEvolution ? 20 : 12;
      const shakeAmt = (isEvolution ? 16 : 8) * (1 - progress);
      const sx = centerX + (Math.random() * 2 - 1) * shakeAmt;
      const sy = centerY + (Math.random() * 2 - 1) * shakeAmt;

      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = isEvolution ? '#d1b3ff' : '#fff3c2';
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const length = 120 + progress * (isEvolution ? 1100 : 700);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(angle);
        ctx.fillRect(0, -14, length, 28);
        ctx.restore();
      }
      ctx.restore();

      this.drawChest(ctx, sx, sy, true);
      return;
    }

    // Reward phase.
    this.drawChest(ctx, centerX, centerY + 130, true);

    if (isEvolution) {
      // The big moment: pulsing purple headline.
      const pulse = 1 + Math.sin(this.timer * 6) * 0.04;
      drawPixelText(ctx, 'WEAPON EVOLVED!', centerX, 220, {
        scale: Math.round(10 * pulse),
        color: '#b388ff',
        shadeColor: '#6a3ab2',
        outline: OUTLINE,
        align: 'center',
      });
    } else {
      drawPixelText(ctx, 'TREASURE!', centerX, 240, {
        scale: 12,
        color: GOLD,
        shadeColor: GOLD_DARK,
        outline: OUTLINE,
        align: 'center',
      });
    }

    drawPixelText(ctx, this.reward.title, centerX, 430, {
      scale: isEvolution ? 8 : 7,
      color: isEvolution ? GOLD : '#e8ecf4',
      shadeColor: isEvolution ? GOLD_DARK : '#9aa3b8',
      outline: OUTLINE,
      align: 'center',
    });
    drawPixelText(ctx, this.reward.subtitle, centerX, 540, {
      scale: 5,
      color: isEvolution ? '#d1b3ff' : GOLD,
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
