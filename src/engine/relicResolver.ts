import type { GameState } from '../state/store';
import { relics, type RelicTrigger } from '../content/relics';
import { addStatus } from './statuses';
import { drawCardsState } from './drawCards';
import { applyPostureDamage } from '../mechanics/posture';

// Emanetler birbirlerini tetiklemez; bir oyun olayı tek geçişte çözülür.
export function triggerRelics(state: GameState, trigger: RelicTrigger): GameState {
  if (!state.campaign || state.player.mevcutCan <= 0) return state;
  let s = { ...state, campaign: { ...state.campaign, usedRelics: [...state.campaign.usedRelics] } };
  for (const relic of relics.filter(r => s.campaign.relics.includes(r.id) && r.trigger === trigger)) {
    if (relic.once && s.campaign.usedRelics.includes(relic.id)) continue;
    if (relic.once) s.campaign.usedRelics.push(relic.id);
    switch (relic.effect) {
      case 'block': if (!s.player.isBroken) s.playerBlock += relic.amount; break;
      case 'heal': s.player = { ...s.player, mevcutCan: Math.min(s.player.maksimumCan, s.player.mevcutCan + relic.amount) }; break;
      case 'maxhp': s.player = { ...s.player, maksimumCan: s.player.maksimumCan + relic.amount, mevcutCan: s.player.mevcutCan + relic.amount }; break;
      case 'energy': s.currentEnergy += relic.amount; break;
      case 'gold': s.gold += relic.amount; break;
      case 'draw': s = { ...s, ...drawCardsState(s, relic.amount), campaign: s.campaign }; break;
      case 'poison': s.enemyStatuses = addStatus(s.enemyStatuses, { id: 'poisoned', duration: 2, stacks: relic.amount }); break;
      case 'power': s.playerStatuses = addStatus(s.playerStatuses, { id: 'empowered', duration: 1, stacks: relic.amount }); break;
      case 'posture':
        if (s.enemy.mevcutCan > 0) { s.enemy = applyPostureDamage(s.enemy, relic.amount); if (s.enemy.isBroken) { s.enemyBlock = 0; s.enemyGuardPostureCost = 0; } }
        break;
      case 'cleanse': {
        const harmful = s.playerStatuses.find(e => ['poisoned', 'bleeding', 'weakened', 'vulnerable', 'timeLocked'].includes(e.id));
        if (harmful) s.playerStatuses = s.playerStatuses.map(e => e === harmful ? { ...e, stacks: e.stacks - 1 } : e).filter(e => e.stacks > 0);
        break;
      }
    }
    s.battleLogs = [...s.battleLogs, `${relic.name}: ${relic.detail}`];
  }
  return s;
}
