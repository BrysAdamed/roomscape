import type { ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useApartmentStore } from '../../state/apartmentStore';

const CLICK_TOLERANCE_PX = 4;

export function Selectable({ id, children }: { id: string; children: ReactNode }) {
  const select = useApartmentStore((state) => state.select);
  const hover = useApartmentStore((state) => state.hover);

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta <= CLICK_TOLERANCE_PX) {
      select(id);
    }
  };
  const onPointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    hover(id);
    document.body.style.cursor = 'pointer';
  };
  const onPointerOut = () => {
    if (useApartmentStore.getState().hoveredId === id) {
      hover(undefined);
    }
    document.body.style.cursor = '';
  };

  return (
    <group name={id} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {children}
    </group>
  );
}
