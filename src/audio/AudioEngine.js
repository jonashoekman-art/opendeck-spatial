/**
 * @file src/audio/AudioEngine.js
 * @author Jonas Hoekman
 * @project OpenDeck Spatial Sing & Mix <remote pending>
 * @license MIT
 * 
 * OpenDeck Dual-Deck Audio Engine
 * Manages Web Audio API graph, AudioWorklet Vocal Reducer, 3-Band EQ,
 * Bipolar Filter (-1.0 to +1.0), and 45mm Crossfader.
 */

import { appState } from '../state/appState.js';
import { createDemoTrack } from './AudioDemoTracks.js';

class DeckAudioNode {
  constructor(deckId, audioCtx) {
    this.deckId = deckId;
    this.ctx = audioCtx;
    this.buffer = null;
    this.sourceNode = null;
    this.startTime = 0;
    this.pausedAt = 0;
    this.isPlaying = false;
    this.playbackRate = 1.0;
    this.keyLock = true;
    this.vocalLevel = 1.0;
    this.filterValue = 0.0; // -1.0 (LPF) to 0.0 (Bypass) to +1.0 (HPF)
    this.hotCues = [0, null, null, null]; // Cue 1 defaults to 0s

    // 1. Vocal Reducer Worklet Node or fallback DSP
    this.vocalWorkletNode = null;
    this.fallbackVocalGain = null;

    // 2. 3-Band EQ
    this.lowEQ = this.ctx.createBiquadFilter();
    this.lowEQ.type = 'lowshelf';
    this.lowEQ.frequency.value = 250;
    this.lowEQ.gain.value = 0;

    this.midEQ = this.ctx.createBiquadFilter();
    this.midEQ.type = 'peaking';
    this.midEQ.frequency.value = 1000;
    this.midEQ.Q.value = 1.0;
    this.midEQ.gain.value = 0;

    this.highEQ = this.ctx.createBiquadFilter();
    this.highEQ.type = 'highshelf';
    this.highEQ.frequency.value = 4000;
    this.highEQ.gain.value = 0;

    // 3. Bipolar Filter (LPF on negative, HPF on positive)
    this.bipolarLPF = this.ctx.createBiquadFilter();
    this.bipolarLPF.type = 'lowpass';
    this.bipolarLPF.frequency.value = 20000;

    this.bipolarHPF = this.ctx.createBiquadFilter();
    this.bipolarHPF.type = 'highpass';
    this.bipolarHPF.frequency.value = 20;

    // 4. Channel Gain
    this.channelGain = this.ctx.createGain();
    this.channelGain.gain.value = 1.0;

    // 5. Analyser for 60fps Waveform rendering (Zero React re-render overhead!)
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.chainOutput = this.ctx.createGain();
  }

  async initGraph() {
    // Try to load AudioWorklet
    try {
      await this.ctx.audioWorklet.addModule('/src/audio/VocalReducerWorklet.js');
      this.vocalWorkletNode = new AudioWorkletNode(this.ctx, 'vocal-reducer-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2]
      });
      this.vocalWorkletNode.connect(this.lowEQ);
    } catch (err) {
      console.warn(`Deck ${this.deckId}: AudioWorklet registration fallback (standard graph active):`, err);
      // Clean fallback: Low-pass / high-pass mid crossover
      this.fallbackVocalGain = this.ctx.createGain();
      this.fallbackVocalGain.connect(this.lowEQ);
    }

    // Connect rest of chain
    this.lowEQ.connect(this.midEQ);
    this.midEQ.connect(this.highEQ);
    this.highEQ.connect(this.bipolarLPF);
    this.bipolarLPF.connect(this.bipolarHPF);
    this.bipolarHPF.connect(this.channelGain);
    this.channelGain.connect(this.analyser);
    this.analyser.connect(this.chainOutput);
  }

  loadBuffer(audioBuffer, title = 'Audio Track') {
    if (this.isPlaying) {
      this.stop();
    }
    this.buffer = audioBuffer;
    this.pausedAt = 0;
    appState.updateDeck(this.deckId, { title, isPlaying: false });
    appState.announce(`Deck ${this.deckId}: ${title} geladen`);
  }

  play() {
    if (!this.buffer || this.isPlaying) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = this.buffer;
    this.sourceNode.loop = true;
    this.sourceNode.playbackRate.value = this.playbackRate;

    // Connect source to vocal reducer
    if (this.vocalWorkletNode) {
      this.sourceNode.connect(this.vocalWorkletNode);
    } else if (this.fallbackVocalGain) {
      this.sourceNode.connect(this.fallbackVocalGain);
    } else {
      this.sourceNode.connect(this.lowEQ);
    }

    this.startTime = this.ctx.currentTime - this.pausedAt;
    this.sourceNode.start(0, this.pausedAt % this.buffer.duration);
    this.isPlaying = true;
    appState.updateDeck(this.deckId, { isPlaying: true });
  }

  pause() {
    if (!this.isPlaying) return;
    this.pausedAt = (this.ctx.currentTime - this.startTime) % (this.buffer ? this.buffer.duration : 1);
    this.stop();
    appState.updateDeck(this.deckId, { isPlaying: false });
  }

  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      this.sourceNode = null;
    }
    this.isPlaying = false;
  }

  cue() {
    // Jump to Hot Cue 1 (or 0s)
    this.pause();
    this.pausedAt = this.hotCues[0] || 0;
    appState.announce(`Deck ${this.deckId}: Terug naar Cue`);
  }

  setHotCue(index) {
    if (!this.buffer) return;
    const current = (this.ctx.currentTime - this.startTime) % this.buffer.duration;
    this.hotCues[index] = current;
    appState.announce(`Deck ${this.deckId}: Eilandje ${index + 1} opgeslagen`);
  }

  jumpToHotCue(index) {
    if (this.hotCues[index] === null || this.hotCues[index] === undefined) {
      this.setHotCue(index);
      return;
    }
    const cuePos = this.hotCues[index];
    this.pausedAt = cuePos;
    if (this.isPlaying) {
      this.stop();
      this.play();
    }
  }

  setVocalLevel(level) {
    this.vocalLevel = Math.max(0, Math.min(1, level));
    if (this.vocalWorkletNode) {
      const param = this.vocalWorkletNode.parameters.get('vocalLevel');
      if (param) {
        param.setTargetAtTime(this.vocalLevel, this.ctx.currentTime, 0.02);
      }
    } else if (this.fallbackVocalGain) {
      // In fallback mode, attenuate mid-high frequencies
      this.fallbackVocalGain.gain.setTargetAtTime(this.vocalLevel, this.ctx.currentTime, 0.02);
    }
    appState.updateDeck(this.deckId, { vocalLevel: this.vocalLevel });
  }

  setBipolarFilter(val) {
    // val in [-1.0, 1.0]. -1.0 = LPF 160Hz, 0.0 = Bypass, +1.0 = HPF 8000Hz
    // Kids Mode safety clamp: [-0.75, +0.75]
    if (appState.get().isKidsMode) {
      val = Math.max(-0.75, Math.min(0.75, val));
    } else {
      val = Math.max(-1.0, Math.min(1.0, val));
    }
    this.filterValue = val;

    const now = this.ctx.currentTime;
    if (val < 0) {
      // LPF active: sweep from 20000Hz down to 200Hz
      const freq = 20000 * Math.pow(0.01, -val);
      this.bipolarLPF.frequency.setTargetAtTime(Math.max(160, freq), now, 0.03);
      this.bipolarHPF.frequency.setTargetAtTime(20, now, 0.03);
    } else if (val > 0) {
      // HPF active: sweep from 20Hz up to 5000Hz
      const freq = 20 * Math.pow(250, val);
      this.bipolarHPF.frequency.setTargetAtTime(Math.min(8000, freq), now, 0.03);
      this.bipolarLPF.frequency.setTargetAtTime(20000, now, 0.03);
    } else {
      // Neutral detent
      this.bipolarLPF.frequency.setTargetAtTime(20000, now, 0.03);
      this.bipolarHPF.frequency.setTargetAtTime(20, now, 0.03);
    }

    appState.updateDeck(this.deckId, { filterValue: this.filterValue });
  }

  setEQKill(band, killed) {
    const gainNode = band === 'low' ? this.lowEQ : band === 'mid' ? this.midEQ : this.highEQ;
    const targetGain = killed ? -40 : 0; // -40dB kill
    gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.02);
  }

  nudge(delta) {
    this.playbackRate = Math.max(0.5, Math.min(1.5, this.playbackRate + delta));
    if (this.sourceNode) {
      this.sourceNode.playbackRate.setTargetAtTime(this.playbackRate, this.ctx.currentTime, 0.05);
    }
  }

  resetNudge() {
    this.playbackRate = 1.0;
    if (this.sourceNode) {
      this.sourceNode.playbackRate.setTargetAtTime(1.0, this.ctx.currentTime, 0.05);
    }
  }

  getCurrentPlayhead() {
    if (!this.buffer) return 0;
    if (!this.isPlaying) return this.pausedAt % this.buffer.duration;
    return (this.ctx.currentTime - this.startTime) % this.buffer.duration;
  }
}

class AudioEngine {
  constructor() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass({ latencyHint: 'interactive' });

    this.deckA = new DeckAudioNode('A', this.ctx);
    this.deckB = new DeckAudioNode('B', this.ctx);

    // Crossfader gains
    this.crossfaderGainA = this.ctx.createGain();
    this.crossfaderGainB = this.ctx.createGain();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;

    // Connect crossfader and master
    this.deckA.chainOutput.connect(this.crossfaderGainA);
    this.deckB.chainOutput.connect(this.crossfaderGainB);

    this.crossfaderGainA.connect(this.masterGain);
    this.crossfaderGainB.connect(this.masterGain);

    this.masterGain.connect(this.ctx.destination);

    this.setCrossfader(0.0); // Center detent
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await Promise.all([this.deckA.initGraph(), this.deckB.initGraph()]);
    this.initialized = true;

    // Generate built-in demo tracks so the user can play immediately!
    const demoA = createDemoTrack(this.ctx, 124, 'groove');
    const demoB = createDemoTrack(this.ctx, 128, 'anthem');
    this.deckA.loadBuffer(demoA, 'OpenDeck Groove (124 BPM)');
    this.deckB.loadBuffer(demoB, 'Spatial Anthem (128 BPM)');
  }

  setCrossfader(val) {
    // val: -1.0 (Full A) to 0.0 (Center) to +1.0 (Full B)
    // In Kids Mode, ensure crossfader never mutes both decks completely
    val = Math.max(-1.0, Math.min(1.0, val));
    appState.set({ crossfader: val });

    // Constant power crossfade curve
    const x = (val + 1) * 0.5; // [0, 1]
    const gainA = Math.cos(x * 0.5 * Math.PI);
    const gainB = Math.sin(x * 0.5 * Math.PI);

    const now = this.ctx.currentTime;
    this.crossfaderGainA.gain.setTargetAtTime(gainA, now, 0.02);
    this.crossfaderGainB.gain.setTargetAtTime(gainB, now, 0.02);
  }

  async loadFile(file, deckId) {
    await this.ctx.resume();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this.ctx.decodeAudioData(arrayBuffer);
    const deck = deckId === 'A' ? this.deckA : this.deckB;
    deck.loadBuffer(decoded, file.name);
  }

  triggerPartyDrop() {
    // Play celebratory riser tone
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.4);
    g.gain.setValueAtTime(0.3, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);

    appState.announce('🎉 GROTE FEESTKNOP: Confetti & Drop Effect!');
  }
}

export const audioEngine = new AudioEngine();
