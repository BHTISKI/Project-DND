import type { GameState } from '../state/store';
import type { Card, Character, EnemyIntent, StatusEffect } from '../types/game';
import { sampleCardDefs } from '../types/game';
import { decideEnemyBehavior, actionFromIntent } from './enemyBehavior';
import { generateEnemyIntent } from './enemyArchetypes';
import { resolveAttackRoll, calculateDamage } from './combatMath';
import { rollDie } from './dice';
import { ageStatuses, addStatus, poisonTick, statusValue, statusNames } from './statuses';
import { drawFromPiles } from './cardPiles';
import { generateRandomId } from '../utils/id';
export { chooseArchetype, createEnemy, generateEnemyIntent } from './enemyArchetypes';

export function rollAttackDie(advantage: number, disadvantage: number, rng: () => number = Math.random): number {
  const first = rollDie(20, rng);
  if (advantage > disadvantage) return Math.max(first, rollDie(20, rng));
  if (disadvantage > advantage) return Math.min(first, rollDie(20, rng));
  return first;
}
export function rollEffectDie(die: string | undefined, fallback = 4): number {
  if (!die || die === 'sabit') return fallback;
  return rollDie(Number(die.replace(/^d/, '')));
}
export function damageWithStatuses(amount: number, attacker: StatusEffect[], target: StatusEffect[]): number {
  const modified = Math.max(0, amount + statusValue(attacker, 'empowered') - statusValue(attacker, 'weakened'));
  return Math.ceil(modified * (1 + 0.25 * statusValue(target, 'vulnerable')));
}
export function hitCharacter(character: Character, block: number, amount: number, ignoresBlock = false) {
  const absorbed = ignoresBlock ? 0 : Math.min(block, Math.max(0, amount));
  const damage = Math.max(0, amount - absorbed) * (character.staggered ? 2 : 1);
  const denge = character.staggered ? 0 : Math.min(character.maksimumDenge ?? 10, (character.denge ?? 0) + damage);
  return {
    character: { ...character, mevcutCan: Math.max(0, character.mevcutCan - damage), denge,
      staggered: character.staggered ? false : denge >= (character.maksimumDenge ?? 10) },
    block: block - absorbed, damage, absorbed,
  };
}
function cursedCard(name: string): Card {
  const def = sampleCardDefs.find(c => c.isim === name);
  if (!def) throw new Error('Bilinmeyen lanet: ' + name);
  return { ...def, id: generateRandomId() };
}
export function drawCardsState(state: GameState, count: number): GameState {
  const { drawn, ...piles } = drawFromPiles(state, count);
  let next = { ...state, ...piles };
  const broken = drawn.filter(c => c.isim === 'Kırık Ruh').length;
  if (broken) {
    const maximum = Math.max(1, state.player.maksimumCan - broken * 2);
    const energy = Math.max(1, state.maxEnergy - broken * 2);
    next = { ...next, maxEnergy: energy, currentEnergy: Math.min(next.currentEnergy, energy),
      player: { ...next.player, maksimumCan: maximum, mevcutCan: Math.min(next.player.mevcutCan, maximum) },
      battleLogs: [...next.battleLogs, `Kırık Ruh: maksimum can ve enerji ${broken * 2} azaldı.`] };
  }
  return next;
}

export function refreshEnemyIntent(state: GameState): GameState {
  if (state.gamePhase !== 'combat' || state.enemy.mevcutCan <= 0) return state;
  const block = state.playerBlock + statusValue(state.playerStatuses, 'fortified');
  const signal = state.lastPlayerSignal === 'parry' || state.lastPlayerSignal === 'retaliation'
    ? state.lastPlayerSignal : block === 0 ? 'no-block' : 'none';
  const decision = decideEnemyBehavior({
    behavior: state.enemyBehavior, enemy: state.enemy, player: state.player, playerBlock: block,
    playerStatuses: state.playerStatuses, previousIntent: state.baseEnemyIntent,
    lastPlayerSignal: signal, desperationStacks: state.desperationStacks, canLie: state.enemyCanLie,
    random: () => state.enemyBehaviorRoll,
  });
  const action = decision.action;
  const attacks = ['attack', 'critical-execution', 'desperation-attack'].includes(action.kind);
  const incoming = damageWithStatuses(action.damage ?? 0, state.enemyStatuses, state.playerStatuses);
  const multiplier = state.player.staggered ? 2 : 1;
  const suppressed = state.enemySkipNextTurn || state.enemy.staggered;
  const hidden = decision.telegraph.deceptive;
  const intent: EnemyIntent = {
    type: suppressed ? 'defend' : decision.telegraph.type,
    telegraph: suppressed ? { type: 'defend', label: 'Bu tur hamle yapamaz', icon: '◈' } : decision.telegraph,
    action: suppressed ? { kind: 'pass' } : action,
    effectKey: suppressed ? 'pass' : action.kind,
    estimatedDamage: !hidden && !suppressed && (attacks || action.kind === 'magic') ? incoming * multiplier : undefined,
    criticalDamage: !hidden && !suppressed && attacks
      ? damageWithStatuses((action.damage ?? 0) * 2, state.enemyStatuses, state.playerStatuses) * multiplier : undefined,
    estimatedBlock: !suppressed && action.kind === 'defend' ? (action.block ?? 0) + statusValue(state.enemyStatuses, 'fortified') : undefined,
    estimatedHeal: !hidden && !suppressed && action.kind === 'heal'
      ? Math.min(action.damage ?? 4, state.enemy.maksimumCan - state.enemy.mevcutCan) : undefined,
    warning: hidden ? 'Niyet belirsiz: farklı bir hamle yapabilir.'
      : action.ignoresBlock ? 'Blok bu saldırıyı durdurmaz.'
      : state.enemyBehavior === 'opportunist' ? 'Blok kazanırsan fırsat saldırısı iptal olur.'
      : state.enemyBehavior === 'paranoid' ? 'Savuşturma kartları bu niyeti değiştirebilir.' : undefined,
  };
  return { ...state, enemyIntent: intent, enemyIntentValue: intent.estimatedDamage ?? intent.estimatedBlock ?? intent.estimatedHeal ?? 0 };
}
export function prepareEnemyIntent(state: GameState): GameState {
  const baseEnemyIntent = generateEnemyIntent(state.enemy, state.enemyArchetype, state.baseEnemyIntent).intent;
  return refreshEnemyIntent({ ...state, baseEnemyIntent, enemyBehaviorRoll: Math.random() });
}

export function resolveCard(state: GameState, cardId: string): GameState {
  if (state.gamePhase !== 'combat' || !state.isPlayerTurn || state.player.mevcutCan <= 0 || state.enemy.mevcutCan <= 0) return state;
  const card = state.hand.find(c => c.id === cardId);
  if (!card) return state;
  const reason = state.player.staggered ? 'Oyuncu kırıldı; önce turunu bitir.'
    : card.onDiscardPenalty ? 'Bu lanetli kart oynanamaz.'
    : state.currentEnergy < card.manaBedeli ? `Yetersiz enerji! ${card.isim} için ${card.manaBedeli} enerji gerekiyor.` : null;
  if (reason) return { ...state, battleLogs: [...state.battleLogs, reason] };
  const logs: string[] = [];
  let s: GameState = { ...state, hand: state.hand.filter(c => c.id !== cardId),
    currentEnergy: state.currentEnergy - card.manaBedeli,
    lastPlayerSignal: card.tags?.includes('parry') ? 'parry' : card.tags?.includes('retaliation') ? 'retaliation' : state.lastPlayerSignal };
  const tag = card.tags?.[0] ?? card.tip;
  const previous = state.comboChain.at(-1);
  if (previous && previous !== tag) s = { ...s, comboCount: s.comboCount + 1,
    nextDamageBonus: s.nextDamageBonus + (tag === 'attack' ? previous === 'skill' ? 2 : previous === 'defend' ? 1 : 0 : 0) };
  s.comboChain = [tag];
  if (card.apocalypse) {
    s.apocalypseTurns = card.apocalypse.delay;
    s.apocalypseHpPercent = card.apocalypse.hpPercent;
    logs.push(`Kıyamet sayacı: ${card.apocalypse.delay} tur; bedel mevcut canın %${card.apocalypse.hpPercent}'i.`);
  }
  for (const effect of card.effects ?? []) {
    switch (effect.kind) {
      case 'attack':
      case 'damage': {
        let critical = false;
        if (effect.kind === 'attack' && !effect.ignoresArmor) {
          const roll = rollAttackDie(s.player.advantageCounter, s.player.disadvantageCounter);
          const result = resolveAttackRoll(roll, s.player.gucCarpani, s.enemy.zirhSinifi);
          s.player = { ...s.player, advantageCounter: Math.max(0, s.player.advantageCounter - 1),
            disadvantageCounter: Math.max(0, s.player.disadvantageCounter - 1) };
          logs.push(`D20: ${roll} + ${s.player.gucCarpani}, zırh ${s.enemy.zirhSinifi}. ${result.hit ? result.critical ? 'KRİTİK!' : 'İsabet.' : 'Iskaladı.'}`);
          if (!result.hit) { s.nextDamageBonus = 0; break; }
          critical = result.critical;
        }
        const die = effect.die ?? (card.zarTuru === 'sabit' ? undefined : card.zarTuru);
        const base = calculateDamage(die && die !== 'sabit' ? rollEffectDie(die) : 0, card.baseHasar, s.player.gucCarpani,
          (effect.damageBonus ?? 0) + s.nextDamageBonus);
        const damage = damageWithStatuses(base * (critical ? 2 : 1), s.playerStatuses, s.enemyStatuses);
        const hit = hitCharacter(s.enemy, s.enemyBlock, damage);
        s = { ...s, enemy: hit.character, enemyBlock: hit.block, nextDamageBonus: 0 };
        logs.push(`${card.isim} ${hit.damage} hasar verdi. (Blok: ${hit.absorbed})`);
        break;
      }
      case 'block': {
        const amount = effect.amount ?? rollEffectDie(effect.die);
        if (effect.target === 'enemy') s.enemyBlock += amount; else s.playerBlock += amount;
        logs.push(`${effect.target === 'enemy' ? 'Düşman' : 'Oyuncu'} ${amount} blok kazandı.`);
        break;
      }
      case 'heal': {
        const target = effect.target ?? 'player';
        const amount = Math.min(effect.amount ?? rollEffectDie(effect.die), s[target].maksimumCan - s[target].mevcutCan);
        s[target] = { ...s[target], mevcutCan: s[target].mevcutCan + amount };
        logs.push(`${effect.target === 'enemy' ? 'Düşman' : 'Oyuncu'} ${amount} can iyileştirdi.`);
        break;
      }
      case 'status': {
        const key = effect.target === 'enemy' ? 'enemyStatuses' : 'playerStatuses';
        s[key] = addStatus(s[key], { id: effect.status, duration: effect.duration, stacks: effect.stacks ?? 1, value: effect.value ?? 1 });
        logs.push(`${statusNames[effect.status]}: ${effect.duration} tur.`);
        break;
      }
      case 'draw': {
        const before = s.hand.length;
        s = drawCardsState(s, effect.amount);
        logs.push(`${s.hand.length - before} kart çekildi.`);
        break;
      }
      case 'energy':
        // maxEnergy is the turn refill, not a cap on card-generated energy.
        s.currentEnergy += effect.amount;
        logs.push(`${effect.amount} enerji kazanıldı.`);
        break;
      case 'skip':
        s.enemySkipNextTurn = true;
        logs.push('Düşman sonraki turunu atlayacak.');
        break;
      case 'advantage':
      case 'disadvantage': {
        const target = effect.target ?? 'player';
        const key = effect.kind === 'advantage' ? 'advantageCounter' : 'disadvantageCounter';
        s[target] = { ...s[target], [key]: s[target][key] + (effect.value ?? 1) };
        logs.push(`${effect.value ?? 1} ${effect.kind === 'advantage' ? 'avantaj' : 'dezavantaj'} uygulandı.`);
        break;
      }
      case 'trash':
      case 'trade': {
        const amount = effect.kind === 'trash' ? effect.amount ?? 1 : effect.trashAmount ?? 1;
        const removed = s.deck.slice(0, amount);
        s.deck = s.deck.slice(removed.length);
        logs.push(`${removed.length} kart kalıcı olarak kaldırıldı${removed.length ? ': ' + removed.map(c => c.isim).join(', ') : ''}.`);
        if (effect.kind === 'trade') {
          const before = s.hand.length;
          s = drawCardsState(s, effect.drawAmount ?? 1);
          logs.push(`${s.hand.length - before} kart çekildi.`);
        }
        break;
      }
      default: {
        const unsupported: never = effect;
        throw new Error('Desteklenmeyen kart etkisi: ' + JSON.stringify(unsupported));
      }
    }
  }
  if (card.onPlayPenalty) {
    s.deck = [...s.deck, cursedCard('Kırık Ruh')];
    logs.push('Şeytanın Kılıcı yerini Kırık Ruh kartına bıraktı.');
  } else s.discardPile = [...s.discardPile, card];
  s.battleLogs = [...s.battleLogs, logs.join(' ')];
  s.playerDialog = [{ text: `${card.isim} kartını oynadım!`, timestamp: Date.now() }];
  return refreshEnemyIntent(s);
}

export function resolveTurn(state: GameState, finish: (s: GameState) => GameState): GameState {
  if (state.gamePhase !== 'combat' || !state.isPlayerTurn) return state;
  let s = finish(state);
  if (s.gamePhase !== 'combat') return s;
  // A player's stagger consumes this turn, then clears even if the enemy passes.
  const wasStaggered = s.player.staggered;
  s = { ...s, playerBlock: s.playerBlock + statusValue(s.playerStatuses, 'fortified') };
  const cursed = s.hand.filter(c => c.onDiscardPenalty);
  const penalty = cursed.reduce((sum, c) => sum + (c.onDiscardPenalty?.amount ?? 0), 0);
  s = { ...s, hand: [], deck: [...s.deck, ...cursed.filter(c => c.onDiscardPenalty?.returnToDeck)],
    discardPile: [...s.discardPile, ...state.hand.filter(c => !c.onDiscardPenalty?.returnToDeck)],
    player: { ...s.player, mevcutCan: Math.max(0, s.player.mevcutCan - penalty) } };
  if (penalty) s.battleLogs = [...s.battleLogs, `Lanet bedeli: ${penalty} saf hasar.`];
  s = finish(s);
  if (s.gamePhase !== 'combat') return s;
  if (s.apocalypseTurns !== null) {
    s.apocalypseTurns -= 1;
    if (s.apocalypseTurns <= 0) {
      const damage = Math.ceil(s.player.mevcutCan * s.apocalypseHpPercent / 100);
      s = { ...s, player: { ...s.player, mevcutCan: Math.max(0, s.player.mevcutCan - damage) },
        apocalypseTurns: null, battleLogs: [...s.battleLogs, `Kıyamet Mührü: ${damage} saf hasar.`] };
    }
  }
  s = finish(s);
  if (s.gamePhase !== 'combat') return s;
  const enemyTick = poisonTick(s.enemyStatuses, 'enemy', s.enemy);
  s = finish({ ...s, enemy: enemyTick.character, battleLogs: [...s.battleLogs, ...enemyTick.log] });
  if (s.gamePhase !== 'combat') return s;
  // Resolve the published action; never roll another decision here.
  const action = actionFromIntent(state.enemyIntent);
  const skipped = state.enemySkipNextTurn || state.enemy.staggered;
  s.enemyBlock = 0;
  if (skipped) {
    s = { ...s, enemy: { ...s.enemy, denge: state.enemy.staggered ? 0 : s.enemy.denge, staggered: false },
      battleLogs: [...s.battleLogs, 'Düşman turunu atladı.'] };
  } else if (['attack', 'critical-execution', 'desperation-attack', 'magic'].includes(action.kind)) {
    const magical = action.kind === 'magic';
    const attack = magical ? { hit: true, critical: false, roll: 0 }
      : resolveAttackRoll(rollAttackDie(s.enemy.advantageCounter, s.enemy.disadvantageCounter), s.enemy.gucCarpani, s.player.zirhSinifi);
    if (!magical) s.enemy = { ...s.enemy, advantageCounter: Math.max(0, s.enemy.advantageCounter - 1),
      disadvantageCounter: Math.max(0, s.enemy.disadvantageCounter - 1) };
    if (attack.hit) {
      const amount = damageWithStatuses((action.damage ?? 0) * (attack.critical ? 2 : 1), s.enemyStatuses, s.playerStatuses);
      const hit = hitCharacter(s.player, s.playerBlock, amount, action.ignoresBlock);
      s = { ...s, player: hit.character, playerBlock: hit.block,
        battleLogs: [...s.battleLogs, `${attack.critical ? 'KRİTİK! ' : ''}Başarılı saldırı: Düşman ${hit.damage} hasar vurdu. (Blok: ${hit.absorbed})`] };
      if (hit.damage > 0 && Math.random() < 0.3) s.deck = [...s.deck, cursedCard('Körlük Mührü')];
    } else s.battleLogs = [...s.battleLogs, `Düşman ıskaladı. (D20: ${attack.roll})`];
    if (action.kind === 'desperation-attack') s.desperationStacks += 1;
  } else if (action.kind === 'defend') {
    s.enemyBlock = (action.block ?? 0) + statusValue(s.enemyStatuses, 'fortified');
    s.battleLogs = [...s.battleLogs, `Düşman ${s.enemyBlock} blok kazandı.`];
  } else if (action.kind === 'heal') {
    const amount = Math.min(action.damage ?? 4, s.enemy.maksimumCan - s.enemy.mevcutCan);
    s.enemy = { ...s.enemy, mevcutCan: s.enemy.mevcutCan + amount };
    s.battleLogs = [...s.battleLogs, `Düşman ${amount} can iyileştirdi.`];
  } else if (action.kind === 'poison') {
    s.playerStatuses = addStatus(s.playerStatuses, { id: 'poisoned', duration: 3, stacks: action.poison ?? 2, value: 1 });
    s.battleLogs = [...s.battleLogs, 'Düşman zehir uyguladı.'];
  } else if (action.kind === 'weaken') {
    s.playerStatuses = addStatus(s.playerStatuses, { id: 'weakened', duration: 2, stacks: 1, value: 1 });
    s.battleLogs = [...s.battleLogs, 'Düşman oyuncuyu güçsüzleştirdi.'];
  } else s.battleLogs = [...s.battleLogs, 'Düşman geri çekildi.'];
  s = finish(s);
  if (s.gamePhase !== 'combat') return s;
  const playerTick = poisonTick(s.playerStatuses, 'player', s.player);
  s = finish({ ...s, player: playerTick.character, battleLogs: [...s.battleLogs, ...playerTick.log] });
  if (s.gamePhase !== 'combat') return s;
  s = { ...s, player: wasStaggered ? { ...s.player, denge: 0, staggered: false } : s.player,
    playerStatuses: ageStatuses(s.playerStatuses), enemyStatuses: ageStatuses(s.enemyStatuses),
    playerBlock: 0, enemySkipNextTurn: false, currentEnergy: s.maxEnergy, isPlayerTurn: true,
    comboChain: [], comboCount: 0, nextDamageBonus: 0, lastPlayerSignal: 'none', round: s.round + 1,
    enemyDialog: [{ text: skipped ? 'Bu tur hamle yapamıyorum.' : 'Hamlemi yaptım. Sıra sende.', timestamp: Date.now() }] };
  return prepareEnemyIntent(drawCardsState(s, s.drawCount));
}
