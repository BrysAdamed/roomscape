import { useMemo } from 'react';
import { findFurnitureType } from '../catalogue/furniture/registry';
import { resolveMaterialRefs, resolveParams } from '../catalogue/furniture/resolve';
import type { FurnitureItem } from '../schema/apartment';
import { meshMaterial } from './materials';

const PLACEHOLDER_SIZE = 0.4;

export function FurnitureMesh({ item }: { item: FurnitureItem }) {
  const type = findFurnitureType(item.type);
  const params = useMemo(() => (type ? resolveParams(type, item) : {}), [type, item]);
  const materials = useMemo(
    () =>
      type
        ? Object.fromEntries(
            Object.entries(resolveMaterialRefs(type, item)).map(([slot, ref]) => [
              slot,
              meshMaterial(ref),
            ]),
          )
        : {},
    [type, item],
  );

  return (
    <group
      position={[item.position[0], item.elevation ?? 0, item.position[1]]}
      rotation={[0, (item.rotation * Math.PI) / 180, 0]}
    >
      {type ? (
        <type.Component params={params} materials={materials} />
      ) : (
        <mesh position={[0, PLACEHOLDER_SIZE / 2, 0]} material={meshMaterial('unknown')}>
          <boxGeometry args={[PLACEHOLDER_SIZE, PLACEHOLDER_SIZE, PLACEHOLDER_SIZE]} />
        </mesh>
      )}
    </group>
  );
}
