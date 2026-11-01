import type { ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useApartmentStore } from '../../state/apartmentStore';
import { useViewerStore } from '../../state/viewerStore';

const CLICK_TOLERANCE_PX = 4;

export function Selectable({ id, children }: { id: string; children: ReactNode }) {
  const select = useApartmentStore((state) => state.select);
  const hover = useApartmentStore((state) => state.hover);
  const tool = useViewerStore((state) => state.tool);
  const addMeasurePoint = useViewerStore((state) => state.addMeasurePoint);
  const setHoverPoint = useViewerStore((state) => state.setHoverPoint);
  const measuring = tool === 'ruler';

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > CLICK_TOLERANCE_PX) {
      return;
    }
    if (measuring) {
      addMeasurePoint(event.point.toArray());
    } else {
      select(id);
    }
  };
  const onPointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = measuring ? 'crosshair' : 'pointer';
    if (!measuring) {
      hover(id);
    }
  };
  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (measuring) {
      event.stopPropagation();
      setHoverPoint(event.point.toArray());
    }
  };
  const onPointerOut = () => {
    if (useApartmentStore.getState().hoveredId === id) {
      hover(undefined);
    }
    document.body.style.cursor = '';
  };

  return (
    <group
      name={id}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerMove={onPointerMove}
      onPointerOut={onPointerOut}
    >
      {children}
    </group>
  );
}
