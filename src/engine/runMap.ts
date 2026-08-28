// Run map system for generating node-based progression
import type { NodeType } from '../types/game';

// Weights for node type selection based on floor
const nodeTypeWeights: Record<NodeType, { base: number; floorFactor: number }> = {
  combat: { base: 0.4, floorFactor: -0.01 }, // Decreases slightly as floor increases
  elite: { base: 0.1, floorFactor: 0.005 },  // Increases slightly as floor increases
  shop: { base: 0.2, floorFactor: 0 },       // Constant
  event: { base: 0.2, floorFactor: 0 },      // Constant
  rest: { base: 0.1, floorFactor: 0 },       // Constant
  boss: { base: 0, floorFactor: 0 },         // Special handling
};

// Generate a unique ID for nodes
function generateNodeId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Get weights for a specific floor
function getNodeWeightsForFloor(floor: number): Record<NodeType, number> {
  const weights = {} as Record<NodeType, number>;

  for (const [type, { base, floorFactor }] of Object.entries(nodeTypeWeights)) {
    let weight = base + (floor * floorFactor);
    // Ensure weight is between 0.05 and 0.9
    weight = Math.max(0.05, Math.min(0.9, weight));
    weights[type as NodeType] = weight;
  }

  // Normalize weights so they sum to 1 (excluding boss which is handled separately)
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  for (const type in weights) {
    weights[type as NodeType] = weights[type as NodeType] / total;
  }

  return weights;
}

// Determine if a boss node should be forced at this floor
function shouldForceBoss(floor: number): boolean {
  // Boss every 3rd floor (3, 6, 9, ...)
  return floor > 0 && floor % 3 === 0;
}

// Generate available nodes for the player to choose from
export function generateAvailableNodes(currentFloor: number, _currentNodeType: NodeType | null): Array<{ type: NodeType; id: string }> {
  const nodes: Array<{ type: NodeType; id: string }> = [];

  // Determine how many choices to give (2-3 based on floor)
  const choiceCount = Math.min(3, 2 + Math.floor(currentFloor / 5));

  // Handle boss forcing
  if (shouldForceBoss(currentFloor + 1)) {
    // Force a boss node as one of the choices
    nodes.push({ type: 'boss', id: generateNodeId() });
  }

  // Fill remaining choices with weighted random selection
  const weights = getNodeWeightsForFloor(currentFloor);
  const availableTypes = Object.keys(weights) as NodeType[];

  // Remove boss from regular selection if it was already forced
  const selectionTypes = shouldForceBoss(currentFloor + 1)
    ? availableTypes.filter(t => t !== 'boss')
    : availableTypes;

  // Create a weighted selection array
  const weightedTypes: NodeType[] = [];
  for (const type of selectionTypes) {
    const weight = Math.floor(weights[type] * 100); // Convert to integer percentage
    for (let i = 0; i < weight; i++) {
      weightedTypes.push(type);
    }
  }

  // If we don't have enough weighted types (shouldn't happen with proper normalization),
  // fall back to equal distribution
  const selectionPool = weightedTypes.length > 0 ? weightedTypes : selectionTypes;

  // Add remaining choices
  while (nodes.length < choiceCount && selectionPool.length > 0) {
    const randomIndex = Math.floor(Math.random() * selectionPool.length);
    const selectedType = selectionPool[randomIndex];

    // Avoid duplicating the same type too often (except for combat which is common)
    const sameTypeCount = nodes.filter(n => n.type === selectedType).length;
    const maxSameType = selectedType === 'combat' ? 2 : 1;

    if (sameTypeCount < maxSameType) {
      nodes.push({ type: selectedType, id: generateNodeId() });
    }

    // If we can't add more of this type, remove it from selection pool temporarily
    if (sameTypeCount >= maxSameType) {
      // Create a new array without this type for this iteration
      const filteredPool = selectionPool.filter(t => t !== selectedType);
      if (filteredPool.length > 0) {
        // Continue with filtered pool
        // Note: We don't modify selectionPool permanently to maintain variety
      }
    }
  }

  // Ensure we have at least 2 choices
  if (nodes.length < 2) {
    // Add combat nodes as fallback
    while (nodes.length < 2) {
      nodes.push({ type: 'combat', id: generateNodeId() });
    }
  }

  return nodes;
}

// Update run map state after completing a node
export function updateRunMapAfterNodeCompletion(
  currentState: {
    runFloor: number;
    currentNode: NodeType | null;
    nodeType: NodeType | null;
  },
  completedNodeType: NodeType
) {
  // Increment floor when we complete a node
  const newFloor = completedNodeType === 'boss' ? currentState.runFloor + 1 : currentState.runFloor + 1;

  // Determine the type of node we just completed for tracking
  const nodeType = completedNodeType;

  // Generate new available nodes for the next choice
  const availableNodes = generateAvailableNodes(newFloor, completedNodeType);

  return {
    runFloor: newFloor,
    currentNode: completedNodeType,
    availableNodes,
    nodeType,
  };
}

// Get reward bonus for elite nodes
export function getEliteRewardBonus(victoryCount: number): number {
  // Elite nodes give 50% more gold rewards
  return Math.floor((20 + victoryCount * 5) * 0.5);
}

// Get event node choices (simplified for first version)
export function getEventChoices(): Array<{ description: string; effect: () => void }> {
  return [
    {
      description: "Canınızı %20 artırır, ancak altınızın %10'unu verlersiniz",
      effect: () => {
        // This will be implemented in the event resolver
      }
    },
    {
      description: "Bir kart çekersiniz, ancak bir cartı destağınızdan kaldırırsınız",
      effect: () => {
        // This will be implemented in the event resolver
      }
    },
    {
      description: "Düşmanınızın gücünü azaltır, ancak bir tur riesce bırakırsınız",
      effect: () => {
        // This will be implemented in the event resolver
      }
    }
  ];
}