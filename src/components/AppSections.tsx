import type { Card, NodeType } from '../types/game';
import { getCardWeight } from '../utils/game';
import { nodeInfo } from './appView';

interface RewardCardsProps {
  cards: Card[];
  onSelect: (cardId: string) => void;
}

export function RewardCards({ cards, onSelect }: RewardCardsProps) {
  if (cards.length === 0) return <p className="empty-state">Ödül kartları yükleniyor...</p>;
  return <div className="reward-grid">{cards.map((card) => <article key={card.id} className={`reward-card reward-card--${card.tip} reward-card--${card.rarity ?? 'common'}`}>
    <div className="reward-card__head"><span className="reward-rarity">{card.rarity ?? 'common'}</span><span className="reward-mana">{card.manaBedeli} <small>MP</small></span></div>
    <p className="reward-type">{card.tip} · {card.baseHasar} hasar</p><h3>{card.isim}</h3>
    <p>{card.effects?.length ? `${card.effects.length} özel etki` : 'Temel kart etkisi'}</p>
    <button onClick={() => onSelect(card.id)} className="button button--reward" type="button">Bu kartı seç <span aria-hidden="true">→</span></button>
  </article>)}</div>;
}

interface DeckBuildProps {
  cards: Card[];
  picks: number;
  budget: number;
  onPick: (cardId: string) => void;
}

export function DeckBuild({ cards, picks, budget, onPick }: DeckBuildProps) {
  return <section className="deck-build" aria-label="Savaş öncesi deste kurma">
    <div className="deck-build__header"><span className="eyebrow">Savaş öncesi hazırlık</span><h3>Desteni kur</h3><p>Üç karttan ikisini seç. Güçlü kartlar daha ağırdır; seçim hakkın sınırlı.</p><strong>{picks} / 2 seçim · {budget} yük kaldı</strong></div>
    <div className="draft-grid">{cards.map((card) => { const weight = getCardWeight(card); return <article key={card.id} className={`draft-card draft-card--${card.tip}`}>
      <span className="draft-card__glyph" aria-hidden="true">{card.tip === 'saldırı' ? '⚔' : card.tip === 'savunma' ? '◈' : '✦'}</span>
      <span className="draft-card__type">{card.tip} · {card.rarity === 'rare' ? 'nadir' : card.rarity === 'uncommon' ? 'seçkin' : card.rarity === 'legendary' ? 'efsanevi' : 'sıradan'} · Yük {weight}</span>
      <h4>{card.isim}</h4><p>{card.effects?.length ? `${card.effects.length} özel etki` : 'Temel kart etkisi'}</p>
      <button className="button button--reward" type="button" disabled={weight > budget} onClick={() => onPick(card.id)}>{weight > budget ? 'Çok ağır' : 'Desteye ekle'} <span aria-hidden="true">→</span></button>
    </article>; })}</div>
  </section>;
}

interface PhaseChoicesProps {
  phase: 'event' | 'rest';
  onChoose: (choiceIndex: number) => void;
}

export function PhaseChoices({ phase, onChoose }: PhaseChoicesProps) {
  const choices = phase === 'event'
    ? [['Kanlı pazarlık', '10 altın karşılığında 4 can yenile.'], ['Kader değişimi', 'Bir kart çek, elinden rastgele bir kartı kaldır.'], ['Zayıflatıcı kehanet', 'Düşmanı zayıflat; bir sonraki durağa geç.']]
    : [['Dinlen', '25 altın karşılığında 4 can yenile.'], ['Desteyi arındır', 'Destenden rastgele bir kartı kaldır.']];

  return <section className="phase-choices" aria-label={phase === 'event' ? 'Olay seçenekleri' : 'Dinlenme seçenekleri'}>
    <span className="eyebrow">{phase === 'event' ? 'Karar anı' : 'Güvenli durak'}</span>
    <h3>{phase === 'event' ? 'Kaderin ne getirecek?' : 'Nasıl toparlanacaksın?'}</h3>
    <div className="phase-choices__grid">{choices.map(([title, detail], index) => <button key={title} className="phase-choice" type="button" onClick={() => onChoose(index)}>
      <strong>{title}</strong><span>{detail}</span><small aria-hidden="true">→</small>
    </button>)}</div>
  </section>;
}

interface MapSelectionProps {
  floor: number;
  nodes: Array<{ type: NodeType; id: string }>;
  rewards: Card[];
  onSelectNode: (id: string) => void;
  onSelectReward: (id: string) => void;
  onSkipReward: () => void;
}

export function MapSelection({ floor, nodes, rewards, onSelectNode, onSelectReward, onSkipReward }: MapSelectionProps) {
  return <div className="map-selection">
    <div className="map-selection__intro"><span className="map-floor">BÖLÜM {floor + 1}</span><p>Bir sonraki karşılaşmanın kaderini belirle.</p></div>
    <div className="map-selection__nodes" aria-label="Mevcut yol seçenekleri">{nodes.map((node, index) => <button key={`${node.id}-${index}`} type="button" className={`map-node-button map-node--${node.type}`} onClick={() => onSelectNode(node.id)}>
      <div className="map-node-content"><span className="map-node__icon" aria-hidden="true">{nodeInfo[node.type].icon}</span><strong className="map-node__label">{nodeInfo[node.type].label}</strong><small className="map-node__detail">{nodeInfo[node.type].detail}</small></div><span className="map-node__arrow" aria-hidden="true">→</span>
    </button>)}</div>
    {rewards.length > 0 && <div className="map-reward-note"><span aria-hidden="true">★</span> Zafer ödülün hazır. Önce bir kart seçebilir veya pas geçebilirsin.</div>}
    {rewards.length > 0 && <RewardCards cards={rewards} onSelect={onSelectReward} />}
    {rewards.length > 0 && <button onClick={onSkipReward} className="button button--quiet" type="button">Ödülü pas geç</button>}
  </div>;
}
