import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { useGameStore } from '../state/store';
import type { Card } from '../types/game';
import { createDataTransfer, mockRandom, withMockRandom } from './index';

const testCard: Card = {
  id: 'reward-card',
  isim: 'Test Ödülü',
  tip: 'yetenek',
  manaBedeli: 1,
  baseHasar: 0,
  zarTuru: 'd4',
  rarity: 'rare',
  effects: [{ kind: 'energy', amount: 1 }],
};

describe('test utilities and critical game flows', () => {
  it('returns mocked random values in order and reverts after reset', () => {
    mockRandom([0.1, 0.8]);
    expect(Math.random()).toBe(0.1);
    expect(Math.random()).toBe(0.8);
    expect(Math.random()).toBe(0.8);
  });

  it('supports deterministic callbacks and resets even when they throw', async () => {
    await expect(withMockRandom([0.25], () => {
      expect(Math.random()).toBe(0.25);
      throw new Error('expected test error');
    })).rejects.toThrow('expected test error');

    const random = Math.random();
    expect(random).not.toBe(0.25);
  });

  it('renders the combat view and ends a player turn', async () => {
    await withMockRandom(Array.from({ length: 20 }, (_, index) => (index + 1) / 21), async () => {
      render(<App />);
      expect(screen.getByRole('heading', { name: 'Hamleni seç' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Oyuncu turunu bitir' }));
      expect(useGameStore.getState().battleLogs.length).toBeGreaterThan(1);
    });
  });

  it('selects a reward and moves to the shop', async () => {
    useGameStore.setState({
      initialized: true,
      gamePhase: 'victory',
      rewardOptions: [testCard],
    });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /Bu kartı seç/ }));

    expect(useGameStore.getState().gamePhase).toBe('shop');
    expect(useGameStore.getState().deck).toContainEqual(testCard);
  });

  it('starts a fresh game from the game-over screen', async () => {
    useGameStore.setState({
      initialized: true,
      gamePhase: 'gameOver',
      player: { ...useGameStore.getState().player, mevcutCan: 0 },
    });
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Yeni Oyun Başlat' }));

    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('combat');
    expect(state.player.mevcutCan).toBe(state.player.maksimumCan);
    expect(state.hand).toHaveLength(state.drawCount);
  });

  it('provides a reusable drag-and-drop data transfer fixture', () => {
    const transfer = createDataTransfer();
    fireEvent.dragStart(document.body, { dataTransfer: transfer });
    transfer.setData('text/plain', 'card-id');
    expect(transfer.getData('text/plain')).toBe('card-id');
  });
});
