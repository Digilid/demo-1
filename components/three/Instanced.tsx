'use client';

import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

export type Xform = {
  p: [number, number, number];
  r?: [number, number, number];
  s?: [number, number, number] | number;
};

/** Renders many copies of one geometry+material as a single draw call. */
export function Instanced({
  geometry,
  material,
  items,
}: {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  items: Xform[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    items.forEach((it, i) => {
      pos.set(...it.p);
      e.set(...(it.r ?? [0, 0, 0]));
      q.setFromEuler(e);
      if (typeof it.s === 'number') scl.setScalar(it.s);
      else if (it.s) scl.set(...it.s);
      else scl.setScalar(1);
      m.compose(pos, q, scl);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (items.length === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} />;
}

/** Cylinder/capsule-like limb between two points. */
export function Limb({
  from,
  to,
  radius,
  material,
  radiusEnd,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  radiusEnd?: number;
  material: THREE.Material;
}) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  const mid = a.clone().add(b).multiplyScalar(0.5);
  return (
    <group>
      <mesh position={mid} quaternion={q} material={material}>
        <cylinderGeometry args={[radiusEnd ?? radius, radius, len, 12]} />
      </mesh>
      <mesh position={a} material={material}>
        <sphereGeometry args={[radius, 12, 10]} />
      </mesh>
      <mesh position={b} material={material}>
        <sphereGeometry args={[radiusEnd ?? radius, 12, 10]} />
      </mesh>
    </group>
  );
}

/** Points along a hanging catenary-like curve between two anchors. */
export function festoon(
  a: [number, number, number],
  b: [number, number, number],
  sag: number,
  count: number,
): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    out.push([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t),
      a[2] + (b[2] - a[2]) * t,
    ]);
  }
  return out;
}
