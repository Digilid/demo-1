import * as THREE from 'three';

/**
 * Kerala hip roof: four tiled slopes meeting at a ridge, with flared eaves
 * (the eave edge droops slightly at the corners like a traditional roof).
 */
export function hipRoofGeometry(width: number, depth: number, height: number, flare = 0.25) {
  const w = width / 2;
  const d = depth / 2;
  const ridge = Math.max(width - depth, 0) / 2;
  // eave corners (y = 0, dropped at corners for the flare), ridge ends (y = height)
  const E = [
    new THREE.Vector3(-w, -flare, d),
    new THREE.Vector3(w, -flare, d),
    new THREE.Vector3(w, -flare, -d),
    new THREE.Vector3(-w, -flare, -d),
  ];
  const R0 = new THREE.Vector3(-ridge, height, 0);
  const R1 = new THREE.Vector3(ridge, height, 0);
  const Mf = new THREE.Vector3(0, 0, d); // eave mid-points (no drop)
  const Mb = new THREE.Vector3(0, 0, -d);
  const Ml = new THREE.Vector3(-w, 0, 0);
  const Mr = new THREE.Vector3(w, 0, 0);

  const tris: THREE.Vector3[][] = [
    // front
    [E[0], Mf, R0],
    [Mf, R1, R0],
    [Mf, E[1], R1],
    // back
    [E[2], Mb, R1],
    [Mb, R0, R1],
    [Mb, E[3], R0],
    // right
    [E[1], Mr, R1],
    [Mr, E[2], R1],
    // left
    [E[3], Ml, R0],
    [Ml, E[0], R0],
  ];
  const pos: number[] = [];
  const uv: number[] = [];
  for (const t of tris) {
    for (const v of t) {
      pos.push(v.x, v.y, v.z);
      uv.push((v.x + w) / width, v.y / height + Math.abs(v.z) / depth);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

/** Brass/gold Kalasam finial (stacked pots and a spire). */
export function kalasamGeometry() {
  const p: [number, number][] = [
    [0.0001, 0],
    [0.16, 0],
    [0.18, 0.05],
    [0.1, 0.1],
    [0.2, 0.22],
    [0.22, 0.3],
    [0.15, 0.4],
    [0.08, 0.44],
    [0.14, 0.52],
    [0.14, 0.58],
    [0.06, 0.64],
    [0.09, 0.7],
    [0.04, 0.78],
    [0.02, 0.95],
    [0.0001, 1.02],
  ];
  return new THREE.LatheGeometry(
    p.map(([r, y]) => new THREE.Vector2(r, y)),
    16,
  );
}

/** Temple bell (mani) profile. */
export function bellGeometry() {
  const p: [number, number][] = [
    [0.0001, 0.32],
    [0.03, 0.32],
    [0.05, 0.28],
    [0.07, 0.2],
    [0.09, 0.1],
    [0.12, 0.02],
    [0.13, 0],
    [0.11, 0.005],
  ];
  return new THREE.LatheGeometry(
    p.map(([r, y]) => new THREE.Vector2(r, y)),
    16,
  );
}

/** Pyramidal (square) roof built from a 4-sided cone. */
export function pyramidRoofGeometry(halfSide: number, height: number) {
  const g = new THREE.ConeGeometry(halfSide * Math.SQRT2, height, 4, 1, true);
  g.rotateY(Math.PI / 4);
  g.translate(0, height / 2, 0);
  return g;
}

/** Vertical triangle for the Mukhappu gable face. */
export function gableGeometry(width: number, height: number) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0);
  s.lineTo(width / 2, 0);
  s.lineTo(0, height);
  s.lineTo(-width / 2, 0);
  return new THREE.ShapeGeometry(s);
}
