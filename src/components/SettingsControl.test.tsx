import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsControl } from './SettingsControl';
import { DEFAULT_PREFERENCES, usePreferencesStore } from '../state/preferences';

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  usePreferencesStore.setState({ ...DEFAULT_PREFERENCES, storageError: false });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open'); } });
});
afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.gameMotion;
  delete document.documentElement.dataset.gameShake;
  document.documentElement.style.removeProperty('overflow');
  delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).showModal;
  delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
  vi.restoreAllMocks();
});

it('opens an accessible modal and restores focus after close', async () => {
  const user = userEvent.setup();
  render(<SettingsControl />);
  const trigger = screen.getByRole('button', { name: 'Ayarları aç' });
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Ayarlar' });
  expect(dialog).toHaveAttribute('open');
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('button', { name: 'Ayarları kapat' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Ayarları kapat' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it('closes on Escape without changing preferences', async () => {
  const user = userEvent.setup();
  render(<SettingsControl />);
  await user.click(screen.getByRole('button', { name: 'Ayarları aç' }));
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: false, cancelable: true }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(usePreferencesStore.getState()).toMatchObject(DEFAULT_PREFERENCES);
});

it('does not mistake the dialog scrollbar for a backdrop click', async () => {
  const user = userEvent.setup();
  render(<SettingsControl />);
  await user.click(screen.getByRole('button', { name: 'Ayarları aç' }));
  const dialog = screen.getByRole('dialog', { name: 'Ayarlar' });
  vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
    x: 100, y: 100, left: 100, top: 100, right: 300, bottom: 500,
    width: 200, height: 400, toJSON: () => ({}),
  });

  fireEvent.pointerDown(dialog, { clientX: 299, clientY: 250 });
  fireEvent.click(dialog, { clientX: 299, clientY: 250 });
  expect(dialog).toBeInTheDocument();

  fireEvent.pointerDown(dialog, { clientX: 80, clientY: 250 });
  fireEvent.click(dialog, { clientX: 80, clientY: 250 });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('applies motion and shake preferences to the whole game immediately', async () => {
  const user = userEvent.setup();
  render(<SettingsControl />);
  await user.click(screen.getByRole('button', { name: 'Ayarları aç' }));
  await user.click(screen.getByRole('checkbox', { name: 'Hareketli efektler' }));
  expect(document.documentElement.dataset.gameMotion).toBe('reduced');
  expect(screen.getByRole('checkbox', { name: 'Ekran sarsıntısı' })).toBeDisabled();
  await user.click(screen.getByRole('checkbox', { name: 'Hareketli efektler' }));
  await user.click(screen.getByRole('checkbox', { name: 'Ekran sarsıntısı' }));
  expect(document.documentElement.dataset.gameShake).toBe('off');
});

it('controls the ring, glow and cycle speed without touching the adventure save', async () => {
  localStorage.setItem('makara.run', 'keep-this-run');
  const user = userEvent.setup();
  render(<SettingsControl />);
  await user.click(screen.getByRole('button', { name: 'Ayarları aç' }));
  await user.click(screen.getByRole('checkbox', { name: 'Dolum halkası' }));
  await user.click(screen.getByRole('checkbox', { name: 'Işıltı' }));
  expect(document.querySelector('.settings-control')).toHaveClass('settings-control--no-ring', 'settings-control--quiet');
  await user.click(screen.getByRole('button', { name: 'Varsayılana dön' }));
  const slider = screen.getByRole('slider', { name: 'Animasyon hızı' });
  fireEvent.change(slider, { target: { value: '1.5' } });
  expect(document.querySelector('.settings-control')).toHaveStyle({ '--settings-cycle': '4s' });
  expect(localStorage.getItem('makara.run')).toBe('keep-this-run');
});

it('keeps settings usable when browser storage rejects a write', async () => {
  const user = userEvent.setup();
  render(<SettingsControl />);
  await user.click(screen.getByRole('button', { name: 'Ayarları aç' }));
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
  await user.click(screen.getByRole('checkbox', { name: 'Işıltı' }));
  expect(screen.getByText(/Ayarlar kaydedilemedi/)).toHaveAttribute('role', 'status');
  expect(document.querySelector('.settings-control')).toHaveClass('settings-control--quiet');
});
