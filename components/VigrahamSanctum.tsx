'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMaterials } from '@/lib/materials';
import { getTexture } from '@/lib/textures';
import { kalasamGeometry, pyramidRoofGeometry } from '@/lib/geometry';
import { scrollState, useTempleStore } from '@/lib/store';
import { Flames, FlickerLight, flameTime } from './three/Flames';
import { Instanced, Limb, festoon, type Xform } from './three/Instanced';
import { NilavilakkuSet, type LampPlacement } from './three/Nilavilakku';

/**
 * Sreekovil (sanctum) with golden two-tier roof, open golden doors and a
 * respectful, stylised 2.5D representation of Lord Guruvayurappan as the
 * flute-playing Sri Krishna: dark-stone form, golden Kireetam with peacock
 * feather, silk Pitambaram, Tulsi-and-lotus Vanamala, and a Prabhavali of lamps.
 */

const SANCTUM_Z = -55;
const BASE_H = 1.0;
const VIG_Z = SANCTUM_Z + 0.6;
const box = new THREE.BoxGeometry(1, 1, 1);
const sphere = new THREE.SphereGeometry(1, 14, 10);
const kalasam = kalasamGeometry();

/* divine intensity rises as the visitor reaches the finale */
function divineLevel() {
  return THREE.MathUtils.smoothstep(scrollState.progress, 0.68, 0.95);
}

/* ───────────── volumetric light shafts (additive, depth-tested) ───────────── */

const rayVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vRim;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    vRim = abs(dot(n, normalize(-mv.xyz)));
    gl_Position = projectionMatrix * mv;
  }
`;
const rayFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying float vRim;
  void main() {
    float along = vUv.y;
    float streak = 0.65 + 0.35 * sin(vUv.x * 46.0 + uTime * 0.6) * sin(vUv.x * 17.0 - uTime * 0.4);
    float a = sin(along * 3.14159) * pow(vRim, 1.8) * streak;
    gl_FragColor = vec4(uColor * a * uOpacity, 1.0);
  }
`;

function DivineRays() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: rayVertex,
        fragmentShader: rayFragment,
        uniforms: { uTime: flameTime, uOpacity: { value: 0.5 }, uColor: { value: new THREE.Color('#ffc46b') } },
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [],
  );
  const haloMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: getTexture('aura'),
        color: new THREE.Color(2.4, 1.7, 0.9),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const spill = useMemo(() => {
    const m = mat.clone();
    m.uniforms = { ...mat.uniforms, uOpacity: { value: 0.1 } };
    return m;
  }, [mat]);
  const spokes = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const d = divineLevel();
    mat.uniforms.uOpacity.value = 0.12 + d * 0.38;
    spill.uniforms.uOpacity.value = 0.08 + d * 0.22;
    haloMat.opacity = 0.35 + d * 0.4;
    if (spokes.current) spokes.current.rotation.z += delta * 0.04;
  });

  return (
    <group>
      {/* light spilling out of the sanctum door onto the sopanam steps */}
      <mesh position={[0, BASE_H + 0.75, SANCTUM_Z + 4.6]} rotation-x={-Math.PI / 2 - 0.22} material={spill}>
        <cylinderGeometry args={[0.85, 1.9, 2.4, 32, 1, true]} />
      </mesh>
      {/* aura behind the Vigraham */}
      <mesh position={[0, BASE_H + 1.9, VIG_Z - 0.45]} material={haloMat} scale={[3.2, 3.2, 1]}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <group ref={spokes} position={[0, BASE_H + 1.95, VIG_Z - 0.42]}>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i} rotation-z={(i / 16) * Math.PI * 2} position={[0, 0, 0]} material={mat}>
            <planeGeometry args={[0.06, 2.4, 1, 1]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ───────────── the Vigraham ───────────── */

function Vigraham() {
  const m = useMaterials();
  const silk = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#f2c21a', metalness: 0.1, roughness: 0.55, emissive: '#3a2400', emissiveIntensity: 0.35 }),
    [],
  );
  const sandal = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5e2b8', emissive: '#6a5530', emissiveIntensity: 0.6 }), []);
  const ruby = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c0102a', emissive: '#c0102a', emissiveIntensity: 1.6, toneMapped: false }), []);
  const emerald = useMemo(() => new THREE.MeshStandardMaterial({ color: '#14a05a', emissive: '#14a05a', emissiveIntensity: 1.3, toneMapped: false }), []);
  const tulsi = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2f6b2a', roughness: 0.8, emissive: '#0d2a0a', emissiveIntensity: 0.4 }), []);
  const lotus = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f39ab8', roughness: 0.6, emissive: '#5a1a2a', emissiveIntensity: 0.6 }), []);
  const feather = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: getTexture('peacock'),
        alphaTest: 0.3,
        side: THREE.DoubleSide,
        emissive: '#0d3a2a',
        emissiveIntensity: 0.5,
        roughness: 0.4,
      }),
    [],
  );

  const dhoti = useMemo(() => {
    const p: [number, number][] = [
      [0.0001, 0],
      [0.24, 0],
      [0.25, 0.04],
      [0.2, 0.35],
      [0.17, 0.62],
      [0.15, 0.78],
      [0.0001, 0.8],
    ];
    return new THREE.LatheGeometry(p.map(([r, y]) => new THREE.Vector2(r, y)), 28);
  }, []);
  const torso = useMemo(() => {
    const p: [number, number][] = [
      [0.0001, 0],
      [0.14, 0],
      [0.115, 0.12],
      [0.13, 0.26],
      [0.17, 0.4],
      [0.19, 0.47],
      [0.12, 0.52],
      [0.05, 0.56],
      [0.045, 0.6],
      [0.0001, 0.6],
    ];
    const g = new THREE.LatheGeometry(p.map(([r, y]) => new THREE.Vector2(r, y)), 28);
    g.scale(1, 1, 0.72);
    return g;
  }, []);
  const kireetam = useMemo(() => {
    const p: [number, number][] = [
      [0.0001, 0],
      [0.115, 0],
      [0.12, 0.04],
      [0.105, 0.06],
      [0.12, 0.1],
      [0.095, 0.16],
      [0.105, 0.19],
      [0.075, 0.25],
      [0.085, 0.28],
      [0.05, 0.34],
      [0.06, 0.37],
      [0.025, 0.43],
      [0.0001, 0.48],
    ];
    return new THREE.LatheGeometry(p.map(([r, y]) => new THREE.Vector2(r, y)), 24);
  }, []);

  // Vanamala — garland of Tulsi with lotus blossoms, hanging from the shoulders
  const { tulsiBeads, lotusBuds } = useMemo(() => {
    const tulsiBeads: Xform[] = [];
    const lotusBuds: Xform[] = [];
    const left = festoon([-0.17, 1.47, 0.07], [0.17, 1.47, 0.07], 0.95, 90);
    left.forEach((p, i) => {
      const z = p[2] + 0.1 * Math.sin((i / 90) * Math.PI);
      if (i % 11 === 5) lotusBuds.push({ p: [p[0], p[1], z + 0.03], s: [0.035, 0.045, 0.035] });
      else tulsiBeads.push({ p: [p[0], p[1], z], s: 0.018 });
    });
    // a second, shorter strand
    festoon([-0.14, 1.46, 0.09], [0.14, 1.46, 0.09], 0.45, 50).forEach((p) =>
      tulsiBeads.push({ p: [p[0], p[1], p[2] + 0.06], s: 0.015 }),
    );
    return { tulsiBeads, lotusBuds };
  }, []);

  // Prabhavali arch of tiny flames
  const prabhaFlames = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= 30; i++) {
      const a = (i / 30) * Math.PI;
      out.push(Math.cos(a) * 1.05, 1.05 + Math.sin(a) * 1.05, -0.3);
    }
    return new Float32Array(out);
  }, []);

  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) group.current.position.y = BASE_H + 0.42 + Math.sin(state.clock.elapsedTime * 0.6) * 0.004;
  });

  return (
    <group position={[0, 0, VIG_Z]}>
      {/* peetham (lotus pedestal) */}
      <mesh position={[0, BASE_H + 0.2, 0]} scale={[0.55, 0.4, 0.55]} material={m.gold}>
        <cylinderGeometry args={[0.8, 1, 1, 24]} />
      </mesh>
      <group ref={group} position={[0, BASE_H + 0.42, 0]}>
        {/* Prabhavali */}
        <mesh position={[0, 1.05, -0.34]} material={m.gold}>
          <torusGeometry args={[1.12, 0.035, 10, 60, Math.PI]} />
        </mesh>
        <mesh position={[0, 1.05, -0.36]} material={m.gold}>
          <torusGeometry args={[1.24, 0.02, 8, 60, Math.PI]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.18, 0.525, -0.35]} scale={[0.07, 1.05, 0.07]} geometry={box} material={m.gold} />
        ))}
        <Flames positions={prabhaFlames} width={0.03} height={0.08} intensity={6} />

        {/* Pitambaram & form */}
        <mesh geometry={dhoti} material={silk} />
        <mesh position={[0, 0.02, 0]} material={m.gold}>
          <torusGeometry args={[0.245, 0.012, 6, 32]} />
        </mesh>
        <mesh position={[0, 0.78, 0]} geometry={torso} material={m.deityStone} />
        {/* golden waist belt (Odyanam) */}
        <mesh position={[0, 0.82, 0]} scale={[1, 1, 0.75]} material={m.gold}>
          <torusGeometry args={[0.13, 0.02, 8, 30]} />
        </mesh>
        {/* necklaces */}
        {[0.11, 0.135, 0.16].map((r, i) => (
          <mesh key={r} position={[0, 1.31 - i * 0.03, 0.02]} rotation-x={Math.PI / 2 - 0.5} scale={[1, 1, 0.8]} material={m.gold}>
            <torusGeometry args={[r, 0.008, 6, 32]} />
          </mesh>
        ))}
        <mesh position={[0, 1.2, 0.115]} scale={0.022} geometry={sphere} material={ruby} />

        {/* head */}
        <mesh position={[0, 1.47, 0]} scale={[0.092, 0.105, 0.09]} geometry={sphere} material={m.deityStone} />
        {/* gopi-chandanam tilak */}
        <mesh position={[0, 1.5, 0.087]} scale={[0.01, 0.03, 0.005]} geometry={sphere} material={sandal} />
        {/* makara kundalam */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.095, 1.43, 0]} rotation-y={Math.PI / 2} material={m.gold}>
            <torusGeometry args={[0.025, 0.008, 6, 16]} />
          </mesh>
        ))}
        {/* Kireetam */}
        <mesh position={[0, 1.55, -0.005]} geometry={kireetam} material={m.gold} />
        <mesh position={[0, 1.6, 0.108]} scale={0.016} geometry={sphere} material={ruby} />
        <mesh position={[0, 1.7, 0.08]} scale={0.012} geometry={sphere} material={emerald} />
        <mesh position={[0, 2.01, 0]} scale={0.18} geometry={kalasam} material={m.gold} />
        {/* peacock feather tucked in the crown */}
        <mesh position={[0.07, 1.88, -0.02]} rotation-z={-0.32} material={feather}>
          <planeGeometry args={[0.13, 0.5]} />
        </mesh>

        {/* arms holding the flute (Venu) */}
        <Limb from={[-0.19, 1.27, 0]} to={[-0.14, 1.1, 0.13]} radius={0.04} radiusEnd={0.034} material={m.deityStone} />
        <Limb from={[-0.14, 1.1, 0.13]} to={[0.05, 1.36, 0.14]} radius={0.032} radiusEnd={0.026} material={m.deityStone} />
        <Limb from={[0.19, 1.27, 0]} to={[0.3, 1.12, 0.1]} radius={0.04} radiusEnd={0.034} material={m.deityStone} />
        <Limb from={[0.3, 1.12, 0.1]} to={[0.24, 1.34, 0.15]} radius={0.032} radiusEnd={0.026} material={m.deityStone} />
        {/* armlets & bangles */}
        {[
          [-0.17, 1.2, 0.05],
          [0.24, 1.2, 0.05],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} rotation-x={Math.PI / 2} material={m.gold}>
            <torusGeometry args={[0.042, 0.01, 6, 16]} />
          </mesh>
        ))}
        <mesh position={[0.17, 1.375, 0.15]} rotation-z={Math.PI / 2 - 0.12} material={m.gold}>
          <cylinderGeometry args={[0.011, 0.011, 0.52, 10]} />
        </mesh>
        {[0.06, 0.12, 0.25, 0.32, 0.38].map((x) => (
          <mesh key={x} position={[x - 0.02, 1.375 - (x - 0.17) * 0.12, 0.15]} rotation-z={Math.PI / 2 - 0.12} material={m.vermilion}>
            <torusGeometry args={[0.012, 0.004, 4, 10]} />
          </mesh>
        ))}

        {/* Vanamala */}
        <Instanced geometry={sphere} material={tulsi} items={tulsiBeads} />
        <Instanced geometry={sphere} material={lotus} items={lotusBuds} />
      </group>
    </group>
  );
}

/* ───────────── Sreekovil building ───────────── */

function Sreekovil({ quality }: { quality: 'high' | 'low' }) {
  const m = useMaterials();
  const lowerRoof = useMemo(() => pyramidRoofGeometry(4.6, 2.3), []);
  const upperRoof = useMemo(() => pyramidRoofGeometry(2.5, 1.7), []);
  const W = 6.4;
  const FRONT = SANCTUM_Z + 3.4; // z of the front wall
  const doorW = 1.7;
  const doorH = 2.5;
  const wallH = 3.0;

  const innerLamps = useMemo(() => {
    // tiers of lamps (Vilakku) on the inner walls of the sanctum
    const out: number[] = [];
    const cols = quality === 'high' ? 18 : 10;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < cols; c++) {
        const x = -2.5 + (c / (cols - 1)) * 5;
        out.push(x, BASE_H + 0.35 + r * 0.42, SANCTUM_Z - 2.7);
      }
    for (const s of [-1, 1])
      for (let r = 0; r < 5; r++)
        for (let c = 0; c < 8; c++) out.push(s * 2.75, BASE_H + 0.35 + r * 0.42, SANCTUM_Z - 2.3 + c * 0.6);
    return new Float32Array(out);
  }, [quality]);

  const tallLamps = useMemo<LampPlacement[]>(
    () => [
      [-1.05, BASE_H, VIG_Z + 0.6, 1.15],
      [1.05, BASE_H, VIG_Z + 0.6, 1.15],
      [-2.2, 0, FRONT + 1.9, 1.3],
      [2.2, 0, FRONT + 1.9, 1.3],
    ],
    [FRONT],
  );

  const doorStuds = useMemo<Xform[]>(() => {
    const out: Xform[] = [];
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 2; c++) out.push({ p: [c === 0 ? -0.2 : 0.2, -1.0 + r * 0.33, -0.055], s: 0.028 });
    return out;
  }, []);

  return (
    <group>
      {/* Adhishtanam (moulded granite base) */}
      <mesh position={[0, BASE_H / 2, SANCTUM_Z]} scale={[W + 0.8, BASE_H, W + 0.8]} geometry={box} material={m.granite} />
      <mesh position={[0, BASE_H - 0.12, SANCTUM_Z]} scale={[W + 1.0, 0.14, W + 1.0]} geometry={box} material={m.granite} />
      {/* Sopanam steps with brass rails */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, (i + 0.5) * (BASE_H / 3), FRONT + 1.6 - i * 0.42]} scale={[2.4, BASE_H / 3, 0.44]} geometry={box} material={m.granite} />
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.25, BASE_H * 0.62, FRONT + 1.2]} rotation-x={0.6} scale={[0.07, 0.07, 1.6]} geometry={box} material={m.brass} />
      ))}

      {/* walls painted with Kerala murals */}
      <mesh position={[0, BASE_H + wallH / 2, SANCTUM_Z - W / 2 + 0.2]} scale={[W, wallH, 0.4]} geometry={box} material={m.mural} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - 0.2), BASE_H + wallH / 2, SANCTUM_Z]} scale={[0.4, wallH, W]} geometry={box} material={m.mural} />
      ))}
      {[-1, 1].map((s) => (
        <mesh
          key={`f${s}`}
          position={[s * (doorW / 2 + (W - doorW) / 4), BASE_H + wallH / 2, FRONT - 0.2]}
          scale={[(W - doorW) / 2, wallH, 0.4]}
          geometry={box}
          material={m.mural}
        />
      ))}
      <mesh position={[0, BASE_H + doorH + (wallH - doorH) / 2, FRONT - 0.2]} scale={[doorW, wallH - doorH, 0.4]} geometry={box} material={m.mural} />
      {/* golden door frame */}
      {[-1, 1].map((s) => (
        <mesh key={`df${s}`} position={[s * (doorW / 2 + 0.06), BASE_H + doorH / 2, FRONT + 0.02]} scale={[0.14, doorH, 0.5]} geometry={box} material={m.gold} />
      ))}
      <mesh position={[0, BASE_H + doorH + 0.07, FRONT + 0.02]} scale={[doorW + 0.26, 0.14, 0.5]} geometry={box} material={m.gold} />
      {/* open golden doors studded with brass */}
      {[-1, 1].map((s) => (
        <group key={`d${s}`} position={[s * (doorW / 2 + 0.05), BASE_H + doorH / 2, FRONT + 0.45]} rotation-y={s * 1.4}>
          <mesh scale={[doorW / 2, doorH, 0.08]} geometry={box} material={m.gold} />
          <Instanced geometry={sphere} material={m.brass} items={doorStuds} />
        </group>
      ))}
      {/* dark interior floor */}
      <mesh position={[0, BASE_H + 0.01, SANCTUM_Z]} rotation-x={-Math.PI / 2} material={m.teakDark}>
        <planeGeometry args={[W - 0.8, W - 0.8]} />
      </mesh>
      {/* ceiling */}
      <mesh position={[0, BASE_H + wallH, SANCTUM_Z]} scale={[W + 0.6, 0.2, W + 0.6]} geometry={box} material={m.teakDark} />

      {/* golden two-tier roof */}
      <mesh position={[0, BASE_H + wallH + 0.05, SANCTUM_Z]} geometry={lowerRoof} material={m.goldRoof} />
      <mesh position={[0, BASE_H + wallH + 2.0, SANCTUM_Z]} scale={[2.6, 0.7, 2.6]} geometry={box} material={m.gold} />
      <mesh position={[0, BASE_H + wallH + 2.3, SANCTUM_Z]} geometry={upperRoof} material={m.goldRoof} />
      <mesh position={[0, BASE_H + wallH + 3.9, SANCTUM_Z]} scale={1.15} geometry={kalasam} material={m.gold} />

      <Flames positions={innerLamps} width={0.035} height={0.09} intensity={5.5} />
      <NilavilakkuSet lamps={tallLamps} wicks={5} />
      <FlickerLight position={[0, BASE_H + 1.9, VIG_Z + 1.3]} intensity={16} distance={6} color="#ffc27a" />
      <FlickerLight position={[0, BASE_H + 2.4, FRONT + 3.2]} intensity={7} distance={8} color="#ffb257" />
    </group>
  );
}

export default function VigrahamSanctum() {
  const quality = useTempleStore((s) => s.quality);
  return (
    <group>
      <Sreekovil quality={quality} />
      <Vigraham />
      <DivineRays />
    </group>
  );
}
