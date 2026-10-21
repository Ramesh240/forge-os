// generate_audio_30s.js
// Generates a 30-second Dark Synthwave / Aggressive Phonk electronic soundtrack
// with a massive riser and drop at 0:13, cyber quest SFX, and game UI impacts.

const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const duration = 30.0; // 30 seconds
const totalSamples = Math.floor(sampleRate * duration);
const buffer = Buffer.alloc(44 + totalSamples * 2); // 16-bit PCM Mono

// 1. WAV Header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + totalSamples * 2, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
buffer.writeUInt32LE(sampleRate, 24); // SampleRate
buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
buffer.writeUInt16LE(2, 32);  // BlockAlign
buffer.writeUInt16LE(16, 34); // BitsPerSample
buffer.write('data', 36);
buffer.writeUInt32LE(totalSamples * 2, 40);

const bpm = 132;
const beatSec = 60 / bpm; // ~0.4545s
const sixteenth = beatSec / 4;

// Phonk Cowbell / Synth frequencies (in Hz)
const melodyNotes = [
  523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33,
  523.25, 440.0,  523.25, 659.25, 783.99, 880.0, 1046.5, 880.0
];

// Major impact transition timestamps
const impacts = [
  { t: 0.1, power: 0.85, pitch: 42 },   // Opening System Alert impact
  { t: 3.2, power: 0.70, pitch: 48 },   // Desk / Awakening reveal
  { t: 6.0, power: 0.80, pitch: 45 },   // Identity Selection
  { t: 8.5, power: 0.65, pitch: 55 },   // Habit Chain Link 1
  { t: 10.8, power: 0.70, pitch: 60 },  // Habit Chain Link 2
  { t: 13.0, power: 1.00, pitch: 36 },  // *** THE MASSIVE 0:13 DROP ***
  { t: 17.5, power: 0.60, pitch: 50 },  // Shield Activate
  { t: 22.0, power: 0.90, pitch: 40 },  // Final Dashboard Reveal
  { t: 26.5, power: 0.75, pitch: 58 },  // Golden Promo Code Flare
];

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  let sample = 0;

  // ── A. SCENE IMPACTS & SUB DROPS ──────────────────────────────────────────
  for (const imp of impacts) {
    if (t >= imp.t && t < imp.t + 2.5) {
      const dt = t - imp.t;
      const decay = Math.exp(-dt * 3.8);
      const freq = imp.pitch * Math.exp(-dt * 14) + 32;
      const sub = Math.sin(2 * Math.PI * freq * dt) * decay * imp.power * 0.75;
      const attackNoise = (Math.random() * 2 - 1) * Math.exp(-dt * 35) * imp.power * 0.35;
      sample += sub + attackNoise;
    }
  }

  // ── B. SOLO LEVELING HOLOGRAPHIC QUEST ALERTS (0.0s - 5.5s) ───────────────
  if (t < 5.5) {
    // Holographic digital shimmer (twin sine waves pulsing)
    const shimmer = (Math.sin(2 * Math.PI * 880 * t) + Math.sin(2 * Math.PI * 1320 * t)) * 0.08;
    // Ambient sci-fi drone
    const drone = Math.sin(2 * Math.PI * 55 * t + Math.sin(2 * Math.PI * 0.5 * t)) * 0.22;
    // System alert beep pulse at 0.4s and 0.8s
    let beep = 0;
    if ((t >= 0.3 && t < 0.45) || (t >= 0.7 && t < 0.85)) {
      const dt = t % 0.4;
      beep = Math.sin(2 * Math.PI * 1760 * dt) * Math.exp(-dt * 18) * 0.25;
    }
    sample += (shimmer + drone + beep) * (1 - Math.min(1, Math.max(0, (t - 4.5) / 1.0)));
  }

  // ── C. RISER & BUILD-UP TOWARDS 0:13 (10.0s - 13.0s) ───────────────────────
  if (t >= 9.5 && t < 13.0) {
    const riseProgress = (t - 9.5) / 3.5; // 0 to 1
    // Pitch sweeps from 100Hz to 1200Hz
    const sweepFreq = 100 + Math.pow(riseProgress, 2.5) * 1100;
    const sweep = Math.sin(2 * Math.PI * sweepFreq * t) * (riseProgress * 0.35);
    // Accelerating snare roll / riser clicks
    const rollRate = 8 + Math.floor(riseProgress * 24);
    const click = (Math.random() * 2 - 1) * Math.exp(-((t * rollRate) % 1) * 30) * riseProgress * 0.25;
    sample += sweep + click;
  }

  // ── D. AGGRESSIVE PHONK DRUMS & 808 BASS (6.0s - 29.5s) ────────────────────
  if (t >= 6.0 && t < 29.5) {
    const isPostDrop = t >= 13.0;
    const beatPos = ((t - 6.0) % beatSec);
    const beatIndex = Math.floor((t - 6.0) / beatSec);

    // 1. Kick Drum (Punchy Phonk 808 kick on beats)
    const kickHit = (beatIndex % 2 === 0) || (isPostDrop && beatIndex % 4 === 3);
    if (kickHit && beatPos < 0.22) {
      const kDecay = Math.exp(-beatPos * 20);
      const kFreq = 48 + 120 * Math.exp(-beatPos * 45);
      const kick = Math.sin(2 * Math.PI * kFreq * beatPos) * kDecay * (isPostDrop ? 0.65 : 0.45);
      sample += kick;
    }

    // 2. Snare / Phonk Clap (on every alternate beat)
    const snareHit = (beatIndex % 2 === 1);
    if (snareHit && beatPos < 0.2) {
      const sDecay = Math.exp(-beatPos * 25);
      const sNoise = (Math.random() * 2 - 1) * sDecay * (isPostDrop ? 0.38 : 0.25);
      const sTone = Math.sin(2 * Math.PI * 220 * beatPos) * sDecay * 0.2;
      sample += sNoise + sTone;
    }

    // 3. Phonk Cowbell / High Energy Synth Lead
    if (isPostDrop || t >= 7.0) {
      const noteIdx = Math.floor(t / sixteenth) % melodyNotes.length;
      const noteFreq = melodyNotes[noteIdx];
      const notePos = (t % sixteenth) / sixteenth;
      const noteEnv = Math.exp(-notePos * 9);
      // Cowbell square/triangle harmonic timbre
      const cowbell = (Math.sin(2 * Math.PI * noteFreq * t) +
                       0.5 * Math.sin(2 * Math.PI * noteFreq * 1.5 * t) +
                       0.25 * Math.sin(2 * Math.PI * noteFreq * 2.0 * t)) * noteEnv * (isPostDrop ? 0.24 : 0.16);
      sample += cowbell;
    }

    // 4. Heavy Distorted Phonk 808 Sub-Bass (Active especially post-drop!)
    if (isPostDrop || (t >= 6.0 && t < 9.5)) {
      const bassRoots = [43.65, 43.65, 51.91, 38.89]; // F, F, G#, D#
      const rootIdx = Math.floor(beatIndex / 4) % bassRoots.length;
      const bassFreq = bassRoots[rootIdx];
      const bassEnv = Math.exp(-beatPos * (isPostDrop ? 3.5 : 5.0));
      // Saturated overdrive
      let rawBass = Math.sin(2 * Math.PI * bassFreq * t) * 1.5;
      let distortedBass = Math.tanh(rawBass) * bassEnv * (isPostDrop ? 0.42 : 0.25);
      sample += distortedBass;
    }

    // 5. Rolling Trap/Phonk Hi-Hats (every 16th note, triplet bursts post-drop)
    const hatPos = (t % (sixteenth / (isPostDrop && beatIndex % 8 === 7 ? 2 : 1))) / sixteenth;
    if (hatPos < 0.09) {
      const hat = (Math.random() * 2 - 1) * Math.exp(-hatPos * 55) * (isPostDrop ? 0.16 : 0.10);
      sample += hat;
    }
  }

  // ── E. TACTILE CYBER CHIMES (Habit Stacking & Level Up) ─────────────────────
  // Plays at 8.5s, 10.8s, 18.0s, 26.5s
  const chimePoints = [8.5, 10.8, 18.0, 26.5];
  for (const cp of chimePoints) {
    if (t >= cp && t < cp + 1.2) {
      const dt = t - cp;
      const chimeFreq = cp === 18.0 ? 1320 : cp === 26.5 ? 1760 : 1046.5;
      const chimeEnv = Math.exp(-dt * 4.5);
      const chime = Math.sin(2 * Math.PI * chimeFreq * dt) * chimeEnv * 0.22;
      const chimeHarmonic = Math.sin(2 * Math.PI * chimeFreq * 2 * dt) * chimeEnv * 0.10;
      sample += chime + chimeHarmonic;
    }
  }

  // ── F. MASTER FADES & LIMITER ─────────────────────────────────────────────
  let masterGain = 1.0;
  if (t < 0.2) masterGain = t / 0.2;
  if (t > 29.0) masterGain = (30.0 - t) / 1.0;

  sample *= masterGain;

  // Limiter with soft-knee saturation
  const clamped = Math.max(-0.95, Math.min(0.95, sample));
  const intVal = Math.floor(clamped * 32767);
  buffer.writeInt16LE(intVal, 44 + i * 2);
}

const outputPath = path.join(__dirname, 'promo-30s-vertical', 'assets', 'soundtrack.wav');
fs.writeFileSync(outputPath, buffer);
console.log('✓ Successfully generated 30-second soundtrack at:', outputPath);
