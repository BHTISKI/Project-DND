export interface Card {
  id: string
  isim: string
  tip: "saldırı" | "savunma" | "yetenek"
  manaBedeli: number
  baseHasar: number
  zarTuru: string
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
}
