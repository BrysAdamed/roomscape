import { describe, expect, it } from 'vitest';
import { FLY_BINDINGS, flyActionFor, keyName } from './flyBindings';

describe('flyBindings', () => {
  it('maps every bound key to exactly one action', () => {
    // Arrange
    const codes = Object.values(FLY_BINDINGS).flat();

    // Act
    const unique = new Set(codes);

    // Assert
    expect(unique.size).toBe(codes.length);
  });

  it('resolves turn, height and pitch keys', () => {
    // Act
    const actions = ['KeyQ', 'KeyE', 'KeyR', 'KeyF', 'KeyT', 'KeyG', 'ArrowUp', 'KeyX'].map(
      flyActionFor,
    );

    // Assert
    expect(actions).toEqual([
      'turnLeft',
      'turnRight',
      'up',
      'down',
      'lookUp',
      'lookDown',
      'lookUp',
      undefined,
    ]);
  });

  it('names keys for the help panel', () => {
    // Act
    const names = ['KeyW', 'ArrowLeft', 'ShiftRight'].map(keyName);

    // Assert
    expect(names).toEqual(['W', '←', 'Shift']);
  });
});
