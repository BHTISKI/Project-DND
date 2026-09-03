import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useGameStore } from '../state/store';
import { makeCard } from '../testUtils/gameState';
import { CardComponent } from './Card';
import DialogBubble from './DialogBubble';
import { ShopPanel } from './ShopPanel';
import { PhaseChoices } from './AppSections';

beforeEach(() => { useGameStore.setState(useGameStore.getInitialState(), true); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

it('a real click-click-doubleclick sequence inspects without playing', () => {
  vi.useFakeTimers();
  const onPlay = vi.fn();
  render(<CardComponent card={makeCard('İnceleme')} onPlay={onPlay} />);
  const button = screen.getByRole('button', { name: /İnceleme oynanabilir/ });
  fireEvent.click(button, { detail: 1 });
  act(() => vi.advanceTimersByTime(350));
  fireEvent.click(button, { detail: 2 }); fireEvent.doubleClick(button);
  act(() => vi.advanceTimersByTime(1000));
  expect(onPlay).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Kart incelemesini kapat' })).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('disabled cards can be inspected but cannot be played', () => {
  const onPlay = vi.fn();
  render(<CardComponent card={makeCard('Kapalı')} onPlay={onPlay} isPlayable={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'Kapalı ayrıntılarını incele' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Yeterli enerji yok' })).toBeDisabled();
  expect(onPlay).not.toHaveBeenCalled();
});
it('cancels delayed card play on unmount', () => {
  vi.useFakeTimers(); const onPlay = vi.fn();
  const { unmount } = render(<CardComponent card={makeCard('Geçici')} onPlay={onPlay} />);
  fireEvent.click(screen.getByRole('button', { name: /Geçici oynanabilir/ }), { detail: 1 });
  unmount(); act(() => vi.advanceTimersByTime(1000));
  expect(onPlay).not.toHaveBeenCalled();
});
it('dialogs expire without another insertion and newer messages replace older ones', () => {
  vi.useFakeTimers();
  render(<DialogBubble />);
  act(() => useGameStore.getState().addPlayerDialog('İlk mesaj'));
  act(() => vi.advanceTimersByTime(3000));
  act(() => useGameStore.getState().addPlayerDialog('Yeni mesaj'));
  expect(screen.queryByText('İlk mesaj')).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByText('Yeni mesaj')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(3000));
  expect(screen.queryByText('Yeni mesaj')).not.toBeInTheDocument();
  expect(useGameStore.getState().playerDialog).toEqual([]);
});
it('shop lists hand and discard cards and disables full-health healing', () => {
  useGameStore.setState({ gamePhase: 'shop', gold: 200, hand: [makeCard('Eldeki')], discardPile: [makeCard('Mezarlıktaki')] });
  render(<ShopPanel />);
  expect(screen.getByRole('button', { name: /Eldeki kartını 50/ })).toBeEnabled();
  expect(screen.getByRole('button', { name: /Mezarlıktaki kartını 50/ })).toBeEnabled();
  expect(screen.getByText('Canın zaten tam')).toBeInTheDocument();
  const heal = document.querySelector('.shop-action--heal button');
  expect(heal).toBeDisabled();
});
it('rest offers a way forward when the player cannot buy healing or remove a card', () => {
  useGameStore.setState({ gamePhase: 'rest', gold: 0, hand: [makeCard('Son kart')] });
  render(<PhaseChoices phase="rest" onChoose={useGameStore.getState().resolveRest} />);
  expect(screen.getByRole('button', { name: /^Dinlen/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /^Desteyi arındır/ })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /^Yola devam et/ }));
  expect(useGameStore.getState().gamePhase).toBe('mapSelection');
});
