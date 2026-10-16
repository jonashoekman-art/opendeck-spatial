/**
 * @file src/audio/AudioDemoTracks.js
 * @author Jonas Hoekman
 * @project OpenDeck Spatial Sing & Mix <remote pending>
 * @license MIT
 * 
 * OpenDeck Procedural Stereo Demo Audio Tracks
 * 
 * Generates two punchy electronic groove tracks with:
 * - Center kick + sub bass (solid fundamentals)
 * - Wide stereo percussion and pads
 * - Distinct center vocal simulation (formant harmonic lead)
 * 
 * This allows instant, out-of-the-box verification of the Mid/Side Vocal Reducer Worklet!
 */

export function createDemoTrack(audioCtx, bpm = 124, type = 'groove') {
  const sampleRate = audioCtx.sampleRate;
  const lengthSeconds = 16.0; // 8-measure seamless loop
  const totalSamples = Math.floor(sampleRate * lengthSeconds);
  const buffer = audioCtx.createBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const beatDuration = 60.0 / bpm;
  const sixteenthDuration = beatDuration / 4;
  const totalSixteenths = Math.floor(lengthSeconds / sixteenthDuration);

  // Sound synthesis parameters
  for (let s = 0; s < totalSixteenths; s++) {
    const stepTime = s * sixteenthDuration;
    const startSample = Math.floor(stepTime * sampleRate);

    const isBeat = s % 4 === 0;
    const isSnare = s % 8 === 4;
    const isOffbeatHat = s % 2 === 1;

    // 1. Kick Drum (Dead Center, low freq sweep 150Hz -> 45Hz)
    if (isBeat) {
      const kickSamples = Math.floor(0.25 * sampleRate);
      for (let i = 0; i < kickSamples && (startSample + i) < totalSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 22);
        const freq = 45 + 110 * Math.exp(-t * 30);
        const val = Math.sin(2 * Math.PI * freq * t) * env * 0.7;
        left[startSample + i] += val;
        right[startSample + i] += val; // Perfect center
      }
    }

    // 2. Snare Drum (Slightly wide stereo snap)
    if (isSnare) {
      const snareSamples = Math.floor(0.18 * sampleRate);
      for (let i = 0; i < snareSamples && (startSample + i) < totalSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 18);
        const noise = (Math.random() * 2 - 1) * 0.35;
        const tone = Math.sin(2 * Math.PI * 180 * t) * 0.35;
        const valL = (noise * 0.9 + tone) * env * 0.55;
        const valR = (noise * 1.1 + tone) * env * 0.55;
        left[startSample + i] += valL;
        right[startSample + i] += valR;
      }
    }

    // 3. Hi-Hats (Alternating stereo panned)
    if (isOffbeatHat) {
      const hatSamples = Math.floor(0.08 * sampleRate);
      const pan = (s % 4 === 1) ? 0.3 : 0.7; // pan modulation
      for (let i = 0; i < hatSamples && (startSample + i) < totalSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 50);
        const noise = (Math.random() * 2 - 1) * env * 0.22;
        left[startSample + i] += noise * (1 - pan);
        right[startSample + i] += noise * pan;
      }
    }

    // 4. Bassline (Syncopated sub/mid bass)
    if (s % 2 === 0 && !isSnare) {
      const bassDuration = sixteenthDuration * 1.5;
      const bassSamples = Math.floor(bassDuration * sampleRate);
      const noteFreq = type === 'groove' ? (s % 16 < 8 ? 65.41 : 58.27) : (s % 16 < 8 ? 73.42 : 65.41);
      for (let i = 0; i < bassSamples && (startSample + i) < totalSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 6);
        const val = (Math.sin(2 * Math.PI * noteFreq * t) + 0.3 * Math.sin(2 * Math.PI * noteFreq * 2 * t)) * env * 0.4;
        left[startSample + i] += val;
        right[startSample + i] += val; // Center bass
      }
    }

    // 5. Stereo Chord Synth (Panned Wide - Side signal dominant)
    if (s % 8 === 0 || s % 8 === 6) {
      const chordSamples = Math.floor(0.35 * sampleRate);
      const baseFreq = type === 'groove' ? 261.63 : 293.66; // C4 or D4
      for (let i = 0; i < chordSamples && (startSample + i) < totalSamples; i++) {
        const t = i / sampleRate;
        const env = Math.exp(-t * 5) * (1 - Math.exp(-t * 80));
        const vL = Math.sin(2 * Math.PI * baseFreq * t) + Math.sin(2 * Math.PI * baseFreq * 1.25 * t);
        const vR = Math.sin(2 * Math.PI * baseFreq * 1.5 * t) + Math.sin(2 * Math.PI * baseFreq * 1.75 * t);
        left[startSample + i] += vL * env * 0.18;
        right[startSample + i] += vR * env * 0.18;
      }
    }

    // 6. Center Lead Vocal Formant Simulation (Placed 100% in center channel for Mid/Side vocal cancellation test)
    // Plays a catchy vocal chant during beats 4-12
    if (s >= 16 && s <= 48 && s % 4 === 2) {
      const vocalSamples = Math.floor(0.4 * sampleRate);
      const formantFreq1 = type === 'groove' ? 440 : 523.25; // A4 / C5
      const formantFreq2 = formantFreq1 * 1.5;
      for (let i = 0; i < vocalSamples && (startSample + i) < totalSamples; i++) {
        const t = i / sampleRate;
        const env = Math.sin(Math.PI * (i / vocalSamples)); // Bell envelope
        // Formant vocal simulation: fundamental + harmonics
        const f0 = Math.sin(2 * Math.PI * formantFreq1 * t);
        const f1 = 0.5 * Math.sin(2 * Math.PI * formantFreq2 * t);
        const f2 = 0.25 * Math.sin(2 * Math.PI * (formantFreq1 * 2) * t);
        const vocalVal = (f0 + f1 + f2) * env * 0.38;
        // Identical in Left & Right -> pure Mid signal!
        left[startSample + i] += vocalVal;
        right[startSample + i] += vocalVal;
      }
    }
  }

  // Soft-clip limiter to avoid clipping
  for (let i = 0; i < totalSamples; i++) {
    left[i] = Math.tanh(left[i]);
    right[i] = Math.tanh(right[i]);
  }

  return buffer;
}
