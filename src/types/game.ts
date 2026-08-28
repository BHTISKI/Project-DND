export interface Card {
  id: string
  isim: string
  tip: "saldırı" | "savunma" | "yetenek"
  manaBedeli: number
  baseHasar: number
  zarTuru: string
  rarity?: "common" | "uncommon" | "rare"
  isUpgraded?: boolean
  tags?: string[]
  effects?: CardEffect[]
}

export type CardEffect =
  | { kind: "attack"; die?: string; ignoresArmor?: boolean; damageBonus?: number }
  | { kind: "damage"; die: string; ignoresArmor?: boolean; damageBonus?: number }
  | { kind: "block"; die?: string; amount?: number; target?: "player" | "enemy" }
  | { kind: "heal"; die?: string; amount?: number; target?: "player" | "enemy" }
  | { kind: "status"; status: StatusId; duration: number; stacks?: number; value?: number; target?: "player" | "enemy" }
  | { kind: "draw"; amount: number }
  | { kind: "energy"; amount: number }
  | { kind: "skip"; target?: "enemy" }

export type StatusId = "vulnerable" | "weakened" | "poisoned" | "fortified" | "empowered"

export interface StatusEffect {
  id: StatusId
  duration: number
  stacks: number
  value?: number
}

export interface Character {
  id: string
  isim: string
  mevcutCan: number
  maksimumCan: number
  zirhSinifi: number
  gucCarpani: number
}

export type EnemyIntentType = "attack" | "defend" | "special"

export interface EnemyIntent {
  type: EnemyIntentType
  estimatedDamage?: number
  estimatedBlock?: number
  estimatedHeal?: number
  effectKey?: string
}

export type EnemyArchetypeId = "goblin" | "guardian" | "mage"

export type NodeType = "combat" | "elite" | "shop" | "event" | "rest" | "boss"

export interface RunMapState {
  currentNode: NodeType | null
  availableNodes: Array<{ type: NodeType; id: string }>
  runFloor: number
  nodeType: NodeType | null
}

export const sampleCardDefs: Omit<Card, 'id'>[] = [
  { isim: 'Hızlı Saldırı', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', rarity: 'common', isUpgraded: false, tags: ['attack'], effects: [{ kind: 'attack', die: 'd4' }] },
  { isim: 'Kalkan Sihri', tip: 'savunma', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', rarity: 'common', isUpgraded: false, tags: ['defend'], effects: [{ kind: 'block', die: 'd4' }] },
  { isim: 'Ateş Topu', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, zarTuru: 'd6', rarity: 'common', isUpgraded: false, tags: ['skill', 'attack'], effects: [{ kind: 'damage', die: 'd6', ignoresArmor: true, damageBonus: 2 }] },
  { isim: 'Buhar Nefesi', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, zarTuru: 'd8', rarity: 'uncommon', isUpgraded: false, tags: ['skill', 'heal'], effects: [{ kind: 'heal', die: 'd8' }] },
  { isim: 'Zayıflatıcı Lanet', tip: 'yetenek', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', rarity: 'uncommon', isUpgraded: false, tags: ['skill', 'control'], effects: [{ kind: 'status', status: 'weakened', duration: 2, value: 1, target: 'enemy' }] },
  { isim: 'Zehirli Bıçak', tip: 'saldırı', manaBedeli: 2, baseHasar: 0, zarTuru: 'd4', rarity: 'uncommon', isUpgraded: false, tags: ['attack', 'poison'], effects: [{ kind: 'attack', die: 'd4' }, { kind: 'status', status: 'poisoned', duration: 3, value: 1, target: 'enemy' }] },
  { isim: 'Savaş İlhamı', tip: 'yetenek', manaBedeli: 1, baseHasar: 0, zarTuru: 'd4', rarity: 'uncommon', isUpgraded: false, tags: ['skill', 'combo'], effects: [{ kind: 'status', status: 'empowered', duration: 2, value: 2 }, { kind: 'energy', amount: 1 }] },
  { isim: 'Büyüleyici Çukur', tip: 'yetenek', manaBedeli: 3, baseHasar: 0, zarTuru: 'd10', rarity: 'rare', isUpgraded: false, tags: ['skill', 'control'], effects: [{ kind: 'skip', target: 'enemy' }] },
  { isim: 'Kırılgan Zafer', tip: 'saldırı', manaBedeli: 2, baseHasar: 0, zarTuru: 'd8', rarity: 'rare', isUpgraded: false, tags: ['attack', 'risk'], effects: [{ kind: 'attack', die: 'd8', damageBonus: 3 }, { kind: 'status', status: 'vulnerable', duration: 2, value: 1, target: 'player' }] },
  { isim: 'Taktik Hazırlık', tip: 'yetenek', manaBedeli: 0, baseHasar: 0, zarTuru: 'd1', rarity: 'rare', isUpgraded: false, tags: ['skill', 'setup'], effects: [{ kind: 'draw', amount: 1 }, { kind: 'status', status: 'empowered', duration: 1, value: 1 }] },
]