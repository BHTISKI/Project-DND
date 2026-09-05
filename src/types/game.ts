// Makara oyun verisinin ortak tipleri.
import { cardPostureMetadata } from '../mechanics/posture';
import { expansionCards } from '../content/expansionCards';
export interface Card {
  id: string
  isim: string
  tip: "saldırı" | "savunma" | "yetenek"
  manaBedeli: number
  baseHasar: number
  rarity?: "common" | "uncommon" | "rare" | "legendary"
  isUpgraded?: boolean
  tags?: string[]
  theme?: string
  effects?: CardEffect[]
  agirlik?: number
  isCursed?: boolean
  onDiscardPenalty?: { kind: 'pureDamage'; amount: number; returnToDeck?: boolean }
  onPlayPenalty?: 'replace-with-broken-soul'
  apocalypse?: { delay: number; hpPercent: number }
  retain?: boolean
  exhaust?: boolean
  finisher?: { threshold: number; damage: number }
  postureDamage?: number
  postureCostOnBlock?: number
  isRanged?: boolean
  isParry?: boolean
}

export type CardEffect =
  | { kind: 'conditional'; status: StatusId; damage: number }
  | { kind: "attack"; amount?: number; damageBonus?: number }
  | { kind: "damage"; amount?: number; damageBonus?: number }
  | { kind: "block"; amount: number; target?: "player" | "enemy" }
  | { kind: "heal"; amount: number; target?: "player" | "enemy" }
  | { kind: "status"; status: StatusId; duration: number; stacks?: number; value?: number; target?: "player" | "enemy" }
  | { kind: "draw"; amount: number }
  | { kind: "energy"; amount: number }
  | { kind: "skip"; target?: "enemy" }
  | { kind: "trash"; amount?: number; target?: "player" }
  | { kind: "trade"; trashAmount?: number; drawAmount?: number; target?: "player" }

export type StatusId = "vulnerable" | "weakened" | "poisoned" | "fortified" | "empowered" | "postureExposed" | 'bleeding' | 'reflection' | 'regeneration' | 'timeLocked'

export interface StatusEffect {
  id: StatusId
  duration: number
  stacks: number
  value?: number
}

export interface PostureProfile {
  maxPosture: number
  postureRecoveryRate: number
  postureDamageTaken: number
}

export interface PostureState extends PostureProfile {
  currentPosture: number
  isBroken: boolean
}

export interface Character extends PostureState {
  id: string
  isim: string
  mevcutCan: number
  maksimumCan: number
  hasarBonusu: number
}

export type EnemyIntentType = "attack" | "defend" | "special"

export type EnemyBehaviorId = "opportunist" | "paranoid" | "desperation" | "standard"
export type PlayerSignal = "none" | "no-block" | "parry" | "retaliation"
export type EnemyActionKind = "attack" | "execution" | "poison" | "heal" | "pass" | "desperation-attack" | "defend" | "weaken" | "magic"

export interface EnemyAction {
  kind: EnemyActionKind
  damage?: number
  ignoresBlock?: boolean
  poison?: number
  block?: number
  postureDamage?: number
  postureCostOnBlock?: number
  isRanged?: boolean
}

export interface EnemyTelegraph {
  type: EnemyIntentType
  label: string
  icon: string
  deceptive?: boolean
}

export interface EnemyIntent {
  type: EnemyIntentType
  estimatedDamage?: number
  estimatedBlock?: number
  estimatedHeal?: number
  warning?: string
  effectKey?: string
  telegraph?: EnemyTelegraph
  action?: EnemyAction
}

export type EnemyArchetypeId = "goblin" | "guardian" | "mage" | "assassin" | "knight"

export type NodeType = "combat" | "elite" | "shop" | "event" | "rest" | "boss"

export interface RunMapState {
  currentNode: NodeType | null
  availableNodes: Array<{ type: NodeType; id: string }>
  runFloor: number
  nodeType: NodeType | null
}

const baseCardDefs: Omit<Card, 'id'>[] = [
  { isim: 'Şeytanın Kılıcı', tip: 'saldırı', manaBedeli: 0, baseHasar: 25, rarity: 'legendary', theme: 'blood', tags: ['attack', 'cursed'], isCursed: true, onPlayPenalty: 'replace-with-broken-soul', effects: [{ kind: 'attack' }] },
  { isim: 'Patlamaya Hazır Mühür', tip: 'yetenek', manaBedeli: 1, baseHasar: 0, rarity: 'rare', theme: 'fate', tags: ['skill', 'cursed'], isCursed: true, apocalypse: { delay: 2, hpPercent: 50 }, effects: [{ kind: 'energy', amount: 3 }, { kind: 'draw', amount: 3 }] },
  { isim: 'Körlük Mührü', tip: 'yetenek', manaBedeli: 0, baseHasar: 0, rarity: 'common', theme: 'shadow', tags: ['curse'], isCursed: true, onDiscardPenalty: { kind: 'pureDamage', amount: 5, returnToDeck: true }, effects: [{ kind: 'status', status: 'weakened', duration: 1, target: 'player' }] },
  { isim: 'Kırık Ruh', tip: 'yetenek', manaBedeli: 0, baseHasar: 0, rarity: 'common', theme: 'shadow', tags: ['curse'], isCursed: true, effects: [{ kind: 'status', status: 'weakened', duration: 1, target: 'player' }] },
  { isim: 'Hızlı Saldırı', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, rarity: 'common', isUpgraded: false, tags: ['attack'], effects: [{ kind: 'attack', amount: 3 }] },
  { isim: 'Kalkan Sihri', tip: 'savunma', manaBedeli: 1, baseHasar: 0, rarity: 'common', isUpgraded: false, tags: ['defend'], effects: [{ kind: 'block', amount: 3 }] },
  { isim: 'Ayna Duruşu', tip: 'savunma', manaBedeli: 1, baseHasar: 0, rarity: 'uncommon', isUpgraded: false, tags: ['defend', 'parry'], effects: [{ kind: 'block', amount: 4 }] },
  { isim: 'Ateş Topu', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, rarity: 'common', isUpgraded: false, tags: ['skill', 'attack'], effects: [{ kind: 'damage', amount: 4, damageBonus: 2 }] },
  { isim: 'Buhar Nefesi', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, rarity: 'uncommon', isUpgraded: false, tags: ['skill', 'heal'], effects: [{ kind: 'heal', amount: 5 }] },
  { isim: 'Zayıflatıcı Lanet', tip: 'yetenek', manaBedeli: 1, baseHasar: 0, rarity: 'uncommon', isUpgraded: false, tags: ['skill', 'control'], effects: [{ kind: 'status', status: 'weakened', duration: 2, value: 1, target: 'enemy' }] },
  { isim: 'Zehirli Bıçak', tip: 'saldırı', manaBedeli: 2, baseHasar: 0, rarity: 'uncommon', isUpgraded: false, tags: ['attack', 'poison'], effects: [{ kind: 'attack', amount: 3 }, { kind: 'status', status: 'poisoned', duration: 3, value: 1, target: 'enemy' }] },
  { isim: 'Savaş İlhamı', tip: 'yetenek', manaBedeli: 1, baseHasar: 0, rarity: 'uncommon', isUpgraded: false, tags: ['skill', 'combo'], effects: [{ kind: 'status', status: 'empowered', duration: 2, value: 2 }, { kind: 'energy', amount: 1 }] },
  { isim: 'Büyüleyici Çukur', tip: 'yetenek', manaBedeli: 3, baseHasar: 0, rarity: 'rare', isUpgraded: false, tags: ['skill', 'control'], effects: [{ kind: 'skip', target: 'enemy' }] },
  { isim: 'Kırılgan Zafer', tip: 'saldırı', manaBedeli: 2, baseHasar: 0, rarity: 'rare', isUpgraded: false, tags: ['attack', 'risk'], effects: [{ kind: 'attack', amount: 5, damageBonus: 3 }, { kind: 'status', status: 'vulnerable', duration: 2, value: 1, target: 'player' }] },
  { isim: 'Taktik Hazırlık', tip: 'yetenek', manaBedeli: 0, baseHasar: 0, rarity: 'rare', isUpgraded: false, tags: ['skill', 'setup'], effects: [{ kind: 'draw', amount: 1 }, { kind: 'status', status: 'empowered', duration: 1, value: 1 }] },
  { isim: 'Zephyros Solumu', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, rarity: 'uncommon', theme: 'wind', tags: ['skill', 'draw'], effects: [{ kind: 'draw', amount: 2 }, { kind: 'status', status: 'weakened', duration: 1, value: 1, target: 'player' }] },
  { isim: 'Kanlı Elçi', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, rarity: 'common', theme: 'blood', tags: ['attack', 'heal'], effects: [{ kind: 'attack', amount: 3, damageBonus: 1 }, { kind: 'heal', amount: 1, target: 'player' }] },
  { isim: 'Köklerin İldarısı', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, rarity: 'uncommon', theme: 'earth', tags: ['skill', 'control', 'block'], effects: [{ kind: 'status', status: 'weakened', duration: 2, value: 1, target: 'enemy' }, { kind: 'block', amount: 3 }] },
  { isim: 'Ateşli Yolcu', tip: 'saldırı', manaBedeli: 3, baseHasar: 0, rarity: 'rare', theme: 'fire', tags: ['attack', 'poison'], effects: [{ kind: 'damage', amount: 4, damageBonus: 2 }, { kind: 'status', status: 'poisoned', duration: 2, value: 1, target: 'enemy' }] },
  { isim: 'Gökyüzü Kemancı', tip: 'saldırı', manaBedeli: 2, baseHasar: 0, rarity: 'uncommon', theme: 'sky', tags: ['attack', 'draw'], effects: [{ kind: 'attack', amount: 5 }, { kind: 'draw', amount: 1 }] },
  { isim: 'Kırılgan Zırh', tip: 'savunma', manaBedeli: 1, baseHasar: 0, rarity: 'common', theme: 'armor', tags: ['defend', 'fortify'], effects: [{ kind: 'block', amount: 4 }, { kind: 'status', status: 'fortified', duration: 2, value: 1, target: 'player' }] },
  { isim: 'Zehrin Damlası', tip: 'yetenek', manaBedeli: 1, baseHasar: 0, rarity: 'uncommon', theme: 'poison', tags: ['skill', 'poison'], effects: [{ kind: 'status', status: 'poisoned', duration: 4, value: 1, target: 'enemy' }] },
  { isim: 'Yıldırımın Çarpması', tip: 'saldırı', manaBedeli: 4, baseHasar: 0, rarity: 'rare', theme: 'lightning', tags: ['attack', 'vulnerable'], effects: [{ kind: 'attack', amount: 6, damageBonus: 3 }, { kind: 'status', status: 'vulnerable', duration: 1, value: 1, target: 'enemy' }] },
  { isim: 'Kaderin Çekilişi', tip: 'yetenek', manaBedeli: 0, baseHasar: 0, rarity: 'legendary', theme: 'fate', tags: ['skill', 'draw', 'empower'], effects: [{ kind: 'draw', amount: 1 }, { kind: 'status', status: 'empowered', duration: 1, value: 1, target: 'player' }] },
  { isim: 'Kan Tükeneği', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, rarity: 'uncommon', theme: 'blood', tags: ['skill', 'heal'], effects: [{ kind: 'heal', amount: 3, target: 'player' }, { kind: 'status', status: 'weakened', duration: 2, value: 1, target: 'player' }] },
  { isim: 'Rüzgarın Sesli', tip: 'savunma', manaBedeli: 1, baseHasar: 0, rarity: 'common', theme: 'wind', tags: ['defend', 'draw'], effects: [{ kind: 'block', amount: 5 }, { kind: 'draw', amount: 1 }] },
  { isim: 'Toprak Kortunması', tip: 'yetenek', manaBedeli: 3, baseHasar: 0, rarity: 'rare', theme: 'earth', tags: ['skill', 'heal', 'fortify'], effects: [{ kind: 'heal', amount: 2, target: 'player' }, { kind: 'status', status: 'fortified', duration: 3, value: 1, target: 'player' }] },
  { isim: 'Gölge Adımı', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, rarity: 'rare', theme: 'shadow', tags: ['skill', 'skip', 'draw'], effects: [{ kind: 'skip', target: 'enemy' }, { kind: 'draw', amount: 1 }] },
  { isim: 'Alev Fısıltısı', tip: 'yetenek', manaBedeli: 1, baseHasar: 0, rarity: 'uncommon', theme: 'fire', tags: ['skill', 'empower'], effects: [{ kind: 'status', status: 'empowered', duration: 1, value: 1, target: 'player' }, { kind: 'status', status: 'weakened', duration: 1, value: 1, target: 'player' }] },
  { isim: 'Kötümserin Bakışı', tip: 'yetenek', manaBedeli: 1, baseHasar: 0, rarity: 'uncommon', theme: 'fate', tags: ['skill', 'weaken', 'draw'], effects: [{ kind: 'status', status: 'weakened', duration: 1, value: 1, target: 'enemy' }, { kind: 'draw', amount: 1 }] },
  { isim: 'Dönüşüm Müzikçisi', tip: 'yetenek', manaBedeli: 2, baseHasar: 0, rarity: 'uncommon', theme: 'transmutation', tags: ['skill', 'trade'], effects: [{ kind: 'trade', trashAmount: 1, drawAmount: 2 }] },
  { isim: 'Sabırlı Muhafız', tip: 'savunma', manaBedeli: 1, baseHasar: 0, rarity: 'common', theme: 'armor', tags: ['defend'], retain: true, effects: [{ kind: 'block', amount: 3 }] },
  { isim: 'Son Kıvılcım', tip: 'yetenek', manaBedeli: 0, baseHasar: 0, rarity: 'uncommon', theme: 'fire', tags: ['skill'], exhaust: true, effects: [{ kind: 'energy', amount: 1 }] },
  { isim: 'Zincir Darbesi', tip: 'saldırı', manaBedeli: 1, baseHasar: 0, rarity: 'common', theme: 'lightning', tags: ['attack'], finisher: { threshold: 2, damage: 3 }, effects: [{ kind: 'attack', amount: 3 }] },
]

export const sampleCardDefs: Omit<Card, 'id'>[] = [...baseCardDefs, ...expansionCards].map(card => ({ ...cardPostureMetadata(card), ...card }));
