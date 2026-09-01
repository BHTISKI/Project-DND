// Bu dosya src/components/BattleLogDrawer.test.tsx için ilgili kodları içerir.
// BattleLogDrawer bileşeni testleri: render ve kullanıcı etkileşimleri
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BattleLogDrawer } from './BattleLogDrawer';
import { cleanup } from '@testing-library/react';

describe('BattleLogDrawer', () => {
  const mockClassify = vi.fn((message: string) => {
    const lowerMessage = message.toLocaleLowerCase('tr');
    console.log('classify called with:', message);
    console.log('lowerMessage:', lowerMessage);
    let result;
    if (lowerMessage.includes('kritik')) {
      result = { className: 'log-entry--critical', icon: '✦', label: 'Kritik' };
      console.log('classified as critical');
    }
    else if (lowerMessage.includes('hasar') || lowerMessage.includes('saldırı') || lowerMessage.includes('vuruldu')) {
      result = { className: 'log-entry--attack', icon: '⚔', label: 'Saldırı' };
      console.log('classified as attack');
    }
    else if (lowerMessage.includes('blok') || lowerMessage.includes('savun')) {
      result = { className: 'log-entry--defense', icon: '◈', label: 'Savunma' };
      console.log('classified as defense');
    }
    else if (lowerMessage.includes('iyileş')) {
      result = { className: 'log-entry--heal', icon: '✚', label: 'Şifa' };
      console.log('classified as heal');
    }
    else if (lowerMessage.includes('zafer') || lowerMessage.includes('ödül')) {
      result = { className: 'log-entry--victory', icon: '★', label: 'Zafer' };
      console.log('classified as victory');
    }
    else if (lowerMessage.includes('bitti') || lowerMessage.includes('ölü')) {
      result = { className: 'log-entry--gameover', icon: '×', label: 'Run sonu' };
      console.log('classified as gameover');
    }
    else {
      result = { className: '', icon: '·', label: 'Kayıt' };
      console.log('classified as normal');
    }
    console.log('classify result:', result);
    return result;
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders toggle button with message count', () => {
    const messages = ['İlk kayıt', 'İkinci kayıt'];
    render(<BattleLogDrawer messages={messages} isOpen={false} onToggle={vi.fn()} classify={mockClassify} />);
    const toggleButton = screen.getByRole('button', { name: /Günlük/i });
    expect(toggleButton).toBeInTheDocument();
    expect(screen.getByText(/▤/i)).toBeInTheDocument();
    expect(screen.getByText(/Günlük/i)).toBeInTheDocument();
    expect(screen.getByText(/2/i)).toBeInTheDocument(); // message count
  });

  it('shows drawer when isOpen is true', () => {
    const messages = ['Test mesajı'];
    render(<BattleLogDrawer messages={messages} isOpen={true} onToggle={vi.fn()} classify={mockClassify} />);
    // The drawer has aria-label="Savaş günlüğü"
    const drawer = screen.getByLabelText(/^Savaş günlüğü$/i);
    expect(drawer).toHaveAttribute('aria-hidden', 'false');
  });

  it('hides drawer when isOpen is false', () => {
    const messages = ['Test mesajı'];
    render(<BattleLogDrawer messages={messages} isOpen={false} onToggle={vi.fn()} classify={mockClassify} />);
    // The drawer has aria-label="Savaş günlüğü"
    const drawer = screen.getByLabelText(/^Savaş günlüğü$/i);
    expect(drawer).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onToggle when toggle button is clicked', async () => {
    const onToggle = vi.fn();
    const messages = ['Test'];
    render(<BattleLogDrawer messages={messages} isOpen={false} onToggle={onToggle} classify={mockClassify} />);
    const toggleButton = screen.getByRole('button', { name: /Günlük/i });
    await userEvent.click(toggleButton);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onToggle when close button is clicked', async () => {
    const onToggle = vi.fn();
    const messages = ['Test'];
    render(<BattleLogDrawer messages={messages} isOpen={true} onToggle={onToggle} classify={mockClassify} />);
    // The close button has aria-label="Savaş günlüğünü kapat"
    const closeButton = screen.getByLabelText(/^Savaş günlüğünü kapat$/i);
    await userEvent.click(closeButton);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('displays messages in reverse order (latest first)', () => {
    const messages = ['İlk', 'İkinci', 'Üçüncü'];
    const { container } = render(<BattleLogDrawer messages={messages} isOpen={true} onToggle={vi.fn()} classify={mockClassify} />);
    // The messages are reversed in the body: messages.slice().reverse()
    // So we expect Üçüncü first, then İkinci, then İlk
    const logEntries = Array.from(container.querySelectorAll('.log-entry'));
    expect(logEntries[0]).toHaveTextContent(/Üçüncü/);
    expect(logEntries[1]).toHaveTextContent(/İkinci/);
    expect(logEntries[2]).toHaveTextContent(/İlk/);
  });

  it('applies correct classification to messages', () => {
    const messages = [
      'KRİTİK hasar!',
      'Düşmanı vuruldu', // changed from vurdun to vuruldu to match mockClassify
      'Blok başarılı',
      'Canınız iyileşti',
      'Zafer kazandınız!',
      'Oyun bitti.',
      'Normal mesaj'
    ];
    const { container } = render(<BattleLogDrawer messages={messages} isOpen={true} onToggle={vi.fn()} classify={mockClassify} />);
    // we can check the class names by looking at the elements
    const logEntries = Array.from(container.querySelectorAll('.log-entry'));
    // The component reverses the messages, so we expect:
    // index 0: Normal mesaj -> empty class (only base class)
    // index 1: Oyun bitti. -> gameover
    // index 2: Zafer kazandınız! -> victory
    // index 3: Canınız iyileşti -> heal
    // index 4: Blok başarılı -> defense
    // index 5: Düşmanı vuruldu -> attack
    // index 6: KRİTİK hasar! -> critical

    // Helper to check that an element has the base class and optionally a specific class
    const hasBaseClass = (el: HTMLElement) => el.classList.contains('log-entry');
    const hasSpecificClass = (el: HTMLElement, specific: string) => el.classList.contains(`log-entry--${specific}`);

    // Normal mesaj: only base class
    expect(hasBaseClass(logEntries[0])).toBe(true);
    expect(hasSpecificClass(logEntries[0], 'critical')).toBe(false);
    expect(hasSpecificClass(logEntries[0], 'attack')).toBe(false);
    expect(hasSpecificClass(logEntries[0], 'defense')).toBe(false);
    expect(hasSpecificClass(logEntries[0], 'heal')).toBe(false);
    expect(hasSpecificClass(logEntries[0], 'victory')).toBe(false);
    expect(hasSpecificClass(logEntries[0], 'gameover')).toBe(false);

    // Oyun bitti.: base + gameover
    expect(hasBaseClass(logEntries[1])).toBe(true);
    expect(hasSpecificClass(logEntries[1], 'gameover')).toBe(true);
    expect(hasSpecificClass(logEntries[1], 'critical')).toBe(false);
    expect(hasSpecificClass(logEntries[1], 'attack')).toBe(false);
    expect(hasSpecificClass(logEntries[1], 'defense')).toBe(false);
    expect(hasSpecificClass(logEntries[1], 'heal')).toBe(false);
    expect(hasSpecificClass(logEntries[1], 'victory')).toBe(false);

    // Zafer kazandınız!: base + victory
    expect(hasBaseClass(logEntries[2])).toBe(true);
    expect(hasSpecificClass(logEntries[2], 'victory')).toBe(true);
    expect(hasSpecificClass(logEntries[2], 'critical')).toBe(false);
    expect(hasSpecificClass(logEntries[2], 'attack')).toBe(false);
    expect(hasSpecificClass(logEntries[2], 'defense')).toBe(false);
    expect(hasSpecificClass(logEntries[2], 'heal')).toBe(false);
    expect(hasSpecificClass(logEntries[2], 'gameover')).toBe(false);

    // Canınız iyileşti: base + heal
    expect(hasBaseClass(logEntries[3])).toBe(true);
    expect(hasSpecificClass(logEntries[3], 'heal')).toBe(true);
    expect(hasSpecificClass(logEntries[3], 'critical')).toBe(false);
    expect(hasSpecificClass(logEntries[3], 'attack')).toBe(false);
    expect(hasSpecificClass(logEntries[3], 'defense')).toBe(false);
    expect(hasSpecificClass(logEntries[3], 'victory')).toBe(false);
    expect(hasSpecificClass(logEntries[3], 'gameover')).toBe(false);

    // Blok başarılı: base + defense
    expect(hasBaseClass(logEntries[4])).toBe(true);
    expect(hasSpecificClass(logEntries[4], 'defense')).toBe(true);
    expect(hasSpecificClass(logEntries[4], 'critical')).toBe(false);
    expect(hasSpecificClass(logEntries[4], 'attack')).toBe(false);
    expect(hasSpecificClass(logEntries[4], 'heal')).toBe(false);
    expect(hasSpecificClass(logEntries[4], 'victory')).toBe(false);
    expect(hasSpecificClass(logEntries[4], 'gameover')).toBe(false);

    // Düşmanı vuruldu: base + attack
    expect(hasBaseClass(logEntries[5])).toBe(true);
    expect(hasSpecificClass(logEntries[5], 'attack')).toBe(true);
    expect(hasSpecificClass(logEntries[5], 'critical')).toBe(false);
    expect(hasSpecificClass(logEntries[5], 'defense')).toBe(false);
    expect(hasSpecificClass(logEntries[5], 'heal')).toBe(false);
    expect(hasSpecificClass(logEntries[5], 'victory')).toBe(false);
    expect(hasSpecificClass(logEntries[5], 'gameover')).toBe(false);

    // KRİTİK hasar!: base + critical
    expect(hasBaseClass(logEntries[6])).toBe(true);
    expect(hasSpecificClass(logEntries[6], 'critical')).toBe(true);
    expect(hasSpecificClass(logEntries[6], 'attack')).toBe(false);
    expect(hasSpecificClass(logEntries[6], 'defense')).toBe(false);
    expect(hasSpecificClass(logEntries[6], 'heal')).toBe(false);
    expect(hasSpecificClass(logEntries[6], 'victory')).toBe(false);
    expect(hasSpecificClass(logEntries[6], 'gameover')).toBe(false);
  });

  it('shows empty state when no messages', () => {
    const { container } = render(<BattleLogDrawer messages={[]} isOpen={true} onToggle={vi.fn()} classify={mockClassify} />);
    expect(screen.getByText(/Henüz bir kayıt yok./i)).toBeInTheDocument();
    expect(container.querySelectorAll('.log-entry')).toHaveLength(0);
  });
});