'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type WheelEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MILESTONES, scrollState, useTempleStore, type SectionId } from '@/lib/store';
import { templeAudio } from '@/lib/templeAudio';
import { scrollStepBack, scrollStepForward, scrollToProgress } from '@/lib/smoothScroll';
import { downloadICS, googleCalendarUrl } from '@/lib/calendar';
import { downloadInvitationCard } from '@/lib/invitationCard';
import { BLESSING, COUPLE, DRESS_CODE, EVENTS, RSVP, VENUE, WEDDING } from '@/constants/weddingData';

/* ───────────────────────── small pieces ───────────────────────── */

function Ornament({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 16" className={`mx-auto h-4 w-44 ${className}`} aria-hidden>
      <path d="M0 8 H80" stroke="#d4af37" strokeWidth="1" />
      <path d="M120 8 H200" stroke="#d4af37" strokeWidth="1" />
      <path d="M86 8 Q100 -4 114 8 Q100 20 86 8 Z" fill="#d4af37" />
      <circle cx="100" cy="8" r="2.5" fill="#6b141a" />
      <circle cx="78" cy="8" r="1.8" fill="#d4af37" />
      <circle cx="122" cy="8" r="1.8" fill="#d4af37" />
    </svg>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="font-label text-[0.68rem] uppercase tracking-[0.32em] text-brass-soft/85">{children}</p>;
}

const cardMotion = {
  initial: { opacity: 0, y: 40, filter: 'blur(10px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -30, filter: 'blur(8px)', transition: { duration: 0.5, ease: 'easeIn' as const } },
};

function Card({ side, children, wide = false }: { side: 'left' | 'right'; children: ReactNode; wide?: boolean }) {
  const section = useTempleStore((s) => s.section);

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight <= el.clientHeight + 2) return;
    const atTop = el.scrollTop <= 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) {
      e.stopPropagation();
    }
  };

  return (
    <motion.section
      {...cardMotion}
      className={[
        'pointer-events-auto fixed z-20 bottom-3 left-3 right-3 md:bottom-auto md:top-1/2 md:-translate-y-1/2',
        side === 'left' ? 'md:left-10 md:right-auto lg:left-16' : 'md:right-24 md:left-auto lg:right-28',
        wide ? 'md:w-[460px]' : 'md:w-[420px]',
      ].join(' ')}
    >
      <div
        onWheel={handleWheel}
        className="kasavu-card scrollbar-thin max-h-[50dvh] overflow-y-auto rounded-2xl px-6 py-9 md:max-h-[80dvh] md:px-8 md:py-11"
      >
        {children}
        <div className="mt-6 flex items-center justify-between gap-2 border-t border-brass/25 pt-4">
          <button
            type="button"
            onClick={() => scrollStepBack()}
            className="ghost-btn rounded-full px-3.5 py-1.5 font-label text-[0.62rem] uppercase tracking-[0.2em]"
          >
            ← Scroll Back
          </button>
          {section !== 'blessing' ? (
            <button
              type="button"
              onClick={() => scrollStepForward()}
              className="ghost-btn rounded-full px-3.5 py-1.5 font-label text-[0.62rem] uppercase tracking-[0.2em]"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => scrollToProgress(0, 3.2)}
              className="ghost-btn rounded-full px-3.5 py-1.5 font-label text-[0.62rem] uppercase tracking-[0.2em]"
            >
              ↑ Back to Top
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
}

/* ───────────────────────── cards ───────────────────────── */

function IntroCard() {
  return (
    <Card side="left">
      <div className="text-center">
        <p className="font-ml text-base text-brass-soft" lang="sa">
          {BLESSING.sanskrit}
        </p>
        <p className="font-ml mt-1 text-xl text-brass" lang="ml">
          {BLESSING.malayalam}
        </p>
        <p className="mt-1 text-sm italic text-kasavu/70">{BLESSING.transliteration}</p>
        <Ornament className="my-5" />
        <Label>{BLESSING.invocation}</Label>
        <h1 className="gold-text mt-4 font-display text-5xl font-semibold leading-none md:text-6xl">{COUPLE.groom.name}</h1>
        <p className="my-1 font-display text-3xl italic text-kasavu/80">&amp;</p>
        <h1 className="gold-text font-display text-5xl font-semibold leading-none md:text-6xl">{COUPLE.bride.name}</h1>
        <div className="mt-6 space-y-3 text-[1.02rem] leading-snug text-kasavu/85">
          <p>
            <span className="font-semibold text-kasavu">{COUPLE.groom.fullName}</span>
            <br />
            <span className="text-kasavu/70">{COUPLE.groom.parents}</span>
          </p>
          <p>
            <span className="font-semibold text-kasavu">{COUPLE.bride.fullName}</span>
            <br />
            <span className="text-kasavu/70">{COUPLE.bride.parents}</span>
          </p>
        </div>
        <Ornament className="my-5" />
        <p className="text-lg italic text-kasavu/90">request the honour of your presence at their wedding</p>
        <p className="font-label mt-3 text-sm tracking-[0.2em] text-brass">{WEDDING.displayDate}</p>
      </div>
    </Card>
  );
}

function EventsCard() {
  return (
    <Card side="right" wide>
      <div className="text-center">
        <Label>The Auspicious Day</Label>
        <h2 className="gold-text mt-2 font-display text-4xl font-semibold">Wedding Events</h2>
        <p className="mt-1 text-kasavu/70">
          {WEDDING.displayDate} · {WEDDING.malayalamMonth}
        </p>
        <Ornament className="my-5" />
      </div>
      <ol className="relative space-y-6 border-l border-brass/40 pl-6">
        {EVENTS.map((ev) => (
          <li key={ev.id} className="relative">
            <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-brass shadow-[0_0_14px_4px_rgba(255,180,70,0.6)]" />
            <p className="font-label text-[0.7rem] uppercase tracking-[0.25em] text-brass-soft">{ev.timeLabel}</p>
            <h3 className="mt-0.5 font-display text-2xl font-semibold text-kasavu">
              {ev.title} <span className="font-ml text-base font-normal text-brass-soft/80">{ev.malayalam}</span>
            </h3>
            <p className="text-kasavu/80">{ev.venue}</p>
            <p className="text-sm italic text-kasavu/60">{ev.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={googleCalendarUrl(ev)}
                target="_blank"
                rel="noreferrer"
                className="ghost-btn rounded-full px-3 py-1 font-label text-[0.62rem] uppercase tracking-[0.18em]"
              >
                Google Calendar
              </a>
              <button
                onClick={() => downloadICS(ev)}
                className="ghost-btn rounded-full px-3 py-1 font-label text-[0.62rem] uppercase tracking-[0.18em]"
              >
                Apple / Outlook (.ics)
              </button>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

type RsvpStatus = 'idle' | 'sending' | 'sent' | 'error';

function RsvpForm() {
  const [status, setStatus] = useState<RsvpStatus>('idle');
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') || ''),
      phone: String(fd.get('phone') || ''),
      attending,
      guests: attending === 'yes' ? Number(fd.get('guests') || 1) : 0,
      message: String(fd.get('message') || ''),
      submittedAt: new Date().toISOString(),
    };
    if (!payload.name.trim()) return;
    setStatus('sending');
    try {
      if (RSVP.endpoint) {
        const res = await fetch(RSVP.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`RSVP failed: ${res.status}`);
      } else {
        const text = [
          `RSVP · ${COUPLE.groom.name} & ${COUPLE.bride.name}`,
          `Name: ${payload.name}`,
          payload.phone && `Phone: ${payload.phone}`,
          `Attending: ${attending === 'yes' ? `Yes, ${payload.guests} guest(s)` : 'Regretfully, no'}`,
          payload.message && `Message: ${payload.message}`,
        ]
          .filter(Boolean)
          .join('\n');
        window.open(`https://wa.me/${RSVP.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      }
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-brass/40 bg-night/40 p-5 text-center">
        <p className="gold-text font-display text-2xl font-semibold">Thank you!</p>
        <p className="mt-1 text-kasavu/80">
          {attending === 'yes' ? 'We can’t wait to welcome you at Guruvayur.' : 'You will be in our prayers on the day.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input name="name" required placeholder="Your name" className="field" autoComplete="name" />
      <input name="phone" placeholder="Phone (optional)" className="field" autoComplete="tel" inputMode="tel" />
      <div className="grid grid-cols-2 gap-2">
        {(['yes', 'no'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAttending(v)}
            className={`rounded-lg border px-3 py-2 text-[1rem] transition ${
              attending === v ? 'border-brass bg-brass/20 text-kasavu' : 'border-brass/30 text-kasavu/70'
            }`}
          >
            {v === 'yes' ? 'Joyfully accept' : 'Regretfully decline'}
          </button>
        ))}
      </div>
      {attending === 'yes' && (
        <select name="guests" className="field" defaultValue="1">
          {Array.from({ length: RSVP.maxGuests }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n} className="bg-night">
              {n} {n === 1 ? 'guest' : 'guests'}
            </option>
          ))}
        </select>
      )}
      <textarea name="message" rows={2} placeholder="A blessing for the couple (optional)" className="field resize-none" />
      <button
        type="submit"
        disabled={status === 'sending'}
        className="gold-btn w-full rounded-full py-3 font-label text-xs font-semibold uppercase tracking-[0.25em] disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : RSVP.endpoint ? 'Send RSVP' : 'Send RSVP on WhatsApp'}
      </button>
      {status === 'error' && <p className="text-center text-sm text-red-300">Something went wrong — please try again.</p>}
      <p className="text-center text-sm italic text-kasavu/55">Kindly respond by {RSVP.deadline}</p>
    </form>
  );
}

function VenueCard() {
  return (
    <Card side="left" wide>
      <div className="text-center">
        <Label>The Sacred Venue</Label>
        <h2 className="gold-text mt-2 font-display text-4xl font-semibold leading-tight">{VENUE.name}</h2>
        <p className="mt-1 text-kasavu/80">{VENUE.subtitle}</p>
        <p className="text-sm text-kasavu/60">{VENUE.address}</p>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-brass/40">
        <iframe
          title="Map to Guruvayur Temple East Nada"
          src={VENUE.mapsEmbedUrl}
          className="h-36 w-full grayscale-[35%] sepia-[25%]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={VENUE.mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="gold-btn mt-3 block rounded-full py-2.5 text-center font-label text-xs font-semibold uppercase tracking-[0.25em]"
      >
        Open in Google Maps
      </a>
      <p className="mt-3 text-center text-sm italic text-kasavu/65">{VENUE.note}</p>

      <Ornament className="my-5" />
      <div className="text-center">
        <Label>Dress Code</Label>
        <p className="mt-1 font-display text-2xl font-semibold text-kasavu">{DRESS_CODE.title}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-[0.98rem] text-kasavu/80">
          <div className="rounded-lg border border-brass/30 p-2">
            <p className="font-label text-[0.6rem] uppercase tracking-[0.2em] text-brass-soft">Women</p>
            {DRESS_CODE.women}
          </div>
          <div className="rounded-lg border border-brass/30 p-2">
            <p className="font-label text-[0.6rem] uppercase tracking-[0.2em] text-brass-soft">Men</p>
            {DRESS_CODE.men}
          </div>
        </div>
        <p className="mt-2 text-sm italic text-kasavu/60">{DRESS_CODE.note}</p>
      </div>

      <Ornament className="my-5" />
      <div className="mb-3 text-center">
        <Label>Kindly RSVP</Label>
      </div>
      <RsvpForm />
    </Card>
  );
}

function BlessingCard() {
  const [busy, setBusy] = useState(false);
  return (
    <Card side="right">
      <div className="text-center">
        <p className="font-ml text-xl text-brass" lang="ml">
          {BLESSING.malayalam}
        </p>
        <Ornament className="my-4" />
        <Label>A Final Blessing</Label>
        <p className="mt-3 font-display text-[1.35rem] italic leading-snug text-kasavu/95">“{BLESSING.finalBlessing}”</p>
        <Ornament className="my-5" />
        <p className="text-[1.05rem] leading-relaxed text-kasavu/80">{BLESSING.gratitude}</p>
        <p className="gold-text mt-4 font-display text-2xl font-semibold">{BLESSING.signOff}</p>
        <p className="font-label mt-2 text-xs tracking-[0.25em] text-brass-soft">{COUPLE.hashtag}</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            onClick={async () => {
              setBusy(true);
              await downloadInvitationCard();
              setBusy(false);
            }}
            className="gold-btn rounded-full px-4 py-3 font-label text-[0.66rem] font-semibold uppercase tracking-[0.2em]"
          >
            {busy ? 'Preparing…' : 'Download Invitation'}
          </button>
          <button
            onClick={() => scrollToProgress(0, 5)}
            className="ghost-btn rounded-full px-4 py-3 font-label text-[0.66rem] uppercase tracking-[0.2em]"
          >
            Replay Journey
          </button>
        </div>
      </div>
    </Card>
  );
}

const CARDS: Record<SectionId, () => ReactNode> = {
  intro: IntroCard,
  events: EventsCard,
  venue: VenueCard,
  blessing: BlessingCard,
};

/* ───────────────────────── gate (doors closed) ───────────────────────── */

function Gate() {
  const phase = useTempleStore((s) => s.phase);
  const setPhase = useTempleStore((s) => s.setPhase);

  const enter = () => {
    if (phase !== 'gate') return;
    templeAudio.setMuted(useTempleStore.getState().muted);
    templeAudio.enterTemple();
    setPhase('opening');
    window.setTimeout(() => setPhase('inside'), 2600);
  };

  return (
    <AnimatePresence>
      {phase === 'gate' && (
        <motion.div
          key="gate"
          className="pointer-events-auto fixed inset-0 z-30 flex flex-col items-center justify-between px-6 py-10 md:py-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 1.6, delay: 0.4 } }}
          exit={{ opacity: 0, scale: 1.04, transition: { duration: 1.1 } }}
        >
          <div className="text-center">
            <p className="font-ml text-lg text-brass-soft" lang="ml">
              {BLESSING.malayalam}
            </p>
            <Label>The wedding of</Label>
            <h1 className="gold-text mt-2 font-display text-5xl font-semibold drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] md:text-7xl">
              {COUPLE.groom.name} <span className="italic text-kasavu/80">&amp;</span> {COUPLE.bride.name}
            </h1>
            <p className="font-label mt-3 text-sm tracking-[0.4em] text-kasavu/80">{WEDDING.shortDate}</p>
          </div>

          <button
            onClick={enter}
            className="seal group relative flex h-44 w-44 flex-col items-center justify-center rounded-full text-center md:h-52 md:w-52"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, #fff3c4 0%, #e9cf7a 22%, #d4af37 48%, #8a6414 85%, #5a3e08 100%)',
            }}
          >
            <span className="absolute inset-2 rounded-full border border-[#6b141a]/50" />
            <span className="absolute inset-4 rounded-full border border-dashed border-[#6b141a]/40" />
            <span className="font-ml text-3xl text-maroon">ॐ</span>
            <span className="font-label mt-1 px-6 text-[0.72rem] font-semibold uppercase leading-relaxed tracking-[0.18em] text-maroon-deep">
              Open Temple Doors
              <br />
              &amp; Enter
            </span>
          </button>

          <p className="font-label text-[0.65rem] uppercase tracking-[0.3em] text-kasavu/60">Best experienced with sound on</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───────────────────────── chrome: top bar, rail, hint ───────────────────────── */

function SoundToggle() {
  const muted = useTempleStore((s) => s.muted);
  const setMuted = useTempleStore((s) => s.setMuted);
  return (
    <button
      onClick={() => {
        setMuted(!muted);
        templeAudio.setMuted(!muted);
      }}
      aria-label={muted ? 'Unmute temple sounds' : 'Mute temple sounds'}
      className="ghost-btn flex h-11 w-11 items-center justify-center rounded-full bg-night/50 backdrop-blur"
    >
      {muted ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 9h4l5-4v14l-5-4H4z" />
          <path d="M17 9l5 6M22 9l-5 6" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 9h4l5-4v14l-5-4H4z" />
          <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" />
        </svg>
      )}
    </button>
  );
}

const RAIL: { id: SectionId; label: string }[] = [
  { id: 'intro', label: 'Deepasthambham' },
  { id: 'events', label: 'Kodimaram' },
  { id: 'venue', label: 'Mandapam' },
  { id: 'blessing', label: 'Sreekovil' },
];

function ProgressRail() {
  const fill = useRef<HTMLDivElement>(null);
  const section = useTempleStore((s) => s.section);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (fill.current) fill.current.style.transform = `scaleY(${scrollState.progress})`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <nav className="pointer-events-auto fixed right-5 top-1/2 z-20 hidden -translate-y-1/2 md:block" aria-label="Journey">
      <div className="relative h-[52vh] w-px bg-brass/25">
        <div ref={fill} className="absolute inset-0 origin-top bg-gradient-to-b from-brass-soft to-brass" style={{ transform: 'scaleY(0)' }} />
        <button
          onClick={() => scrollToProgress(0)}
          className="group absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
          aria-label="Temple Entrance"
        >
          <span
            className={`block h-3 w-3 rotate-45 border border-brass transition ${
              section === null ? 'bg-brass/70' : 'bg-night'
            }`}
          />
          <span className="font-label pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-[0.6rem] uppercase tracking-[0.25em] text-brass-soft opacity-0 transition group-hover:opacity-100">
            Gopuram
          </span>
        </button>
        {RAIL.map((r) => (
          <button
            key={r.id}
            onClick={() => scrollToProgress(MILESTONES[r.id])}
            className="group absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ top: `${MILESTONES[r.id] * 100}%` }}
            aria-label={r.label}
          >
            <span
              className={`block h-3 w-3 rotate-45 border border-brass transition ${
                section === r.id ? 'scale-125 bg-brass shadow-[0_0_12px_3px_rgba(255,190,80,0.7)]' : 'bg-night'
              }`}
            />
            <span className="font-label pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-[0.6rem] uppercase tracking-[0.25em] text-brass-soft opacity-0 transition group-hover:opacity-100">
              {r.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function ScrollHint() {
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const section = useTempleStore((s) => s.section);
  const setPhase = useTempleStore((s) => s.setPhase);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = scrollState.progress;
      setAtStart((prev) => {
        const next = p <= 0.03;
        return prev === next ? prev : next;
      });
      setAtEnd((prev) => {
        const next = p >= 0.86;
        return prev === next ? prev : next;
      });
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`pointer-events-auto fixed bottom-5 left-1/2 z-20 -translate-x-1/2 flex-col items-center ${
        section ? 'hidden md:flex' : 'flex'
      }`}
    >
      <AnimatePresence mode="wait">
        {atStart ? (
          <motion.div
            key="hint"
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.25 } }}
          >
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPhase('gate')}
                className="ghost-btn rounded-full bg-night/60 px-3.5 py-1.5 font-label text-[0.62rem] uppercase tracking-[0.22em] backdrop-blur"
              >
                ← Close Gate
              </button>
              <button
                type="button"
                onClick={() => scrollStepForward()}
                className="gold-btn rounded-full px-4 py-1.5 font-label text-[0.62rem] font-semibold uppercase tracking-[0.22em]"
              >
                Walk In →
              </button>
            </div>
            <p className="font-label text-[0.62rem] uppercase tracking-[0.35em] text-kasavu/80">or scroll to walk in</p>
          </motion.div>
        ) : (
          <motion.div
            key="nav"
            className="flex items-center gap-2 rounded-full border border-brass/40 bg-night/75 px-3 py-1.5 shadow-lg backdrop-blur-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35 } }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.2 } }}
          >
            <button
              type="button"
              onClick={() => scrollStepBack()}
              className="ghost-btn rounded-full px-3.5 py-1.5 font-label text-[0.62rem] uppercase tracking-[0.2em]"
            >
              ← Scroll Back
            </button>
            <button
              type="button"
              onClick={() => scrollToProgress(0, 3)}
              className="ghost-btn rounded-full px-3 py-1.5 font-label text-[0.62rem] uppercase tracking-[0.2em]"
              title="Return to Temple Entrance"
            >
              ↑ Entrance
            </button>
            {!atEnd && (
              <button
                type="button"
                onClick={() => scrollStepForward()}
                className="gold-btn rounded-full px-3.5 py-1.5 font-label text-[0.62rem] font-semibold uppercase tracking-[0.2em]"
              >
                Next →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── root ───────────────────────── */

export default function InvitationOverlays() {
  const phase = useTempleStore((s) => s.phase);
  const section = useTempleStore((s) => s.section);
  const inside = phase === 'inside';
  const Active = section ? CARDS[section] : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <Gate />

      <AnimatePresence>
        {(phase === 'gate' || phase === 'opening' || inside) && (
          <motion.header
            key="bar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 1.2 } }}
            className="pointer-events-auto fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-5 py-4 md:px-8"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => inside && scrollToProgress(0, 3)}
                className="font-display text-xl font-semibold tracking-wide"
                aria-label="Back to the temple gate"
              >
                <span className="gold-text">
                  {COUPLE.groom.name[0]}
                  <span className="mx-1 italic text-kasavu/70">&amp;</span>
                  {COUPLE.bride.name[0]}
                </span>
              </button>
              {inside && (
                <button
                  type="button"
                  onClick={() => scrollStepBack()}
                  className="ghost-btn rounded-full bg-night/55 px-3 py-1.5 font-label text-[0.6rem] uppercase tracking-[0.2em] backdrop-blur"
                >
                  ← Scroll Back
                </button>
              )}
            </div>
            <SoundToggle />
          </motion.header>
        )}
      </AnimatePresence>

      {inside && <ProgressRail />}
      {inside && <ScrollHint />}

      <AnimatePresence mode="wait">{inside && Active && <Active key={section} />}</AnimatePresence>
    </div>
  );
}
