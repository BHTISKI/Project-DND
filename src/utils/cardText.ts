import type { Card, CardEffect } from '../types/game';
import { statusNames } from '../engine/statuses';

export function rarityName(rarity: Card['rarity']): string {
  return rarity === 'legendary' ? 'Efsanevi' : rarity === 'rare' ? 'Nadir' : rarity === 'uncommon' ? 'Seçkin' : 'Sıradan';
}
function diceAmount(die?: string, amount?: number): string {
  return amount !== undefined ? String(amount) : die && /^d\d+$/.test(die) ? `${die} (1–${die.slice(1)})` : '4';
}
function damageFormula(card: Card, effect: Extract<CardEffect, {kind: 'attack' | 'damage'}>): string {
  const die = effect.die ?? (card.zarTuru === 'sabit' ? undefined : card.zarTuru);
  const fixed = card.baseHasar + (effect.damageBonus ?? 0);
  return [die === 'sabit' ? '' : die, fixed ? String(fixed) : '', 'Güç'].filter(Boolean).join(' + ');
}
export function describeEffect(effect: CardEffect, card: Card): string {
  switch (effect.kind) {
    case 'attack': return `${effect.ignoresArmor ? 'Zırhı yok say' : 'Zırha karşı saldır (D20)'}: ${damageFormula(card, effect)} hasar`;
    case 'damage': return `Doğrudan hasar: ${damageFormula(card, effect)}`;
    case 'block': return `${effect.target === 'enemy' ? 'Düşmana ' : ''}${diceAmount(effect.die, effect.amount)} blok kazan`;
    case 'heal': return `${effect.target === 'enemy' ? 'Düşmana ' : ''}${diceAmount(effect.die, effect.amount)} can yenile`;
    case 'status': return `${effect.target === 'enemy' ? 'Düşmana' : 'Kendine'} ${statusNames[effect.status]} uygula: ${effect.duration} tur, ${effect.stacks ?? 1} yük × ${effect.value ?? 1}`;
    case 'draw': return `${effect.amount} kart çek`;
    case 'energy': return `${effect.amount} enerji kazan (tur dolum sınırını aşabilir)`;
    case 'skip': return 'Düşmanın turunu atlat';
    case 'advantage': return `${effect.target === 'enemy' ? 'Düşmana' : 'Kendine'} ${effect.value ?? 1} saldırı için avantaj ver (iki D20, yüksek sonuç)`;
    case 'disadvantage': return `${effect.target === 'enemy' ? 'Düşmana' : 'Kendine'} ${effect.value ?? 1} saldırı için dezavantaj ver (iki D20, düşük sonuç)`;
    case 'trash': return `Çekiş destesinin üstünden ${effect.amount ?? 1} kartı kalıcı kaldır`;
    case 'trade': return `Çekiş destesinin üstünden ${effect.trashAmount ?? 1} kartı kalıcı kaldır, ${effect.drawAmount ?? 1} kart çek`;
    default: { const unknown: never = effect; throw new Error('Bilinmeyen etki: ' + JSON.stringify(unknown)); }
  }
}
export function describeCard(card: Card): string {
  const parts = card.onDiscardPenalty ? [] : (card.effects ?? []).map(e => describeEffect(e, card));
  if (card.onDiscardPenalty) parts.push(`Oynanamaz. Tur sonunda ${card.onDiscardPenalty.amount} saf hasar${card.onDiscardPenalty.returnToDeck ? '; çekiş destesine döner' : ''}.`);
  if (card.onPlayPenalty) parts.push('Oynanınca kalıcı olarak Kırık Ruh ile değişir.');
  if (card.isim === 'Kırık Ruh') parts.push('Her çekilişte maksimum can ve enerji 2 azalır (en az 1).');
  if (card.apocalypse) parts.push(`${card.apocalypse.delay} tur içinde savaş bitmezse mevcut canının %${card.apocalypse.hpPercent} kadarı kaybolur.`);
  if (card.retain && !card.onDiscardPenalty) parts.push('Elde tut: oynanmazsa sonraki tur elinde kalır; bir çekiş yerini kullanır.');
  if (card.exhaust) parts.push('Tükenir: oynanınca bu savaşta tekrar çekilmez; savaş sonunda geri döner.');
  if (card.finisher) parts.push(`Bitirici ${card.finisher.threshold}: bu kart dahil, bu tur ${card.finisher.threshold} tür değişiminde ilk saldırıya +${card.finisher.damage} hasar.`);
  return parts.join(' · ') || 'Bu kartın bir etkisi yok.';
}
export function cardDamageText(card: Card): string {
  return card.effects?.filter((e): e is Extract<CardEffect, {kind: 'attack' | 'damage'}> => e.kind === 'attack' || e.kind === 'damage').map(e => damageFormula(card, e)).join(' / ') || '—';
}
export function cardBlockText(card: Card): string {
  return card.effects?.filter((e): e is Extract<CardEffect, {kind: 'block'}> => e.kind === 'block').map(e => diceAmount(e.die, e.amount)).join(' + ') || '—';
}
