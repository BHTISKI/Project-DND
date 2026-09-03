/** Design hypothesis, not an empirical measure of enjoyment. Ratings are 0–5. */
export interface FunMetrics {
  decisionDepth: number;
  agency: number;
  comboPotential: number;
  controlledVariance: number;
  clarity: number;
}
const weights: FunMetrics = { decisionDepth: 30, agency: 30, comboPotential: 20, controlledVariance: 10, clarity: 10 };
export function funScore(metrics: Partial<FunMetrics> = {}): number {
  let score = 0;
  for (const key of Object.keys(weights) as (keyof FunMetrics)[]) {
    const rating = metrics[key] ?? 0;
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) throw new RangeError(`${key}: rating must be between 0 and 5`);
    score += rating / 5 * weights[key];
  }
  return Math.round(score);
}
