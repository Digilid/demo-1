'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useMaterials } from '@/lib/materials';
import { useTempleStore } from '@/lib/store';
import { bellGeometry, gableGeometry, hipRoofGeometry, kalasamGeometry, pyramidRoofGeometry } from '@/lib/geometry';
import { Flames, FlickerLight } from './three/Flames';
import { NilavilakkuSet, type LampPlacement } from './three/Nilavilakku';
import { Instanced, festoon, type Xform } from './three/Instanced';

/* ───────────────────────── shared geometries ───────────────────────── */

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  octPillar: new THREE.CylinderGeometry(0.2, 0.23, 1, 8),
  disc: new THREE.CylinderGeometry(1, 0.92, 1, 32),
  cup: new THREE.CylinderGeometry(0.04, 0.025, 0.04, 6),
  stud: new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
  floret: new THREE.IcosahedronGeometry(1, 0),
  leafPlane: new THREE.PlaneGeometry(1, 1),
  ring: new THREE.TorusGeometry(1, 0.12, 6, 24),
  kalasam: kalasamGeometry(),
  bell: bellGeometry(),
};

/* ───────────────────────── ground ───────────────────────── */

function Ground() {
  const m = useMaterials();
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -20]} material={m.pavers}>
        <planeGeometry args={[160, 160]} />
      </mesh>
      {/* raised granite pradakshina path through the courtyard */}
      <mesh position={[0, 0.03, -10]} material={m.granite} scale={[3.2, 0.06, 40]} geometry={G.box} />
    </group>
  );
}

/* ───────────────────────── Mukhappu gable ───────────────────────── */

function Mukhappu({ width, height, position }: { width: number; height: number; position: [number, number, number] }) {
  const m = useMaterials();
  const gable = useMemo(() => gableGeometry(width, height), [width, height]);
  const slope = Math.atan2(height, width / 2);
  const len = Math.hypot(width / 2, height) + 0.25;
  return (
    <group position={position}>
      <mesh geometry={gable} material={m.teak} />
      {/* brass-lined gable boards */}
      <mesh position={[-width / 4, height / 2, 0.05]} rotation-z={slope} scale={[len, 0.08, 0.06]} geometry={G.box} material={m.brass} />
      <mesh position={[width / 4, height / 2, 0.05]} rotation-z={-slope} scale={[len, 0.08, 0.06]} geometry={G.box} material={m.brass} />
      {/* small tiled roof projecting over the gable */}
      <mesh position={[-width / 4 - 0.05, height / 2 + 0.08, -0.4]} rotation={[0, 0, slope]} scale={[len + 0.1, 0.06, 1.1]} geometry={G.box} material={m.roofTiles} />
      <mesh position={[width / 4 + 0.05, height / 2 + 0.08, -0.4]} rotation={[0, 0, -slope]} scale={[len + 0.1, 0.06, 1.1]} geometry={G.box} material={m.roofTiles} />
      <mesh position={[0, height + 0.05, 0]} scale={0.35} geometry={G.kalasam} material={m.gold} />
      {/* carved medallion */}
      <mesh position={[0, height * 0.38, 0.03]} scale={height * 0.16} geometry={G.ring} material={m.brass} />
    </group>
  );
}

/* ───────────────────────── Gopuram + doors ───────────────────────── */

const DOOR_W = 1.6;
const DOOR_H = 3.85;
const PLINTH = 0.35;

function DoorLeaf({ side }: { side: -1 | 1 }) {
  const m = useMaterials();
  const pivot = useRef<THREE.Group>(null);
  const angle = useRef(0);

  const studs = useMemo<Xform[]>(() => {
    const out: Xform[] = [];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 4; c++)
        out.push({
          p: [side * -(0.25 + c * 0.37), 0.35 + r * 0.42, 0.1],
          r: [Math.PI / 2, 0, 0],
          s: 0.045,
        });
    return out;
  }, [side]);

  useFrame((_, delta) => {
    const phase = useTempleStore.getState().phase;
    const target = phase === 'opening' || phase === 'inside' ? 1.48 : 0;
    angle.current = THREE.MathUtils.damp(angle.current, target, 1.1, delta);
    if (pivot.current) pivot.current.rotation.y = side === -1 ? angle.current : -angle.current;
  });

  // hinge at the outer edge: left hinge x = −1.6, right hinge x = +1.6
  return (
    <group ref={pivot} position={[side * DOOR_W, PLINTH, 0]}>
      <mesh position={[side * -DOOR_W / 2, DOOR_H / 2, 0]} scale={[DOOR_W - 0.02, DOOR_H, 0.16]} geometry={G.box} material={m.teak} />
      {/* raised frame */}
      <mesh position={[side * -DOOR_W / 2, DOOR_H / 2, 0.09]} scale={[DOOR_W - 0.1, 0.1, 0.03]} geometry={G.box} material={m.teakDark} />
      <mesh position={[side * -0.05, DOOR_H / 2, 0.09]} scale={[0.1, DOOR_H, 0.04]} geometry={G.box} material={m.brass} />
      <mesh position={[side * -(DOOR_W - 0.05), DOOR_H / 2, 0.09]} scale={[0.08, DOOR_H, 0.03]} geometry={G.box} material={m.teakDark} />
      <Instanced geometry={G.stud} material={m.brass} items={studs} />
      {/* ring handle */}
      <mesh position={[side * -0.22, 1.7, 0.16]} scale={0.1} geometry={G.ring} material={m.brass} />
    </group>
  );
}

function HangingBells() {
  const m = useMaterials();
  const group = useRef<THREE.Group>(null);
  const xs = [-1.2, -0.6, 0, 0.6, 1.2];
  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const opening = useTempleStore.getState().phase !== 'gate' && useTempleStore.getState().phase !== 'loading';
    g.children.forEach((c, i) => {
      c.rotation.z = Math.sin(t * 2.2 + i) * (opening ? 0.12 : 0.03);
      c.rotation.x = Math.cos(t * 1.7 + i * 0.6) * (opening ? 0.08 : 0.02);
    });
  });
  return (
    <group ref={group} position={[0, PLINTH + DOOR_H + 0.3, 0.6]}>
      {xs.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, -0.25, 0]} scale={[0.012, 0.5, 0.012]} geometry={G.box} material={m.brass} />
          <mesh position={[0, -0.82, 0]} geometry={G.bell} material={m.brass} scale={i === 2 ? 1.4 : 1} />
        </group>
      ))}
    </group>
  );
}

function Gopuram() {
  const m = useMaterials();
  const lowerRoof = useMemo(() => hipRoofGeometry(9.4, 6.4, 2.1, 0.3), []);
  const upperRoof = useMemo(() => hipRoofGeometry(6.2, 4.4, 1.9, 0.22), []);

  const rafters = useMemo<Xform[]>(() => {
    const out: Xform[] = [];
    for (let i = 0; i < 26; i++) {
      const x = -4.4 + i * 0.352;
      out.push({ p: [x, 4.45, 3.05], r: [0.5, 0, 0], s: [0.07, 0.07, 0.7] });
      out.push({ p: [x, 4.45, -3.05], r: [-0.5, 0, 0], s: [0.07, 0.07, 0.7] });
    }
    return out;
  }, []);

  const thoranam = useMemo<Xform[]>(() => {
    // mango-leaf thoranam strung across the doorway
    return festoon([-1.6, 4.25, 0.75], [1.6, 4.25, 0.75], 0.18, 26).map((p, i) => ({
      p: [p[0], p[1] - 0.12, p[2]],
      r: [0, 0, (i % 2 ? 1 : -1) * 0.12],
      s: [0.09, 0.26, 1],
    }));
  }, []);

  const gateLamps = useMemo<LampPlacement[]>(
    () => [
      [-2.6, PLINTH, 12.4, 1.25],
      [2.6, PLINTH, 12.4, 1.25],
      [-2.2, PLINTH, 7.6, 1.1],
      [2.2, PLINTH, 7.6, 1.1],
    ],
    [],
  );

  return (
    <group position={[0, 0, 10]}>
      {/* granite plinth & steps */}
      <mesh position={[0, PLINTH / 2, 0]} scale={[7.6, PLINTH, 4.6]} geometry={G.box} material={m.granite} />
      <mesh position={[0, 0.12, 2.6]} scale={[3.6, 0.24, 0.6]} geometry={G.box} material={m.granite} />
      {/* side masses */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 2.6, PLINTH + 2.1, 0]} scale={[1.9, 4.2, 4]} geometry={G.box} material={m.laterite} />
          <mesh position={[s * 2.6, PLINTH + 0.3, 2.05]} scale={[1.95, 0.6, 0.12]} geometry={G.box} material={m.whitewash} />
          {/* front porch pillars */}
          <mesh position={[s * 1.85, PLINTH + 2.0, 2.4]} scale={[1, 4, 1]} geometry={G.octPillar} material={m.teak} />
        </group>
      ))}
      {/* lintel over the doorway */}
      <mesh position={[0, PLINTH + DOOR_H + 0.18, 0]} scale={[3.4, 0.36, 4]} geometry={G.box} material={m.teakDark} />
      <mesh position={[0, PLINTH + DOOR_H + 0.18, 2.02]} scale={[3.4, 0.08, 0.06]} geometry={G.box} material={m.brass} />
      {/* door frame */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.66, PLINTH + DOOR_H / 2, 0]} scale={[0.14, DOOR_H, 0.4]} geometry={G.box} material={m.teakDark} />
      ))}
      {/* the doors */}
      <DoorLeaf side={-1} />
      <DoorLeaf side={1} />
      <HangingBells />
      <Instanced geometry={G.leafPlane} material={m.leaf} items={thoranam} />
      <Instanced geometry={G.leafPlane} material={m.leaf} items={thoranam.map((t) => ({ ...t, p: [t.p[0], t.p[1], -0.75] as [number, number, number] }))} />

      {/* two-tier Kerala roof */}
      <mesh position={[0, 4.6, 0]} geometry={lowerRoof} material={m.roofTiles} />
      <Instanced geometry={G.box} material={m.teakDark} items={rafters} />
      <mesh position={[0, 5.9, 0]} scale={[4.6, 1.2, 3.2]} geometry={G.box} material={m.whitewash} />
      <mesh position={[0, 6.3, 0]} geometry={upperRoof} material={m.roofTiles} />
      <Mukhappu width={2.6} height={1.25} position={[0, 6.35, 1.7]} />
      <Mukhappu width={3.2} height={1.1} position={[0, 4.75, 3.05]} />
      {[-0.9, 0, 0.9].map((x) => (
        <mesh key={x} position={[x, 8.15, 0]} scale={x === 0 ? 0.75 : 0.55} geometry={G.kalasam} material={m.gold} />
      ))}
      <NilavilakkuSet lamps={gateLamps} />
      <FlickerLight position={[0, 3.2, 3.6]} intensity={14} distance={11} />
      <FlickerLight position={[0, 3.0, -2.5]} intensity={8} distance={8} optional />
    </group>
  );
}

function OuterWalls() {
  const m = useMaterials();
  const segs: { p: [number, number, number]; s: [number, number, number] }[] = [
    { p: [-17, 1.9, 10], s: [27, 3.8, 0.8] },
    { p: [17, 1.9, 10], s: [27, 3.8, 0.8] },
    { p: [-12.5, 1.9, -26], s: [0.8, 3.8, 72] },
    { p: [12.5, 1.9, -26], s: [0.8, 3.8, 72] },
    { p: [0, 1.9, -62.5], s: [26, 3.8, 0.8] },
  ];
  return (
    <group>
      {segs.map((w, i) => (
        <group key={i}>
          <mesh position={w.p} scale={w.s} geometry={G.box} material={m.laterite} />
          <mesh position={[w.p[0], 3.9, w.p[2]]} scale={[w.s[0] + 0.1, 0.2, w.s[2] + 0.1]} geometry={G.box} material={m.whitewash} />
        </group>
      ))}
    </group>
  );
}

/* ───────────────────────── Deepasthambham ───────────────────────── */

function Deepasthambham({ quality }: { quality: 'high' | 'low' }) {
  const m = useMaterials();
  const tiers = 12;
  const { discs, flames } = useMemo(() => {
    const discs: Xform[] = [];
    const flames: number[] = [];
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1);
      const y = 1.0 + t * 5.2;
      const r = 0.95 - t * 0.6;
      discs.push({ p: [0, y, 0], s: [r, 0.05, r] });
      const n = Math.round((Math.PI * 2 * r) / (quality === 'high' ? 0.13 : 0.2));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        flames.push(Math.cos(a) * (r - 0.03), y + 0.04, Math.sin(a) * (r - 0.03));
      }
    }
    flames.push(0, 7.15, 0);
    return { discs, flames: new Float32Array(flames) };
  }, [quality]);

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.25, 0]} scale={[1.8, 0.5, 1.8]} geometry={G.box} material={m.granite} />
      <mesh position={[0, 0.6, 0]} scale={[1.3, 0.2, 1.3]} geometry={G.box} material={m.granite} />
      <mesh position={[0, 0.7, 0]} scale={[0.55, 0.35, 0.55]} geometry={G.disc} material={m.brass} />
      <mesh position={[0, 3.9, 0]} material={m.brass}>
        <cylinderGeometry args={[0.07, 0.14, 6.4, 16]} />
      </mesh>
      <Instanced geometry={G.disc} material={m.brass} items={discs} />
      <Instanced geometry={G.ring} material={m.gold} items={discs.map((d) => ({ p: [0, (d.p[1] as number) - 0.2, 0], r: [Math.PI / 2, 0, 0], s: 0.11 }))} />
      <mesh position={[0, 6.6, 0]} scale={0.55} geometry={G.kalasam} material={m.gold} />
      <Flames positions={flames} width={0.04} height={0.11} intensity={5.5} />
      <FlickerLight position={[0, 3.6, 0.6]} intensity={22} distance={13} />
    </group>
  );
}

/* ───────────────────────── Corridor (Chuttambalam / Aanapanthal) ───────────────────────── */

const PILLAR_X = 3.8;
const PILLAR_ZS = Array.from({ length: 9 }, (_, i) => -6 - i * 3);

function Pillars() {
  const m = useMaterials();
  const { bases, shafts, caps } = useMemo(() => {
    const bases: Xform[] = [];
    const shafts: Xform[] = [];
    const caps: Xform[] = [];
    for (const s of [-1, 1])
      for (const z of PILLAR_ZS) {
        const x = s * PILLAR_X;
        bases.push({ p: [x, 0.25, z], s: [0.62, 0.5, 0.62] });
        shafts.push({ p: [x, 2.1, z], s: [1, 3.2, 1] });
        caps.push({ p: [x, 3.85, z], s: [0.72, 0.3, 0.72] });
        caps.push({ p: [x - s * 0.35, 3.75, z], s: [0.5, 0.14, 0.24] });
      }
    return { bases, shafts, caps };
  }, []);
  return (
    <group>
      <Instanced geometry={G.box} material={m.granite} items={bases} />
      <Instanced geometry={G.octPillar} material={m.granite} items={shafts} />
      <Instanced geometry={G.box} material={m.granite} items={caps} />
    </group>
  );
}

function Garlands({ quality }: { quality: 'high' | 'low' }) {
  const m = useMaterials();
  const { jasmine, marigold, leaves } = useMemo(() => {
    const jasmine: Xform[] = [];
    const marigold: Xform[] = [];
    const leaves: Xform[] = [];
    const perPillar = quality === 'high' ? 110 : 55;
    for (const s of [-1, 1]) {
      for (let pi = 0; pi < PILLAR_ZS.length; pi++) {
        const z = PILLAR_ZS[pi];
        const x = s * PILLAR_X;
        // jasmine spiral wrapping the pillar
        for (let k = 0; k < perPillar; k++) {
          const t = k / perPillar;
          const a = t * Math.PI * 2 * 5;
          jasmine.push({ p: [x + Math.cos(a) * 0.255, 0.6 + t * 2.9, z + Math.sin(a) * 0.255], s: 0.03 });
        }
        // marigold rings top and bottom
        for (let k = 0; k < 18; k++) {
          const a = (k / 18) * Math.PI * 2;
          marigold.push({ p: [x + Math.cos(a) * 0.27, 3.55, z + Math.sin(a) * 0.27], s: 0.045 });
          marigold.push({ p: [x + Math.cos(a) * 0.27, 0.62, z + Math.sin(a) * 0.27], s: 0.045 });
        }
        // festoon to the next pillar
        if (pi < PILLAR_ZS.length - 1) {
          festoon([x, 3.7, z], [x, 3.7, PILLAR_ZS[pi + 1]], 0.55, 40).forEach((p, i) =>
            (i % 6 === 0 ? marigold : jasmine).push({ p, s: i % 6 === 0 ? 0.05 : 0.035 }),
          );
        }
        // banana leaves tied to the capital
        leaves.push({ p: [x - s * 0.42, 3.1, z + 0.18], r: [0.1, 0, s * 0.2], s: [0.45, 1.4, 1] });
        leaves.push({ p: [x - s * 0.42, 3.1, z - 0.18], r: [-0.1, 0, s * 0.25], s: [0.42, 1.3, 1] });
      }
    }
    // garlands crossing over the walkway at alternate pillars
    for (let pi = 0; pi < PILLAR_ZS.length; pi += 2) {
      const z = PILLAR_ZS[pi];
      festoon([-PILLAR_X, 3.75, z], [PILLAR_X, 3.75, z], 0.6, 70).forEach((p, i) =>
        (i % 7 === 0 ? marigold : jasmine).push({ p, s: i % 7 === 0 ? 0.05 : 0.035 }),
      );
    }
    return { jasmine, marigold, leaves };
  }, [quality]);

  return (
    <group>
      <Instanced geometry={G.floret} material={m.jasmine} items={jasmine} />
      <Instanced geometry={G.floret} material={m.marigold} items={marigold} />
      <Instanced geometry={G.leafPlane} material={m.leaf} items={leaves} />
    </group>
  );
}

function CorridorRoofs() {
  const m = useMaterials();
  const len = 27;
  const zc = -18;
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* longitudinal beam over the pillars */}
          <mesh position={[s * PILLAR_X, 4.05, zc]} scale={[0.45, 0.25, len]} geometry={G.box} material={m.teakDark} />
          {/* tiled lean-to roof sloping toward the walkway */}
          <mesh position={[s * 5.5, 4.95, zc]} rotation-z={s * 0.36} scale={[4.4, 0.08, len + 0.5]} geometry={G.box} material={m.roofTiles} />
          {/* ceiling planks */}
          <mesh position={[s * 5.5, 4.15, zc]} scale={[3.4, 0.05, len]} geometry={G.box} material={m.teak} />
        </group>
      ))}
    </group>
  );
}

/* ───────────────────────── Vilakkumatam lamp walls ───────────────────────── */

type LampWall = { axis: 'x' | 'z'; fixed: number; from: number; to: number; face: 1 | -1 };

function VilakkumatamWalls({ quality }: { quality: 'high' | 'low' }) {
  const m = useMaterials();
  const walls: LampWall[] = useMemo(
    () => [
      { axis: 'x', fixed: -7.2, from: -4.5, to: -30.5, face: 1 },
      { axis: 'x', fixed: 7.2, from: -4.5, to: -30.5, face: -1 },
      { axis: 'z', fixed: -31.4, from: -8.4, to: -2.6, face: 1 },
      { axis: 'z', fixed: -31.4, from: 2.6, to: 8.4, face: 1 },
      { axis: 'x', fixed: -8.4, from: -32, to: -60.5, face: 1 },
      { axis: 'x', fixed: 8.4, from: -32, to: -60.5, face: -1 },
    ],
    [],
  );

  const { cups, flames, panels } = useMemo(() => {
    const step = quality === 'high' ? 0.3 : 0.5;
    const rows = quality === 'high' ? 7 : 5;
    const cups: Xform[] = [];
    const flames: number[] = [];
    const panels: Xform[] = [];
    for (const w of walls) {
      const len = Math.abs(w.to - w.from);
      const mid = (w.from + w.to) / 2;
      const n = Math.floor(len / step);
      const dir = Math.sign(w.to - w.from);
      for (let r = 0; r < rows; r++) {
        const y = 0.75 + r * (2.1 / (rows - 1));
        for (let i = 0; i <= n; i++) {
          const along = w.from + dir * i * step;
          const off = w.fixed + w.face * 0.12;
          const p: [number, number, number] = w.axis === 'x' ? [off, y, along] : [along, y, off];
          cups.push({ p });
          flames.push(p[0], y + 0.03, p[2]);
        }
      }
      // dark wooden lattice backing + the wall behind it
      if (w.axis === 'x') {
        panels.push({ p: [w.fixed, 1.75, mid], s: [0.1, 3.5, len] });
      } else {
        panels.push({ p: [mid, 1.75, w.fixed], s: [len, 3.5, 0.1] });
      }
    }
    return { cups, flames: new Float32Array(flames), panels };
  }, [walls, quality]);

  return (
    <group>
      <Instanced geometry={G.box} material={m.lattice} items={panels} />
      <Instanced geometry={G.cup} material={m.brass} items={cups} />
      <Flames positions={flames} width={0.032} height={0.085} intensity={4.2} />
      {/* back walls with roofs above the lamp walls */}
      {walls
        .filter((w) => w.axis === 'x')
        .map((w, i) => {
          const nalambalam = Math.abs(w.fixed) > 8;
          const len = Math.abs(w.to - w.from);
          const mid = (w.from + w.to) / 2;
          return (
            <group key={i}>
              <mesh position={[w.fixed - w.face * 0.35, 2, mid]} scale={[0.6, 4, len]} geometry={G.box} material={m.laterite} />
              {nalambalam && (
                <mesh position={[w.fixed + w.face * 0.6, 4.1, mid]} rotation-z={-w.face * 0.4} scale={[2.2, 0.08, len]} geometry={G.box} material={m.roofTiles} />
              )}
            </group>
          );
        })}
      <mesh position={[0, 4.4, -31.4]} scale={[5.6, 0.6, 0.6]} geometry={G.box} material={m.teakDark} />
      <FlickerLight position={[-5.5, 2.2, -14]} intensity={9} distance={9} optional />
      <FlickerLight position={[5.5, 2.2, -24]} intensity={9} distance={9} optional />
      <FlickerLight position={[-6.5, 2.2, -46]} intensity={10} distance={10} optional />
      <FlickerLight position={[6.5, 2.2, -46]} intensity={10} distance={10} optional />
    </group>
  );
}

/* ───────────────────────── Kodimaram ───────────────────────── */

function Kodimaram() {
  const m = useMaterials();
  const rings = useMemo<Xform[]>(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        p: [0, 1.9 + i * 0.75, 0] as [number, number, number],
        r: [Math.PI / 2, 0, 0] as [number, number, number],
        s: 0.17 - i * 0.004,
      })),
    [],
  );
  const bells = useMemo<Xform[]>(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return { p: [Math.cos(a) * 0.55, 12.6, Math.sin(a) * 0.55] as [number, number, number], s: 0.5 };
      }),
    [],
  );
  return (
    <group position={[0, 0, -22]}>
      {[1.9, 1.45, 1.0].map((w, i) => (
        <mesh key={i} position={[0, 0.15 + i * 0.3, 0]} scale={[w, 0.3, w]} geometry={G.box} material={m.granite} />
      ))}
      <mesh position={[0, 1.1, 0]} scale={[0.5, 0.4, 0.5]} geometry={G.disc} material={m.gold} />
      <mesh position={[0, 7.2, 0]} material={m.gold}>
        <cylinderGeometry args={[0.1, 0.17, 12, 20]} />
      </mesh>
      <Instanced geometry={G.ring} material={m.gold} items={rings} />
      {/* crown platform with bells */}
      <mesh position={[0, 13.0, 0]} scale={[0.7, 0.08, 0.7]} geometry={G.disc} material={m.gold} />
      <Instanced geometry={G.bell} material={m.gold} items={bells} />
      <mesh position={[0, 13.05, 0]} scale={0.8} geometry={G.kalasam} material={m.gold} />
      <FlickerLight position={[1.4, 4.5, 1.2]} intensity={10} distance={9} color="#ffc070" />
    </group>
  );
}

/* ───────────────────────── Namaskara Mandapam ───────────────────────── */

function NamaskaraMandapam() {
  const m = useMaterials();
  const roof = useMemo(() => pyramidRoofGeometry(3.8, 2.4), []);
  const pillars = useMemo<Xform[]>(() => {
    const pts: [number, number][] = [];
    const v = [-2.8, -0.95, 0.95, 2.8];
    for (const x of v) {
      pts.push([x, -2.8]);
      pts.push([x, 2.8]);
    }
    pts.push([-2.8, -0.95], [-2.8, 0.95], [2.8, -0.95], [2.8, 0.95]);
    return pts.map(([x, z]) => ({ p: [x, 2.0, z], s: [0.85, 3.3, 0.85] }));
  }, []);
  const hangingLamps = useMemo(() => {
    const out: number[] = [];
    for (const [x, z] of [
      [-1.5, -1.5],
      [1.5, -1.5],
      [-1.5, 1.5],
      [1.5, 1.5],
    ])
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        out.push(x + Math.cos(a) * 0.14, 3.05, z + Math.sin(a) * 0.14);
      }
    return new Float32Array(out);
  }, []);

  return (
    <group position={[0, 0, -38]}>
      <mesh position={[0, 0.18, 0]} scale={[6.6, 0.36, 6.6]} geometry={G.box} material={m.granite} />
      <Instanced geometry={G.octPillar} material={m.granite} items={pillars} />
      <mesh position={[0, 3.75, 0]} scale={[6.4, 0.22, 6.4]} geometry={G.box} material={m.teakDark} />
      <mesh position={[0, 3.62, 0]} scale={[5.6, 0.04, 5.6]} geometry={G.box} material={m.mural} />
      <mesh position={[0, 3.86, 0]} geometry={roof} material={m.goldRoof} />
      <mesh position={[0, 6.2, 0]} scale={0.7} geometry={G.kalasam} material={m.gold} />
      {/* hanging Thookkuvilakku */}
      {[
        [-1.5, -1.5],
        [1.5, -1.5],
        [-1.5, 1.5],
        [1.5, 1.5],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 3.35, 0]} scale={[0.01, 0.5, 0.01]} geometry={G.box} material={m.brass} />
          <mesh position={[0, 3.02, 0]} scale={[0.17, 0.03, 0.17]} geometry={G.disc} material={m.brass} />
        </group>
      ))}
      <Flames positions={hangingLamps} width={0.035} height={0.1} intensity={5} />
      <FlickerLight position={[0, 2.8, 0]} intensity={12} distance={9} />
    </group>
  );
}

/* ───────────────────────── Nalambalam gateway ───────────────────────── */

function NalambalamGate() {
  const m = useMaterials();
  const roof = useMemo(() => hipRoofGeometry(7, 3.4, 1.6, 0.2), []);
  return (
    <group position={[0, 0, -31.4]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.45, 2.2, 0]} scale={[0.4, 4.4, 0.8]} geometry={G.box} material={m.teakDark} />
      ))}
      <mesh position={[0, 4.8, 0]} geometry={roof} material={m.roofTiles} />
      <Mukhappu width={2.2} height={1.0} position={[0, 4.85, 1.0]} />
    </group>
  );
}

/* ───────────────────────── Courtyard lamps ───────────────────────── */

function WalkwayLamps() {
  const lamps = useMemo<LampPlacement[]>(() => {
    const out: LampPlacement[] = [];
    for (let z = 6.5; z >= -4.5; z -= 1.6) {
      out.push([-3.6, 0.06, z, 1.15]);
      out.push([3.6, 0.06, z, 1.15]);
    }
    // a pair of tall lamps at the Mandapam steps
    out.push([-3.4, 0.06, -34.6, 1.15], [3.4, 0.06, -34.6, 1.15]);
    return out;
  }, []);
  return <NilavilakkuSet lamps={lamps} />;
}

/* ───────────────────────── composition ───────────────────────── */

export default function TempleArchitecture() {
  const quality = useTempleStore((s) => s.quality);
  return (
    <group>
      <Ground />
      <OuterWalls />
      <Gopuram />
      <Deepasthambham quality={quality} />
      <WalkwayLamps />
      <Pillars />
      <Garlands quality={quality} />
      <CorridorRoofs />
      <Kodimaram />
      <VilakkumatamWalls quality={quality} />
      <NalambalamGate />
      <NamaskaraMandapam />
      {/* golden incense / dust motes */}
      <Sparkles
        count={quality === 'high' ? 140 : 60}
        scale={[12, 4.5, 26]}
        position={[0, 2.6, -44]}
        size={3.2}
        speed={0.25}
        opacity={0.85}
        color="#ffd27a"
      />
      <Sparkles
        count={quality === 'high' ? 70 : 30}
        scale={[7, 4, 26]}
        position={[0, 2.4, -16]}
        size={2.2}
        speed={0.2}
        opacity={0.6}
        color="#ffcf8a"
      />
    </group>
  );
}
