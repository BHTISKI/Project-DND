// Bu dosya src/components/Card.test.tsx için ilgili kodları içerir.
// Card bileşeni testleri: render ve kullanıcı etkileşimleri
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cleanup } from '@testing-library/react';
import { CardComponent } from './Card';
import type { Card } from '../types/game';
import { useRef } from 'react';
import { usePreferencesStore } from '../state/preferences';

describe('Card', () => {
  const baseCard: Card = {
    id: 'test-card',
    isim: 'Test Kartı',
    tip: 'saldırı',
    manaBedeli: 2,
    baseHasar: 3,
    effects: [{ kind: 'attack' as const, amount: 4 }],
    isUpgraded: false,
    rarity: 'common',
    tags: ['attack'],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    usePreferencesStore.setState({ motionEnabled: true });
  });

  afterEach(() => {
    cleanup();
    usePreferencesStore.setState({ motionEnabled: true });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders card with correct name, mana, and effect', () => {
    const onPlay = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isPlayable={true} />);

    // name
    expect(screen.getByText(/Test Kartı/i)).toBeInTheDocument();
    // mana: check the aria-label of the card-mana strong element
    const manaStrong = screen.getByText(/2/i, { selector: '.card-mana' });
    expect(manaStrong).toHaveAttribute('aria-label', '2 mana');
    // fixed attack value plus the printed base damage
    expect(screen.getByText(/Saldırı: 7 \+ Hasar bonusu hasar/i, { selector: '.card-effect' })).toBeInTheDocument();
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
    await waitFor(() => expect(onPlay).toHaveBeenCalledTimes(1));
    expect(onPlay).toHaveBeenCalledWith(baseCard);
  });

  it('does not call onPlay when card is clicked but not playable', async () => {
    const onPlay = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isPlayable={false} />);

    const button = screen.getByLabelText(/Test Kartı için yeterli enerji yok/i);
    await userEvent.click(button);
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('expands the selected card on double click', async () => {
    const onPlay = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isPlayable={true} />);

    const button = screen.getByLabelText(/Test Kartı oynanabilir/i);
    await userEvent.dblClick(button);

    expect(onPlay).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(button).toHaveClass('zoomed');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent('ENERJİ');
    expect(button).toHaveTextContent('HASAR');
  });

  it('reports a pointer drop once and suppresses the click generated after dragging', async () => {
    const onPlay = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isDraggable onDragStart={onDragStart} onDragEnd={onDragEnd} />);
    const button = screen.getByLabelText(/Test Kartı oynanabilir/i);
    fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 300 }));
    fireEvent(window, new MouseEvent('pointermove', { clientX: 150, clientY: 150 }));
    await waitFor(() => expect(onDragStart).toHaveBeenCalledWith(baseCard.id));
    fireEvent(window, new MouseEvent('pointerup', { clientX: 175, clientY: 125 }));
    await waitFor(() => expect(onDragEnd).toHaveBeenCalledWith(baseCard.id, { x: 175, y: 125 }));
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    fireEvent.click(button, { detail: 1 });
    await new Promise(resolve => window.setTimeout(resolve, 550));
    expect(onPlay).not.toHaveBeenCalled();
    // Yeni bir klavye seçimi hâlâ kullanılabilir; iptal bayrağı kartı kilitlemez.
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.click(button, { detail: 0 });
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it.each(['pointercancel', 'Escape', 'blur', 'resize'])('returns the card without a drop target when dragging is cancelled by %s', async cancellation => {
    const onPlay = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isDraggable onDragStart={onDragStart} onDragEnd={onDragEnd} />);
    const button = screen.getByLabelText(/Test Kartı oynanabilir/i);
    fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 300 }));
    fireEvent(window, new MouseEvent('pointermove', { clientX: 150, clientY: 150 }));
    await waitFor(() => expect(onDragStart).toHaveBeenCalledOnce());
    if (cancellation === 'Escape') fireEvent.keyDown(document, { key: 'Escape' });
    else if (cancellation === 'blur') fireEvent(window, new Event('blur'));
    else if (cancellation === 'resize') fireEvent(window, new Event('resize'));
    else fireEvent(window, new MouseEvent('pointercancel', { clientX: 150, clientY: 150 }));
    await waitFor(() => expect(onDragEnd).toHaveBeenCalledWith(baseCard.id, null));
    fireEvent(window, new MouseEvent('pointerup', { clientX: 150, clientY: 150 }));
    fireEvent.click(button, { detail: 1 });
    expect(onPlay).not.toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('keeps resting cards in their layout position when the table becomes narrow and taller', async () => {
    let tableRect = new DOMRect(0, 0, 1440, 1200);
    let cardRect = new DOMRect(550, 600, 210, 330);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.dataset.table ? tableRect : cardRect;
    });
    const Table = () => {
      const bounds = useRef<HTMLDivElement>(null);
      return <div ref={bounds} data-table="true"><div className="card-hit-area"><CardComponent card={baseCard} onPlay={vi.fn()} isDraggable dragBounds={bounds} /></div></div>;
    };
    render(<Table />);
    const card = screen.getByLabelText(/Test Kartı oynanabilir/i);
    await new Promise(resolve => window.setTimeout(resolve, 80));
    expect(card.style.transform).not.toMatch(/translate[XY]\(/);
    // Masaüstü pencere daralınca kart sıraları sayfayı uzatır; yeni yerleşim CSS'e ait olmalı.
    tableRect = new DOMRect(0, 0, 900, 1600);
    cardRect = new DOMRect(120, 950, 210, 330);
    fireEvent(window, new Event('resize'));
    await new Promise(resolve => window.setTimeout(resolve, 80));
    expect(card.style.transform).not.toMatch(/translate[XY]\(/);
  });

  it.each(['Enter', ' '])('does not play a card with the %s key during an active drag', async key => {
    const onPlay = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isDraggable onDragStart={onDragStart} onDragEnd={onDragEnd} />);
    const button = screen.getByLabelText(/Test Kartı oynanabilir/i);
    fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 300 }));
    fireEvent(window, new MouseEvent('pointermove', { clientX: 150, clientY: 150 }));
    await waitFor(() => expect(onDragStart).toHaveBeenCalledOnce());
    fireEvent.keyDown(button, { key });
    fireEvent.click(button, { detail: 0 });
    expect(onPlay).not.toHaveBeenCalled();
    fireEvent(window, new MouseEvent('pointercancel', { clientX: 150, clientY: 150 }));
    await waitFor(() => expect(onDragEnd).toHaveBeenCalledWith(baseCard.id, null));
  });

  it('cancels the active drag before opening card inspection', async () => {
    const onPlay = vi.fn();
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    render(<CardComponent card={baseCard} onPlay={onPlay} isDraggable onDragStart={onDragStart} onDragEnd={onDragEnd} />);
    const button = screen.getByLabelText(/Test Kartı oynanabilir/i);
    fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 300 }));
    fireEvent(window, new MouseEvent('pointermove', { clientX: 150, clientY: 150 }));
    await waitFor(() => expect(onDragStart).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole('button', { name: 'Test Kartı ayrıntılarını incele' }));
    expect(onDragEnd).toHaveBeenCalledWith(baseCard.id, null);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onPlay).not.toHaveBeenCalled();
  });

  it.each(['game setting', 'operating system'])('clears drag shadows and hover lift immediately when reduced motion is enabled by the %s', async preference => {
    let reduced = false;
    const media = new EventTarget();
    Object.defineProperty(media, 'matches', { get: () => reduced });
    vi.stubGlobal('matchMedia', () => media);
    const onDragStart = vi.fn();
    const onDragEnd = vi.fn();
    render(<CardComponent card={baseCard} onPlay={vi.fn()} isDraggable onDragStart={onDragStart} onDragEnd={onDragEnd} />);
    const button = screen.getByLabelText(/Test Kartı oynanabilir/i);
    fireEvent(button, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 300 }));
    fireEvent(window, new MouseEvent('pointermove', { clientX: 150, clientY: 150 }));
    await waitFor(() => expect(onDragStart).toHaveBeenCalledOnce());
    await waitFor(() => expect(button).toHaveClass('card--dragging'));
    fireEvent(window, new MouseEvent('pointercancel', { clientX: 150, clientY: 150 }));
    await waitFor(() => expect(onDragEnd).toHaveBeenCalledOnce());
    await userEvent.hover(button);
    await waitFor(() => expect(button.style.transform).toContain('translateZ'));
    act(() => {
      if (preference === 'game setting') usePreferencesStore.setState({ motionEnabled: false });
      else { reduced = true; media.dispatchEvent(new Event('change')); }
    });
    await waitFor(() => {
      expect(button.style.transform).not.toMatch(/translate[XYZ]\(|rotateX\(|scale\(/);
      expect(button.style.filter).toBe('');
    }, { timeout: 250 });
  });

  it('returns a hovered card to the table when it becomes unavailable', async () => {
    const { rerender } = render(<CardComponent card={baseCard} onPlay={vi.fn()} />);
    const button = screen.getByLabelText(/Test Kartı oynanabilir/i);
    await userEvent.hover(button);
    await waitFor(() => expect(button.style.transform).toContain('translateZ'));
    rerender(<CardComponent card={baseCard} onPlay={vi.fn()} isPlayable={false} />);
    await waitFor(() => expect(button.style.transform).not.toMatch(/translateZ\(|rotateX\(|scale\(/));
    expect(button).toBeDisabled();
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
    expect(screen.getByText(/Efsanevi/i, { selector: '.card-rarity' })).toBeInTheDocument();
  });

  it('applies the card theme visual class', () => {
    const onPlay = vi.fn();
    render(<CardComponent card={{ ...baseCard, theme: 'blood' }} onPlay={onPlay} isPlayable={true} />);

    expect(screen.getByRole('button', { name: /Test Kartı oynanabilir/i })).toHaveClass('game-card--theme-blood');
  });

  it('formats different effect types correctly', () => {
    const onPlay = vi.fn();
    // heal effect
    const healCard = { ...baseCard, effects: [{ kind: 'heal' as const, amount: 5 }] };
    const fixedBlockCard = { ...baseCard, effects: [{ kind: 'block' as const, amount: 5 }] };
    const blockAmountCard = { ...baseCard, effects: [{ kind: 'block' as const, amount: 3 }] };
    const drawCard = { ...baseCard, effects: [{ kind: 'draw' as const, amount: 2 }] };
    const energyCard = { ...baseCard, effects: [{ kind: 'energy' as const, amount: 1 }] };
    const statusCard = { ...baseCard, effects: [{ kind: 'status' as const, status: 'vulnerable' as const, duration: 1 }] };
    const trashCard = { ...baseCard, effects: [{ kind: 'trash' as const, amount: 2, target: 'player' as const }] };
    const tradeCard = { ...baseCard, effects: [{ kind: 'trade' as const, trashAmount: 1, drawAmount: 2, target: 'player' as const }] };
    const skipCard = { ...baseCard, effects: [{ kind: 'skip' as const, target: 'enemy' as const }] };

    const { rerender } = render(<CardComponent card={healCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/5 can yenile/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={fixedBlockCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/5 blok kazan/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={blockAmountCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/3 blok kazan/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={drawCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/2 kart çek/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={energyCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/1 enerji kazan/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={statusCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/Savunmasız uygula/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={trashCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/2 kartı kalıcı kaldır/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={tradeCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/1 kartı kalıcı kaldır, 2 kart çek/i, { selector: '.card-effect' })).toBeInTheDocument();

    rerender(<CardComponent card={skipCard} onPlay={onPlay} isPlayable={true} />);
    expect(screen.getByText(/düşmanın turunu atlat/i, { selector: '.card-effect' })).toBeInTheDocument();
  });
});
