import type { GameState } from '../state/store';
import type { Card, Character, EnemyIntent, StatusEffect } from '../types/game';
import { sampleCardDefs } from '../types/game';
import { decideEnemyBehavior, actionFromIntent } from './enemyBehavior';
import { generateEnemyIntent } from './enemyArchetypes';
import { ageStatuses, addStatus, poisonTick, statusValue, statusNames } from './statuses';
import { drawFromPiles } from './cardPiles';
import { generateRandomId } from '../utils/id';
import { retainHand } from '../mechanics/retain';
import { routePlayedCard } from '../mechanics/exhaust';
import { advanceCombo, cardCategory, finisherBonus } from '../mechanics/finisher';
import { applyPostureDamage, canExecute, cardUnavailableReason, isMeleeAction, isMeleeCard,
  momentumMultiplier, POSTURE_CONFIG, recoverPostureOnTurnEnd, resolveExecute, withEnemyPosture } from '../mechanics/posture';

export function damageWithStatuses(amount: number, attacker: StatusEffect[], target: StatusEffect[]): number {
  const modified = Math.max(0, amount + statusValue(attacker, 'empowered') - statusValue(attacker, 'weakened'));
  return Math.ceil(modified * (1 + 0.25 * statusValue(target, 'vulnerable')));
}
export function hitCharacter(character: Character, block: number, amount: number, ignoresBlock = false) {
  const absorbed = ignoresBlock ? 0 : Math.min(block, Math.max(0, amount));
  const damage = Math.max(0, amount - absorbed);
  return {
    character: { ...character, mevcutCan: Math.max(0, character.mevcutCan - damage) },
    block: block - absorbed, damage, absorbed,
  };
}

type CombatSide = 'player' | 'enemy';
function withPostureDamage(state: GameState, target: CombatSide, amount: number, multiplier = 1, hpSnapshot?: Character): GameState {
  if (amount <= 0 || state[target].mevcutCan <= 0) return state;
  const previous = state[target];
  const statuses = target === 'player' ? state.playerStatuses : state.enemyStatuses;
  const exposed = 1 + statusValue(statuses, 'postureExposed');
  const calculated = applyPostureDamage(hpSnapshot ? { ...previous, mevcutCan: hpSnapshot.mevcutCan } : previous, amount, multiplier * exposed);
  const character = { ...previous, currentPosture: calculated.currentPosture, isBroken: calculated.isBroken };
  if (character.currentPosture === previous.currentPosture && character.isBroken === previous.isBroken) return state;
  const broke = !previous.isBroken && character.isBroken;
  const blockKey = target === 'player' ? 'playerBlock' : 'enemyBlock';
  const costKey = target === 'player' ? 'playerGuardPostureCost' : 'enemyGuardPostureCost';
  return { ...state, [target]: character,
    ...(broke ? { [blockKey]: 0, [costKey]: 0,
      battleLogs: [...state.battleLogs, `${target === 'player' ? 'Oyuncunun' : 'Düşmanın'} duruşu kırıldı.`] } : {}) };
}

function enemyExecuteKind(state: GameState): 'minion' | 'elite' | 'boss' {
  const encounter = state.nodeType ?? state.currentNode;
  return encounter === 'elite' ? 'elite' : encounter === 'boss' ? 'boss' : 'minion';
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
  const action = withEnemyPosture(decision.action, state.enemyArchetype);
  const attacks = ['attack', 'execution', 'desperation-attack'].includes(action.kind);
  const incoming = damageWithStatuses(action.damage ?? 0, state.enemyStatuses, state.playerStatuses);
  const executeThreat = !state.enemySkipNextTurn && state.player.isBroken && isMeleeAction(action);
  const multiplier = executeThreat ? POSTURE_CONFIG.execute.playerDamageMultiplier : 1;
  const suppressed = state.enemySkipNextTurn;
  const hidden = decision.telegraph.deceptive;
  const intent: EnemyIntent = {
    type: suppressed ? 'defend' : decision.telegraph.type,
    telegraph: suppressed ? { type: 'defend', label: 'Bu tur hamle yapamaz', icon: '◈' }
      : executeThreat ? { type: 'attack', label: 'İnfaz saldırısı', icon: '☠' } : decision.telegraph,
    action: suppressed ? { kind: 'pass' } : action,
    effectKey: suppressed ? 'pass' : action.kind,
    estimatedDamage: !hidden && !suppressed && (attacks || action.kind === 'magic') ? incoming * multiplier : undefined,
    estimatedBlock: !suppressed && action.kind === 'defend' ? (action.block ?? 0) + statusValue(state.enemyStatuses, 'fortified') : undefined,
    estimatedHeal: !hidden && !suppressed && action.kind === 'heal'
      ? Math.min(action.damage ?? 4, state.enemy.maksimumCan - state.enemy.mevcutCan) : undefined,
    warning: suppressed ? undefined : executeThreat ? `İnfaz bloklanamaz${incoming * multiplier >= state.player.mevcutCan ? ' ve ölümcül' : ''}.`
      : hidden ? 'Niyet belirsiz: farklı bir hamle yapabilir.'
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
  const unavailable = cardUnavailableReason(state, card);
  if (unavailable) {
    const reason = unavailable === 'Yeterli enerji yok' ? `Yetersiz enerji! ${card.isim} için ${card.manaBedeli} enerji gerekiyor.` : `${unavailable}.`;
    return { ...state, battleLogs: [...state.battleLogs, reason] };
  }
  const logs: string[] = [];
  let s: GameState = { ...state, hand: state.hand.filter(c => c.id !== cardId),
    currentEnergy: state.currentEnergy - card.manaBedeli,
    lastPlayerSignal: card.isParry || card.tags?.includes('parry') ? 'parry' : card.tags?.includes('retaliation') ? 'retaliation' : state.lastPlayerSignal,
    pendingParry: card.isParry || state.pendingParry };
  const meleeCard = isMeleeCard(card);
  s.postureComboCount = meleeCard ? state.postureComboCount + 1 : 0;
  const executes = meleeCard && canExecute(s.enemy);
  const tag = cardCategory(card);
  const previous = state.comboChain.at(-1);
  if (previous && previous !== tag) s = { ...s, comboCount: advanceCombo(s.comboCount, previous, tag),
    nextDamageBonus: s.nextDamageBonus + (tag === 'attack' ? previous === 'skill' ? 2 : previous === 'defend' ? 1 : 0 : 0) };
  s.comboChain = [tag];
  let finisherDamage = executes ? 0 : finisherBonus(card, s.comboCount);
  if (finisherDamage) logs.push(`Bitirici: +${finisherDamage} hasar (kombo ${s.comboCount}).`);
  if (card.apocalypse) {
    s.apocalypseTurns = card.apocalypse.delay;
    s.apocalypseHpPercent = card.apocalypse.hpPercent;
    logs.push(`Kıyamet sayacı: ${card.apocalypse.delay} tur; bedel mevcut canın %${card.apocalypse.hpPercent}'i.`);
  }
  if (executes) {
    const result = resolveExecute(s.enemy, enemyExecuteKind(s));
    s = { ...s, enemy: result.character, enemyBlock: 0, enemyGuardPostureCost: 0, postureComboCount: 0,
      enemyStatuses: result.exposure
        ? [...s.enemyStatuses.filter(status => status.id !== 'postureExposed'), result.exposure]
        : s.enemyStatuses };
    logs.push(`İnfaz: ${result.damage} hasar${result.character.mevcutCan <= 0 ? '; düşman yenildi' : ''}.`);
  }
  let postureApplied = false;
  let guardCostQueued = false;
  for (const effect of card.effects ?? []) {
    switch (effect.kind) {
      case 'attack':
      case 'damage': {
        if (executes) break;
        const bonus = finisherDamage;
        finisherDamage = 0;
        const base = Math.max(0, (effect.amount ?? 0) + card.baseHasar + s.player.hasarBonusu
          + (effect.damageBonus ?? 0) + s.nextDamageBonus + bonus);
        const damage = damageWithStatuses(base, s.playerStatuses, s.enemyStatuses);
        const defenderBeforeHit = s.enemy;
        const hit = hitCharacter(s.enemy, s.enemyBlock, damage);
        s = { ...s, enemy: hit.character, enemyBlock: hit.block, nextDamageBonus: 0 };
        if (!postureApplied && meleeCard && hit.character.mevcutCan > 0) {
          const guardCost = hit.absorbed > 0 ? s.enemyGuardPostureCost : 0;
          s = withPostureDamage(s, 'enemy', card.postureDamage ?? 0,
            momentumMultiplier(s.postureComboCount), defenderBeforeHit);
          s = withPostureDamage(s, 'enemy', guardCost, 1, defenderBeforeHit);
          if (hit.absorbed > 0) s.enemyGuardPostureCost = 0;
          postureApplied = true;
        }
        logs.push(`${card.isim} ${hit.damage} hasar verdi. (Blok: ${hit.absorbed})`);
        break;
      }
      case 'block': {
        const amount = effect.amount;
        if (effect.target === 'enemy') {
          s.enemyBlock += amount;
          if (!guardCostQueued) s.enemyGuardPostureCost += card.postureCostOnBlock ?? 0;
        } else {
          s.playerBlock += amount;
          if (!guardCostQueued) s.playerGuardPostureCost += card.postureCostOnBlock ?? 0;
        }
        guardCostQueued = true;
        logs.push(`${effect.target === 'enemy' ? 'Düşman' : 'Oyuncu'} ${amount} blok kazandı.`);
        break;
      }
      case 'heal': {
        const target = effect.target ?? 'player';
        const amount = Math.min(effect.amount, s[target].maksimumCan - s[target].mevcutCan);
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
  } else {
    s = { ...s, ...routePlayedCard(s, card) };
    if (card.exhaust) logs.push(`${card.isim} tükendi; savaş sonunda geri döner.`);
  }
  s.battleLogs = [...s.battleLogs, logs.join(' ')];
  s.playerDialog = [{ text: `${card.isim} kartını oynadım!`, timestamp: Date.now() }];
  return refreshEnemyIntent(s);
}

export function resolveTurn(state: GameState, finish: (s: GameState) => GameState): GameState {
  if (state.gamePhase !== 'combat' || !state.isPlayerTurn) return state;
  let s = finish(state);
  if (s.gamePhase !== 'combat') return s;
  // A break caused by this enemy action must survive into the player's response turn.
  const playerWasBroken = s.player.isBroken;
  s = { ...s, playerBlock: s.playerBlock + statusValue(s.playerStatuses, 'fortified') };
  const { retained, discarded } = retainHand(s.hand);
  const cursed = discarded.filter(c => c.onDiscardPenalty);
  const penalty = cursed.reduce((sum, c) => sum + (c.onDiscardPenalty?.amount ?? 0), 0);
  s = { ...s, hand: retained, deck: [...s.deck, ...cursed.filter(c => c.onDiscardPenalty?.returnToDeck)],
    discardPile: [...s.discardPile, ...discarded.filter(c => !c.onDiscardPenalty?.returnToDeck)],
    player: { ...s.player, mevcutCan: Math.max(0, s.player.mevcutCan - penalty) } };
  if (penalty) s.battleLogs = [...s.battleLogs, `Lanet bedeli: ${penalty} saf hasar.`];
  if (retained.length) s.battleLogs = [...s.battleLogs, `Elde tutuldu: ${retained.map(c => c.isim).join(', ')}.`];
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
  const enemyBeforeRecovery = s.enemy.currentPosture;
  s.enemy = recoverPostureOnTurnEnd(s.enemy);
  if (s.enemy.currentPosture < enemyBeforeRecovery) s.battleLogs = [...s.battleLogs,
    `Düşman dengesi ${enemyBeforeRecovery - s.enemy.currentPosture} azaldı.`];
  // Resolve the published action; never roll another decision here.
  const action = withEnemyPosture(actionFromIntent(state.enemyIntent), state.enemyArchetype);
  const skipped = state.enemySkipNextTurn;
  let parrySucceeded = false;
  s.enemyBlock = 0;
  s.enemyGuardPostureCost = 0;
  if (!skipped && s.pendingParry && !playerWasBroken) {
    if (isMeleeAction(action)) {
      s = withPostureDamage(s, 'enemy', POSTURE_CONFIG.parry.successDamage);
      parrySucceeded = true;
      s.battleLogs = [...s.battleLogs, 'Savuşturma başarılı: düşman saldırısı engellendi.'];
    } else {
      s = withPostureDamage(s, 'player', POSTURE_CONFIG.parry.failureDamage);
      s.battleLogs = [...s.battleLogs, 'Savuşturma başarısız: oyuncunun dengesi sarsıldı.'];
    }
  }
  s.pendingParry = false;
  if (skipped) {
    s = { ...s, battleLogs: [...s.battleLogs, 'Düşman turunu atladı.'] };
  } else if (parrySucceeded) {
    // The published melee action was fully deflected.
  } else if (['attack', 'execution', 'desperation-attack', 'magic'].includes(action.kind)) {
    const amount = damageWithStatuses(action.damage ?? 0, s.enemyStatuses, s.playerStatuses);
    if (playerWasBroken && canExecute(s.player) && isMeleeAction(action)) {
      const result = resolveExecute(s.player, 'player', amount);
      s = { ...s, player: result.character, playerBlock: 0, playerGuardPostureCost: 0,
        battleLogs: [...s.battleLogs, `İnfaz: düşman oyuncuya ${result.damage} hasar vurdu.`] };
      if (result.damage > 0 && Math.random() < 0.3) s.deck = [...s.deck, cursedCard('Körlük Mührü')];
    } else {
      const defenderBeforeHit = s.player;
      const hit = hitCharacter(s.player, s.playerBlock, amount, action.ignoresBlock);
      s = { ...s, player: hit.character, playerBlock: hit.block,
        battleLogs: [...s.battleLogs, `Düşman ${hit.damage} hasar vurdu. (Blok: ${hit.absorbed})`] };
      if (isMeleeAction(action) && hit.character.mevcutCan > 0) {
        s = withPostureDamage(s, 'player', action.postureDamage ?? 0, 1, defenderBeforeHit);
        if (hit.absorbed > 0) {
          s = withPostureDamage(s, 'player', s.playerGuardPostureCost, 1, defenderBeforeHit);
          s.playerGuardPostureCost = 0;
        }
      }
      if (hit.damage > 0 && Math.random() < 0.3) s.deck = [...s.deck, cursedCard('Körlük Mührü')];
    }
    if (action.kind === 'desperation-attack') s.desperationStacks += 1;
  } else if (action.kind === 'defend') {
    s.enemyBlock = (action.block ?? 0) + statusValue(s.enemyStatuses, 'fortified');
    s.enemyGuardPostureCost = action.postureCostOnBlock ?? 0;
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
  const playerNewlyBroken = !playerWasBroken && s.player.isBroken;
  const playerBeforeRecovery = s.player.currentPosture;
  const recoveredPlayer = playerWasBroken && s.player.isBroken ? recoverPostureOnTurnEnd(s.player)
    : !playerWasBroken && !playerNewlyBroken ? recoverPostureOnTurnEnd(s.player) : s.player;
  if (recoveredPlayer.currentPosture < playerBeforeRecovery) s.battleLogs = [...s.battleLogs,
    `Oyuncu dengesi ${playerBeforeRecovery - recoveredPlayer.currentPosture} azaldı.`];
  s = { ...s, player: recoveredPlayer,
    playerStatuses: ageStatuses(s.playerStatuses), enemyStatuses: ageStatuses(s.enemyStatuses),
    playerBlock: 0, playerGuardPostureCost: 0, enemySkipNextTurn: false, currentEnergy: s.maxEnergy, isPlayerTurn: true,
    comboChain: [], comboCount: 0, postureComboCount: 0, nextDamageBonus: 0, lastPlayerSignal: 'none', round: s.round + 1,
    enemyDialog: [{ text: skipped ? 'Bu tur hamle yapamıyorum.' : 'Hamlemi yaptım. Sıra sende.', timestamp: Date.now() }] };
  return prepareEnemyIntent(drawCardsState(s, Math.max(0, s.drawCount - retained.length)));
}
