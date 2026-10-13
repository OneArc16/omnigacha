const FIVE_STAR_RARITY = 5;
const FOUR_STAR_RARITY = 4;

export function isFiveStar(rarity: number) {
  return rarity >= FIVE_STAR_RARITY;
}

/** Color de la barra de rareza: dorado para 5★, púrpura para 4★, neutro para el resto. */
export function getRarityBarClassName(rarity: number) {
  if (isFiveStar(rarity)) return 'bg-[linear-gradient(90deg,#e8c987,#c99f5f)]';
  if (rarity === FOUR_STAR_RARITY) return 'bg-accent-purple-deep';
  return 'bg-track';
}
