'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTempleStore } from '@/lib/store';
import { BLESSING } from '@/constants/weddingData';

/** Rotating brass Nilavilakku with a circular progress ring. */
function LampIndicator({ progress }: { progress: number }) {
  const R = 74;
  const C = 464.96;
  const offset = Math.round(C * (1 - progress) * 100) / 100;
  return (
    <div className="relative h-44 w-44" style={{ perspective: '600px' }}>
      <svg viewBox="0 0 180 180" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="2" />
        <circle
          cx="90"
          cy="90"
          r={R}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6e3a1" />
            <stop offset="1" stopColor="#a7801c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="lamp-spin">
          <svg width="74" height="110" viewBox="0 0 74 110">
            <defs>
              <linearGradient id="brass" x1="0" x2="1">
                <stop offset="0" stopColor="#7a5414" />
                <stop offset="0.45" stopColor="#f6e3a1" />
                <stop offset="0.7" stopColor="#d4af37" />
                <stop offset="1" stopColor="#6a4810" />
              </linearGradient>
              <radialGradient id="flameG" cx="0.5" cy="0.7" r="0.6">
                <stop offset="0" stopColor="#fffbe6" />
                <stop offset="0.45" stopColor="#ffc35a" />
                <stop offset="1" stopColor="#ff6a00" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g className="flame">
              <ellipse cx="37" cy="14" rx="7" ry="13" fill="url(#flameG)" />
            </g>
            <path d="M14 30 Q37 40 60 30 L56 34 Q37 42 18 34 Z" fill="url(#brass)" />
            <rect x="34" y="36" width="6" height="44" fill="url(#brass)" />
            <ellipse cx="37" cy="52" rx="7" ry="3" fill="url(#brass)" />
            <ellipse cx="37" cy="66" rx="6" ry="2.6" fill="url(#brass)" />
            <path d="M22 98 Q37 74 52 98 Z" fill="url(#brass)" />
            <ellipse cx="37" cy="100" rx="22" ry="5" fill="url(#brass)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function LoadingScreen() {
  const phase = useTempleStore((s) => s.phase);
  const progress = useTempleStore((s) => s.loadProgress);
  const label = useTempleStore((s) => s.loadLabel);

  return (
    <AnimatePresence>
      {phase === 'loading' && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-night"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.4, ease: 'easeInOut' } }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle at 50% 45%, rgba(107,20,26,0.55), transparent 60%)' }}
          />
          <p className="font-ml relative mb-6 text-lg tracking-wide text-brass-soft/90">{BLESSING.malayalam}</p>
          <LampIndicator progress={progress} />
          <p className="font-label relative mt-8 text-xs uppercase tracking-[0.35em] text-brass-soft/80">{label}</p>
          <p className="relative mt-2 font-display text-2xl text-kasavu/80">{Math.round(progress * 100)}%</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
