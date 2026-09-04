import type { NodeType } from '../types/game';

// runFloor is the number of completed nodes. Keep one generator for UI and engine.
export function generateAvailableNodes(floor: number, _previous: NodeType | null = null): Array<{ type: NodeType; id: string }> {
  const types: NodeType[] = floor > 0 && floor % 3 === 0
    ? ['boss', 'elite', 'shop']
    : floor > 0 ? ['combat', 'event', 'rest'] : ['combat', 'combat', 'shop'];
  const counts = new Map<NodeType, number>();
  return types.map(type => {
    const index = counts.get(type) ?? 0;
    counts.set(type, index + 1);
    return { type, id: `floor-${floor}-${type}-${index}` };
  });
}
