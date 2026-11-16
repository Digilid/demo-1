import * as THREE from 'three';

/**
 * Procedural canvas textures — no image downloads required.
 * Generated once (async, with progress) before the scene mounts.
 */

export type TextureName =
  | 'teak'
  | 'granite'
  | 'laterite'
  | 'pavers'
  | 'roofTiles'
  | 'copperRoof'
  | 'mural'
  | 'lattice'
  | 'peacock'
  | 'aura'
  | 'leaf';

const cache = new Map<TextureName, THREE.Texture>();

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(size = 512, h = size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return { c, ctx };
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, colors: string[], r: () => number, maxR = 1.6) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = colors[Math.floor(r() * colors.length)];
    ctx.globalAlpha = 0.25 + r() * 0.5;
    ctx.beginPath();
    ctx.arc(r() * w, r() * h, 0.3 + r() * maxR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const painters: Record<TextureName, () => HTMLCanvasElement> = {
  teak() {
    const { c, ctx } = canvas(512);
    const r = rng(11);
    ctx.fillStyle = '#4a230f';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 160; i++) {
      const x = r() * 512;
      ctx.strokeStyle = r() > 0.5 ? 'rgba(110,55,22,0.35)' : 'rgba(25,10,4,0.35)';
      ctx.lineWidth = 0.6 + r() * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      for (let y = 0; y <= 512; y += 16) ctx.lineTo(x + Math.sin(y * 0.02 + i) * (2 + r() * 5), y);
      ctx.stroke();
    }
    return c;
  },
  granite() {
    const { c, ctx } = canvas(512);
    const r = rng(23);
    ctx.fillStyle = '#5d544c';
    ctx.fillRect(0, 0, 512, 512);
    speckle(ctx, 512, 512, 9000, ['#2b2621', '#8a7f72', '#3f3832', '#a39686', '#1a1613'], r);
    return c;
  },
  laterite() {
    const { c, ctx } = canvas(512);
    const r = rng(37);
    ctx.fillStyle = '#7a3420';
    ctx.fillRect(0, 0, 512, 512);
    speckle(ctx, 512, 512, 5000, ['#4a1c10', '#9a4a2a', '#2e120a', '#b0603a'], r, 2.4);
    ctx.strokeStyle = 'rgba(30,10,5,0.55)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 8; row++) {
      const y = row * 64;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
      for (let col = 0; col < 4; col++) {
        const x = col * 128 + (row % 2) * 64;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 64);
        ctx.stroke();
      }
    }
    // lime-wash band
    ctx.fillStyle = 'rgba(240,225,200,0.08)';
    ctx.fillRect(0, 0, 512, 40);
    return c;
  },
  pavers() {
    const { c, ctx } = canvas(512);
    const r = rng(41);
    ctx.fillStyle = '#1c1612';
    ctx.fillRect(0, 0, 512, 512);
    const s = 128;
    for (let y = 0; y < 512; y += s / 2) {
      for (let x = 0; x < 512; x += s) {
        const off = ((y / (s / 2)) % 2) * (s / 2);
        const g = 70 + Math.floor(r() * 30);
        ctx.fillStyle = `rgb(${g + 8},${g},${g - 8})`;
        ctx.fillRect(x + off - 512 * Number(x + off >= 512) + 2, y + 2, s - 4, s / 2 - 4);
      }
    }
    speckle(ctx, 512, 512, 6000, ['#2a231e', '#6d6157', '#433a33'], r, 1.2);
    return c;
  },
  roofTiles() {
    const { c, ctx } = canvas(512);
    ctx.fillStyle = '#4a150c';
    ctx.fillRect(0, 0, 512, 512);
    const r = rng(53);
    for (let y = 0; y < 512; y += 32) {
      for (let x = -16; x < 512; x += 32) {
        const ox = (y / 32) % 2 ? 16 : 0;
        const shade = 0.75 + r() * 0.35;
        const grd = ctx.createLinearGradient(0, y, 0, y + 32);
        grd.addColorStop(0, `rgba(${150 * shade},${55 * shade},${30 * shade},1)`);
        grd.addColorStop(1, `rgba(${80 * shade},${24 * shade},${12 * shade},1)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(x + ox, y);
        ctx.lineTo(x + ox + 30, y);
        ctx.quadraticCurveTo(x + ox + 30, y + 34, x + ox + 15, y + 34);
        ctx.quadraticCurveTo(x + ox, y + 34, x + ox, y);
        ctx.fill();
      }
    }
    return c;
  },
  copperRoof() {
    const { c, ctx } = canvas(512);
    ctx.fillStyle = '#b8862c';
    ctx.fillRect(0, 0, 512, 512);
    for (let x = 0; x < 512; x += 24) {
      const grd = ctx.createLinearGradient(x, 0, x + 24, 0);
      grd.addColorStop(0, 'rgba(255,230,150,0.55)');
      grd.addColorStop(0.5, 'rgba(120,80,20,0.15)');
      grd.addColorStop(1, 'rgba(60,35,5,0.55)');
      ctx.fillStyle = grd;
      ctx.fillRect(x, 0, 24, 512);
    }
    ctx.fillStyle = 'rgba(70,40,10,0.5)';
    for (let y = 0; y < 512; y += 64) ctx.fillRect(0, y, 512, 3);
    return c;
  },
  mural() {
    const { c, ctx } = canvas(512);
    const r = rng(71);
    ctx.fillStyle = '#7a2a12';
    ctx.fillRect(0, 0, 512, 512);
    // Kerala mural palette bands and lotus medallions
    const pal = ['#c8781e', '#2f5b2b', '#e8c25a', '#1d2e4a', '#d9a066'];
    ctx.fillStyle = '#e8c25a';
    ctx.fillRect(0, 20, 512, 8);
    ctx.fillRect(0, 484, 512, 8);
    for (let i = 0; i < 6; i++) {
      const cx = 43 + i * 85;
      const cy = 256;
      for (let k = 0; k < 12; k++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((k / 12) * Math.PI * 2);
        ctx.fillStyle = pal[k % pal.length];
        ctx.beginPath();
        ctx.ellipse(0, -22, 8, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#f2d98a';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, 512, 512, 2500, ['#3a1006', '#a0481c'], r, 1.4);
    return c;
  },
  lattice() {
    const { c, ctx } = canvas(256);
    ctx.fillStyle = '#1e0e06';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#3d1f0d';
    for (let y = 0; y < 256; y += 32) ctx.fillRect(0, y + 22, 256, 6);
    ctx.fillStyle = '#2a1408';
    for (let x = 0; x < 256; x += 32) ctx.fillRect(x, 0, 3, 256);
    return c;
  },
  peacock() {
    const { c, ctx } = canvas(128, 512);
    ctx.clearRect(0, 0, 128, 512);
    ctx.strokeStyle = '#d8c58a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, 512);
    ctx.lineTo(64, 40);
    ctx.stroke();
    for (let y = 60; y < 500; y += 4) {
      const w = 56 * Math.sin(((y - 40) / 470) * Math.PI) * (y < 140 ? 1 : 0.85);
      ctx.strokeStyle = y < 170 ? 'rgba(40,140,90,0.85)' : 'rgba(70,150,60,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(64, y);
      ctx.quadraticCurveTo(64 - w * 0.6, y - 10, 64 - w, y - 22);
      ctx.moveTo(64, y);
      ctx.quadraticCurveTo(64 + w * 0.6, y - 10, 64 + w, y - 22);
      ctx.stroke();
    }
    const eye: [string, number, number][] = [
      ['#2f9e6a', 40, 52],
      ['#d4af37', 30, 40],
      ['#1aa0a8', 22, 30],
      ['#5b3a1c', 15, 21],
      ['#13235e', 10, 14],
    ];
    for (const [col, rx, ry] of eye) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(64, 100, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    return c;
  },
  aura() {
    const { c, ctx } = canvas(256);
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,236,190,1)');
    g.addColorStop(0.25, 'rgba(255,190,90,0.65)');
    g.addColorStop(0.6, 'rgba(220,120,40,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return c;
  },
  leaf() {
    const { c, ctx } = canvas(128, 256);
    ctx.clearRect(0, 0, 128, 256);
    const g = ctx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, '#1f4d16');
    g.addColorStop(0.5, '#4f8f2a');
    g.addColorStop(1, '#2a5e1a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.bezierCurveTo(130, 60, 120, 200, 64, 256);
    ctx.bezierCurveTo(8, 200, -2, 60, 64, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,230,140,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.lineTo(64, 256);
    ctx.stroke();
    ctx.lineWidth = 0.8;
    for (let y = 20; y < 240; y += 12) {
      ctx.beginPath();
      ctx.moveTo(64, y);
      ctx.lineTo(18, y + 18);
      ctx.moveTo(64, y);
      ctx.lineTo(110, y + 18);
      ctx.stroke();
    }
    return c;
  },
};

const COLOR_DATA: TextureName[] = ['lattice', 'aura'];

export const TEXTURE_NAMES = Object.keys(painters) as TextureName[];

function build(name: TextureName) {
  const tex = new THREE.CanvasTexture(painters[name]());
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  if (COLOR_DATA.includes(name)) tex.generateMipmaps = true;
  return tex;
}

/** Generate every texture, yielding a frame between each so the loader animates. */
export async function generateTextures(onProgress: (done: number, total: number, name: string) => void) {
  const total = TEXTURE_NAMES.length;
  for (let i = 0; i < total; i++) {
    const name = TEXTURE_NAMES[i];
    if (!cache.has(name)) cache.set(name, build(name));
    onProgress(i + 1, total, name);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
  }
}

/** Returns a texture; clones when a custom repeat is needed. */
export function getTexture(name: TextureName, repeatX = 1, repeatY = repeatX): THREE.Texture {
  if (!cache.has(name)) cache.set(name, build(name));
  const base = cache.get(name)!;
  if (repeatX === 1 && repeatY === 1) return base;
  const t = base.clone();
  t.repeat.set(repeatX, repeatY);
  t.needsUpdate = true;
  return t;
}
