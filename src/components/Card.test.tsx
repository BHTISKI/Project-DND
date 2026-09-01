// Bu dosya src/components/Card.test.tsx için ilgili kodları içerir.
// Card bileşeni testleri: render ve kullanıcı etkileşimleri
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardComponent } from './Card';
import type { Card } from '../types/game';

describe('Card', () => {
  const baseCard: Card = {
    id: 'test-card',
    isim: 'Test Kartı',
    tip: 'saldırı',
    manaBedeli: 2,
    baseHasar: 3,
    zarTuru: 'd6',
    effects: [{ kind: 'attack', die: 'd6' }],
    isUpgraded: false,
    rarity: 'common',
    tags: ['attack'],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders card with correct name, mana, and effect', () => {
    const onPlay = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isPlayable={true} />);

    // name
    expect(screen.getByText(/Test Kartı/i)).toBeInTheDocument();
    // mana: check the aria-label of the card-mana strong element
    const manaStrong = screen.getByText(/2/i);
    expect(manaStrong).toHaveAttribute('aria-label', /2 mana/i);
    // effect text (attack d6 -> "Zırha karşı saldır")
    expect(screen.getByText(/Zırha karşı saldır/i)).toBeInTheDocument();
    // upgraded indicator should not be present
    expect(screen.queryByText(/↑/i)).not.toBeInTheDocument();
    // card should be enabled (not disabled)
    expect(screen.getByLabelText(/Test Kartı oynanabilir/i)).not.toBeDisabled();
  });

  it('shows upgraded indicator when isUpgraded is true', () => {
    const onPlay = vi.fn();
    const upgradedCard = { ...baseCard, isUpgraded: true };
    render(<CardComponent card={upgradedCard} onPlay={onPlay} isPlayable={true} />);

    expect(screen.getByText(/↑/i)).toBeInTheDocument();
  });

  it('is playable when isPlayable prop is true and has sufficient energy (implicitly via prop)', () => {
    const onPlay = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isPlayable={true} />);

    const button = screen.getByLabelText(/Test Kartı oynanabilir/i);
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'false');
  });

  it('is not playable when isPlayable prop is false', () => {
    const onPlay = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isPlayable={false} />);

    const button = screen.getByLabelText(/Test Kartı için yeterli enerji yok/i );
    expect(button).toBeDisabled();
  });

  it('calls onPlay when card is clicked and playable', async () => {
    const onPlay = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isPlayable={true} />);

    const button = screen.getByLabelText(/Test Kartı oynanabilir/i);
    await userEvent.click(button);
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledWith(baseCard);
  });

  it('does not call onPlay when card is clicked but not playable', async () => {
    const onPlay = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isPlayable={false} />);

    const button = screen.getByLabelText(/Test Kartı için yeterli enerji yok/i);
    await userEvent.click(button);
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('renders correct card type glyph and color', () => {
    const onPlay = vi.fn();
    // test each type
    const attackCard = { ...baseCard, tip: 'saldırı' };
    const defenseCard = { ...baseCard, tip: 'savunma' };
    const skillCard = { ...baseCard, tip: 'yetenek' };

    render(<CardComponent card={attackCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/⚔/i)).toBeInTheDocument(); // attack glyph
    expect(screen.getByText(/Saldırı/i)).toBeInTheDocument();

    render(<CardComponent card={defenseCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/◈/i)).toBeInTheDocument(); // defense glyph
    expect(screen.getByText(/Savunma/i)).toBeInTheDocument();

    render(<CardComponent card={skillCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/✦/i)).toBeInTheDocument(); // skill glyph
    expect(screen.getByText(/Yetenek/i)).toBeInTheDocument();
  });

  it('renders rarity label correctly', () => {
    const onPlay = vi.fn();
    const rareCard = { ...baseCard, rarity: 'rare' };
    const uncommonCard = { ...baseCard, rarity: 'uncommon' };
    const commonCard = { ...baseCard, rarity: 'common' };
    const legendaryCard = { ...baseCard, rarity: 'legendary' };

    render(<CardComponent card={rareCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/Nadir/i)).toBeInTheDocument();

    render(<CardComponent card={uncommonCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/Seçkin/i)).toBeInTheDocument();

    render(<CardComponent card={commonCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/Sıradan/i)).toBeInTheDocument();

    render(<CardComponent card={legendaryCard} onPlay={onPlay} isPlayable={true} />);
    // legendary rarity label? In the component, rarityLabel is only defined for rare/uncommon, else 'Sıradan'
    // So legendary will show as 'Sıradan'
    expect(screen.getByText(/Sıradan/i)).toBeInTheDocument();
  });

  it('formats different effect types correctly', () => {
    const onPlay = vi.fn();
    // heal effect
    const healCard = { ...baseCard, effets: [{ kind: 'heal', amount: 5 }] };
    render(<CardComponent card={healCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/5 can yenile/i)).toBeInTheDocument();

    // block effect with die
    const blockDieCard = { ...baseCard, effets: [{ kind: 'block', die: 'd8' }] };
    render(<CardComponent card={blockDieCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/d8 blok kazan/i)).toBeInTheDocument();

    // block effect with amount
    const blockAmountCard = { ...baseCard, effets: [{ kind: 'block', amount: 3 }] };
    render(<CardComponent card={blockAmountCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/3 blok kazan/i)).toBeInTheDocument();

    // draw effect
    const drawCard = { ...baseCard, effets: [{ kind: 'draw', amount: 2 }] };
    render(<CardComponent card={drawCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/2 kart çek/i)).toBeInTheDocument();

    // energy effect
    const energyCard = { ...baseCard, effets: [{ kind: 'energy', amount: 1 }] };
    render(<CardComponent card={energyCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/1 enerji kazan/i)).toBeInTheDocument();

    // status effect
    const statusCard = { ...baseCard, effets: [{ kind: 'status', status: 'vulnerable' }] };
    render(<CardComponent card={statusCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/vulnerable uygula/i)).toBeInTheDocument();

    // trash effect
    const trashCard = { ...baseCard, effets: [{ kind: 'trash', amount: 2, target: 'enemy' }] };
    render(<CardComponent card={trashCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/2 kartı düşmanın desteleden kaldır/i)).toBeInTheDocument();

    // trade effect
    const tradeCard = { ...baseCard, effets: [{ kind: 'trade', trashAmount: 1, drawAmount: 2, target: 'player' }] };
    render(<CardComponent card={tradeCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/1 kartı oyuncunun desteleden kaldır, 2 kart çek/i)).toBeInTheDocument();

    // skip effect
    const skipCard = { ...baseCard, effets: [{ kind: 'skip', target: 'enemy' }] };
    render(<CardComponent card={skipCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/düşmanın turunu atlat/i)).toBeInTheDocument();
  });
});