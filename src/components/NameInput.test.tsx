import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { useGameStore } from '../state/store';
import { RUN_SAVE_KEY, snapshotRun } from '../state/runPersistence';

beforeEach(() => {
  vi.restoreAllMocks(); localStorage.clear();
  useGameStore.setState(useGameStore.getInitialState(), true);
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function saveRun() {
  useGameStore.getState().startNewGame('Selim', null);
  useGameStore.getState().configureCampaign('weaver', 0);
  const s = useGameStore.getState();
  s.selectNode(s.availableNodes[0].id);
  useGameStore.getState().chooseDraftCard(useGameStore.getState().draftOptions[0].id);
  useGameStore.setState(useGameStore.getInitialState(), true);
}

it('opens a plain name form, validates it and starts using the trimmed name', async () => {
  const user = userEvent.setup();
  render(<App />);
  const name = screen.getByRole('textbox', { name: 'Karakter adı' });
  expect(name).toHaveFocus();
  expect(screen.queryByRole('button', { name: 'Devam et' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Başla' }));
  expect(screen.getByRole('alert')).toHaveTextContent('İsim 2–20 karakter olmalı.');
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBeNull();
  await user.type(name, '  Selim  ');
  await user.keyboard('{Enter}');
  expect(await screen.findByText('Geride bıraktığın ses')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Hatıra Dokuyucusu/ }));
  expect(screen.getByText('BÖLÜM 1')).toBeInTheDocument();
  expect(useGameStore.getState().playerName).toBe('Selim');
  expect(screen.getByRole('status')).toHaveTextContent('Kaydedildi');
});

it('shows the save after reopening and resumes exactly once with keyboard navigation', async () => {
  saveRun();
  const original = localStorage.getItem(RUN_SAVE_KEY);
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Selim' })).toBeInTheDocument();
  expect(screen.getByText(/Deste seçimi/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Devam et' })).toHaveFocus();
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBe(original);
  await user.keyboard('{Enter}');
  expect(screen.getByRole('heading', { name: 'Desteni kur' })).toBeInTheDocument();
  expect(useGameStore.getState().draftPicks).toBe(1);
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBe(original);
  const beforeMenu = snapshotRun(useGameStore.getState());
  await user.click(screen.getByRole('button', { name: 'Menü' }));
  await user.click(screen.getByRole('button', { name: 'Devam et' }));
  expect(snapshotRun(useGameStore.getState())).toEqual(beforeMenu);
});

it('requires explicit replacement and cancel or Escape leaves the save untouched', async () => {
  saveRun();
  const original = localStorage.getItem(RUN_SAVE_KEY);
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Yeni macera' }));
  const input = screen.getByRole('textbox', { name: 'Karakter adı' });
  expect(input).toHaveFocus();
  await user.clear(input); await user.type(input, 'Deniz');
  await user.click(screen.getByRole('button', { name: 'Başla' }));
  expect(screen.getByRole('heading', { name: 'Yeni maceraya başla?' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Vazgeç' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.getByRole('textbox', { name: 'Karakter adı' })).toHaveFocus();
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBe(original);
  await user.click(screen.getByRole('button', { name: 'Başla' }));
  await user.click(screen.getByRole('button', { name: 'Vazgeç' }));
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBe(original);
  await user.click(screen.getByRole('button', { name: 'Başla' }));
  await user.click(screen.getByRole('button', { name: 'Yeni maceraya başla' }));
  expect(useGameStore.getState().playerName).toBe('Deniz');
  expect(useGameStore.getState().draftPicks).toBe(0);
  expect(localStorage.getItem(RUN_SAVE_KEY)).not.toBe(original);
});

it('shows damaged saves without offering a broken Continue action or silently removing them', () => {
  localStorage.setItem(RUN_SAVE_KEY, '{');
  render(<App />);
  expect(screen.getByRole('alert')).toHaveTextContent('Kayıt okunamadı');
  expect(screen.queryByRole('button', { name: 'Devam et' })).not.toBeInTheDocument();
  expect(localStorage.getItem(RUN_SAVE_KEY)).toBe('{');
});

it('opens a new-game form after defeat instead of offering to revive the old character', () => {
  saveRun(); useGameStore.getState().resumeGame();
  while (useGameStore.getState().gamePhase === 'deckBuild') useGameStore.getState().chooseDraftCard(useGameStore.getState().draftOptions[0].id);
  useGameStore.getState().applyDamage('player', 1000);
  useGameStore.setState(useGameStore.getInitialState(), true);
  render(<App />);
  expect(screen.getByRole('textbox', { name: 'Karakter adı' })).toHaveValue('Selim');
  expect(screen.queryByRole('button', { name: 'Devam et' })).not.toBeInTheDocument();
});

it('shows save failures, lets the player return to the live run and retry saving', async () => {
  useGameStore.getState().startNewGame('Selim', null);
  useGameStore.getState().configureCampaign('weaver', 0);
  const user = userEvent.setup();
  render(<App />);
  const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
  await user.click(screen.getAllByRole('button', { name: /Savaş/ })[0]);
  expect(screen.getByRole('alert')).toHaveTextContent('İlerleme kaydedilemedi');
  expect(screen.getByRole('status')).toHaveTextContent('Kaydedilemedi');
  await user.click(screen.getByRole('button', { name: 'Menü' }));
  await user.click(screen.getByRole('button', { name: 'Devam et' }));
  expect(useGameStore.getState().gamePhase).toBe('deckBuild');
  fail.mockRestore();
  await user.click(screen.getByRole('button', { name: 'Tekrar kaydet' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Kaydedildi');
});

it('updates the menu when a different tab saves, without showing stale in-memory details', async () => {
  useGameStore.getState().startNewGame('Selim', null);
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Menü' }));
  const original = localStorage.getItem(RUN_SAVE_KEY)!;
  const other = JSON.parse(original);
  other.run.playerName = 'Deniz'; other.run.player.isim = 'Deniz';
  localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(other));
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: RUN_SAVE_KEY, oldValue: original, newValue: JSON.stringify(other) })));
  expect(screen.getByRole('heading', { name: 'Deniz' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Devam et' }));
  expect(useGameStore.getState().playerName).toBe('Deniz');
});
