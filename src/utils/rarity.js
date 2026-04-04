export const RARITY_OPTIONS = ['COMMON', 'RARE', 'LEGENDARY']

const RARITY_LABELS = {
  COMMON: 'Thông thường',
  RARE: 'Hiếm',
  LEGENDARY: 'Cực hiếm',
}

export function formatRarity(rarity) {
  if (!rarity) return '-'
  return RARITY_LABELS[rarity] || rarity
}
