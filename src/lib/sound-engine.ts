// src/lib/sound-engine.ts
'use client';

class ForgeSoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Subtle tactile blip when starting the timer or toggling Challenge Mode
   */
  playTactileClick(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  }

  /**
   * Harmonic ascending chime when the 120-second Micro-Start threshold clears
   * Notes: C5 -> E5 -> G5 -> B5 -> D6 (Warm Major 9th arpeggio)
   */
  playMicroClearedChime(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startTime = now + idx * 0.09;
      const duration = 0.65;

      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.16, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });

    // Mobile haptic pulse pattern
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 50, 140]);
    }
  }

  /**
   * Rich completion chord when banking Identity Points & finishing a session
   */
  playSessionCompleteFanfare(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const chord = [440, 554.37, 659.25, 880]; // A Major warm triad
    const now = ctx.currentTime;

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startTime = now + idx * 0.05;
      const duration = 0.85;

      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([60, 40, 60, 40, 180]);
    }
  }

  /**
   * Calming descending chime when a Pomodoro work block finishes and Break begins
   */
  playBreakStartChime(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [880, 659.25, 523.25, 440]; // Descending A5 -> E5 -> C5 -> A4
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startTime = now + idx * 0.11;
      const duration = 0.7;

      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.14, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 60, 100]);
    }
  }

  /**
   * Energizing double-pulse chime when Break ends and the next Pomodoro starts
   */
  playBreakOverChime(enabled = true) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [587.33, 880, 1174.66]; // D5 -> A5 -> D6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startTime = now + idx * 0.08;
      const duration = 0.5;

      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([70, 40, 120]);
    }
  }
}

export const soundEngine = new ForgeSoundEngine();
