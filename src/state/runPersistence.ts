import { sampleCardDefs } from '../types/game';
import type { Card, CardEffect, Character, EnemyAction, EnemyIntent, EnemyArchetypeId, NodeType, StatusEffect, StatusId } from '../types/game';
import type { GameState } from './store';
import { cardPostureMetadata, postureProfile, POSTURE_CONFIG, withEnemyPosture } from '../mechanics/posture';

export const RUN_SAVE_KEY = 'makara.run';
export const LEGACY_RUN_SAVE_KEY = ['project', ['d', 'n', 'd'].join('') + '.run'].join('-');
const SAVE_VERSION = 3;

type ActionKeys = { [K in keyof GameState]: GameState[K] extends (...args: never[]) => unknown ? K : never }[keyof GameState];
export type RunSnapshot = Omit<GameState, ActionKeys | 'initialized' |
  'playerDialog' | 'enemyDialog' | 'saveStatus' | 'saveCursor'>;
export type SaveStatus = 'idle' | 'saved' | 'error' | 'conflict';
export type RunSaveResult =
  | { kind: 'ready'; run: RunSnapshot; savedAt: number; cursor: string | null }
  | { kind: 'empty' | 'unavailable'; cursor: null }
  | { kind: 'invalid' | 'incompatible'; cursor: string };

type Check = (value: unknown) => boolean;
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text: Check = v => typeof v === 'string';
const nonempty: Check = v => typeof v === 'string' && v.trim().length > 0;
const number: Check = v => typeof v === 'number' && Number.isFinite(v);
const nonnegative: Check = v => number(v) && (v as number) >= 0;
const integer: Check = v => nonnegative(v) && Number.isSafeInteger(v);
const positive: Check = v => integer(v) && (v as number) > 0;
const boolean: Check = v => typeof v === 'boolean';
const oneOf = (...values: string[]): Check => v => typeof v === 'string' && values.includes(v);
const nullable = (check: Check): Check => v => v === null || check(v);
const list = (check: Check): Check => v => Array.isArray(v) && v.every(check);
const shape = (required: Record<string, Check>, optional: Record<string, Check> = {}): Check => v =>
  record(v) && Object.entries(required).every(([key, check]) => check(v[key])) &&
  Object.entries(optional).every(([key, check]) => v[key] === undefined || check(v[key]));
const legacyDie: Check = v => typeof v === 'string' && (v === 'sabit' || /^d[1-9]\d*$/.test(v));
const targetSide = oneOf('player', 'enemy');
const statusId = oneOf('vulnerable', 'weakened', 'poisoned', 'fortified', 'empowered', 'postureExposed');
const nodeType = oneOf('combat', 'elite', 'shop', 'event', 'rest', 'boss');
const intentType = oneOf('attack', 'defend', 'special');
const cardType = oneOf('saldırı', 'savunma', 'yetenek');

const effect: Check = value => {
  if (!record(value)) return false;
  switch (value.kind) {
    case 'attack': case 'damage': return shape({}, { amount: nonnegative, damageBonus: number })(value);
    case 'block': case 'heal': return shape({ amount: nonnegative }, { target: targetSide })(value);
    case 'status': return shape({ status: statusId, duration: positive }, { stacks: positive, value: number, target: targetSide })(value);
    case 'draw': case 'energy': return shape({ amount: integer })(value);
    case 'skip': return shape({}, { target: oneOf('enemy') })(value);
    case 'trash': return shape({}, { amount: integer, target: oneOf('player') })(value);
    case 'trade': return shape({}, { trashAmount: integer, drawAmount: integer, target: oneOf('player') })(value);
    default: return false;
  }
};
const legacyEffect: Check = value => {
  if (!record(value)) return false;
  switch (value.kind) {
    case 'attack': return shape({}, { die: legacyDie, ignoresArmor: boolean, damageBonus: number })(value);
    case 'damage': return shape({ die: legacyDie }, { ignoresArmor: boolean, damageBonus: number })(value);
    case 'block': case 'heal': return shape({}, { die: legacyDie, amount: nonnegative, target: targetSide })(value);
    case 'status': return shape({ status: statusId, duration: positive }, { stacks: positive, value: number, target: targetSide })(value);
    case 'draw': case 'energy': return shape({ amount: integer })(value);
    case 'skip': return shape({}, { target: oneOf('enemy') })(value);
    case 'trash': return shape({}, { amount: integer, target: oneOf('player') })(value);
    case 'trade': return shape({}, { trashAmount: integer, drawAmount: integer, target: oneOf('player') })(value);
    case 'advantage': case 'disadvantage': return shape({}, { value: integer, target: targetSide })(value);
    default: return false;
  }
};
const card = shape({ id: nonempty, isim: nonempty, tip: cardType, manaBedeli: integer, baseHasar: nonnegative }, {
  rarity: oneOf('common', 'uncommon', 'rare', 'legendary'), isUpgraded: boolean, tags: list(text), theme: text,
  effects: list(effect), agirlik: nonnegative, isCursed: boolean, retain: boolean, exhaust: boolean,
  onDiscardPenalty: shape({ kind: oneOf('pureDamage'), amount: nonnegative }, { returnToDeck: boolean }),
  onPlayPenalty: oneOf('replace-with-broken-soul'), apocalypse: shape({ delay: positive, hpPercent: nonnegative }),
  finisher: shape({ threshold: integer, damage: nonnegative }),
  postureDamage: nonnegative, postureCostOnBlock: nonnegative, isRanged: boolean, isParry: boolean,
});
const legacyCard = shape({ id: nonempty, isim: nonempty, tip: cardType, manaBedeli: integer, baseHasar: nonnegative, zarTuru: legacyDie }, {
  rarity: oneOf('common', 'uncommon', 'rare', 'legendary'), isUpgraded: boolean, tags: list(text), theme: text,
  effects: list(legacyEffect), agirlik: nonnegative, isCursed: boolean, retain: boolean, exhaust: boolean,
  onDiscardPenalty: shape({ kind: oneOf('pureDamage'), amount: nonnegative }, { returnToDeck: boolean }),
  onPlayPenalty: oneOf('replace-with-broken-soul'), apocalypse: shape({ delay: positive, hpPercent: nonnegative }),
  finisher: shape({ threshold: integer, damage: nonnegative }),
});
const character: Check = value => shape({
  id: nonempty, isim: nonempty, mevcutCan: nonnegative, maksimumCan: positive, hasarBonusu: number,
  currentPosture: nonnegative, maxPosture: positive, postureRecoveryRate: number, postureDamageTaken: number, isBroken: boolean,
})(value) && (value as Character).mevcutCan <= (value as Character).maksimumCan
  && (value as Character).currentPosture <= (value as Character).maxPosture
  && (value as Character).postureRecoveryRate >= 0
  && (value as Character).postureDamageTaken > 0
  && (!(value as Character).isBroken || (value as Character).currentPosture === (value as Character).maxPosture);
const versionTwoCharacter: Check = value => shape({
  id: nonempty, isim: nonempty, mevcutCan: nonnegative, maksimumCan: positive, hasarBonusu: number,
}, { denge: nonnegative, maksimumDenge: positive, staggered: boolean })(value) &&
  (value as Character).mevcutCan <= (value as Character).maksimumCan;
const legacyCharacter: Check = value => shape({
  id: nonempty, isim: nonempty, mevcutCan: nonnegative, maksimumCan: positive, zirhSinifi: number,
  gucCarpani: number, advantageCounter: integer, disadvantageCounter: integer,
}, { denge: nonnegative, maksimumDenge: positive, staggered: boolean })(value) &&
  (value as GameState['player']).mevcutCan <= (value as GameState['player']).maksimumCan;
const status = shape({ id: statusId, duration: integer, stacks: positive }, { value: number });
const action = shape({ kind: oneOf('attack', 'execution', 'poison', 'heal', 'pass', 'desperation-attack', 'defend', 'weaken', 'magic') },
  { damage: nonnegative, ignoresBlock: boolean, poison: nonnegative, block: nonnegative,
    postureDamage: nonnegative, postureCostOnBlock: nonnegative, isRanged: boolean });
const legacyAction = shape({ kind: oneOf('attack', 'critical-execution', 'poison', 'heal', 'pass', 'desperation-attack', 'defend', 'weaken', 'magic') },
  { damage: nonnegative, ignoresBlock: boolean, poison: nonnegative, block: nonnegative });
const intent = shape({ type: intentType }, {
  estimatedDamage: nonnegative, estimatedBlock: nonnegative, estimatedHeal: nonnegative,
  warning: text, effectKey: text,
  telegraph: shape({ type: intentType, label: text, icon: text }, { deceptive: boolean }), action,
});
const legacyIntent = shape({ type: intentType }, {
  estimatedDamage: nonnegative, estimatedBlock: nonnegative, estimatedHeal: nonnegative, criticalDamage: nonnegative,
  warning: text, effectKey: text,
  telegraph: shape({ type: intentType, label: text, icon: text }, { deceptive: boolean }), action: legacyAction,
});

const runRules = {
  player: character, enemy: character, playerName: value => typeof value === 'string' && value.trim() === value && value.length >= 2 && value.length <= 20,
  isPlayerTurn: boolean, round: positive, maxEnergy: positive, currentEnergy: integer, drawCount: positive,
  deck: list(card), hand: list(card), discardPile: list(card), exhaustedPile: list(card), gold: nonnegative,
  metaGold: nonnegative, metaVictories: integer,
  battleLogs: list(text), gamePhase: oneOf('combat', 'shop', 'victory', 'gameOver', 'mapSelection', 'deckBuild', 'event', 'rest', 'boss'),
  rewardOptions: list(card), draftOptions: list(card), draftPicks: integer, draftBudget: integer, starterDraftComplete: boolean,
  apocalypseTurns: nullable(integer), apocalypseHpPercent: nonnegative,
  playerBlock: nonnegative, enemyBlock: nonnegative, enemySkipNextTurn: boolean, victoryCount: integer,
  enemyIntent: nullable(intent), baseEnemyIntent: nullable(intent), enemyIntentValue: nonnegative,
  enemyBehaviorRoll: value => number(value) && (value as number) >= 0 && (value as number) <= 1,
  enemyArchetype: oneOf('goblin', 'guardian', 'mage', 'assassin', 'knight'),
  enemyBehavior: oneOf('opportunist', 'paranoid', 'desperation', 'standard'), enemyCanLie: boolean,
  lastPlayerSignal: oneOf('none', 'no-block', 'parry', 'retaliation'), desperationStacks: integer,
  playerStatuses: list(status), enemyStatuses: list(status), pendingEnemyStatuses: list(status), pendingPlayerSkip: boolean,
  comboChain: list(text), comboCount: integer, nextDamageBonus: nonnegative,
  postureComboCount: integer, pendingParry: boolean,
  playerGuardPostureCost: nonnegative, enemyGuardPostureCost: nonnegative,
  currentNode: nullable(nodeType), nodeType: nullable(nodeType), runFloor: integer,
  availableNodes: list(shape({ id: nonempty, type: nodeType })),
} satisfies Record<keyof RunSnapshot, Check>;
const previousRunRules = Object.fromEntries(Object.entries(runRules).filter(([key]) =>
  !['postureComboCount', 'pendingParry', 'playerGuardPostureCost', 'enemyGuardPostureCost'].includes(key))) as Record<string, Check>;
const versionTwoRunRules: Record<string, Check> = {
  ...previousRunRules,
  player: versionTwoCharacter, enemy: versionTwoCharacter,
};
const legacyRunRules: Record<string, Check> = {
  ...previousRunRules,
  player: legacyCharacter, enemy: legacyCharacter,
  deck: list(legacyCard), hand: list(legacyCard), discardPile: list(legacyCard), exhaustedPile: list(legacyCard),
  rewardOptions: list(legacyCard), draftOptions: list(legacyCard),
  enemyIntent: nullable(legacyIntent), baseEnemyIntent: nullable(legacyIntent),
};

function fixedValue(value: unknown): number {
  if (typeof value !== 'string' || value === 'sabit') return 0;
  const sides = Number(value.replace(/^d/, ''));
  return Number.isFinite(sides) ? Math.ceil((sides + 1) / 2) : 0;
}
function cleanEffect(value: Record<string, unknown>, fallbackDie?: unknown, upgraded = false): CardEffect {
  const kind = value.kind;
  if (kind === 'advantage' || kind === 'disadvantage') return {
    kind: 'status', status: kind === 'advantage' ? 'empowered' : 'weakened', duration: 1,
    value: typeof value.value === 'number' ? value.value : 1,
    target: value.target === 'enemy' ? 'enemy' : 'player',
  };
  if (kind === 'attack' || kind === 'damage') {
    const amount = typeof value.amount === 'number' ? value.amount : fixedValue(value.die ?? fallbackDie);
    return { kind, amount, ...(typeof value.damageBonus === 'number' ? { damageBonus: value.damageBonus } : {}) };
  }
  if (kind === 'block' || kind === 'heal') {
    const converted = fixedValue(value.die);
    const amount = typeof value.amount === 'number' ? value.amount : (converted || 4) + (upgraded && converted ? 1 : 0);
    return { kind, amount, ...(value.target === 'enemy' ? { target: 'enemy' as const } : {}) };
  }
  if (kind === 'status') return { kind, status: value.status as StatusId,
    duration: value.duration as number, ...(typeof value.stacks === 'number' ? { stacks: value.stacks } : {}),
    ...(typeof value.value === 'number' ? { value: value.value } : {}),
    ...(value.target === 'enemy' ? { target: 'enemy' as const } : value.target === 'player' ? { target: 'player' as const } : {}) };
  if (kind === 'draw' || kind === 'energy') return { kind, amount: value.amount as number };
  if (kind === 'skip') return { kind, ...(value.target === 'enemy' ? { target: 'enemy' as const } : {}) };
  if (kind === 'trash') return { kind, ...(typeof value.amount === 'number' ? { amount: value.amount } : {}),
    ...(value.target === 'player' ? { target: 'player' as const } : {}) };
  return { kind: 'trade', ...(typeof value.trashAmount === 'number' ? { trashAmount: value.trashAmount } : {}),
    ...(typeof value.drawAmount === 'number' ? { drawAmount: value.drawAmount } : {}),
    ...(value.target === 'player' ? { target: 'player' as const } : {}) };
}
function cleanCard(value: Card | Record<string, unknown>): Card {
  const raw = value as Record<string, unknown>;
  const { zarTuru: _removed, ...rest } = raw;
  const cleaned = { ...rest,
    effects: Array.isArray(raw.effects) ? raw.effects.map(item => cleanEffect(item as Record<string, unknown>, raw.zarTuru, raw.isUpgraded === true)) : [],
  } as unknown as Card;
  const definition = sampleCardDefs.find(cardValue => cardValue.isim === cleaned.isim);
  const metadata = cardPostureMetadata(definition ?? cleaned);
  const upgradedPosture = metadata.postureDamage && raw.isUpgraded === true
    ? metadata.postureDamage + POSTURE_CONFIG.card.upgradeBonus : metadata.postureDamage;
  return {
    ...cleaned,
    postureDamage: typeof raw.postureDamage === 'number' ? raw.postureDamage : upgradedPosture,
    postureCostOnBlock: typeof raw.postureCostOnBlock === 'number' ? raw.postureCostOnBlock : metadata.postureCostOnBlock,
    isRanged: typeof raw.isRanged === 'boolean' ? raw.isRanged : metadata.isRanged,
    isParry: typeof raw.isParry === 'boolean' ? raw.isParry : metadata.isParry,
  };
}
function cleanCharacter(value: Character | Record<string, unknown>, kind: EnemyArchetypeId | 'player', encounter?: NodeType | null): Character {
  const raw = value as Record<string, unknown>;
  const { zirhSinifi: _armor, gucCarpani: legacyBonus, advantageCounter: _advantage,
    disadvantageCounter: _disadvantage, denge: legacyPosture, maksimumDenge: legacyMaxPosture,
    staggered: legacyBroken, ...rest } = raw;
  const profile = postureProfile(kind, encounter);
  const maxPosture = typeof raw.maxPosture === 'number' && raw.maxPosture > 0 ? raw.maxPosture : profile.maxPosture;
  const legacyRatio = typeof legacyPosture === 'number' && typeof legacyMaxPosture === 'number' && legacyMaxPosture > 0
    ? legacyPosture / legacyMaxPosture : 0;
  const isBroken = typeof raw.isBroken === 'boolean' ? raw.isBroken : legacyBroken === true;
  const migratedPosture = typeof raw.currentPosture === 'number'
    ? raw.currentPosture : Math.ceil(maxPosture * Math.min(1, Math.max(0, legacyRatio)));
  return {
    ...rest,
    hasarBonusu: typeof raw.hasarBonusu === 'number' ? raw.hasarBonusu
      : typeof legacyBonus === 'number' ? legacyBonus : 0,
    maxPosture,
    currentPosture: isBroken ? maxPosture : Math.min(maxPosture, Math.max(0, migratedPosture)),
    postureRecoveryRate: typeof raw.postureRecoveryRate === 'number' ? raw.postureRecoveryRate : profile.postureRecoveryRate,
    postureDamageTaken: typeof raw.postureDamageTaken === 'number' ? raw.postureDamageTaken : profile.postureDamageTaken,
    isBroken,
  } as unknown as Character;
}
function cleanIntent(value: EnemyIntent | Record<string, unknown> | null, archetype: EnemyArchetypeId): EnemyIntent | null {
  if (!value) return null;
  const raw = value as Record<string, unknown>;
  const { criticalDamage: _removed, ...rest } = raw;
  const rawAction = record(raw.action) ? raw.action : undefined;
  const actionValue = rawAction ? withEnemyPosture({ ...rawAction,
    kind: rawAction.kind === 'critical-execution' ? 'execution' : rawAction.kind,
  } as EnemyAction, archetype) : undefined;
  return { ...rest, ...(actionValue ? { action: actionValue } : {}) } as unknown as EnemyIntent;
}
function mergeCounterStatus(statuses: StatusEffect[], id: StatusId, count: number): StatusEffect[] {
  const addedStacks = Math.min(3, count);
  if (addedStacks <= 0) return statuses;
  const existing = statuses.find(statusValue => statusValue.id === id);
  if (!existing) return [...statuses, { id, duration: 1, stacks: addedStacks, value: 1 }];
  const stacks = Math.min(3, existing.stacks + addedStacks);
  const totalValue = (existing.value ?? 1) * existing.stacks + addedStacks;
  return statuses.map(statusValue => statusValue.id === id
    ? { ...statusValue, duration: Math.max(1, statusValue.duration), stacks, value: totalValue / stacks }
    : statusValue);
}
function migrateCounterStatuses(statuses: StatusEffect[], characterValue: Character | Record<string, unknown>): StatusEffect[] {
  const character = characterValue as unknown as Record<string, unknown>;
  const advantage = typeof character.advantageCounter === 'number' ? character.advantageCounter : 0;
  const disadvantage = typeof character.disadvantageCounter === 'number' ? character.disadvantageCounter : 0;
  return mergeCounterStatus(mergeCounterStatus(statuses, 'empowered', advantage), 'weakened', disadvantage);
}
function isRetiredLog(message: string): boolean {
  return /d20|zar|kritik|ıskaladı/i.test(message);
}

function hasValidRunShape(value: unknown, rules: Record<string, Check>): boolean {
  if (!shape(rules)(value)) return false;
  const run = value as RunSnapshot;
  const cards = [...run.deck, ...run.hand, ...run.discardPile, ...run.exhaustedPile, ...run.draftOptions, ...run.rewardOptions];
  if (new Set(cards.map(cardValue => cardValue.id)).size !== cards.length || run.draftPicks > 3 || run.draftBudget > 6) return false;
  if (run.deck.length + run.hand.length + run.discardPile.length + run.exhaustedPile.length === 0) return false;
  if (run.gamePhase === 'gameOver') return run.player.mevcutCan === 0;
  if (run.player.mevcutCan <= 0) return false;
  if (run.gamePhase === 'combat' && (!run.starterDraftComplete || !run.isPlayerTurn || !run.enemyIntent || run.enemy.mevcutCan <= 0)) return false;
  if (run.gamePhase === 'deckBuild' && (run.starterDraftComplete || run.draftPicks >= 3 || run.draftOptions.length < 3 - run.draftPicks)) return false;
  if (run.gamePhase === 'mapSelection' && !run.availableNodes.length) return false;
  if (run.gamePhase === 'victory' && !run.rewardOptions.length) return false;
  return true;
}

export function snapshotRun(state: RunSnapshot): RunSnapshot {
  const run = Object.fromEntries(Object.keys(runRules).map(key => [key, state[key as keyof RunSnapshot]])) as RunSnapshot;
  const cleanCards = (cards: Card[]) => cards.map(cardValue => cleanCard(cardValue));
  const encounter = run.nodeType ?? run.currentNode;
  return {
    ...run,
    player: cleanCharacter(run.player, 'player'), enemy: cleanCharacter(run.enemy, run.enemyArchetype, encounter),
    deck: cleanCards(run.deck), hand: cleanCards(run.hand), discardPile: cleanCards(run.discardPile),
    exhaustedPile: cleanCards(run.exhaustedPile), rewardOptions: cleanCards(run.rewardOptions), draftOptions: cleanCards(run.draftOptions),
    enemyIntent: cleanIntent(run.enemyIntent, run.enemyArchetype), baseEnemyIntent: cleanIntent(run.baseEnemyIntent, run.enemyArchetype),
    playerStatuses: migrateCounterStatuses(run.playerStatuses, run.player),
    enemyStatuses: migrateCounterStatuses(run.enemyStatuses, run.enemy),
    battleLogs: run.battleLogs.filter(message => !isRetiredLog(message)).slice(-200),
  };
}
function validRun(value: unknown): value is RunSnapshot {
  return hasValidRunShape(value, runRules);
}

export function readRunSave(): RunSaveResult {
  let cursor: string | null;
  let fromLegacyKey = false;
  try {
    cursor = window.localStorage.getItem(RUN_SAVE_KEY);
    if (cursor === null) {
      cursor = window.localStorage.getItem(LEGACY_RUN_SAVE_KEY);
      fromLegacyKey = cursor !== null;
    }
  } catch { return { kind: 'unavailable', cursor: null }; }
  if (cursor === null) return { kind: 'empty', cursor: null };
  try {
    const data: unknown = JSON.parse(cursor);
    if (!record(data) || !positive(data.version)) return { kind: 'invalid', cursor };
    if (![1, 2, SAVE_VERSION].includes(data.version as number)) return { kind: 'incompatible', cursor };
    if (!positive(data.savedAt) || (data.savedAt as number) > 8640000000000000) return { kind: 'invalid', cursor };
    const version = data.version as number;
    const rules = version === 1 ? legacyRunRules : version === 2 ? versionTwoRunRules : runRules;
    if (!hasValidRunShape(data.run, rules)) return { kind: 'invalid', cursor };
    const source = data.run as Record<string, unknown>;
    const run = snapshotRun({
      ...source,
      postureComboCount: typeof source.postureComboCount === 'number' ? source.postureComboCount : 0,
      pendingParry: typeof source.pendingParry === 'boolean' ? source.pendingParry : false,
      playerGuardPostureCost: typeof source.playerGuardPostureCost === 'number' ? source.playerGuardPostureCost : 0,
      enemyGuardPostureCost: typeof source.enemyGuardPostureCost === 'number' ? source.enemyGuardPostureCost : 0,
    } as unknown as RunSnapshot);
    if (!validRun(run)) return { kind: 'invalid', cursor };
    if (version === SAVE_VERSION && !fromLegacyKey) return { kind: 'ready', run, savedAt: data.savedAt as number, cursor };

    const migratedCursor = JSON.stringify({ version: SAVE_VERSION, savedAt: data.savedAt, run });
    try {
      if (window.localStorage.getItem(RUN_SAVE_KEY) === null || !fromLegacyKey) {
        window.localStorage.setItem(RUN_SAVE_KEY, migratedCursor);
        return { kind: 'ready', run, savedAt: data.savedAt as number, cursor: migratedCursor };
      }
    } catch { return { kind: 'ready', run, savedAt: data.savedAt as number, cursor: null }; }
    return readRunSave();
  } catch { return { kind: 'invalid', cursor }; }
}

export function writeRunSave(state: RunSnapshot, expectedCursor: string | null): { status: SaveStatus; cursor: string | null } {
  try {
    const currentCursor = window.localStorage.getItem(RUN_SAVE_KEY);
    const matchesLegacyCursor = currentCursor === null && expectedCursor !== null
      && window.localStorage.getItem(LEGACY_RUN_SAVE_KEY) === expectedCursor;
    if (currentCursor !== expectedCursor && !matchesLegacyCursor) return { status: 'conflict', cursor: expectedCursor };
    const run = snapshotRun(state);
    if (!validRun(run)) return { status: 'error', cursor: expectedCursor };
    const cursor = JSON.stringify({ version: SAVE_VERSION, savedAt: Date.now(), run });
    window.localStorage.setItem(RUN_SAVE_KEY, cursor);
    return { status: 'saved', cursor };
  } catch { return { status: 'error', cursor: expectedCursor }; }
}
