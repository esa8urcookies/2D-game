// The upgrade pool for level-ups.
//
// Every upgrade is pure data plus one apply() function, so adding a
// new upgrade is just adding an entry here — the level-up screen,
// key handling, and level tracking all work automatically.
//
//   id          unique key (used to track how many times it's taken)
//   name        card title (pixel font, keep it short)
//   description one line explaining the effect
//   maxLevel    how many times it can be taken (Infinity = no cap)
//   isUseful    optional: hide the card when it would do nothing
//   apply       changes the live game state

export const UPGRADES = [
  {
    id: 'damage',
    name: 'POWER SHOT',
    description: '+5 WEAPON DAMAGE',
    maxLevel: 8,
    apply(game) {
      game.stats.damage += 5;
    },
  },
  {
    id: 'fireRate',
    name: 'RAPID FIRE',
    description: 'SHOOT 12% FASTER',
    maxLevel: 8,
    apply(game) {
      game.stats.fireInterval *= 0.88;
    },
  },
  {
    id: 'projectileSpeed',
    name: 'SWIFT BOLTS',
    description: '+20% PROJECTILE SPEED',
    maxLevel: 5,
    apply(game) {
      game.stats.projectileSpeed *= 1.2;
    },
  },
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
