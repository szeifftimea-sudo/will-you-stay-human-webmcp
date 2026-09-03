export type RitualSoundCue =
  | "futura-call"
  | "futura-question"
  | "cards-dealt"
  | "selection"
  | "counterpoint"
  | "retention"
  | "confirmation"
  | "consequence"
  | "balance"
  | "unmute";

export type RitualSoundDetail = {
  changedBalanceAxes?: number[];
};

export interface RitualSoundPort {
  play(cue: RitualSoundCue, detail?: RitualSoundDetail): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}

type AudioContextConstructor = new () => AudioContext;

type Tone = {
  offset: number;
  duration: number;
  from: number;
  to?: number;
  gain?: number;
  type?: OscillatorType;
};

const EPSILON = 0.0001;

class BrowserRitualSoundPort implements RitualSoundPort {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private sources = new Set<OscillatorNode>();
  private muted = false;

  play(cue: RitualSoundCue, detail: RitualSoundDetail = {}): void {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context || !this.master) return;

    void context.resume();
    const start = context.currentTime + 0.02;

    switch (cue) {
      case "futura-call":
        this.playFuturaCall(start);
        break;
      case "futura-question":
        this.playFuturaQuestion(start);
        break;
      case "cards-dealt":
        this.playCardsDealt(start);
        break;
      case "selection":
        this.playTones(start, [
          { offset: 0, duration: 0.18, from: 210, to: 315, gain: 0.026, type: "triangle" },
          { offset: 0.03, duration: 0.22, from: 630, to: 790, gain: 0.012 },
        ]);
        break;
      case "counterpoint":
        this.playTones(start, [
          { offset: 0, duration: 0.34, from: 420, to: 165, gain: 0.04, type: "sawtooth" },
          { offset: 0.14, duration: 0.3, from: 265, to: 205, gain: 0.03, type: "triangle" },
        ]);
        break;
      case "retention":
        this.playTones(start, [
          { offset: 0, duration: 0.17, from: 185, to: 148, gain: 0.06, type: "triangle" },
          { offset: 0.13, duration: 0.2, from: 370, to: 296, gain: 0.025 },
        ]);
        break;
      case "confirmation":
        this.playTones(start, [
          { offset: 0, duration: 0.16, from: 160, to: 132, gain: 0.03, type: "triangle" },
          { offset: 0.12, duration: 0.34, from: 264, to: 264, gain: 0.018, type: "sine" },
          { offset: 0.2, duration: 0.28, from: 528, to: 528, gain: 0.009, type: "sine" },
        ]);
        break;
      case "consequence":
        this.playTones(start, [
          { offset: 0, duration: 1.15, from: 92, to: 246, gain: 0.055, type: "sine" },
          { offset: 0.32, duration: 0.84, from: 184, to: 492, gain: 0.035, type: "triangle" },
          { offset: 0.78, duration: 0.5, from: 738, to: 984, gain: 0.022, type: "sine" },
        ]);
        break;
      case "balance":
        this.playBalance(start, detail.changedBalanceAxes ?? []);
        break;
      case "unmute":
        this.playTones(start, [
          { offset: 0, duration: 0.13, from: 440, to: 520, gain: 0.025 },
          { offset: 0.12, duration: 0.2, from: 660, to: 780, gain: 0.025 },
        ]);
        break;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.context || !this.master) return;

    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(muted ? 0 : 0.9, now);
    if (muted) this.cancelScheduledSources();
  }

  dispose(): void {
    this.cancelScheduledSources();
    const context = this.context;
    this.context = null;
    this.master = null;
    if (context && context.state !== "closed") void context.close();
  }

  private ensureContext(): AudioContext | null {
    if (this.context && this.context.state !== "closed") return this.context;
    if (typeof window === "undefined") return null;

    const browserWindow = window as typeof window & {
      webkitAudioContext?: AudioContextConstructor;
    };
    const AudioContextClass = window.AudioContext ?? browserWindow.webkitAudioContext;
    if (!AudioContextClass) return null;

    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.value = this.muted ? 0 : 0.9;
    master.connect(context.destination);
    this.context = context;
    this.master = master;
    return context;
  }

  private playFuturaCall(start: number): void {
    const rings: Tone[] = [];
    for (const offset of [0, 0.52, 1.04]) {
      rings.push(
        { offset, duration: 0.28, from: 196, to: 220, gain: 0.012, type: "sine" },
        { offset: offset + 0.06, duration: 0.22, from: 392, to: 494, gain: 0.014, type: "triangle" },
        { offset: offset + 0.16, duration: 0.18, from: 784, to: 740, gain: 0.006, type: "sine" },
      );
    }

    // The repeated call resolves into the same three-part Machine City signature
    // used by the question cue, so the ring stopping and the connection are audible
    // as one restrained event rather than two unrelated interface sounds.
    this.playTones(start, [
      ...rings,
      { offset: 1.56, duration: 0.52, from: 196, to: 247, gain: 0.018, type: "sine" },
      { offset: 1.62, duration: 0.46, from: 392, to: 494, gain: 0.016, type: "triangle" },
      { offset: 1.84, duration: 0.44, from: 784, to: 659, gain: 0.008, type: "sine" },
    ]);
  }

  private playFuturaQuestion(start: number): void {
    this.playTones(start, [
      { offset: 0, duration: 0.38, from: 196, to: 247, gain: 0.017, type: "sine" },
      { offset: 0.06, duration: 0.32, from: 392, to: 494, gain: 0.015, type: "triangle" },
      { offset: 0.18, duration: 0.3, from: 784, to: 659, gain: 0.008, type: "sine" },
      { offset: 0.42, duration: 0.28, from: 294, to: 330, gain: 0.01, type: "sine" },
    ]);
  }

  private playCardsDealt(start: number): void {
    this.playTones(start, [
      { offset: 0.3, duration: 0.16, from: 294, to: 392, gain: 0.018, type: "triangle" },
      { offset: 0.45, duration: 0.16, from: 330, to: 440, gain: 0.018, type: "triangle" },
      { offset: 0.6, duration: 0.2, from: 392, to: 523, gain: 0.02, type: "triangle" },
    ]);
  }

  private playBalance(start: number, changedAxes: number[]): void {
    this.playTones(start, [
      { offset: 0, duration: 0.75, from: 78, to: 118, gain: 0.055, type: "triangle" },
      { offset: 0.55, duration: 0.42, from: 236, to: 314, gain: 0.022 },
      ...changedAxes.map<Tone>((axisIndex) => ({
        offset: 3 + axisIndex * 0.21,
        duration: 0.11,
        from: 640 + axisIndex * 38,
        to: 520 + axisIndex * 30,
        gain: 0.04,
        type: "square",
      })),
    ]);
  }

  private playTones(start: number, tones: Tone[]): void {
    for (const tone of tones) this.scheduleTone(start, tone);
  }

  private scheduleTone(start: number, tone: Tone): void {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const beginsAt = start + tone.offset;
    const endsAt = beginsAt + tone.duration;
    const peakAt = beginsAt + Math.min(0.025, tone.duration * 0.22);

    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.setValueAtTime(tone.from, beginsAt);
    oscillator.frequency.exponentialRampToValueAtTime(tone.to ?? tone.from, endsAt);
    envelope.gain.setValueAtTime(EPSILON, beginsAt);
    envelope.gain.exponentialRampToValueAtTime(tone.gain ?? 0.03, peakAt);
    envelope.gain.exponentialRampToValueAtTime(EPSILON, endsAt);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.addEventListener("ended", () => this.sources.delete(oscillator), { once: true });
    this.sources.add(oscillator);
    oscillator.start(beginsAt);
    oscillator.stop(endsAt + 0.02);
  }

  private cancelScheduledSources(): void {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // The source may already have ended between scheduling and cancellation.
      }
    }
    this.sources.clear();
  }
}

export function createRitualSoundPort(): RitualSoundPort {
  return new BrowserRitualSoundPort();
}
