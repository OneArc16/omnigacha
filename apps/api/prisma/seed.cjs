const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const characters = [
  { name: 'Kafka', element: 'Lightning', path: 'Nihility', role: 'DoT DPS', baseAtk: 679, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 100 },
  { name: 'Black Swan', element: 'Wind', path: 'Nihility', role: 'DoT Sub-DPS', baseAtk: 660, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 102 },
  { name: 'Acheron', element: 'Lightning', path: 'Nihility', role: 'Hypercarry DPS', baseAtk: 698, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 101 },
  { name: 'Ruan Mei', element: 'Ice', path: 'Harmony', role: 'Universal Support', baseAtk: 659, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 104 },
  { name: 'Sparkle', element: 'Quantum', path: 'Harmony', role: 'SP Support', baseAtk: 523, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 101 },
  { name: 'Luocha', element: 'Imaginary', path: 'Abundance', role: 'Sustain Healer', baseAtk: 756, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 101 },
  { name: 'Fu Xuan', element: 'Quantum', path: 'Preservation', role: 'Sustain Tank', baseAtk: 465, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 100 },
  { name: 'Bronya', element: 'Wind', path: 'Harmony', role: 'Advance Support', baseAtk: 582, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 99 },
  { name: 'Pela', element: 'Ice', path: 'Nihility', role: 'DEF Shred Support', baseAtk: 546, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 105 },
  { name: 'Tingyun', element: 'Lightning', path: 'Harmony', role: 'ATK Buffer', baseAtk: 529, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 112 },
  { name: 'Silver Wolf', element: 'Quantum', path: 'Nihility', role: 'Debuffer', baseAtk: 640, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 107 },
  { name: 'Jingliu', element: 'Ice', path: 'Destruction', role: 'Hypercarry DPS', baseAtk: 679, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 96 },
  { name: 'Blade', element: 'Wind', path: 'Destruction', role: 'HP Scaling DPS', baseAtk: 543, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 97 },
  { name: 'Huohuo', element: 'Wind', path: 'Abundance', role: 'Sustain Buffer', baseAtk: 601, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 98 },
  { name: 'Robin', element: 'Physical', path: 'Harmony', role: 'Teamwide Buffer', baseAtk: 640, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 102 },
  { name: 'Topaz', element: 'Fire', path: 'Hunt', role: 'Follow-Up DPS', baseAtk: 621, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 110 },
  { name: 'Dr. Ratio', element: 'Imaginary', path: 'Hunt', role: 'Single Target DPS', baseAtk: 776, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 103 },
  { name: 'Aventurine', element: 'Imaginary', path: 'Preservation', role: 'Shield Sustain', baseAtk: 446, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 106 },
  { name: 'Jiaoqiu', element: 'Fire', path: 'Nihility', role: 'Debuff Support', baseAtk: 635, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 98 },
  { name: 'Sunday', element: 'Imaginary', path: 'Harmony', role: 'Hypercarry Enabler', baseAtk: 601, baseCritRate: 0.05, baseCritDamage: 0.5, baseSpeed: 102 }
];

const lightCones = [
  {
    name: 'Along the Passing Shore',
    path: 'Nihility',
    rarity: 5,
    effectDescription: 'Crit-focused signature cone with debuff synergy.',
  },
  {
    name: 'Good Night and Sleep Well',
    path: 'Nihility',
    rarity: 4,
    effectDescription: 'Scales with debuff count and fits DoT or debuff teams.',
  },
  {
    name: 'Eyes of the Prey',
    path: 'Nihility',
    rarity: 4,
    effectDescription: 'Boosts effect hit rate and damage over time output.',
  },
  {
    name: 'Patience Is All You Need',
    path: 'Nihility',
    rarity: 5,
    effectDescription: 'Premium Kafka option with speed and damage bonuses.',
  },
  {
    name: 'But the Battle Isnt Over',
    path: 'Harmony',
    rarity: 5,
    effectDescription: 'Energy and team utility for hypercarry supports.',
  },
  {
    name: 'Past and Future',
    path: 'Harmony',
    rarity: 4,
    effectDescription: 'Simple buffing cone for action-forward support units.',
  },
  {
    name: 'Carve the Moon, Weave the Clouds',
    path: 'Harmony',
    rarity: 4,
    effectDescription: 'Rotating team buffs for general Harmony value.',
  },
  {
    name: 'Earthly Escapade',
    path: 'Harmony',
    rarity: 5,
    effectDescription: 'High-value crit support option for premium buffers.',
  },
  {
    name: 'Echoes of the Coffin',
    path: 'Abundance',
    rarity: 5,
    effectDescription: 'Healing utility with extra team tempo support.',
  },
  {
    name: 'Time Waits for No One',
    path: 'Abundance',
    rarity: 5,
    effectDescription: 'Reliable healing cone with extra damage contribution.',
  },
  {
    name: 'Shared Feeling',
    path: 'Abundance',
    rarity: 4,
    effectDescription: 'Energy support and healing for utility sustain builds.',
  },
  {
    name: 'Moment of Victory',
    path: 'Preservation',
    rarity: 5,
    effectDescription: 'Defensive signature cone for tanky preservation units.',
  },
  {
    name: 'Texture of Memories',
    path: 'Preservation',
    rarity: 5,
    effectDescription: 'Free defensive option with strong survivability value.',
  },
  {
    name: 'Trend of the Universal Market',
    path: 'Preservation',
    rarity: 4,
    effectDescription: 'Utility option that adds burn pressure in some teams.',
  },
  {
    name: 'On the Fall of an Aeon',
    path: 'Destruction',
    rarity: 5,
    effectDescription: 'F2P premium attack scaling cone for destruction carries.',
  },
  {
    name: 'Something Irreplaceable',
    path: 'Destruction',
    rarity: 5,
    effectDescription: 'Generalist destruction cone with sustain and damage.',
  },
  {
    name: 'The Moles Welcome You',
    path: 'Destruction',
    rarity: 4,
    effectDescription: 'Stacking attack option for budget destruction builds.',
  },
  {
    name: 'Worrisome, Blissful',
    path: 'Hunt',
    rarity: 5,
    effectDescription: 'Follow-up oriented signature option for Hunt units.',
  },
  {
    name: 'Cruising in the Stellar Sea',
    path: 'Hunt',
    rarity: 5,
    effectDescription: 'Excellent F2P cone with strong crit support.',
  },
  {
    name: 'Only Silence Remains',
    path: 'Hunt',
    rarity: 4,
    effectDescription: 'Solid single-target cone when enemy count is low.',
  },
];

const synergyRules = [
  { source: 'Kafka', target: 'Black Swan', weight: 95, note: 'Best in slot DoT core.' },
  { source: 'Kafka', target: 'Ruan Mei', weight: 78, note: 'Universal speed and dmg amplification.' },
  { source: 'Acheron', target: 'Pela', weight: 84, note: 'Reliable DEF shred for ultimate spikes.' },
  { source: 'Acheron', target: 'Jiaoqiu', weight: 92, note: 'Premier Nihility partner for stack flow.' },
  { source: 'Jingliu', target: 'Bronya', weight: 91, note: 'Action advance and crit scaling synergy.' },
  { source: 'Blade', target: 'Ruan Mei', weight: 73, note: 'Damage and speed gains across cycles.' },
  { source: 'Topaz', target: 'Dr. Ratio', weight: 94, note: 'Follow-up centered dual DPS core.' },
  { source: 'Topaz', target: 'Robin', weight: 86, note: 'Follow-up teams gain strong buffs.' },
  { source: 'Dr. Ratio', target: 'Silver Wolf', weight: 88, note: 'Debuffs improve consistency and output.' },
  { source: 'Sunday', target: 'Jingliu', weight: 89, note: 'Hypercarry setup with high buff uptime.' },
  { source: 'Sunday', target: 'Acheron', weight: 81, note: 'Good hypercarry utility and team tempo.' },
  { source: 'Robin', target: 'Aventurine', weight: 70, note: 'Safe sustain core for buff windows.' },
  { source: 'Sparkle', target: 'Acheron', weight: 74, note: 'Skill point economy and burst tempo.' },
  { source: 'Fu Xuan', target: 'Acheron', weight: 68, note: 'Stability for high-risk hypercarry comps.' },
  { source: 'Luocha', target: 'Blade', weight: 82, note: 'Comfort sustain with offensive uptime.' }
];

async function seedCharacters() {
  for (const character of characters) {
    await prisma.character.upsert({
      where: { name: character.name },
      create: character,
      update: {
        element: character.element,
        path: character.path,
        role: character.role,
        baseAtk: character.baseAtk,
        baseCritRate: character.baseCritRate,
        baseCritDamage: character.baseCritDamage,
        baseSpeed: character.baseSpeed,
      },
    });
  }
}

async function seedLightCones() {
  for (const lightCone of lightCones) {
    await prisma.lightCone.upsert({
      where: { name: lightCone.name },
      create: lightCone,
      update: {
        path: lightCone.path,
        rarity: lightCone.rarity,
        effectDescription: lightCone.effectDescription,
      },
    });
  }
}

async function seedSynergies() {
  const characterRows = await prisma.character.findMany({
    select: { id: true, name: true },
  });

  const idByName = new Map(characterRows.map((row) => [row.name, row.id]));

  for (const rule of synergyRules) {
    const sourceId = idByName.get(rule.source);
    const targetId = idByName.get(rule.target);

    if (!sourceId || !targetId) {
      continue;
    }

    await prisma.characterSynergy.upsert({
      where: {
        sourceCharacterId_targetCharacterId: {
          sourceCharacterId: sourceId,
          targetCharacterId: targetId,
        },
      },
      create: {
        sourceCharacterId: sourceId,
        targetCharacterId: targetId,
        weight: rule.weight,
        note: rule.note,
      },
      update: {
        weight: rule.weight,
        note: rule.note,
      },
    });
  }
}

async function main() {
  await seedCharacters();
  await seedLightCones();
  await seedSynergies();

  console.log(
    `Seeded ${characters.length} characters, ${lightCones.length} light cones and ${synergyRules.length} synergy rules`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
