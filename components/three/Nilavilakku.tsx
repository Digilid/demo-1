'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useMaterials } from '@/lib/materials';
import { Flames } from './Flames';

const PROFILE: [number, number][] = [
  [0.0001, 0],
  [0.22, 0],
  [0.24, 0.03],
  [0.2, 0.08],
  [0.1, 0.14],
  [0.05, 0.18],
  [0.04, 0.3],
  [0.075, 0.33],
  [0.04, 0.36],
  [0.034, 0.6],
  [0.065, 0.63],
  [0.034, 0.66],
  [0.034, 0.82],
  [0.05, 0.845],
  [0.16, 0.885],
  [0.205, 0.925],
  [0.19, 0.945],
  [0.12, 0.905],
  [0.03, 0.9],
  [0.045, 0.98],
  [0.02, 1.05],
  [0.0001, 1.09],
];

let lampGeo: THREE.LatheGeometry | null = null;
export function getNilavilakkuGeometry() {
  if (!lampGeo) lampGeo = new THREE.LatheGeometry(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 18);
  return lampGeo;
}

export type LampPlacement = [x: number, y: number, z: number, scale: number];

/**
 * Brass Nilavilakku oil lamps, rendered as one InstancedMesh, with five
 * flickering wicks each — all flames in a second InstancedMesh.
 */
export function NilavilakkuSet({ lamps, wicks = 5 }: { lamps: LampPlacement[]; wicks?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { brass } = useMaterials();

  const flamePositions = useMemo(() => {
    const out: number[] = [];
    for (const [x, y, z, s] of lamps) {
      for (let w = 0; w < wicks; w++) {
        const a = (w / wicks) * Math.PI * 2 + Math.PI / 2;
        out.push(x + Math.cos(a) * 0.18 * s, y + 0.935 * s, z + Math.sin(a) * 0.18 * s);
      }
    }
    return new Float32Array(out);
  }, [lamps, wicks]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    lamps.forEach(([x, y, z, s], i) => {
      m.makeScale(s, s, s).setPosition(x, y, z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [lamps]);

  const scale = lamps[0]?.[3] ?? 1;
  return (
    <group>
      <instancedMesh ref={ref} args={[getNilavilakkuGeometry(), brass, lamps.length]} />
      <Flames positions={flamePositions} width={0.045 * scale} height={0.12 * scale} intensity={5} />
    </group>
  );
}
