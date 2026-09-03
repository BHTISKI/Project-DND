export interface IRNG {
  random(): number;
}

export class DefaultRNG implements IRNG {
  random(): number {
    return Math.random();
  }
}

export class SeededRNG implements IRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = (seed >>> 0) || 0x9e3779b9;
  }

  random(): number {
    // Xorshift algorithm
    this.seed ^= this.seed << 13;
    this.seed ^= this.seed >>> 17;
    this.seed ^= this.seed << 5;
    // Convert to float in [0,1)
    return (this.seed >>> 0) / 0x100000000;
  }
}
