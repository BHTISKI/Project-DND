import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { useGameStore } from './store';
import { LEGACY_RUN_SAVE_KEY, readRunSave, RUN_SAVE_KEY, snapshotRun, writeRunSave } from './runPersistence';
import { sampleCardDefs } from '../types/game';
import { upgradedCard } from '../utils/game';
import { generateAvailableNodes } from '../engine/runMap';

const state = () => useGameStore.getState();
beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  useGameStore.setState(useGameStore.getInitialState(), true);
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});
afterEach(() => vi.restoreAllMocks());

// These regression cases deliberately exercise pre-campaign runs; campaign saves have a separate suite.
function start() {
  expect(state().startNewGame('Selim', null)).toBe(true);
  useGameStore.setState({ campaign: undefined, availableNodes: generateAvailableNodes(0) });
  state().retrySave();
}

function legacyPayloadFromCurrent() {
  const payload = JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!);
  payload.version = 1;
  const run = payload.run;
  const piles = [run.deck, run.hand, run.discardPile, run.exhaustedPile, run.rewardOptions, run.draftOptions];
  for (const cardValue of piles.flat()) {
    cardValue.zarTuru = 'd6';
    for (const effect of cardValue.effects ?? []) {
      if (effect.kind === 'attack' || effect.kind === 'damage') {
        effect.die = 'd6';
        delete effect.amount;
      }
    }
  }
  const migratedCard = piles.flat()[0];
  migratedCard.effects = [{ kind: 'attack', die: 'd6', damageBonus: 1 }];
  const makeLegacyCharacter = (character: Record<string, any>) => {
    character.zirhSinifi = 10;
    character.gucCarpani = character.hasarBonusu;
    character.advantageCounter = 1;
    character.disadvantageCounter = 2;
    character.denge = character.currentPosture;
    character.maksimumDenge = character.maxPosture;
    character.staggered = character.isBroken;
    delete character.hasarBonusu;
    delete character.currentPosture;
    delete character.maxPosture;
    delete character.postureRecoveryRate;
    delete character.postureDamageTaken;
    delete character.isBroken;
  };
  makeLegacyCharacter(run.player);
  makeLegacyCharacter(run.enemy);
  run.baseEnemyIntent = {
    type: 'attack', estimatedDamage: 12, criticalDamage: 20,
    action: { kind: 'critical-execution', damage: 12 },
  };
  run.battleLogs = ['Normal kayıt', 'D20 sonucu: KRİTİK'];
  return { payload, migratedCardId: migratedCard.id };
}

function enterCombat() {
  state().selectNode(state().availableNodes.find(n => n.type === 'combat')!.id);
  while (state().gamePhase === 'deckBuild') state().chooseDraftCard(state().draftOptions[0].id);
}
function reload() {
  expect(state().saveStatus).toBe('saved');
  const expected = JSON.parse(JSON.stringify(snapshotRun(state())));
  const stored = localStorage.getItem(RUN_SAVE_KEY);
  const randomCalls = vi.mocked(Math.random).mock.calls.length;
  useGameStore.setState(useGameStore.getInitialState(), true);
  expect(state().resumeGame()).toBe(true);
  state().initializeGame();
  expect(snapshotRun(state())).toEqual(expected);
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBe(stored);
  expect(vi.mocked(Math.random).mock.calls.length).toBe(randomCalls);
  return expected;
}

it('starts with one saved slot and preserves existing meta counters', () => {
  localStorage.setItem('metaGold', '80'); localStorage.setItem('metaVictories', '8');
  start(); reload();
  expect(state().metaGold).toBe(80);
  expect(state().metaVictories).toBe(8);
  expect(state().playerName).toBe('Selim');
});

it('resumes a partly chosen draft without generating a new pool or duplicating the pick', () => {
  start();
  state().selectNode(state().availableNodes[0].id);
  state().chooseDraftCard(state().draftOptions[0].id);
  reload();
  expect(state().draftPicks).toBe(1);
  state().chooseDraftCard(state().draftOptions[0].id);
  state().chooseDraftCard(state().draftOptions[0].id);
  expect(state().gamePhase).toBe('combat');
  expect(state().hand.length + state().deck.length).toBe(10);
  reload();
});

it('keeps energy, combo, exhaustion, curses, statuses, intent and pile order mid-turn', () => {
  start(); enterCombat();
  const named = (name: string, id: string) => ({ ...sampleCardDefs.find(c => c.isim === name)!, id });
  useGameStore.setState({
    enemy: { ...state().enemy, mevcutCan: 100, maksimumCan: 100 },
    player: { ...state().player, mevcutCan: 8, currentPosture: 4 },
    deck: [named('Hızlı Saldırı', 'draw-1'), named('Kırık Ruh', 'curse-1')],
    hand: [named('Son Kıvılcım', 'energy'), named('Sabırlı Muhafız', 'retain'), named('Zincir Darbesi', 'finisher')],
    discardPile: [named('Kalkan Sihri', 'discard-1')],
    playerStatuses: [{ id: 'poisoned', duration: 3, stacks: 2, value: 1 }],
    enemyStatuses: [{ id: 'weakened', duration: 2, stacks: 1, value: 2 }],
    apocalypseTurns: 2, apocalypseHpPercent: 25,
  });
  state().playCard('energy');
  expect(state().currentEnergy).toBe(4);
  expect(state().exhaustedPile[0].id).toBe('energy');
  reload();
  state().playCard('retain');
  expect(state().comboCount).toBe(1);
  expect(state().playerBlock).toBe(3);
  reload();
  state().playCard('finisher');
  expect(state().comboCount).toBe(2);
  reload();
  state().endTurn();
  expect(state().round).toBe(2);
  reload();
});

it('preserves Broken, Parry, Guard costs and posture momentum mid-turn', () => {
  start(); enterCombat();
  useGameStore.setState({
    enemy: { ...state().enemy, currentPosture: state().enemy.maxPosture, isBroken: true },
    pendingParry: true,
    postureComboCount: 3,
    playerGuardPostureCost: 15,
    enemyGuardPostureCost: 20,
  });
  state().retrySave();
  reload();
  expect(state().enemy).toMatchObject({ currentPosture: state().enemy.maxPosture, isBroken: true });
  expect(state()).toMatchObject({ pendingParry: true, postureComboCount: 3,
    playerGuardPostureCost: 15, enemyGuardPostureCost: 20 });
});

it('migrates a version 2 posture ratio and fills new card and turn metadata', () => {
  start();
  const payload = JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!);
  payload.version = 2;
  const migrateCharacter = (character: Record<string, any>, current: number, maximum: number, broken: boolean) => {
    character.denge = current;
    character.maksimumDenge = maximum;
    character.staggered = broken;
    delete character.currentPosture;
    delete character.maxPosture;
    delete character.postureRecoveryRate;
    delete character.postureDamageTaken;
    delete character.isBroken;
  };
  migrateCharacter(payload.run.player, 40, 80, true);
  migrateCharacter(payload.run.enemy, 35, 70, false);
  delete payload.run.postureComboCount;
  delete payload.run.pendingParry;
  delete payload.run.playerGuardPostureCost;
  delete payload.run.enemyGuardPostureCost;
  for (const cardValue of [...payload.run.deck, ...payload.run.hand]) {
    delete cardValue.postureDamage;
    delete cardValue.postureCostOnBlock;
    delete cardValue.isRanged;
    delete cardValue.isParry;
  }
  localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(payload));

  const result = readRunSave();
  expect(result.kind).toBe('ready');
  if (result.kind !== 'ready') return;
  expect(result.run.player).toMatchObject({ maxPosture: 100, currentPosture: 100, isBroken: true });
  expect(result.run.enemy).toMatchObject({ maxPosture: 80, currentPosture: 40, isBroken: false });
  expect(result.run).toMatchObject({ postureComboCount: 0, pendingParry: false,
    playerGuardPostureCost: 0, enemyGuardPostureCost: 0 });
  expect([...result.run.deck, ...result.run.hand].every(cardValue =>
    typeof cardValue.postureDamage === 'number' && typeof cardValue.isRanged === 'boolean')).toBe(true);
  expect(JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!).version).toBe(4);
});

it('does not give victory rewards or persistent gold twice after reload', () => {
  start(); enterCombat();
  state().applyDamage('enemy', 1000);
  expect(state().rewardOptions).toHaveLength(3);
  const gold = state().gold;
  reload(); reload();
  expect(state().gold).toBe(gold);
  expect(state().victoryCount).toBe(1);
  expect(state().metaVictories).toBe(1);
  expect(state().metaGold).toBe(10);
  state().addRewardCardToDeck(state().rewardOptions[0].id);
  reload();
  expect(state().gamePhase).toBe('shop');
  expect(state().rewardOptions).toHaveLength(0);
});

it('persists purchases and upgrades once and resumes the same shop', () => {
  start();
  state().selectNode(state().availableNodes.find(n => n.type === 'shop')!.id);
  useGameStore.setState({ gold: 200 });
  state().buyCard('shop-7');
  const bought = state().deck.at(-1)!;
  state().upgradeCard(bought.id);
  const gold = state().gold;
  reload();
  expect(state().deck.find(c => c.id === bought.id)?.isUpgraded).toBe(true);
  expect(state().gold).toBe(gold);
  state().startNextCombat();
  expect(state().runFloor).toBe(1);
  reload();
});

it.each(['event', 'rest'] as const)('resumes %s before and after choosing', phase => {
  start(); state().selectNode(state().availableNodes.find(n => n.type === 'shop')!.id); state().startNextCombat();
  state().selectNode(state().availableNodes.find(n => n.type === phase)!.id);
  reload();
  if (phase === 'event') state().resolveEvent(2);
  else state().resolveRest(2);
  reload();
  expect(state().runFloor).toBe(2);
  expect(state().pendingPlayerSkip).toBe(phase === 'event');
  if (phase === 'event') {
    enterCombat();
    expect(state().pendingPlayerSkip).toBe(false);
    expect(state().round).toBe(2);
    reload();
    expect(state().round).toBe(2);
  }
});

it('saves boss combat and its reward without upgrading the boss again on resume', () => {
  start();
  state().selectNode(state().availableNodes.find(n => n.type === 'shop')!.id); state().startNextCombat();
  for (let i = 0; i < 2; i++) {
    state().selectNode(state().availableNodes.find(n => n.type === 'rest')!.id); state().resolveRest(2);
  }
  state().selectNode(state().availableNodes.find(n => n.type === 'boss')!.id);
  while (state().gamePhase === 'deckBuild') state().chooseDraftCard(state().draftOptions[0].id);
  reload();
  expect(state().nodeType).toBe('boss');
  state().applyDamage('enemy', 1000);
  expect(state().rewardOptions).toHaveLength(4);
  reload();
  expect(state().runFloor).toBe(4);
});

it('saves defeat instead of leaving an earlier living character to reload', () => {
  start(); enterCombat();
  state().applyDamage('player', 1000);
  reload();
  expect(state().gamePhase).toBe('gameOver');
  expect(state().player.mevcutCan).toBe(0);
  state().restartGame();
  reload();
  expect(state().runFloor).toBe(0);
  expect(state().player.mevcutCan).toBe(24);
});

it('round-trips every current card and upgrade, including optional mechanics', () => {
  start();
  useGameStore.setState({ hand: [], deck: sampleCardDefs.flatMap((def, i) => {
    const card = { ...def, id: `base-${i}` };
    const upgrade = upgradedCard(card);
    return upgrade ? [card, { ...upgrade, id: `upgrade-${i}` }] : [card];
  }) });
  state().retrySave(); reload();
});

it.each([
  ['broken JSON', () => '{'],
  ['missing field', (data: Record<string, any>) => { delete data.run.baseEnemyIntent; return JSON.stringify(data); }],
  ['bad card', (data: Record<string, any>) => { data.run.hand[0].effects = [{}]; return JSON.stringify(data); }],
  ['duplicate cards', (data: Record<string, any>) => { data.run.deck.push(data.run.hand[0]); return JSON.stringify(data); }],
  ['invalid intent', (data: Record<string, any>) => { data.run.enemyIntent = { type: 'attack', action: { kind: 'unknown' } }; return JSON.stringify(data); }],
  ['zero HP without defeat', (data: Record<string, any>) => { data.run.player.mevcutCan = 0; return JSON.stringify(data); }],
])('rejects %s without deleting or partially restoring the save', (_label, corrupt) => {
  start();
  const raw = corrupt(JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!));
  localStorage.setItem(RUN_SAVE_KEY, raw);
  useGameStore.setState(useGameStore.getInitialState(), true);
  expect(readRunSave().kind).toBe('invalid');
  expect(state().resumeGame()).toBe(false);
  expect(state().initialized).toBe(false);
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBe(raw);
});

it('keeps incompatible versions and excludes injected actions and transient fields', () => {
  start();
  const data = JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!);
  data.version = 99;
  localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(data));
  expect(readRunSave().kind).toBe('incompatible');
  data.version = 2;
  data.run.playCard = 'broken'; data.run.initialized = false; data.run.playerDialog = [{ text: 'old', timestamp: 1 }];
  localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(data));
  useGameStore.setState(useGameStore.getInitialState(), true);
  expect(state().resumeGame()).toBe(true);
  expect(typeof state().playCard).toBe('function');
  expect(state().initialized).toBe(true);
  expect(state().playerDialog).toEqual([]);
});



it.each(['invalid', 'incompatible'] as const)(
  'can start a new Makara run when only an %s old save exists', kind => {
    start();
    const current = localStorage.getItem(RUN_SAVE_KEY)!;
    const legacyRaw = kind === 'invalid'
      ? '{broken'
      : JSON.stringify({ ...JSON.parse(current), version: 99 });
    localStorage.removeItem(RUN_SAVE_KEY);
    localStorage.setItem(LEGACY_RUN_SAVE_KEY, legacyRaw);
    useGameStore.setState(useGameStore.getInitialState(), true);

    const result = readRunSave();
    expect(result.kind).toBe(kind);
    expect(state().startNewGame('Yeni', result.cursor)).toBe(true);
    expect(JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!).run.playerName).toBe('Yeni');
    expect(localStorage.getItem(LEGACY_RUN_SAVE_KEY)).toBe(legacyRaw);
  },
);

it('moves an old run into the Makara save slot and removes retired combat fields', () => {
  start();
  const { payload, migratedCardId } = legacyPayloadFromCurrent();
  const legacyRaw = JSON.stringify(payload);
  localStorage.removeItem(RUN_SAVE_KEY);
  localStorage.setItem(LEGACY_RUN_SAVE_KEY, legacyRaw);

  const result = readRunSave();
  expect(result.kind).toBe('ready');
  if (result.kind !== 'ready') throw new Error('Legacy save could not be migrated');
  const migratedCard = [...result.run.deck, ...result.run.hand].find(cardValue => cardValue.id === migratedCardId)!;
  expect(migratedCard.effects?.[0]).toMatchObject({ kind: 'attack', amount: 4, damageBonus: 1 });
  expect(migratedCard).not.toHaveProperty('zarTuru');
  expect(result.run.playerStatuses).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'empowered', duration: 1, stacks: 1 }),
    expect.objectContaining({ id: 'weakened', duration: 1, stacks: 2 }),
  ]));
  expect(result.run.player).toHaveProperty('hasarBonusu');
  expect(result.run.player).not.toHaveProperty('zirhSinifi');
  expect(result.run.player).not.toHaveProperty('gucCarpani');
  expect(result.run.baseEnemyIntent).toMatchObject({ action: { kind: 'execution', damage: 12 } });
  expect(result.run.baseEnemyIntent).not.toHaveProperty('criticalDamage');
  expect(result.run.battleLogs).toEqual(['Normal kayıt']);
  expect(JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!).version).toBe(4);
  expect(localStorage.getItem(LEGACY_RUN_SAVE_KEY)).toBe(legacyRaw);
});



it('preserves an existing status total while adding old pending counters', () => {
  start();
  const { payload } = legacyPayloadFromCurrent();
  payload.run.playerStatuses = [{ id: 'empowered', duration: 2, stacks: 1, value: 2 }];
  payload.run.player.advantageCounter = 1;
  payload.run.player.disadvantageCounter = 0;
  localStorage.removeItem(RUN_SAVE_KEY);
  localStorage.setItem(LEGACY_RUN_SAVE_KEY, JSON.stringify(payload));

  const result = readRunSave();
  expect(result.kind).toBe('ready');
  if (result.kind !== 'ready') throw new Error('Legacy save could not be migrated');
  expect(result.run.playerStatuses).toContainEqual({
    id: 'empowered', duration: 2, stacks: 2, value: 1.5,
  });
});

it('uses a card-level legacy damage value when the old attack effect has no own value', () => {
  start();
  const { payload, migratedCardId } = legacyPayloadFromCurrent();
  const cardValue = [...payload.run.deck, ...payload.run.hand].find((candidate: Record<string, any>) => candidate.id === migratedCardId)!;
  cardValue.zarTuru = 'd8';
  cardValue.effects = [{ kind: 'attack' }];
  localStorage.removeItem(RUN_SAVE_KEY);
  localStorage.setItem(LEGACY_RUN_SAVE_KEY, JSON.stringify(payload));

  const result = readRunSave();
  expect(result.kind).toBe('ready');
  if (result.kind !== 'ready') throw new Error('Legacy save could not be migrated');
  const migrated = [...result.run.deck, ...result.run.hand].find(candidate => candidate.id === migratedCardId)!;
  expect(migrated.effects?.[0]).toMatchObject({ kind: 'attack', amount: 5 });
});

it('normalizes old upgraded variable block values to the current upgrade result', () => {
  start();
  const { payload, migratedCardId } = legacyPayloadFromCurrent();
  const cardValue = [...payload.run.deck, ...payload.run.hand].find((candidate: Record<string, any>) => candidate.id === migratedCardId)!;
  cardValue.isUpgraded = true;
  cardValue.zarTuru = 'd4';
  cardValue.effects = [{ kind: 'block', die: 'd6' }];
  localStorage.removeItem(RUN_SAVE_KEY);
  localStorage.setItem(LEGACY_RUN_SAVE_KEY, JSON.stringify(payload));

  const result = readRunSave();
  expect(result.kind).toBe('ready');
  if (result.kind !== 'ready') throw new Error('Legacy save could not be migrated');
  const migrated = [...result.run.deck, ...result.run.hand].find(candidate => candidate.id === migratedCardId)!;
  expect(migrated.effects?.[0]).toMatchObject({ kind: 'block', amount: 5 });
});

it('prefers an existing Makara save over the old save slot', () => {
  start();
  const current = JSON.parse(localStorage.getItem(RUN_SAVE_KEY)!);
  const legacy = structuredClone(current);
  legacy.run.playerName = 'Eski';
  legacy.run.player.isim = 'Eski';
  localStorage.setItem(LEGACY_RUN_SAVE_KEY, JSON.stringify(legacy));
  current.run.playerName = 'Yeni';
  current.run.player.isim = 'Yeni';
  localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(current));

  const result = readRunSave();
  expect(result.kind).toBe('ready');
  if (result.kind === 'ready') expect(result.run.playerName).toBe('Yeni');
});

it('keeps the old save readable when writing the migrated save is unavailable', () => {
  start();
  const { payload } = legacyPayloadFromCurrent();
  const legacyRaw = JSON.stringify(payload);
  localStorage.removeItem(RUN_SAVE_KEY);
  localStorage.setItem(LEGACY_RUN_SAVE_KEY, legacyRaw);
  const setItem = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === RUN_SAVE_KEY) throw new DOMException('Full', 'QuotaExceededError');
    setItem.call(this, key, value);
  });

  const result = readRunSave();
  expect(result).toMatchObject({ kind: 'ready', cursor: null });
  expect(localStorage.getItem(LEGACY_RUN_SAVE_KEY)).toBe(legacyRaw);
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBeNull();
});

it('keeps the last good save on write failure and can retry the latest state', () => {
  start();
  const original = localStorage.getItem(RUN_SAVE_KEY);
  const setItem = Storage.prototype.setItem;
  const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === RUN_SAVE_KEY) throw new DOMException('Full', 'QuotaExceededError');
    setItem.call(this, key, value);
  });
  state().selectNode(state().availableNodes[0].id);
  expect(state().saveStatus).toBe('error');
  expect(state().gamePhase).toBe('deckBuild');
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBe(original);
  fail.mockRestore();
  state().retrySave(); reload();
  expect(state().gamePhase).toBe('deckBuild');
});

it('handles storage access denial and still lets a new game start', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(readRunSave().kind).toBe('unavailable');
  expect(state().startNewGame('Selim', null)).toBe(true);
  expect(state().saveStatus).toBe('error');
  expect(state().initialized).toBe(true);
});

it('keeps earned meta in the run even when the separate legacy meta write fails', () => {
  start(); enterCombat();
  const setItem = Storage.prototype.setItem;
  const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (key === 'metaGold' || key === 'metaVictories') throw new Error('blocked');
    setItem.call(this, key, value);
  });
  state().applyDamage('enemy', 1000);
  reload();
  expect(state().metaGold).toBe(10);
  expect(state().metaVictories).toBe(1);
  fail.mockRestore();
  const cursor = state().saveCursor;
  useGameStore.setState(useGameStore.getInitialState(), true);
  expect(state().startNewGame('Deniz', cursor)).toBe(true);
  expect(state().metaGold).toBe(10);
  expect(state().metaVictories).toBe(1);
});

it('does not award persistent currency when a stale tab wins a battle', () => {
  start(); enterCombat();
  const other = writeRunSave({ ...state(), metaGold: 100, metaVictories: 10 }, state().saveCursor);
  localStorage.setItem('metaGold', '100'); localStorage.setItem('metaVictories', '10');
  state().applyDamage('enemy', 1000);
  expect(state().saveStatus).toBe('conflict');
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBe(other.cursor);
  expect(localStorage.getItem('metaGold')).toBe('100');
  expect(localStorage.getItem('metaVictories')).toBe('10');
});

it('does not overwrite another tab’s newer save with stale actions or a stale new-game confirmation', () => {
  start();
  const cursor = state().saveCursor;
  const other = writeRunSave({ ...state(), gold: 99 }, cursor);
  expect(other.status).toBe('saved');
  state().selectNode(state().availableNodes[0].id);
  expect(state().saveStatus).toBe('conflict');
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBe(other.cursor);
  expect(state().startNewGame('Başka', cursor)).toBe(false);
  expect(state().resumeGame()).toBe(true);
  expect(state().gold).toBe(99);
  expect(state().saveStatus).toBe('saved');
});
