import type { GameSettings } from "../systems/settings";
import { DEFAULT_SETTINGS } from "../systems/settings";

const MIDI = (n: number) => 440 * 2 ** ((n - 69) / 12);

type ChordDef = { root: number; tones: number[] };

const CMAJ7: ChordDef = { root: 48, tones: [0, 4, 7, 11] };
const AM7: ChordDef = { root: 45, tones: [0, 3, 7, 10] };
const FMAJ7: ChordDef = { root: 41, tones: [0, 4, 7, 11] };
const G7: ChordDef = { root: 43, tones: [0, 4, 7, 10] };
const DM7: ChordDef = { root: 50, tones: [0, 3, 7, 10] };
const EM7: ChordDef = { root: 52, tones: [0, 3, 7, 10] };
const FM7: ChordDef = { root: 53, tones: [0, 3, 7, 10] };
const E7: ChordDef = { root: 52, tones: [0, 4, 7, 10] };
const D7: ChordDef = { root: 50, tones: [0, 4, 7, 10] };
const GMAJ7: ChordDef = { root: 55, tones: [0, 4, 7, 11] };
const BBMAJ7: ChordDef = { root: 58, tones: [0, 4, 7, 11] };

/** 32-bar corporate loop (~84s) — square bass, triangle pads, evolving melody. */
class CorporateMusic {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private running = false;
  private step = 0;
  private nextTime = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  private readonly bpm = 92;
  private readonly beat = 60 / this.bpm;
  private readonly stepsPerBar = 4;
  private readonly bars = 32;
  private readonly totalSteps = this.bars * this.stepsPerBar;

  /** Four 8-bar phrases — longer progression before repeat. */
  private readonly progression: readonly ChordDef[] = [
    CMAJ7, AM7, FMAJ7, G7, CMAJ7, AM7, DM7, G7,
    CMAJ7, EM7, AM7, AM7, FMAJ7, FM7, CMAJ7, G7,
    DM7, G7, EM7, AM7, DM7, G7, CMAJ7, GMAJ7,
    FMAJ7, DM7, BBMAJ7, G7, EM7, E7, AM7, D7,
    AM7, DM7, G7, CMAJ7, FMAJ7, FMAJ7, EM7, AM7,
    DM7, G7, CMAJ7, CMAJ7, AM7, AM7, FMAJ7, G7,
    CMAJ7, AM7, DM7, G7, EM7, AM7, FMAJ7, G7,
    CMAJ7, EM7, AM7, D7, DM7, G7, CMAJ7, G7,
  ];

  /** Melody per beat; -1 = rest. Four contrasting 8-bar phrases. */
  private readonly melody: readonly number[] = [
    72, 74, 76, 74, 72, 71, 69, -1, 67, 69, 71, 72, 74, 76, 77, 76,
    74, 72, 71, 69, 67, 65, -1, -1, 65, 67, 69, 71, 72, 74, 72, 71,
    69, 71, 72, 74, 76, 77, 79, 77, 76, 74, 72, -1, 71, 69, 67, 65,
    64, 65, 67, 69, 71, 72, 74, 76, 74, 72, 71, 69, 67, 65, 64, -1,
    -1, 67, 69, 71, 72, 74, 76, 74, 72, 71, 69, 67, -1, -1, -1, -1,
    65, 67, 69, 71, 72, 74, 76, 77, 76, 74, 72, 71, 69, 67, 65, 64,
    72, 71, 69, 67, 65, 67, 69, 71, 72, 74, 76, 77, 79, 77, 76, 74,
    72, 74, 76, 74, 72, 71, 69, 67, 65, 67, 69, 71, 72, 71, 69, 67,
    65, 64, 65, 67, 69, 71, 72, 74, 76, 74, 72, 71, 69, 67, 65, -1,
    -1, 69, 71, 72, 74, 72, 71, 69, 67, 65, 64, 65, 67, 69, 71, 72,
    74, 76, 77, 76, 74, 72, 71, 69, 67, 69, 71, 72, 74, 76, 77, 79,
    77, 76, 74, 72, 71, 69, 67, 65, 64, 65, 67, 69, 71, 72, 74, 72,
    71, 69, 67, 65, 67, 69, 71, 72, 74, 76, 74, 72, 71, 69, 67, 65,
  ];

  /** Counter-melody on select beats in the second half of the loop. */
  private readonly counter: readonly number[] = [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, 60, -1, 62, -1, 64, -1, 65, -1, 67, -1, 69, -1, 71, -1,
    -1, 60, -1, 62, -1, 64, -1, 65, -1, 67, -1, 69, -1, 71, -1, 72,
    -1, -1, 55, -1, 57, -1, 59, -1, 60, -1, 62, -1, 64, -1, 65, -1,
    -1, 55, -1, 57, -1, 59, -1, 60, -1, 62, -1, 64, -1, 65, -1, 67,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  ];

  attach(ctx: AudioContext, musicGain: GainNode): void {
    this.ctx = ctx;
    this.musicGain = musicGain;
  }

  start(): void {
    if (!this.ctx || !this.musicGain || this.running) return;
    this.running = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.tick(), 25);
  }

  stop(): void {
    this.running = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    const ctx = this.ctx;
    const dest = this.musicGain;
    if (!ctx || !dest || !this.running) return;

    const horizon = ctx.currentTime + 0.35;
    while (this.nextTime < horizon) {
      this.scheduleStep(this.step, this.nextTime);
      this.step = (this.step + 1) % this.totalSteps;
      this.nextTime += this.beat;
    }
  }

  private scheduleStep(step: number, time: number): void {
    const ctx = this.ctx;
    const dest = this.musicGain;
    if (!ctx || !dest) return;

    const bar = Math.floor(step / this.stepsPerBar);
    const beatInBar = step % this.stepsPerBar;
    const chord = this.progression[bar % this.progression.length];
    const section = Math.floor(bar / 8);

    const bassStyle = section % 2;
    if (beatInBar === 0) {
      this.playNote(ctx, dest, MIDI(chord.root), time, this.beat * 1.85, "square", 0.044);
    } else if (bassStyle === 0 && beatInBar === 2) {
      this.playNote(ctx, dest, MIDI(chord.root + 12), time, this.beat * 0.85, "square", 0.026);
    } else if (bassStyle === 1 && (beatInBar === 1 || beatInBar === 3)) {
      const walk = chord.tones[beatInBar === 1 ? 1 : 2] ?? 0;
      this.playNote(ctx, dest, MIDI(chord.root + walk), time, this.beat * 0.55, "square", 0.02);
    }

    const sparse = section === 3;
    const arpGain = sparse ? 0.014 : 0.02;
    if (!sparse || beatInBar % 2 === 0) {
      const arpNote = chord.tones[(step + beatInBar) % chord.tones.length];
      this.playNote(
        ctx,
        dest,
        MIDI(chord.root + 12 + arpNote),
        time,
        this.beat * 0.68,
        "triangle",
        arpGain,
      );
    }

    if (beatInBar === 0 || (!sparse && beatInBar === 2)) {
      const padGain = sparse ? 0.008 : 0.011;
      for (const tone of chord.tones) {
        this.playNote(
          ctx,
          dest,
          MIDI(chord.root + 12 + tone),
          time,
          this.beat * 2.4,
          "triangle",
          padGain,
        );
      }
    }

    const mel = this.melody[step % this.melody.length];
    if (mel >= 0 && (beatInBar === 1 || beatInBar === 3 || (section === 2 && beatInBar === 0))) {
      this.playNote(ctx, dest, MIDI(mel), time, this.beat * 0.82, "square", 0.017);
    }

    const counter = this.counter[step % this.counter.length];
    if (counter >= 0 && beatInBar === 2) {
      this.playNote(ctx, dest, MIDI(counter), time, this.beat * 0.5, "triangle", 0.012);
    }

    if (section >= 2 && beatInBar === 3 && step % 2 === 0) {
      this.playNote(ctx, dest, 1800, time, 0.04, "square", 0.004);
    }
  }

  private playNote(
    ctx: AudioContext,
    dest: GainNode,
    freq: number,
    time: number,
    duration: number,
    type: OscillatorType,
    gain: number,
  ): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + duration);
  }
}

/** Simple Web Audio bleeps — no external assets. */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private enabled = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private readonly music = new CorporateMusic();
  private settings: GameSettings = { ...DEFAULT_SETTINGS };

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.music.attach(this.ctx, this.musicGain);
      this.applySettings(this.settings);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** Call once when the player starts a run (user gesture). */
  unlock(): void {
    this.enabled = true;
    this.ensure();
    this.syncMusic();
  }

  applySettings(settings: GameSettings): void {
    this.settings = settings;
    if (!this.sfxGain || !this.musicGain) return;
    this.sfxGain.gain.value = settings.sfxVolume;
    this.musicGain.gain.value = settings.musicEnabled ? settings.musicVolume : 0;
    this.syncMusic();
  }

  private syncMusic(): void {
    if (!this.enabled || !this.settings.musicEnabled) {
      this.music.stop();
      return;
    }
    this.ensure();
    this.music.start();
  }

  stopMusic(): void {
    this.music.stop();
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = "square",
    gain = 0.08,
  ): void {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain) return;
    if (this.settings.sfxVolume <= 0) return;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  }

  spray(): void {
    this.tone(220, 0.08, "sawtooth", 0.04);
    setTimeout(() => this.tone(180, 0.06, "sawtooth", 0.03), 40);
  }

  extinguish(): void {
    this.tone(520, 0.1, "square", 0.07);
    this.tone(780, 0.12, "square", 0.05);
  }

  scoreGain(): void {
    this.tone(660, 0.06, "triangle", 0.06);
  }

  powerUp(): void {
    this.tone(440, 0.08, "triangle", 0.07);
    setTimeout(() => this.tone(880, 0.15, "triangle", 0.06), 80);
  }

  reloadDone(): void {
    this.tone(330, 0.1, "square", 0.06);
    this.tone(495, 0.12, "square", 0.05);
  }

  ignite(): void {
    this.tone(120, 0.15, "sawtooth", 0.05);
  }

  gameOver(): void {
    this.tone(80, 0.4, "sawtooth", 0.1);
    setTimeout(() => this.tone(55, 0.5, "sawtooth", 0.08), 200);
  }

  explosionHit(): void {
    this.tone(60, 0.25, "sawtooth", 0.12);
  }
}

export const gameAudio = new GameAudio();
