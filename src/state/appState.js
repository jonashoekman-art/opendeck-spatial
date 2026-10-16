/**
 * @file src/state/appState.js
 * @author Jonas Hoekman
 * @project OpenDeck Spatial Sing & Mix <remote pending>
 * @license MIT
 * 
 * OpenDeck Application State Store
 * Pure reactive store without heavy dependencies.
 * Conforms to Performance Mandate 1.5: No 60fps audio positions stored here!
 */

import { i18n } from '../i18n/i18n.js';

class AppState {
  constructor() {
    this.state = {
      isKidsMode: false,
      fontFamily: 'atkinson', // 'sans' | 'atkinson' | 'dyslexic'
      highContrastAAA: true,
      activeLayout: 'desktop', // 'desktop' | 'pi-800x480'
      shiftModifierActive: false,
      deckA: {
        isPlaying: false,
        vocalLevel: 1.0,
        filterValue: 0.0, // -1.0 to +1.0
        bpm: 124,
        keyLock: true,
        title: 'OpenDeck Groove A'
      },
      deckB: {
        isPlaying: false,
        vocalLevel: 1.0,
        filterValue: 0.0,
        bpm: 128,
        keyLock: true,
        title: 'Spatial Anthem B'
      },
      crossfader: 0.0, // -1.0 (A) to +1.0 (B)
      masterVolume: 0.85
    };

    this.listeners = new Set();
  }

  get() {
    return this.state;
  }

  set(partial) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  updateDeck(deckId, partial) {
    const key = deckId === 'A' ? 'deckA' : 'deckB';
    this.state = {
      ...this.state,
      [key]: { ...this.state[key], ...partial }
    };
    this.notify();
  }

  toggleKidsMode() {
    const next = !this.state.isKidsMode;
    this.set({ isKidsMode: next });
    this.announce(next ? '🎉 Feestmodus geactiveerd!' : 'Pro DJ Modus geactiveerd');
  }

  toggleLayout() {
    const next = this.state.activeLayout === 'desktop' ? 'pi-800x480' : 'desktop';
    this.set({ activeLayout: next });
  }

  setFont(fontFamily) {
    this.set({ fontFamily });
    document.documentElement.setAttribute('data-font', fontFamily);
  }

  setShiftModifier(active) {
    if (this.state.shiftModifierActive !== active) {
      this.set({ shiftModifierActive: active });
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(cb => {
      try {
        cb(this.state);
      } catch (err) {
        console.error('AppState listener error:', err);
      }
    });
  }

  announce(message) {
    const liveRegion = document.getElementById('aria-live-polite');
    if (liveRegion) {
      liveRegion.textContent = '';
      setTimeout(() => {
        liveRegion.textContent = message;
      }, 50);
    }
  }
}

export const appState = new AppState();
