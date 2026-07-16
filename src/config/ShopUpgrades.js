// Permanent upgrades, bought with coins between runs.
// Levels are stored in the save file (SaveData.js) and applied once
// at the start of every run — pure data plus one apply() each.
//
//   baseCost / costGrowth  cost = round(baseCost * costGrowth^level)
//   apply(game, level)     applies the TOTAL effect for that level

export const SHOP_UPGRADES = [
  {
    id: 'vitality',
    name: 'TOUGH HEART',
    description: '+5 MAX HP PER LEVEL',
    maxLevel: 10,
    baseCost: 10,
    costGrowth: 1.5,
    apply(game, level) {
      game.player.maxHealth += 5 * level;
      game.player.health = game.player.maxHealth;
    },
  },
  {
    id: 'might',
    name: 'ANCIENT MIGHT',
    description: '+5% DAMAGE PER LEVEL',
    maxLevel: 10,
    baseCost: 15,
    costGrowth: 1.5,
    apply(game, level) {
      game.stats.damageMultiplier += 0.05 * level;
    },
  },
  {
    id: 'swiftness',
    name: 'SWIFT SOUL',
    description: '+3% MOVE SPEED PER LEVEL',
    maxLevel: 10,
    baseCost: 12,
    costGrowth: 1.5,
    apply(game, level) {
      game.stats.moveSpeedMultiplier += 0.03 * level;
    },
  },
  {
    id: 'wisdom',
    name: 'OLD WISDOM',
    description: '+5% XP GAIN PER LEVEL',
    maxLevel: 10,
    baseCost: 12,
    costGrowth: 1.5,
    apply(game, level) {
      game.stats.xpMultiplier += 0.05 * level;
    },
  },
  {
    id: 'reach',
    name: 'LONG REACH',
    description: '+5% PICKUP RANGE PER LEVEL',
    maxLevel: 10,
    baseCost: 10,
    costGrowth: 1.5,
    apply(game, level) {
      game.stats.magnetRadius *= 1 + 0.05 * level;
    },
  },
  {
    id: 'wealth',
    name: 'LUCKY PURSE',
    description: '+10 STARTING COINS PER LEVEL',
    maxLevel: 5,
    baseCost: 25,
    costGrowth: 1.6,
    apply(game, level) {
      game.coins += 10 * level;
    },
  },
];

/** Coin price of the NEXT level of an upgrade. */
export function upgradeCost(def, currentLevel) {
  return Math.round(def.baseCost * Math.pow(def.costGrowth, currentLevel));
}
