import type { Opening, Wall } from '../schema/apartment';
import { pointAlong, wallFrame } from './geometry/wallFrame';
import { meshMaterial } from './materials';

const FRAME = 0.05;
const DOOR_LEAF_THICKNESS = 0.04;
const DEFAULT_DOOR_MATERIAL = 'wood-white-lacquer';
const WINDOW_FRAME_MATERIAL = 'wood-white-lacquer';
const GLASS_MATERIAL = 'glass-clear';

interface OpeningMeshProps {
  opening: Opening;
  wall: Wall;
}

export function OpeningMesh({ opening, wall }: OpeningMeshProps) {
  const frame = wallFrame(wall);
  const [x, z] = pointAlong(frame, opening.offset + opening.width / 2);

  return (
    <group position={[x, opening.sillHeight, z]} rotation={[0, frame.angle, 0]}>
      {opening.kind === 'door' ? (
        <DoorLeaf opening={opening} />
      ) : (
        <WindowPane opening={opening} depth={wall.thickness} />
      )}
    </group>
  );
}

function DoorLeaf({ opening }: { opening: Opening }) {
  const width = opening.width - FRAME;
  const height = opening.height - FRAME / 2;
  return (
    <mesh
      position={[0, height / 2, 0]}
      material={meshMaterial(opening.door?.material ?? DEFAULT_DOOR_MATERIAL)}
      castShadow
    >
      <boxGeometry args={[width, height, DOOR_LEAF_THICKNESS]} />
    </mesh>
  );
}

function WindowPane({ opening, depth }: { opening: Opening; depth: number }) {
  const { width, height } = opening;
  const frameDepth = Math.min(depth, 0.08);
  const frameMaterial = meshMaterial(WINDOW_FRAME_MATERIAL);
  const bars: [number, number, number, number, number][] = [
    [0, FRAME / 2, width, FRAME, frameDepth],
    [0, height - FRAME / 2, width, FRAME, frameDepth],
    [-width / 2 + FRAME / 2, height / 2, FRAME, height, frameDepth],
    [width / 2 - FRAME / 2, height / 2, FRAME, height, frameDepth],
  ];

  return (
    <group>
      {bars.map(([bx, by, bw, bh, bd], index) => (
        <mesh key={index} position={[bx, by, 0]} material={frameMaterial}>
          <boxGeometry args={[bw, bh, bd]} />
        </mesh>
      ))}
      <mesh position={[0, height / 2, 0]} material={meshMaterial(GLASS_MATERIAL)}>
        <boxGeometry args={[width - 2 * FRAME, height - 2 * FRAME, 0.01]} />
      </mesh>
    </group>
  );
}
