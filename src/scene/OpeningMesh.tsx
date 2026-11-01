import type { Material } from 'three';
import type { Opening, Wall } from '../schema/apartment';
import { pointAlong, wallFrame } from './geometry/wallFrame';
import { meshMaterial } from './materials';
import { DEFAULT_OPENING_MATERIAL } from './openings';

const LINING = 0.025;
const ARCHITRAVE_WIDTH = 0.07;
const ARCHITRAVE_THICKNESS = 0.015;
const DOOR_LEAF_THICKNESS = 0.04;
const WINDOW_FRAME = 0.05;
const GLASS_MATERIAL = 'glass-clear';

type Bar = [x: number, y: number, z: number, width: number, height: number, depth: number];

interface OpeningMeshProps {
  opening: Opening;
  wall: Wall;
}

export function OpeningMesh({ opening, wall }: OpeningMeshProps) {
  const frame = wallFrame(wall);
  const [x, z] = pointAlong(frame, opening.offset + opening.width / 2);
  const frameMaterial = meshMaterial(opening.frameMaterial ?? DEFAULT_OPENING_MATERIAL);

  return (
    <group position={[x, opening.sillHeight, z]} rotation={[0, frame.angle, 0]}>
      {opening.kind === 'window' ? (
        <WindowPane opening={opening} depth={wall.thickness} frameMaterial={frameMaterial} />
      ) : (
        opening.door && (
          <Door opening={opening} depth={wall.thickness} frameMaterial={frameMaterial} />
        )
      )}
    </group>
  );
}

function Door({ opening, depth, frameMaterial }: OpeningPartProps) {
  const { width, height } = opening;
  const face = depth / 2 + ARCHITRAVE_THICKNESS / 2;
  const casingHeight = height + ARCHITRAVE_WIDTH / 2;
  const lining: Bar[] = [
    [-width / 2 + LINING / 2, height / 2, 0, LINING, height, depth],
    [width / 2 - LINING / 2, height / 2, 0, LINING, height, depth],
    [0, height - LINING / 2, 0, width, LINING, depth],
  ];
  const architraves: Bar[] = [-face, face].flatMap((side): Bar[] => [
    [-width / 2, casingHeight / 2, side, ARCHITRAVE_WIDTH, casingHeight, ARCHITRAVE_THICKNESS],
    [width / 2, casingHeight / 2, side, ARCHITRAVE_WIDTH, casingHeight, ARCHITRAVE_THICKNESS],
    [0, height, side, width + ARCHITRAVE_WIDTH, ARCHITRAVE_WIDTH, ARCHITRAVE_THICKNESS],
  ]);
  const leafWidth = width - 2 * LINING;
  const leafHeight = height - LINING;

  return (
    <group>
      <Bars bars={[...lining, ...architraves]} material={frameMaterial} />
      <mesh
        position={[0, leafHeight / 2, 0]}
        material={meshMaterial(opening.door?.material ?? DEFAULT_OPENING_MATERIAL)}
        castShadow
      >
        <boxGeometry args={[leafWidth, leafHeight, DOOR_LEAF_THICKNESS]} />
      </mesh>
    </group>
  );
}

function WindowPane({ opening, depth, frameMaterial }: OpeningPartProps) {
  const { width, height } = opening;
  const frameDepth = Math.min(depth, 0.08);
  const bars: Bar[] = [
    [0, WINDOW_FRAME / 2, 0, width, WINDOW_FRAME, frameDepth],
    [0, height - WINDOW_FRAME / 2, 0, width, WINDOW_FRAME, frameDepth],
    [-width / 2 + WINDOW_FRAME / 2, height / 2, 0, WINDOW_FRAME, height, frameDepth],
    [width / 2 - WINDOW_FRAME / 2, height / 2, 0, WINDOW_FRAME, height, frameDepth],
  ];

  return (
    <group>
      <Bars bars={bars} material={frameMaterial} />
      <mesh position={[0, height / 2, 0]} material={meshMaterial(GLASS_MATERIAL)}>
        <boxGeometry args={[width - 2 * WINDOW_FRAME, height - 2 * WINDOW_FRAME, 0.01]} />
      </mesh>
    </group>
  );
}

interface OpeningPartProps {
  opening: Opening;
  depth: number;
  frameMaterial: Material;
}

function Bars({ bars, material }: { bars: readonly Bar[]; material: Material }) {
  return bars.map(([x, y, z, width, height, depth], index) => (
    <mesh key={index} position={[x, y, z]} material={material} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  ));
}
