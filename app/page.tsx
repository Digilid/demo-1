'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { detectQuality, useTempleStore } from '@/lib/store';
import { generateTextures } from '@/lib/textures';
import { useSmoothScroll } from '@/lib/smoothScroll';
import { templeAudio } from '@/lib/templeAudio';
import InvitationOverlays from '@/components/InvitationOverlays';
import LoadingScreen from '@/components/LoadingScreen';

const TempleScene = dynamic(() => import('@/components/TempleScene'), { ssr: false });

const LABELS: Record<string, string> = {
  teak: 'Carving the teakwood doors',
  granite: 'Laying the granite pillars',
  laterite: 'Raising the laterite walls',
  pavers: 'Paving the Pradakshina path',
  roofTiles: 'Tiling the Kerala roofs',
  copperRoof: 'Gilding the Sreekovil',
  mural: 'Painting the murals',
  lattice: 'Building the Vilakkumatam',
  peacock: 'Gathering a peacock feather',
  aura: 'Kindling the divine glow',
  leaf: 'Tying the Thoranam',
};

export default function Page() {
  const [texturesReady, setTexturesReady] = useState(false);
  const sceneReady = useTempleStore((s) => s.sceneReady);
  const phase = useTempleStore((s) => s.phase);

  useSmoothScroll('journey');

  // 1) choose a quality tier, wait for fonts, generate procedural textures
  useEffect(() => {
    let alive = true;
    const { setQuality, setLoad } = useTempleStore.getState();
    setQuality(detectQuality());
    (async () => {
      setLoad(0.04, 'Lighting the lamps');
      await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 2500))]);
      await generateTextures((done, total, name) => {
        if (alive) setLoad(0.06 + (done / total) * 0.66, LABELS[name] ?? 'Preparing the temple');
      });
      if (alive) setTexturesReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 2) when shaders are compiled, reveal the closed temple doors
  useEffect(() => {
    if (!sceneReady || phase !== 'loading') return;
    const t = window.setTimeout(() => useTempleStore.getState().setPhase('gate'), 700);
    return () => window.clearTimeout(t);
  }, [sceneReady, phase]);

  useEffect(() => () => templeAudio.dispose(), []);

  return (
    <main className="relative">
      {texturesReady && <TempleScene />}
      {/* the scroll track that drives the camera (0 → 1) */}
      <div id="journey" aria-hidden className="relative w-full" style={{ height: '820vh' }} />
      <InvitationOverlays />
      <LoadingScreen />
      <noscript>
        <div className="fixed inset-0 flex items-center justify-center bg-night p-8 text-center text-kasavu">
          Please enable JavaScript to enter the temple and view this invitation.
        </div>
      </noscript>
    </main>
  );
}
