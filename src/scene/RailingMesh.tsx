import type { Material } from 'three';
import type { Railing } from '../schema/apartment';
import {
  DEFAULT_RAILING_HEIGHT,
  DEFAULT_RAILING_MATERIAL,
  railingLayout,
} from './geometry/railingLayout';
import { meshMaterial } from './materials';

const POST = 0.04;
const RAIL = 0.05;
const BAR = 0.015;
const BAR_SPACING = 0.11;
const BOTTOM_GAP = 0.08;
const GLASS_MATERIAL = 'glass-clear';

export function RailingMesh({ railing, override }: { railing: Railing; override?: Material }) {
  const height = railing.height ?? DEFAULT_RAILING_HEIGHT;
  const frame = override ?? meshMaterial(railing.material ?? DEFAULT_RAILING_MATERIAL);
  const infill = override ?? meshMaterial(GLASS_MATERIAL);
  const { posts, segments } = railingLayout(railing);
  const infillHeight = height - RAIL - BOTTOM_GAP;

  return (
    <group>
      {posts.map(([x, z], index) => (
        <mesh key={index} position={[x, height / 2, z]} material={frame} castShadow>
          <boxGeometry args={[POST, height, POST]} />
        </mesh>
      ))}
      {segments.map((segment, index) => {
        const x = (segment.start[0] + segment.end[0]) / 2;
        const z = (segment.start[1] + segment.end[1]) / 2;
        const bars = Math.max(0, Math.floor(segment.length / BAR_SPACING) - 1);
        return (
          <group key={index} position={[x, 0, z]} rotation={[0, segment.angle, 0]}>
            <mesh position={[0, height - RAIL / 2, 0]} material={frame} castShadow>
              <boxGeometry args={[segment.length + POST, RAIL, RAIL]} />
            </mesh>
            {railing.style === 'bars' ? (
              Array.from({ length: bars }, (_, bar) => (
                <mesh
                  key={bar}
                  position={[
                    -segment.length / 2 + (segment.length * (bar + 1)) / (bars + 1),
                    BOTTOM_GAP + infillHeight / 2,
                    0,
                  ]}
                  material={frame}
                  castShadow
                >
                  <boxGeometry args={[BAR, infillHeight, BAR]} />
                </mesh>
              ))
            ) : (
              <mesh position={[0, BOTTOM_GAP + infillHeight / 2, 0]} material={infill}>
                <boxGeometry args={[segment.length - POST, infillHeight, 0.012]} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
