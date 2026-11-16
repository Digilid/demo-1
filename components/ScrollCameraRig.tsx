'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { lookCurve, positionCurve, progressToCurveU } from '@/lib/cameraPath';
import { scrollState, useTempleStore } from '@/lib/store';

/**
 * Drives the camera along a CatmullRom path from scroll progress, with
 * damping, an opening dolly, idle "breathing", and mouse-parallax tilt.
 */
export default function ScrollCameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const u = useRef(0);
  const intro = useRef(9); // starts further back, glides in once loaded
  const parallax = useRef(new THREE.Vector2());
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const fwd = useRef(new THREE.Vector3());
  const side = useRef(new THREE.Vector3());

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 20);
    const { phase } = useTempleStore.getState();

    const targetU = phase === 'inside' ? progressToCurveU(scrollState.progress) : 0;
    u.current = THREE.MathUtils.damp(u.current, targetU, 3.2, delta);

    const introTarget = phase === 'loading' ? 9 : 0;
    intro.current = THREE.MathUtils.damp(intro.current, introTarget, phase === 'loading' ? 10 : 0.9, delta);

    positionCurve.getPoint(u.current, pos.current);
    lookCurve.getPoint(u.current, look.current);
    pos.current.z += intro.current;
    pos.current.y += intro.current * 0.12;

    // gentle breathing so the scene never feels frozen
    const t = state.clock.elapsedTime;
    pos.current.y += Math.sin(t * 0.7) * 0.025;
    pos.current.x += Math.sin(t * 0.43) * 0.02;

    // mouse parallax: look around a little at each stop
    parallax.current.x = THREE.MathUtils.damp(parallax.current.x, state.pointer.x, 2.5, delta);
    parallax.current.y = THREE.MathUtils.damp(parallax.current.y, state.pointer.y, 2.5, delta);
    fwd.current.copy(look.current).sub(pos.current).normalize();
    side.current.crossVectors(fwd.current, camera.up).normalize();
    const lookRange = size.width < 820 ? 0.6 : 1.4;
    look.current.addScaledVector(side.current, parallax.current.x * lookRange);
    look.current.y += parallax.current.y * lookRange * 0.55;
    pos.current.addScaledVector(side.current, parallax.current.x * 0.12);

    // portrait phones: aim lower so the scene sits above the bottom-sheet cards
    if (size.width / size.height < 0.8 && phase === 'inside') look.current.y -= 0.85;

    camera.position.copy(pos.current);
    camera.lookAt(look.current);

    // slightly wider lens on portrait screens so the architecture still reads
    const targetFov = size.width / size.height < 0.8 ? 68 : 52;
    if (Math.abs(camera.fov - targetFov) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 4, delta);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
