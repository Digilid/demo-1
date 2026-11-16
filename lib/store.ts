import { create } from 'zustand';

export type Phase = 'loading' | 'gate' | 'opening' | 'inside';
export type SectionId = 'intro' | 'events' | 'venue' | 'blessing';
export type Quality = 'high' | 'low';

/** Scroll milestones (0–1) where each invitation card is centred. */
export const MILESTONES: Record<SectionId, number> = {
  intro: 0.15,
  events: 0.4,
  venue: 0.65,
  blessing: 0.9,
};

/** Visible window around each milestone. */
export const SECTION_RANGES: { id: SectionId; from: number; to: number }[] = [
  { id: 'intro', from: 0.08, to: 0.26 },
  { id: 'events', from: 0.32, to: 0.5 },
  { id: 'venue', from: 0.57, to: 0.77 },
  { id: 'blessing', from: 0.84, to: 1.01 },
];

export function sectionForProgress(p: number): SectionId | null {
  for (const r of SECTION_RANGES) if (p >= r.from && p < r.to) return r.id;
  return null;
}

/**
 * Mutable, non-reactive scroll state read every frame by the camera rig.
 * Kept outside React so scrolling never triggers re-renders.
 */
export const scrollState = { progress: 0, velocity: 0 };

type TempleState = {
  phase: Phase;
  loadProgress: number;
  loadLabel: string;
  section: SectionId | null;
  muted: boolean;
  quality: Quality;
  sceneReady: boolean;
  setPhase: (p: Phase) => void;
  setLoad: (progress: number, label: string) => void;
  setSection: (s: SectionId | null) => void;
  setMuted: (m: boolean) => void;
  setQuality: (q: Quality) => void;
  setSceneReady: () => void;
};

export const useTempleStore = create<TempleState>()((set) => ({
  phase: 'loading',
  loadProgress: 0,
  loadLabel: 'Lighting the lamps',
  section: null,
  muted: false,
  quality: 'high',
  sceneReady: false,
  setPhase: (phase) => set({ phase }),
  setLoad: (loadProgress, loadLabel) => set({ loadProgress, loadLabel }),
  setSection: (section) => set({ section }),
  setMuted: (muted) => set({ muted }),
  setQuality: (quality) => set({ quality }),
  setSceneReady: () => set({ sceneReady: true }),
}));

export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'high';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = window.innerWidth < 820;
  const lowMem =
    'deviceMemory' in navigator && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
  return coarse || small || lowMem ? 'low' : 'high';
}
