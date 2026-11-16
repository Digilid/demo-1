'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useTempleStore } from '@/lib/store';

/** One shared clock uniform for every flame material in the scene. */
export const flameTime = { value: 0 };

export function FlameClock() {
  useFrame((state) => {
    flameTime.value = state.clock.elapsedTime;
  });
  return null;
}

let teardrop: THREE.LatheGeometry | null = null;
function getTeardrop() {
  if (teardrop) return teardrop;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const y = i / 10;
    const r = 0.5 * Math.sin(Math.PI * Math.pow(y, 0.62)) * (1 - y * 0.25);
    pts.push(new THREE.Vector2(Math.max(r, 0.0001), y));
  }
  teardrop = new THREE.LatheGeometry(pts, 7);
  return teardrop;
}

const vertex = /* glsl */ `
  uniform float uTime;
  varying float vY;
  varying float vFlick;
  varying float vFog;
  uniform float uFogDensity;
  void main() {
    vec3 p = position;
    vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
    float ph = fract(sin(dot(ip.xz + ip.y, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831;
    float f = 0.86 + 0.12 * sin(uTime * 9.0 + ph) + 0.07 * sin(uTime * 23.0 + ph * 2.3);
    vFlick = f;
    p.y *= f;
    p.x += sin(uTime * 4.2 + ph) * 0.18 * p.y * p.y;
    p.z += cos(uTime * 3.7 + ph) * 0.1 * p.y * p.y;
    vY = position.y;
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
    float d = length(mv.xyz);
    vFog = exp(-uFogDensity * uFogDensity * d * d);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uEdge;
  uniform float uIntensity;
  varying float vY;
  varying float vFlick;
  varying float vFog;
  void main() {
    vec3 c = mix(uCore, uEdge, smoothstep(0.05, 0.95, vY));
    float glow = uIntensity * vFlick * mix(0.25, 1.0, vFog);
    gl_FragColor = vec4(c * glow, 1.0);
  }
`;

type FlamesProps = {
  /** Flat xyz array */
  positions: Float32Array | number[];
  width?: number;
  height?: number;
  intensity?: number;
  core?: string;
  edge?: string;
};

export function Flames({
  positions,
  width = 0.05,
  height = 0.13,
  intensity = 4.5,
  core = '#fff1c4',
  edge = '#ff7a1a',
}: FlamesProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = Math.floor(positions.length / 3);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: flameTime,
          uCore: { value: new THREE.Color(core) },
          uEdge: { value: new THREE.Color(edge) },
          uIntensity: { value: intensity },
          uFogDensity: { value: 0.03 },
        },
        transparent: false,
        depthWrite: true,
        toneMapped: false,
      }),
    [core, edge, intensity],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3(width, height, width);
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      v.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      m.compose(v, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [positions, count, width, height]);

  if (count === 0) return null;
  return <instancedMesh ref={ref} args={[getTeardrop(), material, count]} frustumCulled={false} />;
}

/** Light that flickers like an oil lamp. */
export function FlickerLight({
  position,
  intensity = 20,
  distance = 12,
  color = '#ffab52',
  speed = 1,
  optional = false,
}: {
  position: [number, number, number];
  intensity?: number;
  distance?: number;
  color?: string;
  speed?: number;
  /** Skipped on low-quality (mobile) devices to save fragment cost. */
  optional?: boolean;
}) {
  const ref = useRef<THREE.PointLight>(null);
  const low = useTempleStore((s) => s.quality === 'low');
  const seed = useMemo(() => Math.random() * 100, []);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + seed;
    ref.current.intensity = intensity * (0.88 + 0.08 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 17.1));
  });
  if (optional && low) return null;
  return <pointLight ref={ref} position={position} intensity={intensity} distance={distance} decay={1.6} color={color} />;
}
