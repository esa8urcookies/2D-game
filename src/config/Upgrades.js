// Passive (non-weapon) upgrades for level-ups.
//
// Weapon damage/speed upgrades live in each weapon's level table
// (config/Weapons.js); this pool is for everything about the player
// themselves. The level-up screen mixes both pools automatically.
//
//   id          unique key (used to track how many times it's taken)
//   name        card title (pixel font, keep it short)
//   description one line explaining the effect
//   maxLevel    how many times it can be taken (Infinity = no cap)
//   isUseful    optional: hide the card when it would do nothing
//   apply       changes the live game state

export const UPGRADES = [
  {
    id: 'moveSpeed',
    name: 'FLEET FEET',
    description: '+10% MOVE SPEED',
    maxLevel: 5,
    apply(game) {
      game.player.moveSpeed *= 1.1;
    },
  },
  {
    id: 'maxHealth',
    name: 'IRON BODY',
    description: '+25 MAX HP, HEAL 25',
    maxLevel: 5,
    apply(game) {
      game.player.maxHealth += 25;
      game.player.health = Math.min(game.player.maxHealth, game.player.health + 25);
    },
  },
  {
    id: 'heal',
    name: 'FIRST AID',
    description: 'RESTORE 30 HP',
    maxLevel: Infinity, // always available when hurt
    isUseful(game) {
      return game.player.health < game.player.maxHealth;
    },
    apply(game) {
      game.player.health = Math.min(game.player.maxHealth, game.player.health + 30);
    },
  },
  {
    id: 'magnet',
    name: 'GEM MAGNET',
    description: '+60 PICKUP RANGE',
    maxLevel: 5,
    apply(game) {
      game.stats.magnetRadius += 60;
    },
  },
];
