export interface Card {
  id: string
  isim: string
  tip: "saldırı" | "savunma" | "yetenek"
  manaBedeli: number
  baseHasar: number
  zarTuru: string
  rarity?: "common" | "uncommon" | "rare"
  isUpgraded: boolean
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