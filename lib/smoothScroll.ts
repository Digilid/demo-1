'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MILESTONES, scrollState, sectionForProgress, useTempleStore } from './store';

let lenisInstance: Lenis | null = null;

export const JOURNEY_STOPS = [0, MILESTONES.intro, MILESTONES.events, MILESTONES.venue, MILESTONES.blessing] as const;

export function getLenis() {
  return lenisInstance;
}

/** Scroll to a fraction (0–1) of the journey. */
export function scrollToProgress(p: number, duration = 2.4) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const target = Math.max(0, Math.min(1, p)) * max;
  if (lenisInstance) lenisInstance.scrollTo(target, { duration, easing: (t) => 1 - Math.pow(1 - t, 3) });
  else window.scrollTo({ top: target, behavior: 'smooth' });
}

/** Step backward to the previous milestone (or entrance at 0). */
export function scrollStepBack(duration = 2.0) {
  const current = scrollState.progress;
  for (let i = JOURNEY_STOPS.length - 1; i >= 0; i--) {
    if (JOURNEY_STOPS[i] < current - 0.04) {
      scrollToProgress(JOURNEY_STOPS[i], duration);
      return;
    }
  }
  scrollToProgress(0, duration);
}

/** Step forward to the next milestone. */
export function scrollStepForward(duration = 2.0) {
  const current = scrollState.progress;
  for (let i = 0; i < JOURNEY_STOPS.length; i++) {
    if (JOURNEY_STOPS[i] > current + 0.04) {
      scrollToProgress(JOURNEY_STOPS[i], duration);
      return;
    }
  }
  scrollToProgress(MILESTONES.blessing, duration);
}

/**
 * Lenis momentum scrolling bridged to GSAP ScrollTrigger. Progress over the
 * #journey track is written to scrollState (read every frame by the camera),
 * and the active invitation section is pushed into the store.
 */
export function useSmoothScroll(trackId: string) {
  const phase = useTempleStore((s) => s.phase);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
      smoothWheel: true,
      syncTouch: false, // native momentum on touch devices
    });
    lenisInstance = lenis;
    lenis.stop();

    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const st = ScrollTrigger.create({
      trigger: `#${trackId}`,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        scrollState.progress = self.progress;
        scrollState.velocity = self.getVelocity();
        const section = sectionForProgress(self.progress);
        const store = useTempleStore.getState();
        if (store.section !== section) store.setSection(section);
      },
    });

    return () => {
      st.kill();
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisInstance = null;
    };
  }, [trackId]);

  // lock scrolling until the temple doors are opened
  useEffect(() => {
    const root = document.documentElement;
    if (phase === 'inside') {
      root.classList.remove('scroll-locked');
      lenisInstance?.start();
      ScrollTrigger.refresh();
    } else {
      root.classList.add('scroll-locked');
      lenisInstance?.scrollTo(0, { immediate: true });
      lenisInstance?.stop();
      scrollState.progress = 0;
      scrollState.velocity = 0;
      useTempleStore.getState().setSection(null);
      window.scrollTo(0, 0);
    }
  }, [phase]);
}
