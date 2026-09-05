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
it('player stays silent and NPC reactions wait their turn', () => {
  vi.useFakeTimers();
  render(<DialogBubble />);
  act(() => useGameStore.getState().addPlayerDialog('İlk mesaj'));
  expect(screen.queryByText('İlk mesaj')).not.toBeInTheDocument();
  act(() => useGameStore.getState().addEnemyDialog('İlk tepki'));
  act(() => useGameStore.getState().addEnemyDialog('İkinci tepki'));
  expect(screen.getByRole('status')).toHaveTextContent('İlk tepki');
  expect(screen.queryByText('İkinci tepki')).not.toBeInTheDocument();
  act(() => vi.advanceTimersByTime(5500));
  expect(screen.getByRole('status')).toHaveTextContent('İkinci tepki');
  act(() => vi.advanceTimersByTime(5500));
  expect(screen.queryByText('İkinci tepki')).not.toBeInTheDocument();
  expect(useGameStore.getState().playerDialog).toEqual([]);
});
it('story dialogue survives time and advances one line per click', () => {
  vi.useFakeTimers();
  useGameStore.setState({ enemyDialog: [
    { text: 'Geçidin hikâyesi.', timestamp: 1, story: true },
    { text: 'Yolun devamı.', timestamp: 2, story: true },
  ] });
  render(<DialogBubble />);
  act(() => vi.advanceTimersByTime(60000));
  expect(screen.getByText('Geçidin hikâyesi.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Devam et/ }));
  expect(screen.getByRole('status')).toHaveTextContent('Yolun devamı.');
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
