import type { Card, NodeType } from '../types/game';
import { getCardWeight } from '../utils/game';
import { describeCard, rarityName } from '../utils/cardText';
import { canChooseDraftCard } from '../engine/draft';
import { eventChoices } from '../engine/eventResolver';
import { restChoices } from '../engine/restResolver';
import { useGameStore } from '../state/store';
import { useShallow } from 'zustand/react/shallow';
import { nodeInfo } from './appView';
import { canTravel } from '../engine/campaignResolver';

export function RewardCards({ cards, onSelect }: { cards: Card[]; onSelect: (id: string) => void }) {
  if (!cards.length) return <p className="empty-state">Ödül kartı yok.</p>;
  return <div className="reward-grid">{cards.map(card => <article key={card.id} className={`reward-card reward-card--${card.tip} reward-card--${card.rarity ?? 'common'}`}>
    <div className="reward-card__head"><span className="reward-rarity">{rarityName(card.rarity)}</span><span className="reward-mana">{card.manaBedeli} <small>ENERJİ</small></span></div>
    <p className="reward-type">{card.tip}</p><h3>{card.isim}</h3><p>{describeCard(card)}</p>
    <button onClick={() => onSelect(card.id)} className="button button--reward" type="button">Bu kartı seç →</button>
  </article>)}</div>;
}

export function DeckBuild({ cards, picks, budget, onPick }: { cards: Card[]; picks: number; budget: number; onPick: (id: string) => void }) {
  return <section className="deck-build" aria-label="Savaş öncesi deste kurma">
    <div className="deck-build__header"><span className="eyebrow">Savaş öncesi hazırlık</span><h3>Desteni kur</h3><p>Beş seçenekten üç kart seç. Üç seçimi tamamlayacak kadar yük ayırmalısın.</p><strong>{picks} / 3 seçim · {budget} yük kaldı</strong></div>
    <div className="draft-grid">{cards.map(card => { const allowed = canChooseDraftCard(cards, card.id, picks, budget); return <article key={card.id} className={`draft-card draft-card--${card.tip}`}>
      <span className="draft-card__glyph" aria-hidden="true">{card.tip === 'saldırı' ? '⚔' : card.tip === 'savunma' ? '◈' : '✦'}</span>
      <span className="draft-card__type">{card.tip} · {rarityName(card.rarity)} · Yük {getCardWeight(card)} · {card.manaBedeli} enerji</span>
      <h4>{card.isim}</h4><p>{describeCard(card)}</p>
      <button className="button button--reward" type="button" disabled={!allowed} onClick={() => onPick(card.id)}>{allowed ? 'Desteye ekle →' : 'Üç seçim için yük yetmez'}</button>
    </article>; })}</div>
  </section>;
}

export function PhaseChoices({ phase, onChoose }: { phase: 'event' | 'rest'; onChoose: (index: number) => void }) {
  const state = useGameStore(useShallow(s => ({ gold: s.gold, player: s.player, deck: s.deck, hand: s.hand, discardPile: s.discardPile })));
  const choices: Array<{title: string; detail: string; disabled?: boolean}> = phase === 'event' ? eventChoices(state) : [...restChoices(state), { title: 'Yola devam et', detail: 'Bir işlem yapmadan dinlenme durağından ayrıl.' }];
  return <section className="phase-choices" aria-label={phase === 'event' ? 'Olay seçenekleri' : 'Dinlenme seçenekleri'}>
    <span className="eyebrow">{phase === 'event' ? 'Karar anı' : 'Güvenli durak'}</span><h3>{phase === 'event' ? 'Kaderin ne getirecek?' : 'Nasıl toparlanacaksın?'}</h3>
    <div className="phase-choices__grid">{choices.map(({title,detail,disabled},index) => <button key={title} className="phase-choice" type="button" disabled={disabled} onClick={() => onChoose(index)}><strong>{title}</strong><span>{detail}</span><small aria-hidden="true">→</small></button>)}</div>
  </section>;
}

export function MapSelection({ floor, nodes, rewards, onSelectNode, onSelectReward, onSkipReward }: { floor: number; nodes: Array<{type: NodeType; id: string}>; rewards: Card[]; onSelectNode: (id: string) => void; onSelectReward: (id: string) => void; onSkipReward: () => void }) {
  const travelAllowed = useGameStore(s => canTravel(s.campaign));
  return <div className="map-selection">
    <div className="map-selection__intro"><span className="map-floor">BÖLÜM {floor + 1}</span><p>Bir sonraki karşılaşmanın kaderini belirle.</p></div>
    <div className="map-selection__nodes" aria-label="Mevcut yol seçenekleri">{nodes.map(node => <button key={node.id} type="button" disabled={rewards.length > 0 || !travelAllowed} className={`map-node-button map-node--${node.type}`} onClick={() => onSelectNode(node.id)}>
      <div className="map-node-content"><span className="map-node__icon" aria-hidden="true">{nodeInfo[node.type].icon}</span><strong className="map-node__label">{nodeInfo[node.type].label}</strong><small className="map-node__detail">{nodeInfo[node.type].detail}</small></div><span className="map-node__arrow" aria-hidden="true">→</span>
    </button>)}</div>
    {rewards.length > 0 && <><div className="map-reward-note">★ Zafer ödülün hazır. Önce bir kart seç veya pas geç.</div><RewardCards cards={rewards} onSelect={onSelectReward} /><button onClick={onSkipReward} className="button button--quiet" type="button">Ödülü pas geç</button></>}
  </div>;
}
