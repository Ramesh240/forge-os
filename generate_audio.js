// generate_audio.js
// Creates an 18-second cinematic electronic synth track for the ForgeOS Instagram Reel
const fs = require('fs');
const path = require('path');

const sampleRate = 44100;
const duration = 18; // 18 seconds
const totalSamples = sampleRate * duration;
const buffer = Buffer.alloc(44 + totalSamples * 2); // 16-bit mono

// RIFF header
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

const bpm = 126;
const beatDuration = 60 / bpm; // ~0.476s

// Transition points (seconds)
const hits = [0, 3.5, 7.5, 11.0, 14.5];

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  let sample = 0;

  // 1. Scene Transition Impact Booms
  for (const h of hits) {
    if (t >= h && t < h + 2.5) {
      const dt = t - h;
      const decay = Math.exp(-dt * 4.0);
      // Low sub frequency drop (120Hz -> 35Hz)
      const freq = 35 + 85 * Math.exp(-dt * 15);
      const sub = Math.sin(2 * Math.PI * freq * dt) * decay * 0.7;
      // White noise punch on attack
      const noise = (Math.random() * 2 - 1) * Math.exp(-dt * 25) * 0.4;
      sample += sub + noise;
    }
  }

  // 2. Rhythmic Kick (on every beat after 1.5s)
  if (t >= 1.5 && t < 17.0) {
    const beatPos = (t - 1.5) % beatDuration;
    if (beatPos < 0.25) {
      const kDecay = Math.exp(-beatPos * 22);
      const kFreq = 45 + 110 * Math.exp(-beatPos * 40);
      const kick = Math.sin(2 * Math.PI * kFreq * beatPos) * kDecay * 0.55;
      sample += kick;
    }
  }

  // 3. Cybernetic Synth Bass Pulse (Root: F# at 46.25Hz / 92.5Hz)
  if (t >= 1.0) {
    const eighthPos = (t % (beatDuration / 2)) / (beatDuration / 2);
    const bassEnv = Math.pow(1 - eighthPos, 2.5);
    const bassFreq = t < 7.5 ? 46.25 : t < 11.0 ? 55.0 : t < 14.5 ? 61.74 : 46.25;
    // Saw-like rich harmonics
    let saw = 0;
    for (let h = 1; h <= 5; h++) {
      saw += (Math.sin(2 * Math.PI * (bassFreq * h) * t) / h) * 0.35;
    }
    sample += saw * bassEnv * 0.3;
  }

  // 4. Arpeggiator Lead Synth (High tech, melodic)
  if (t >= 3.5 && t < 17.5) {
    const sixteenth = beatDuration / 4;
    const arpStep = Math.floor(t / sixteenth) % 8;
    const notes = [220, 261.63, 329.63, 392.0, 440, 523.25, 659.25, 523.25];
    const arpFreq = notes[arpStep];
    const arpPos = (t % sixteenth) / sixteenth;
    const arpEnv = Math.exp(-arpPos * 8);
    const lead = Math.sin(2 * Math.PI * arpFreq * t) * 0.2 * arpEnv;
    sample += lead;
  }

  // 5. Hi-hats ticking (every 16th note)
  if (t >= 3.5 && t < 16.5) {
    const sixteenth = beatDuration / 4;
    const hatPos = (t % sixteenth) / sixteenth;
    if (hatPos < 0.08) {
      const hat = (Math.random() * 2 - 1) * Math.exp(-hatPos * 60) * 0.15;
      sample += hat;
    }
  }

  // 6. Master Volume fade-in and fade-out
  let masterGain = 1.0;
  if (t < 0.1) masterGain = t / 0.1;
  if (t > 17.0) masterGain = (18.0 - t) / 1.0;

  sample *= masterGain;

  // Soft clip / limiter
  const clamped = Math.max(-0.95, Math.min(0.95, sample));
  const intVal = Math.floor(clamped * 32767);
  buffer.writeInt16LE(intVal, 44 + i * 2);
}

const outputPath = path.join(__dirname, 'instagram-reel', 'assets', 'soundtrack.wav');
fs.writeFileSync(outputPath, buffer);
console.log('Synthesized soundtrack saved to:', outputPath);
