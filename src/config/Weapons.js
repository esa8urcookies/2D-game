// Weapon definitions: pure data, no behavior.
//
// Each weapon has 8 levels. levels[0] is the weapon as first picked
// up; each later entry lists the full stats at that level plus an
// upgradeText describing what improved (shown on the level-up card).
//
// EVOLUTIONS: a base weapon evolves when it is max level, the player
// owns `evolutionRequires`, and a treasure chest is opened. The
// evolved form is itself just another weapon def below (marked
// `evolved: true`, single level) using the same behavior class —
// adding an evolution is pure data.
//
// The matching behavior classes live in src/weapons/.

export const WEAPON_DEFS = {
  arcaneBolt: {
    name: 'EMBERSHOT',
    short: 'EMBER',
    color: '#ffd54f',
    description: 'HURLS EMBERS AT THE NEAREST FOE',
    maxLevel: 8,
    evolvesInto: 'arcaneStorm',
    evolutionRequires: 'spellbook',
    levels: [
      { damage: 10, cooldown: 0.6, speed: 950, pierce: 0 },
      { damage: 15, cooldown: 0.6, speed: 950, pierce: 0, upgradeText: '+5 DAMAGE' },
      { damage: 15, cooldown: 0.5, speed: 950, pierce: 0, upgradeText: 'FIRE FASTER' },
      { damage: 20, cooldown: 0.5, speed: 1050, pierce: 1, upgradeText: '+1 PIERCE' },
      { damage: 25, cooldown: 0.45, speed: 1050, pierce: 1, upgradeText: '+5 DAMAGE' },
      { damage: 25, cooldown: 0.4, speed: 1150, pierce: 1, upgradeText: 'FIRE FASTER' },
      { damage: 32, cooldown: 0.35, speed: 1150, pierce: 2, upgradeText: '+1 PIERCE' },
      { damage: 40, cooldown: 0.3, speed: 1300, pierce: 2, upgradeText: '+8 DAMAGE' },
    ],
  },

  orbitingBlade: {
    name: 'WARDBLADES',
    short: 'WARD',
    color: '#c6cdd8',
    description: 'BLADES OF LIGHT ORBIT YOU',
    maxLevel: 8,
    evolvesInto: 'celestialBlades',
    evolutionRequires: 'powerStone',
    levels: [
      { blades: 1, damage: 10, orbitSpeed: 2.2, orbitRadius: 170, size: 30 },
      { blades: 2, damage: 10, orbitSpeed: 2.2, orbitRadius: 170, size: 30, upgradeText: '+1 BLADE' },
      { blades: 2, damage: 16, orbitSpeed: 2.2, orbitRadius: 170, size: 30, upgradeText: '+6 DAMAGE' },
      { blades: 2, damage: 16, orbitSpeed: 2.8, orbitRadius: 180, size: 36, upgradeText: 'FASTER SPIN' },
      { blades: 3, damage: 16, orbitSpeed: 2.8, orbitRadius: 180, size: 36, upgradeText: '+1 BLADE' },
      { blades: 3, damage: 24, orbitSpeed: 2.8, orbitRadius: 180, size: 36, upgradeText: '+8 DAMAGE' },
      { blades: 3, damage: 24, orbitSpeed: 3.4, orbitRadius: 190, size: 42, upgradeText: 'BIGGER BLADES' },
      { blades: 4, damage: 32, orbitSpeed: 3.4, orbitRadius: 190, size: 42, upgradeText: '+1 BLADE' },
    ],
  },

  holyPulse: {
    name: 'SUNBURST',
    short: 'BURST',
    color: '#fff3c2',
    description: 'A BLAST OF LIGHT ALL AROUND',
    maxLevel: 8,
    evolvesInto: 'divineNova',
    evolutionRequires: 'ironHeart',
    levels: [
      { radius: 230, damage: 8, cooldown: 3.0 },
      { radius: 230, damage: 12, cooldown: 3.0, upgradeText: '+4 DAMAGE' },
      { radius: 290, damage: 12, cooldown: 3.0, upgradeText: 'BIGGER PULSE' },
      { radius: 290, damage: 12, cooldown: 2.5, upgradeText: 'PULSE FASTER' },
      { radius: 290, damage: 18, cooldown: 2.5, upgradeText: '+6 DAMAGE' },
      { radius: 350, damage: 18, cooldown: 2.5, upgradeText: 'BIGGER PULSE' },
      { radius: 350, damage: 18, cooldown: 2.0, upgradeText: 'PULSE FASTER' },
      { radius: 410, damage: 26, cooldown: 2.0, upgradeText: '+8 DAMAGE' },
    ],
  },

  lightningMark: {
    name: 'STARFALL',
    short: 'FALL',
    color: '#9be7ff',
    description: 'STARS STRIKE RANDOM FOES',
    maxLevel: 8,
    evolvesInto: 'thunderCrown',
    evolutionRequires: 'cloverCoin',
    levels: [
      { strikes: 1, damage: 20, cooldown: 2.2 },
      { strikes: 2, damage: 20, cooldown: 2.2, upgradeText: '+1 STRIKE' },
      { strikes: 2, damage: 28, cooldown: 2.2, upgradeText: '+8 DAMAGE' },
      { strikes: 2, damage: 28, cooldown: 1.8, upgradeText: 'STRIKE FASTER' },
      { strikes: 3, damage: 28, cooldown: 1.8, upgradeText: '+1 STRIKE' },
      { strikes: 3, damage: 36, cooldown: 1.8, upgradeText: '+8 DAMAGE' },
      { strikes: 3, damage: 36, cooldown: 1.4, upgradeText: 'STRIKE FASTER' },
      { strikes: 4, damage: 45, cooldown: 1.4, upgradeText: '+1 STRIKE' },
    ],
  },

  // --- Evolved forms ------------------------------------------------------
  // Single-level weapons that replace their base form via a chest.

  arcaneStorm: {
    name: 'CINDERSTORM',
    short: 'CINDER',
    color: '#b388ff',
    description: 'A TEMPEST OF EMBERS',
    maxLevel: 1,
    evolved: true,
    levels: [
      // Twin bolts, rapid fire, deep pierce, arcane visuals.
      { damage: 45, cooldown: 0.22, speed: 1450, pierce: 4, shots: 2, style: 'arcane' },
    ],
  },

  celestialBlades: {
    name: 'DAWNBLADES',
    short: 'DAWN',
    color: '#ffe082',
    description: 'A RING OF DAWN LIGHT',
    maxLevel: 1,
    evolved: true,
    levels: [
      { blades: 6, damage: 45, orbitSpeed: 4.2, orbitRadius: 215, size: 52 },
    ],
  },

  divineNova: {
    name: 'AURORA',
    short: 'AUROR',
    color: '#fff3c2',
    description: 'LIGHT THAT RESTORES',
    maxLevel: 1,
    evolved: true,
    levels: [
      // Huge pulse that heals 1 HP per enemy hit (up to 10).
      { radius: 500, damage: 35, cooldown: 1.7, healPerHit: 1, healCap: 10, visualSeconds: 0.8 },
    ],
  },

  thunderCrown: {
    name: 'STARSTORM',
    short: 'STORM',
    color: '#9be7ff',
    description: 'STARS THAT CHAIN FROM FOE TO FOE',
    maxLevel: 1,
    evolved: true,
    levels: [
      // Six strikes; each has a 50% chance to arc to a neighbor.
      { strikes: 6, damage: 50, cooldown: 1.1, chainChance: 0.5, chainRange: 280 },
    ],
  },
};
