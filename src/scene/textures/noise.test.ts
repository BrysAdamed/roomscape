import { describe, expect, it } from 'vitest';
import { fractalNoise, seededRandom } from './noise';

describe('seededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('fractalNoise', () => {
  it('stays within [0, 1] and tiles seamlessly', () => {
    const noise = fractalNoise(3, 4, 2, 3);
    for (let i = 0; i < 50; i++) {
      const value = noise(i / 50, (i * 7) / 50 - Math.floor((i * 7) / 50));
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
    expect(noise(0, 0.3)).toBeCloseTo(noise(1, 0.3), 10);
    expect(noise(0.4, 0)).toBeCloseTo(noise(0.4, 1), 10);
  });
});
