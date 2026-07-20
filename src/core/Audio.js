// A tiny procedural sound engine built on the Web Audio API.
//
// Every sound is synthesized from oscillators and noise at runtime —
// there are no audio files, copyrighted or otherwise. A single shared
// `audio` instance is imported wherever a sound is needed:
//
//   import { audio } from '../core/Audio.js';
//   audio.play('shoot');
//
// The mute setting persists in localStorage. Browsers block audio
// until the first user gesture, so the context is created (and
// resumed) on the first click or key press.

const MUTE_KEY = 'swarmSurvivorsMuted';
const MASTER_VOLUME = 0.35; // keep the whole game comfortably quiet
const MAX_VOICES = 14; // hard cap so a big wave can't stack a wall of sound

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.activeVoices = 0;

    // Per-sound throttle: name -> last time it played (ms).
    this.lastPlayed = new Map();

    // Load the saved mute preference.
    let saved = null;
    try {
      saved = localStorage.getItem(MUTE_KEY);
    } catch {
      // localStorage unavailable — default to on.
    }
    this.muted = saved === 'true';

    // Create/resume the context on the first user gesture.
    const unlock = () => this.ensureContext();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  /** Lazily create the AudioContext and resume it (needs a gesture). */
  ensureContext() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return; // very old browser: no sound, game still runs
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : MASTER_VOLUME;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) {
      this.master.gain.value = muted ? 0 : MASTER_VOLUME;
    }
    try {
      localStorage.setItem(MUTE_KEY, String(muted));
    } catch {
      // No persistence available — the setting still applies this session.
    }
  }

  /**
   * Play a named sound. Silently does nothing while muted, before the
   * first gesture, or when the same sound fired too recently (which
   * keeps hundreds of enemy hits from becoming noise).
   */
  play(name) {
    if (this.muted || !this.ctx || this.activeVoices >= MAX_VOICES) return;

    const def = SOUNDS[name];
    if (!def) return;

    const now = performance.now();
    const last = this.lastPlayed.get(name) || 0;
    if (now - last < (def.throttle ?? 0)) return;
    this.lastPlayed.set(name, now);

    def.play(this);
  }

  // --- Low-level synth helpers -------------------------------------------

  /** One enveloped oscillator note. Returns nothing; self-cleans. */
  tone({ type = 'sine', freq = 440, endFreq = null, duration = 0.15, gain = 0.5, delay = 0 }) {
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + duration);
    }

    // Quick attack, smooth decay to silence.
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(env);
    env.connect(this.master);

    this.activeVoices += 1;
    osc.onended = () => {
      this.activeVoices -= 1;
      env.disconnect();
    };
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  /** A burst of filtered white noise — impacts, whooshes, deaths. */
  noise({ duration = 0.2, gain = 0.4, filterFreq = 1200, filterType = 'lowpass', delay = 0 }) {
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;

    const frames = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;

    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, start);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    src.connect(filter);
    filter.connect(env);
    env.connect(this.master);

    this.activeVoices += 1;
    src.onended = () => {
      this.activeVoices -= 1;
      env.disconnect();
    };
    src.start(start);
    src.stop(start + duration + 0.02);
  }
}

// --- The sound library ----------------------------------------------------
// Each sound is a tiny recipe. `throttle` (ms) rate-limits repeats.

const SOUNDS = {
  shoot: {
    throttle: 45,
    play: (a) => a.tone({ type: 'square', freq: 720, endFreq: 340, duration: 0.09, gain: 0.16 }),
  },
  enemyHit: {
    throttle: 30,
    play: (a) => a.noise({ duration: 0.05, gain: 0.12, filterFreq: 2600, filterType: 'bandpass' }),
  },
  enemyDeath: {
    throttle: 35,
    play: (a) => {
      a.noise({ duration: 0.16, gain: 0.22, filterFreq: 900 });
      a.tone({ type: 'triangle', freq: 300, endFreq: 90, duration: 0.16, gain: 0.14 });
    },
  },
  xpPickup: {
    throttle: 40,
    play: (a) => a.tone({ type: 'sine', freq: 620, endFreq: 990, duration: 0.08, gain: 0.12 }),
  },
  coin: {
    throttle: 40,
    play: (a) => {
      a.tone({ type: 'square', freq: 988, duration: 0.05, gain: 0.1 });
      a.tone({ type: 'square', freq: 1319, duration: 0.08, gain: 0.1, delay: 0.05 });
    },
  },
  levelUp: {
    play: (a) => {
      [523, 659, 784, 1047].forEach((f, i) =>
        a.tone({ type: 'square', freq: f, duration: 0.14, gain: 0.14, delay: i * 0.08 })
      );
    },
  },
  chestOpen: {
    play: (a) => {
      [659, 880, 1175].forEach((f, i) =>
        a.tone({ type: 'triangle', freq: f, duration: 0.22, gain: 0.16, delay: i * 0.1 })
      );
    },
  },
  evolve: {
    play: (a) => {
      // Rising sweep plus a bright chord — the big reward.
      a.tone({ type: 'sawtooth', freq: 200, endFreq: 900, duration: 0.5, gain: 0.14 });
      [784, 988, 1319].forEach((f) =>
        a.tone({ type: 'triangle', freq: f, duration: 0.6, gain: 0.12, delay: 0.28 })
      );
    },
  },
  playerDamage: {
    throttle: 120,
    play: (a) => {
      a.tone({ type: 'sawtooth', freq: 180, endFreq: 70, duration: 0.22, gain: 0.22 });
      a.noise({ duration: 0.12, gain: 0.14, filterFreq: 500 });
    },
  },
  gameOver: {
    play: (a) => {
      [392, 330, 262, 196].forEach((f, i) =>
        a.tone({ type: 'triangle', freq: f, duration: 0.4, gain: 0.18, delay: i * 0.18 })
      );
    },
  },
};

export const audio = new AudioEngine();
