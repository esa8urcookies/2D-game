// Weapon definitions: pure data, no behavior.
//
// Each weapon has 8 levels. levels[0] is the weapon as first picked
// up; each later entry lists the full stats at that level plus an
// upgradeText describing what improved (shown on the level-up card).
//
// The matching behavior classes live in src/weapons/. `evolvesInto`
// is reserved for the future evolution system — unused for now.

export const WEAPON_DEFS = {
  arcaneBolt: {
    name: 'ARCANE BOLT',
    short: 'BOLT',
    color: '#ffd54f',
    description: 'SHOOTS NEAREST FOE',
    maxLevel: 8,
    evolvesInto: null,
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
    name: 'ORBITING BLADE',
    short: 'BLADE',
    color: '#c6cdd8',
    description: 'BLADES ORBIT YOU',
    maxLevel: 8,
    evolvesInto: null,
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
    name: 'HOLY PULSE',
    short: 'PULSE',
    color: '#fff3c2',
    description: 'DAMAGES ALL NEARBY',
    maxLevel: 8,
    evolvesInto: null,
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
    name: 'LIGHTNING MARK',
    short: 'SPARK',
    color: '#9be7ff',
    description: 'ZAPS RANDOM FOES',
    maxLevel: 8,
    evolvesInto: null,
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
};
