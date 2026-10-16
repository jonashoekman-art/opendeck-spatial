/**
 * @file src/input/keyboardMatrix.js
 * @author Jonas Hoekman
 * @project OpenDeck Spatial Sing & Mix <remote pending>
 * @license MIT
 * 
 * External USB Keyboard Matrix ("Split-Hand Matrix")
 * Provides ergonomic QWERTY control designed for an external USB keyboard,
 * Kids Mode 1/4-beat auto-quantize, smooth crossfader glide, and live Shift badges.
 */

import { audioEngine } from '../audio/AudioEngine.js';
import { appState } from '../state/appState.js';

class KeyboardMatrixManager {
  constructor() {
    this.glideInterval = null;
    this.glideDirection = 0; // -1 for left, +1 for right
    this.activeKeys = new Set();
    this.keyPressListeners = new Set();
    this.shiftActive = false;

    // EQ Kill toggle states
    this.eqKillsA = { low: false, mid: false, high: false };
    this.eqKillsB = { low: false, mid: false, high: false };

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  onKeyActivity(callback) {
    this.keyPressListeners.add(callback);
    return () => this.keyPressListeners.delete(callback);
  }

  notifyKeyActivity(code, isDown) {
    this.keyPressListeners.forEach(cb => {
      try {
        cb(code, isDown, this.shiftActive);
      } catch (err) {
        console.error('Key activity listener error:', err);
      }
    });
  }

  handleKeyDown(e) {
    // Prevent default scrolling on space and arrow keys when operating the decks
    if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.key === 'Shift') {
      this.shiftActive = true;
      appState.setShiftModifier(true);
    }

    if (this.activeKeys.has(e.code)) return; // Prevent OS key-repeat stutter
    this.activeKeys.add(e.code);
    this.notifyKeyActivity(e.code, true);

    const isKidsMode = appState.get().isKidsMode;
    const isShift = e.shiftKey;

    // Helper for 1/4-beat Kids Mode Quantize simulation
    const executeAction = (actionFn) => {
      if (isKidsMode) {
        // Quantize to next 1/4-beat (approx 120ms at 124 BPM)
        setTimeout(actionFn, 60);
      } else {
        actionFn();
      }
    };

    switch (e.code) {
      // ===== DECK A (LEFT HAND) =====
      case 'KeyS': // Play / Pause
        if (audioEngine.deckA.isPlaying) {
          audioEngine.deckA.pause();
        } else {
          audioEngine.deckA.play();
        }
        break;

      case 'KeyA': // Cue Return
        audioEngine.deckA.cue();
        break;

      case 'KeyD': // Nudge Slower
        audioEngine.deckA.nudge(-0.06);
        break;

      case 'KeyF': // Nudge Faster
        audioEngine.deckA.nudge(+0.06);
        break;

      case 'KeyT': // Sync / KeyLock
        if (isShift) {
          audioEngine.deckA.keyLock = !audioEngine.deckA.keyLock;
          appState.announce('Deck A: Key Lock omgeschakeld');
        } else {
          // Sync BPM to Deck B
          audioEngine.deckA.playbackRate = audioEngine.deckB.playbackRate;
          appState.announce('Deck A: Gesynchroniseerd met Deck B');
        }
        break;

      case 'KeyV': // Karaoke Vocal Toggle (0% / 100%, Shift = 20% Guide)
        if (isShift) {
          audioEngine.deckA.setVocalLevel(0.20);
        } else {
          const current = audioEngine.deckA.vocalLevel;
          audioEngine.deckA.setVocalLevel(current > 0.1 ? 0.0 : 1.0);
        }
        break;

      // Deck A EQ Kills: Z (Low), X (Mid), C (High)
      case 'KeyZ':
        this.eqKillsA.low = !this.eqKillsA.low;
        audioEngine.deckA.setEQKill('low', this.eqKillsA.low);
        break;
      case 'KeyX':
        this.eqKillsA.mid = !this.eqKillsA.mid;
        audioEngine.deckA.setEQKill('mid', this.eqKillsA.mid);
        break;
      case 'KeyC':
        this.eqKillsA.high = !this.eqKillsA.high;
        audioEngine.deckA.setEQKill('high', this.eqKillsA.high);
        break;

      // Deck A Hot Cues / Pads (1, 2, 3, 4)
      case 'Digit1': executeAction(() => audioEngine.deckA.jumpToHotCue(0)); break;
      case 'Digit2': executeAction(() => audioEngine.deckA.jumpToHotCue(1)); break;
      case 'Digit3': executeAction(() => audioEngine.deckA.jumpToHotCue(2)); break;
      case 'Digit4': executeAction(() => audioEngine.deckA.jumpToHotCue(3)); break;

      // Deck A FX Pads (Q, W, E, R)
      case 'KeyQ':
      case 'KeyW':
      case 'KeyE':
      case 'KeyR':
        audioEngine.triggerPartyDrop();
        break;

      // ===== DECK B (RIGHT HAND) =====
      case 'KeyK': // Play / Pause
        if (audioEngine.deckB.isPlaying) {
          audioEngine.deckB.pause();
        } else {
          audioEngine.deckB.play();
        }
        break;

      case 'KeyJ': // Cue Return
        audioEngine.deckB.cue();
        break;

      case 'KeyL': // Nudge Slower
        audioEngine.deckB.nudge(-0.06);
        break;

      case 'Semicolon': // Nudge Faster
        audioEngine.deckB.nudge(+0.06);
        break;

      case 'KeyY': // Sync / KeyLock
        if (isShift) {
          audioEngine.deckB.keyLock = !audioEngine.deckB.keyLock;
          appState.announce('Deck B: Key Lock omgeschakeld');
        } else {
          audioEngine.deckB.playbackRate = audioEngine.deckA.playbackRate;
          appState.announce('Deck B: Gesynchroniseerd met Deck A');
        }
        break;

      case 'Slash': // Karaoke Vocal Toggle
        if (isShift) {
          audioEngine.deckB.setVocalLevel(0.20);
        } else {
          const current = audioEngine.deckB.vocalLevel;
          audioEngine.deckB.setVocalLevel(current > 0.1 ? 0.0 : 1.0);
        }
        break;

      // Deck B EQ Kills: M (Low), Comma (Mid), Period (High)
      case 'KeyM':
        this.eqKillsB.low = !this.eqKillsB.low;
        audioEngine.deckB.setEQKill('low', this.eqKillsB.low);
        break;
      case 'Comma':
        this.eqKillsB.mid = !this.eqKillsB.mid;
        audioEngine.deckB.setEQKill('mid', this.eqKillsB.mid);
        break;
      case 'Period':
        this.eqKillsB.high = !this.eqKillsB.high;
        audioEngine.deckB.setEQKill('high', this.eqKillsB.high);
        break;

      // Deck B Hot Cues / Pads (7, 8, 9, 0)
      case 'Digit7': executeAction(() => audioEngine.deckB.jumpToHotCue(0)); break;
      case 'Digit8': executeAction(() => audioEngine.deckB.jumpToHotCue(1)); break;
      case 'Digit9': executeAction(() => audioEngine.deckB.jumpToHotCue(2)); break;
      case 'Digit0': executeAction(() => audioEngine.deckB.jumpToHotCue(3)); break;

      // Deck B FX Pads (U, I, O, P)
      case 'KeyU':
      case 'KeyI':
      case 'KeyO':
      case 'KeyP':
        audioEngine.triggerPartyDrop();
        break;

      // ===== CROSSFADER & PARTY DROP =====
      case 'ArrowLeft':
        this.startCrossfaderGlide(-1);
        break;

      case 'ArrowRight':
        this.startCrossfaderGlide(1);
        break;

      case 'Space': // Big Party Drop button
        audioEngine.triggerPartyDrop();
        this.triggerVisualConfetti();
        break;
    }
  }

  handleKeyUp(e) {
    this.activeKeys.delete(e.code);
    this.notifyKeyActivity(e.code, false);

    if (e.key === 'Shift') {
      this.shiftActive = false;
      appState.setShiftModifier(false);
    }

    if (e.code === 'KeyD' || e.code === 'KeyF') {
      audioEngine.deckA.resetNudge();
    }
    if (e.code === 'KeyL' || e.code === 'Semicolon') {
      audioEngine.deckB.resetNudge();
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      this.stopCrossfaderGlide();
    }
  }

  startCrossfaderGlide(direction) {
    this.glideDirection = direction;
    if (this.glideInterval) return;

    this.glideInterval = setInterval(() => {
      const current = appState.get().crossfader;
      const step = 0.05 * this.glideDirection;
      const next = Math.max(-1.0, Math.min(1.0, current + step));
      audioEngine.setCrossfader(next);
      if ((this.glideDirection < 0 && next <= -1.0) || (this.glideDirection > 0 && next >= 1.0)) {
        this.stopCrossfaderGlide();
      }
    }, 25);
  }

  stopCrossfaderGlide() {
    if (this.glideInterval) {
      clearInterval(this.glideInterval);
      this.glideInterval = null;
    }
  }

  triggerVisualConfetti() {
    // Lightweight canvas particle explosion (WCAG AAA compliant: < 3 flashes/sec, no strobe)
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#0072B2', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#D55E00', '#CC79A7'];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: canvas.width * 0.5,
        y: canvas.height * 0.6,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 12 - 4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0
      });
    }

    let frame = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Gravity
        p.alpha -= 0.015;
        if (p.alpha > 0) {
          alive = true;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1.0;
      frame++;
      if (alive && frame < 90) {
        requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    requestAnimationFrame(render);
  }
}

export const keyboardMatrix = new KeyboardMatrixManager();
