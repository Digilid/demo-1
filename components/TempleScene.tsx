'use client';

import { useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { useTempleStore } from '@/lib/store';
import TempleArchitecture from './TempleArchitecture';
import VigrahamSanctum from './VigrahamSanctum';
import ScrollCameraRig from './ScrollCameraRig';
import { FlameClock } from './three/Flames';

const NIGHT = '#120907';

/** Pre-compiles every shader, then tells the loader the temple is ready. */
function ReadySignal() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let cancelled = false;
    const { setLoad, setSceneReady } = useTempleStore.getState();
    setLoad(0.82, 'Consecrating the sanctum');
    const finish = () => {
      if (cancelled) return;
      setLoad(0.95, 'Opening the Nada');
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (cancelled) return;
          setLoad(1, 'Welcome');
          setSceneReady();
        }),
      );
    };
    const compile = (gl as THREE.WebGLRenderer & { compileAsync?: (s: THREE.Object3D, c: THREE.Camera) => Promise<unknown> })
      .compileAsync;
    if (compile) compile.call(gl, scene, camera).then(finish, finish);
    else {
      gl.compile(scene, camera);
      finish();
    }
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);
  return null;
}

function Lighting() {
  return (
    <>
      <color attach="background" args={[NIGHT]} />
      <fogExp2 attach="fog" args={[NIGHT, 0.03]} />
      <ambientLight intensity={0.18} color="#ffb070" />
      <hemisphereLight args={['#2c2550', '#1a0c06', 0.45]} />
      <directionalLight position={[-12, 22, 14]} intensity={0.35} color="#8f9cff" />
      <Environment resolution={64} frames={1} environmentIntensity={0.55}>
        <color attach="background" args={['#1a0d08']} />
        <Lightformer form="ring" intensity={5} color="#ffb347" position={[0, 6, -12]} scale={10} />
        <Lightformer intensity={2.5} color="#ff8a2a" position={[-8, 2, 0]} rotation-y={Math.PI / 2} scale={[14, 3, 1]} />
        <Lightformer intensity={2.5} color="#ff8a2a" position={[8, 2, 0]} rotation-y={-Math.PI / 2} scale={[14, 3, 1]} />
        <Lightformer intensity={1.2} color="#6070c0" position={[0, 12, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
      </Environment>
    </>
  );
}

function Effects({ quality }: { quality: 'high' | 'low' }) {
  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        luminanceThreshold={0.85}
        luminanceSmoothing={0.25}
        intensity={quality === 'high' ? 1.25 : 0.95}
        radius={0.72}
        levels={quality === 'high' ? 8 : 6}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette eskil={false} offset={0.18} darkness={0.82} />
    </EffectComposer>
  );
}

export default function TempleScene() {
  const quality = useTempleStore((s) => s.quality);
  const [dpr, setDpr] = useState(quality === 'high' ? 1.6 : 1.15);

  return (
    <div className="fixed inset-0 h-[100dvh] w-screen" aria-hidden>
    <Canvas
      flat
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false }}
      camera={{ fov: 52, near: 0.08, far: 140, position: [0, 3, 28] }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <PerformanceMonitor
        bounds={() => [45, 58]}
        onDecline={() => setDpr((d) => Math.max(0.85, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(quality === 'high' ? 1.75 : 1.25, d + 0.15))}
        flipflops={4}
      />
      <Lighting />
      <FlameClock />
      <ScrollCameraRig />
      <TempleArchitecture />
      <VigrahamSanctum />
      <Effects quality={quality} />
      <ReadySignal />
    </Canvas>
    </div>
  );
}
