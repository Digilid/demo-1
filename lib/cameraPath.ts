import * as THREE from 'three';
import { MILESTONES } from './store';

/**
 * World layout (metres, temple faces +Z, the walk goes toward −Z):
 *   z = 10    Gopuram & teak doors
 *   z =  0    Deepasthambham (lamp pillar)
 *   z = −6…−30 Chuttambalam pillared corridor, Kodimaram at z = −22
 *   z = −38   Namaskara Mandapam
 *   z = −51.5 Sreekovil front doors, Vigraham at z = −54.5
 *
 * 21 control points → uniform curve parameter u = index / 20.
 * Milestone cards sit at indices 3, 8, 13 and 18.
 */
const P: [number, number, number][] = [
  [0, 2.1, 19], //  0 outside the gate
  [0, 2.0, 14.5], //  1
  [0, 2.0, 9.4], //  2 through the doors
  [1.9, 2.3, 4.6], //  3 ★ courtyard / Deepasthambham
  [2.5, 2.1, 0.4], //  4
  [2.1, 2.0, -4], //  5
  [0.9, 2.0, -8], //  6 corridor entry
  [0.2, 2.0, -12], //  7
  [0.1, 2.1, -15.8], //  8 ★ corridor / Kodimaram ahead
  [1.7, 2.2, -19], //  9
  [2.35, 2.4, -22], // 10 around the Kodimaram
  [1.8, 2.2, -25], // 11
  [0.6, 2.1, -29], // 12
  [0, 2.2, -32.4], // 13 ★ before the Namaskara Mandapam
  [0, 2.1, -35.5], // 14
  [0, 2.0, -38], // 15 under the Mandapam
  [0, 2.0, -41], // 16
  [0, 2.0, -44], // 17
  [0, 2.05, -46.6], // 18 ★ facing the Sreekovil
  [0, 2.12, -48], // 19
  [0, 2.25, -49], // 20 final, respectful stop
];

const L: [number, number, number][] = [
  [0, 2.7, 10],
  [0, 2.4, 6],
  [0, 3.2, 0],
  [-0.3, 4.4, -1.2],
  [0, 3.6, -4],
  [0, 2.6, -12],
  [0, 2.6, -16],
  [0, 3.0, -20],
  [-0.4, 4.6, -22],
  [0, 5.0, -22.4],
  [0, 6.4, -22],
  [0, 3.0, -32],
  [0, 2.6, -38],
  [0, 3.0, -40],
  [0, 2.6, -44],
  [0, 2.5, -48],
  [0, 2.5, -52],
  [0, 2.6, -54],
  [0, 2.65, -55],
  [0, 2.75, -55.5],
  [0, 2.85, -56],
];

export const positionCurve = new THREE.CatmullRomCurve3(
  P.map((p) => new THREE.Vector3(...p)),
  false,
  'catmullrom',
  0.4,
);
export const lookCurve = new THREE.CatmullRomCurve3(
  L.map((p) => new THREE.Vector3(...p)),
  false,
  'catmullrom',
  0.4,
);

const N = P.length - 1;
/** [scroll progress, curve parameter] stops; camera eases to rest at each. */
const STOPS: [number, number][] = [
  [0, 0],
  [MILESTONES.intro, 3 / N],
  [MILESTONES.events, 8 / N],
  [MILESTONES.venue, 13 / N],
  [MILESTONES.blessing, 18 / N],
  [1, 1],
];

const easeInOut = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * x);

/** Maps scroll progress to curve parameter so the camera dwells at each card. */
export function progressToCurveU(p: number): number {
  const c = THREE.MathUtils.clamp(p, 0, 1);
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [p0, u0] = STOPS[i];
    const [p1, u1] = STOPS[i + 1];
    if (c <= p1) {
      const local = (c - p0) / (p1 - p0);
      return u0 + (u1 - u0) * easeInOut(local);
    }
  }
  return 1;
}
