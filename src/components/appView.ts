import type { NodeType } from '../types/game';

export const nodeInfo: Record<NodeType, { icon: string; label: string; detail: string }> = {
  combat: { icon: '⚔', label: 'Savaş', detail: 'Düşmanla yüzleş' },
  elite: { icon: '✦', label: 'Seçkin savaş', detail: 'Büyük ödül, büyük risk' },
  shop: { icon: '◆', label: 'Dükkan', detail: 'Desteni hazırla' },
  event: { icon: '?', label: 'Olay', detail: 'Bilinmeyen bir fırsat' },
  rest: { icon: '✚', label: 'Dinlenme', detail: 'Nefeslen ve güçlen' },
  boss: { icon: '♛', label: 'Boss', detail: 'Son sınav' },
};

export function classifyLog(message: string): { className: string; icon: string; label: string } {
  if (message.includes('KRİTİK')) return { className: 'log-entry--critical', icon: '✦', label: 'Kritik' };
  if (message.includes('hasar') || message.includes('saldırı') || message.includes('vuruldu')) return { className: 'log-entry--attack', icon: '⚔', label: 'Saldırı' };
  if (message.includes('blok') || message.includes('savun')) return { className: 'log-entry--defense', icon: '◈', label: 'Savunma' };
  if (message.includes('iyileş')) return { className: 'log-entry--heal', icon: '✚', label: 'Şifa' };
  if (message.includes('zafer') || message.includes('Ödül')) return { className: 'log-entry--victory', icon: '★', label: 'Zafer' };
  if (message.includes('bitti') || message.includes('ölü')) return { className: 'log-entry--gameover', icon: '×', label: 'Run sonu' };
  return { className: '', icon: '·', label: 'Kayıt' };
}
