import { describe, expect, it } from 'vitest';
import { useApartmentStore } from './apartmentStore';

describe('apartmentStore', () => {
  it('clears the selection when the active floor changes', () => {
    // Arrange
    const store = useApartmentStore.getState();
    store.select('bed-1');
    store.hover('wall-1');

    // Act
    store.setActiveFloor('first');

    // Assert
    const state = useApartmentStore.getState();
    expect(state.activeFloorId).toBe('first');
    expect(state.selectedId).toBeUndefined();
    expect(state.hoveredId).toBeUndefined();
  });
});
