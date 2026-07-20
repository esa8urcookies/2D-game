// Passive item definitions: pure data, no behavior.
//
// Passives are the player's "equipment": unlike weapons they don't
// attack, they improve the player or every weapon at once. Each can
// be leveled 1 to 5; apply() runs once per level taken.
//
// Owned passives and their levels live in game.passives (id -> level).

export const PASSIVE_DEFS = {
  spellbook: {
    name: 'BELLOWS',
    short: 'BELLOW',
    color: '#b388ff',
    description: 'STOKE WEAPONS: COOLDOWNS -8%',
    maxLevel: 5,
    apply(game) {
      game.stats.cooldownMultiplier *= 0.92;
    },
  },
  powerStone: {
    name: 'SUNSTONE',
    short: 'SUN',
    color: '#ff8a65',
    description: 'ALL DAMAGE +10%',
    maxLevel: 5,
    apply(game) {
      game.stats.damageMultiplier += 0.1;
    },
  },
  windBoots: {
    name: 'EMBERSTEP',
    short: 'STEP',
    color: '#80deea',
    description: '+8% MOVE SPEED',
    maxLevel: 5,
    apply(game) {
      game.stats.moveSpeedMultiplier += 0.08;
    },
  },
  magnetCharm: {
    name: 'LODESTAR',
    short: 'LODE',
    color: '#4fc3f7',
    description: '+60 MOTE PICKUP RANGE',
    maxLevel: 5,
    apply(game) {
      game.stats.magnetRadius += 60;
    },
  },
  ironHeart: {
    name: 'EVERFLAME',
    short: 'FLAME',
    color: '#ef5350',
    description: '+25 MAX HP, HEAL 25',
    maxLevel: 5,
    apply(game) {
      game.player.maxHealth += 25;
      game.player.health = Math.min(game.player.maxHealth, game.player.health + 25);
    },
  },
  cloverCoin: {
    name: 'WISHING EMBER',
    short: 'WISH',
    color: '#9ccc65',
    description: 'MORE CHEST LUCK',
    maxLevel: 5,
    apply(game) {
      // Stored now, used by the chest system later.
      game.stats.luck += 1;
    },
  },
};

// Fallback cards, offered only when every weapon and passive is
// already maxed out, so a level-up is never wasted.
export const FALLBACK_CHOICES = [
  {
    name: 'MENDING LIGHT',
    description: 'RESTORE 50 HP',
    apply(game) {
      game.player.health = Math.min(game.player.maxHealth, game.player.health + 50);
    },
  },
  {
    name: 'GATHERED MOTES',
    description: 'GAIN 25 XP',
    apply(game) {
      game.gainXP(25);
    },
  },
];
