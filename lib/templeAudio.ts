import { AUDIO } from '@/constants/weddingData';

/**
 * Fully synthesised temple soundscape (Web Audio API):
 *  • Brass temple bells — inharmonic additive partials + strike transient
 *  • Tanpura-style shruti drone (Sa–Pa plucks) in C♯
 *  • A Nadaswaram-like reed voice playing gentle Mohanam phrases with gamakas
 *  • A soft, distant evening "Om" chant (formant-filtered voices)
 *  • Procedural convolution reverb for the stone-hall ambience
 * Optionally plays a licensed track from AUDIO.ambientTrackUrl instead of the
 * synthesised music (bells are always synthesised).
 */

const SA = 138.59; // C#3

// Mohanam (S R2 G3 P D2) as just-intonation ratios, indexed by scale degree
const MOHANAM = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];
function degreeToRatio(d: number) {
  const n = MOHANAM.length;
  const oct = Math.floor(d / n);
  const idx = ((d % n) + n) % n;
  return MOHANAM[idx] * Math.pow(2, oct);
}

const PHRASES: [number, number][][] = [
  [[0, 1], [1, 1], [2, 2], [3, 1], [2, 1], [1, 1], [2, 1], [0, 3]],
  [[3, 1], [4, 1], [5, 2], [4, 1], [3, 1], [2, 2], [3, 1], [2, 1], [1, 1], [0, 3]],
  [[2, 1], [3, 1], [4, 1], [3, 1], [5, 2], [6, 1], [5, 1], [4, 1], [3, 1], [2, 3]],
  [[-1, 1], [0, 1], [1, 1], [2, 1], [1, 1], [0, 1], [-1, 1], [-2, 3]],
  [[5, 2], [4, 1], [3, 1], [4, 1], [3, 1], [2, 1], [1, 1], [2, 2], [0, 4]],
];

class TempleAudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private dry!: GainNode;
  private reverbSend!: GainNode;
  private musicBus!: GainNode;
  private timers: number[] = [];
  private nextPhraseAt = 0;
  private reed: { osc: OscillatorNode[]; gain: GainNode } | null = null;
  private trackEl: HTMLAudioElement | null = null;
  private muted = false;
  private ambienceOn = false;

  /** Must be called from a user gesture (click/tap). */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : AUDIO.volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);

    this.dry = ctx.createGain();
    this.dry.connect(this.master);

    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(3.8, 2.6);
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.55;
    this.reverbSend.connect(reverb).connect(this.master);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.dry);
    this.musicBus.connect(this.reverbSend);
  }

  private impulse(seconds: number, decay: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  private out(node: AudioNode, wet = 0.6) {
    const g = this.ctx!.createGain();
    g.gain.value = wet;
    node.connect(this.dry);
    node.connect(g).connect(this.reverbSend);
  }

  /** Temple bell: base frequency in Hz, strength 0–1. */
  ringBell(base = 392, strength = 1, when = 0) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const bus = ctx.createGain();
    bus.gain.value = 0.32 * strength;
    this.out(bus, 0.9);
    const partials: [number, number, number][] = [
      [0.5, 0.35, 7],
      [1, 1, 5.5],
      [1.19, 0.55, 4],
      [1.5, 0.35, 3.2],
      [2, 0.5, 3.5],
      [2.51, 0.25, 2.4],
      [2.66, 0.28, 2.2],
      [3.01, 0.18, 1.8],
      [4.16, 0.12, 1.2],
      [5.43, 0.08, 0.9],
    ];
    for (const [ratio, amp, dur] of partials) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = base * ratio * (1 + (Math.random() - 0.5) * 0.002);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (0.8 + strength * 0.4));
      // slow beating between the two halves of an imperfect bell
      const beat = ctx.createOscillator();
      beat.frequency.value = 1.2 + ratio * 0.4;
      const beatGain = ctx.createGain();
      beatGain.gain.value = 0.2;
      const trem = ctx.createGain();
      trem.gain.value = 0.8;
      beat.connect(beatGain).connect(trem.gain);
      o.connect(g).connect(trem).connect(bus);
      o.start(t);
      beat.start(t);
      o.stop(t + dur * 1.3);
      beat.stop(t + dur * 1.3);
    }
    // metallic strike transient
    const noise = ctx.createBufferSource();
    const nb = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
    noise.buffer = nb;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = base * 6;
    bp.Q.value = 2;
    const ng = ctx.createGain();
    ng.gain.value = 0.35 * strength;
    noise.connect(bp).connect(ng).connect(bus);
    noise.start(t);
  }

  /** Entrance: large bell rung twice, then the ambience swells in. */
  enterTemple() {
    this.init();
    this.ringBell(330, 1, 0.02);
    this.ringBell(330, 0.85, 1.25);
    this.ringBell(660, 0.4, 2.4);
    window.setTimeout(() => this.startAmbience(), 1400);
  }

  startAmbience() {
    const ctx = this.ctx;
    if (!ctx || this.ambienceOn) return;
    this.ambienceOn = true;
    this.musicBus.gain.setTargetAtTime(1, ctx.currentTime, 2.5);

    if (AUDIO.ambientTrackUrl) {
      const el = new Audio(AUDIO.ambientTrackUrl);
      el.loop = true;
      el.crossOrigin = 'anonymous';
      const src = ctx.createMediaElementSource(el);
      src.connect(this.musicBus);
      void el.play();
      this.trackEl = el;
    } else {
      this.startDrone();
      this.startReed();
      this.timers.push(window.setInterval(() => this.chantOm(), 24000));
      window.setTimeout(() => this.chantOm(), 6000);
    }
    // distant temple bells at irregular intervals
    const scheduleBell = () => {
      const delay = 7000 + Math.random() * 9000;
      this.timers.push(
        window.setTimeout(() => {
          const bases = [880, 1046, 1175, 784];
          this.ringBell(bases[Math.floor(Math.random() * bases.length)], 0.18 + Math.random() * 0.12);
          scheduleBell();
        }, delay),
      );
    };
    scheduleBell();
  }

  /* ── tanpura-style drone ── */
  private startDrone() {
    const ctx = this.ctx!;
    // continuous soft shruti box
    const shruti = ctx.createGain();
    shruti.gain.value = 0.045;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    shruti.connect(lp).connect(this.musicBus);
    for (const [r, det] of [
      [0.5, 0],
      [1, 3],
      [1.5, -4],
      [2, 2],
    ] as const) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = SA * r;
      o.detune.value = det;
      o.connect(shruti);
      o.start();
    }
    // plucked tanpura cycle: Pa – Sa' – Sa' – Sa
    const cycle = [1.5 / 2, 1, 1, 0.5];
    let i = 0;
    const pluck = () => {
      const t = ctx.currentTime + 0.05;
      const f = SA * cycle[i % cycle.length];
      i++;
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.Q.value = 6;
      filt.frequency.setValueAtTime(2600, t);
      filt.frequency.exponentialRampToValueAtTime(380, t + 2.8);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
      o.connect(filt).connect(g).connect(this.musicBus);
      o.start(t);
      o.stop(t + 4.3);
    };
    pluck();
    this.timers.push(window.setInterval(pluck, 950));
  }

  /* ── Nadaswaram-like reed ── */
  private startReed() {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1350;
    bp.Q.value = 0.9;
    const peak = ctx.createBiquadFilter();
    peak.type = 'peaking';
    peak.frequency.value = 2700;
    peak.gain.value = 6;
    peak.Q.value = 2;
    const pan = ctx.createStereoPanner();
    pan.pan.value = -0.15;
    gain.connect(bp).connect(peak).connect(pan).connect(this.musicBus);

    const vib = ctx.createOscillator();
    vib.frequency.value = 5.3;
    const vibDepth = ctx.createGain();
    vibDepth.gain.value = 9; // cents
    vib.connect(vibDepth);
    vib.start();

    const oscs = (['sawtooth', 'square'] as OscillatorType[]).map((type, k) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = SA * 2;
      o.detune.value = k ? 4 : 0;
      vibDepth.connect(o.detune);
      const g = ctx.createGain();
      g.gain.value = k ? 0.35 : 0.65;
      o.connect(g).connect(gain);
      o.start();
      return o;
    });
    this.reed = { osc: oscs, gain };
    this.nextPhraseAt = ctx.currentTime + 2.5;
    const tick = () => this.scheduleReed();
    tick();
    this.timers.push(window.setInterval(tick, 250));
  }

  private scheduleReed() {
    const ctx = this.ctx;
    if (!ctx || !this.reed) return;
    if (this.nextPhraseAt > ctx.currentTime + 1.2) return;
    const beat = 0.46;
    const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    let t = Math.max(this.nextPhraseAt, ctx.currentTime + 0.05);
    const { osc, gain } = this.reed;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setTargetAtTime(0.085, t, 0.08);
    for (const [deg, beats] of phrase) {
      const f = SA * 2 * degreeToRatio(deg);
      for (const o of osc) {
        // gamaka: approach each note from slightly below
        o.frequency.setTargetAtTime(f * 0.982, t, 0.01);
        o.frequency.setTargetAtTime(f, t + 0.05, 0.035);
      }
      // gentle swell inside each note
      gain.gain.setTargetAtTime(0.07, t, 0.05);
      gain.gain.setTargetAtTime(0.09, t + beat * beats * 0.4, 0.15);
      t += beat * beats;
    }
    gain.gain.setTargetAtTime(0, t - 0.1, 0.25);
    this.nextPhraseAt = t + 2.2 + Math.random() * 3.5;
  }

  /* ── distant evening chant: "Om" ── */
  private chantOm() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + 0.1;
    const dur = 5.5;
    const voice = ctx.createGain();
    voice.gain.setValueAtTime(0.0001, t);
    voice.gain.exponentialRampToValueAtTime(0.09, t + 0.8);
    voice.gain.setValueAtTime(0.09, t + dur * 0.55);
    voice.gain.exponentialRampToValueAtTime(0.05, t + dur * 0.75);
    voice.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.value = 450;
    f1.Q.value = 5;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.value = 800;
    f2.Q.value = 6;
    const closing = ctx.createBiquadFilter();
    closing.type = 'lowpass';
    closing.frequency.setValueAtTime(3000, t);
    closing.frequency.setValueAtTime(3000, t + dur * 0.55);
    closing.frequency.exponentialRampToValueAtTime(260, t + dur * 0.72); // "o" → "mmm"
    const mix = ctx.createGain();
    f1.connect(mix);
    f2.connect(mix);
    mix.connect(closing).connect(voice);
    this.out(voice, 1.1);
    for (const det of [-9, 0, 7]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = SA;
      o.detune.value = det;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 4.6 + Math.random();
      const lg = ctx.createGain();
      lg.gain.value = 6;
      lfo.connect(lg).connect(o.detune);
      o.connect(f1);
      o.connect(f2);
      o.start(t);
      lfo.start(t);
      o.stop(t + dur + 0.2);
      lfo.stop(t + dur + 0.2);
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : AUDIO.volume, this.ctx.currentTime, 0.25);
      if (this.trackEl) this.trackEl.muted = m;
    }
  }

  dispose() {
    this.timers.forEach((t) => {
      clearInterval(t);
      clearTimeout(t);
    });
    this.timers = [];
    this.trackEl?.pause();
    void this.ctx?.close();
    this.ctx = null;
    this.reed = null;
    this.ambienceOn = false;
  }
}

export const templeAudio = new TempleAudioEngine();
