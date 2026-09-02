// Bu dosya src/components/Card.test.tsx için ilgili kodları içerir.
// Card bileşeni testleri: render ve kullanıcı etkileşimleri
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cleanup } from '@testing-library/react';
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
    effects: [{ kind: 'attack' as const, die: 'd6' }],
    isUpgraded: false,
    rarity: 'common',
    tags: ['attack'],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders card with correct name, mana, and effect', () => {
    const onPlay = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isPlayable={true} />);

    // name
    expect(screen.getByText(/Test Kartı/i)).toBeInTheDocument();
    // mana: check the aria-label of the card-mana strong element
    const manaStrong = screen.getByText(/2/i);
    expect(manaStrong).toHaveAttribute('aria-label', '2 mana');
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
    const attackCard = { ...baseCard, tip: 'saldırı' as const } as Card;
    const defenseCard = { ...baseCard, tip: 'savunma' as const } as Card;
    const skillCard = { ...baseCard, tip: 'yetenek' as const } as Card;

    const { rerender } = render(<CardComponent card={attackCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/⚔/i, { selector: '.card-type > span[aria-hidden]' })).toBeInTheDocument(); // attack glyph
    expect(screen.getByText(/Saldırı/i, { selector: '.card-type' })).toBeInTheDocument();

    rerender(<CardComponent card={defenseCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/◈/i, { selector: '.card-type > span[aria-hidden]' })).toBeInTheDocument(); // defense glyph
    expect(screen.getByText(/Savunma/i, { selector: '.card-type' })).toBeInTheDocument();

    rerender(<CardComponent card={skillCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/✦/i, { selector: '.card-type > span[aria-hidden]' })).toBeInTheDocument(); // skill glyph
    expect(screen.getByText(/Yetenek/i, { selector: '.card-type' })).toBeInTheDocument();
  });

  it('renders rarity label correctly', () => {
    const onPlay = vi.fn();
    const rareCard = { ...baseCard, rarity: 'rare' as const } as Card;
    const uncommonCard = { ...baseCard, rarity: 'uncommon' as const } as Card;
    const commonCard = { ...baseCard, rarity: 'common' as const } as Card;
    const legendaryCard = { ...baseCard, rarity: 'legendary' as const } as Card;

    const { rerender } = render(<CardComponent card={rareCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/Nadir/i, { selector: '.card-rarity' })).toBeInTheDocument();

    rerender(<CardComponent card={uncommonCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/Seçkin/i, { selector: '.card-rarity' })).toBeInTheDocument();

    rerender(<CardComponent card={commonCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/Sıradan/i, { selector: '.card-rarity' })).toBeInTheDocument();

    rerender(<CardComponent card={legendaryCard} onPlay={onPlay} isPlayable={true} />);
    // legendary rarity label? In the component, rarityLabel is only defined for rare/unbalanced, else 'Sıradan'
    // So legendary will show as 'Sıradan'
    expect(screen.getByText(/Sıradan/i, { selector: '.card-rarity' })).toBeInTheDocument();
  });

  it('formats different effect types correctly', () => {
    const onPlay = vi.fn();
    // heal effect
    const healCard = { ...baseCard, effects: [{ kind: 'heal' as const, amount: 5 }] };
    const blockDieCard = { ...baseCard, effects: [{ kind: 'block' as const, die: 'd8' }] };
    const blockAmountCard = { ...baseCard, effects: [{ kind: 'block' as const, amount: 3 }] };
    const drawCard = { ...baseCard, effects: [{ kind: 'draw' as const, amount: 2 }] };
    const energyCard = { ...baseCard, effects: [{ kind: 'energy' as const, amount: 1 }] };
    const statusCard = { ...baseCard, effects: [{ kind: 'status' as const, status: 'vulnerable' as const, duration: 1 }] };
    const trashCard = { ...baseCard, effects: [{ kind: 'trash' as const, amount: 2, target: 'enemy' as const }] };
    const tradeCard = { ...baseCard, effects: [{ kind: 'trade' as const, trashAmount: 1, drawAmount: 2, target: 'player' as const }] };
    const skipCard = { ...baseCard, effects: [{ kind: 'skip' as const, target: 'enemy' as const }] };

    const { rerender } = render(<CardComponent card={healCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/5 can yenile/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={blockDieCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/d8 blok kazan/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={blockAmountCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/3 blok kazan/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={drawCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/2 kart çek/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={energyCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/1 enerji kazan/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={statusCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/vulnerable uygula/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={trashCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/2 kartı düşmanın desteleden kaldır/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={tradeCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/1 kart oyuncunun desteleden kaldır, 2 kart çek/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={skipCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/düşmanın turunu atlat/i, { selector: '.card-effect' })).toBeInTheDocument();
  });
});