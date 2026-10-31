import { useLayoutEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Box3, Box3Helper } from 'three';
import { useApartmentStore } from '../../state/apartmentStore';

const SELECTED_COLOR = '#2f80ed';
const HOVERED_COLOR = '#9cc3f5';
const PADDING = 0.01;

export function SelectionHighlight() {
  const selectedId = useApartmentStore((state) => state.selectedId);
  const hoveredId = useApartmentStore((state) => state.hoveredId);

  return (
    <>
      {hoveredId && hoveredId !== selectedId && (
        <HighlightBox objectName={hoveredId} color={HOVERED_COLOR} />
      )}
      {selectedId && <HighlightBox objectName={selectedId} color={SELECTED_COLOR} />}
    </>
  );
}

function HighlightBox({ objectName, color }: { objectName: string; color: string }) {
  const scene = useThree((state) => state.scene);
  const apartment = useApartmentStore((state) => state.apartment);

  useLayoutEffect(() => {
    const object = scene.getObjectByName(objectName);
    if (!object) {
      return;
    }
    object.updateWorldMatrix(true, true);
    const box = new Box3().setFromObject(object, true).expandByScalar(PADDING);
    const helper = new Box3Helper(box, color);
    helper.raycast = () => {};
    scene.add(helper);
    return () => {
      scene.remove(helper);
      helper.dispose();
    };
  }, [scene, objectName, color, apartment]);

  return null;
}
