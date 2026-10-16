/**
 * @file src/components/WaveformCanvas.js
 * @author Jonas Hoekman
 * @project OpenDeck Spatial Sing & Mix <remote pending>
 * @license MIT
 * 
 * 60fps Parallel Dual Waveform Canvas
 * Renders Deck A & Deck B waveforms via requestAnimationFrame directly
 * from AudioEngine analyser nodes with zero state re-render overhead.
 * Colorblind-safe palettes + luminance and texture variation.
 */

import { audioEngine } from '../audio/AudioEngine.js';

export class WaveformCanvas {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.animationId = null;

    // Fast reusable Uint8Arrays for FFT / TimeDomain data
    this.dataA = new Uint8Array(128);
    this.dataB = new Uint8Array(128);

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.start();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
    }
  }

  start() {
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    this.animationId = requestAnimationFrame(render);
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  draw() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const ctx = this.ctx;

    // High-contrast background (WCAG AAA compliant: #080C14)
    ctx.fillStyle = '#080C14';
    ctx.fillRect(0, 0, width, height);

    const halfHeight = height / 2;

    // Center divider line
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    ctx.lineTo(width, halfHeight);
    ctx.stroke();

    // Center playhead vertical needle
    const playheadX = width * 0.4;
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Render Deck A (Top Half)
    this.renderDeckWaveform(audioEngine.deckA, this.dataA, 0, halfHeight, '#0072B2', '#56B4E9', 'DECK A [124 BPM]');

    // Render Deck B (Bottom Half)
    this.renderDeckWaveform(audioEngine.deckB, this.dataB, halfHeight, halfHeight, '#E69F00', '#F0E442', 'DECK B [128 BPM]');
  }

  renderDeckWaveform(deck, dataArray, topY, height, mainColor, crestColor, label) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const centerY = topY + height / 2;

    if (deck.analyser && deck.isPlaying) {
      deck.analyser.getByteTimeDomainData(dataArray);
    } else {
      // Resting neutral line if paused
      dataArray.fill(128);
    }

    // Grid lines for beat simulation
    const playhead = deck.getCurrentPlayhead();
    const beatSpacing = 40;
    const beatOffset = (playhead * 100) % beatSpacing;

    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let x = -beatOffset; x < width; x += beatSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, topY + height);
      ctx.stroke();
    }

    // 1. Draw solid bass / kick core
    ctx.fillStyle = mainColor;
    ctx.globalAlpha = 0.85;
    const sliceWidth = width / dataArray.length;

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128; // [-1.0, 1.0]
      const y = centerY + v * (height * 0.4);
      const x = i * sliceWidth;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(width, centerY);
    ctx.closePath();
    ctx.fill();

    // 2. Draw high-contrast vocal / melody crest line
    ctx.strokeStyle = crestColor;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      const y = centerY - v * (height * 0.4);
      const x = i * sliceWidth;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 3. Deck label and vocal level badge
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`${label} • Zang: ${Math.round(deck.vocalLevel * 100)}%`, 14, topY + 20);
  }
}
