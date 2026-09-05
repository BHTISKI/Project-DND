import { afterEach, it, expect, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { HealthBar } from './HealthBar';
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('keeps the damage trail behind current HP, handles consecutive hits and healing', () => {
  vi.useFakeTimers();
  const { rerender, container } = render(<HealthBar health={100} maxHealth={100} owner="Oyuncu" />);
  rerender(<HealthBar health={70} maxHealth={100} owner="Oyuncu" />);
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '70');
  expect(container.querySelector('.health-trail')).toHaveStyle({ width: '100%' });
  act(() => vi.advanceTimersByTime(100));
  rerender(<HealthBar health={40} maxHealth={100} owner="Oyuncu" />);
  act(() => vi.advanceTimersByTime(250));
  expect(container.querySelector('.health-trail')).toHaveStyle({ width: '40%' });
  rerender(<HealthBar health={80} maxHealth={100} owner="Oyuncu" />);
  expect(container.querySelector('.health-trail')).toHaveStyle({ width: '80%' });
  expect(screen.getByRole('progressbar')).not.toHaveClass('health-bar--hit');
});
