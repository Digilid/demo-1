import * as THREE from 'three';
import { getTexture } from './textures';

/** Shared, lazily created materials so every mesh reuses the same programs. */
let mats: ReturnType<typeof create> | null = null;

function create() {
  const brass = new THREE.MeshStandardMaterial({
    color: '#c99a3e',
    metalness: 0.92,
    roughness: 0.32,
    emissive: '#3a2206',
    emissiveIntensity: 0.25,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: '#e0b84a',
    metalness: 1,
    roughness: 0.22,
    emissive: '#5a3a08',
    emissiveIntensity: 0.35,
  });
  const goldRoof = new THREE.MeshStandardMaterial({
    map: getTexture('copperRoof', 3, 2),
    color: '#ffd27a',
    metalness: 0.95,
    roughness: 0.3,
    emissive: '#4a2c05',
    emissiveIntensity: 0.4,
  });
  const teak = new THREE.MeshStandardMaterial({ map: getTexture('teak'), roughness: 0.65, metalness: 0.05 });
  const teakDark = new THREE.MeshStandardMaterial({ map: getTexture('teak', 2, 1), color: '#8a5a3a', roughness: 0.7 });
  const granite = new THREE.MeshStandardMaterial({ map: getTexture('granite'), roughness: 0.82, color: '#b8aa98' });
  const laterite = new THREE.MeshStandardMaterial({ map: getTexture('laterite', 4, 1), roughness: 0.9 });
  const whitewash = new THREE.MeshStandardMaterial({ color: '#d9ccb4', roughness: 0.95 });
  const pavers = new THREE.MeshStandardMaterial({ map: getTexture('pavers', 40, 40), roughness: 0.75, metalness: 0.05 });
  const roofTiles = new THREE.MeshStandardMaterial({ map: getTexture('roofTiles', 4, 3), roughness: 0.8, side: THREE.DoubleSide });
  const mural = new THREE.MeshStandardMaterial({ map: getTexture('mural', 2, 1), roughness: 0.85 });
  const lattice = new THREE.MeshStandardMaterial({ map: getTexture('lattice', 12, 3), roughness: 0.9 });
  const jasmine = new THREE.MeshStandardMaterial({ color: '#fff8ea', roughness: 0.6, emissive: '#5a4a30', emissiveIntensity: 0.35 });
  const marigold = new THREE.MeshStandardMaterial({ color: '#ff9a1a', roughness: 0.7, emissive: '#5a2500', emissiveIntensity: 0.4 });
  const leaf = new THREE.MeshStandardMaterial({
    map: getTexture('leaf'),
    alphaTest: 0.4,
    side: THREE.DoubleSide,
    roughness: 0.7,
  });
  const vermilion = new THREE.MeshStandardMaterial({ color: '#6b141a', roughness: 0.7 });
  const deityStone = new THREE.MeshStandardMaterial({
    color: '#16203a',
    metalness: 0.35,
    roughness: 0.35,
    emissive: '#0a1430',
    emissiveIntensity: 0.4,
  });
  return {
    brass,
    gold,
    goldRoof,
    teak,
    teakDark,
    granite,
    laterite,
    whitewash,
    pavers,
    roofTiles,
    mural,
    lattice,
    jasmine,
    marigold,
    leaf,
    vermilion,
    deityStone,
  };
}

export function useMaterials() {
  if (!mats) mats = create();
  return mats;
}
